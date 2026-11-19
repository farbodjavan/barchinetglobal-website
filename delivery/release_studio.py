"""Publish a tested, partial update without replacing unrelated Firebase site content.

Preview once from a Firebase-authorized Google Cloud Shell or gcloud environment.
Promote the resulting receipt only after inspecting its preview address.
"""
import argparse
import gzip
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlencode, urlsplit
from urllib.request import Request, urlopen

SITE = "barchinet-global"
ROOT = "/education/research-labs/architecture/envelope-studio/"
API = "https://firebasehosting.googleapis.com/v1beta1/"
RESOURCE = "sites/" + SITE
CHANNELS = RESOURCE + "/channels/"
LIVE = CHANNELS + "live"
APEX = "https://barchinetglobal.com"
TYPES = {".html", ".js", ".mjs", ".css", ".jpg", ".jpeg", ".webp", ".png", ".ktx2", ".bin", ".glb", ".json", ".woff2", ".hdr", ".avif"}


def require(test, message):
    if not test:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def studio_files(directory):
    require((directory / "index.html").is_file(), "Choose the studio directory containing index.html.")
    files = {}
    for file in sorted(directory.rglob("*")):
        require(not file.is_symlink(), "Symlinks are not deployable studio assets.")
        if file.is_file():
            relative = file.relative_to(directory)
            require(all(not p.startswith(".") for p in relative.parts) and file.suffix.lower() in TYPES,
                    "Unexpected asset in release directory: " + str(relative))
            files[ROOT + relative.as_posix()] = file.read_bytes()
    return files


class Hosting:
    def __init__(self):
        gcloud = shutil.which("gcloud")
        require(gcloud, "Open Google Cloud Shell, or install the Google Cloud CLI on this computer.")
        self.token = subprocess.run([gcloud, "auth", "print-access-token", "--quiet"], check=True,
                                    stdout=subprocess.PIPE, text=True).stdout.strip()
        require(bool(self.token), "Google Cloud CLI needs an authenticated Firebase Hosting account.")

    def call(self, path, method="GET", body=None, query=None):
        url = path if path.startswith("https://") else API + path
        if query:
            url += "?" + urlencode(query)
        is_upload = isinstance(body, bytes)
        parsed = urlsplit(url)
        require(parsed.scheme == "https" and parsed.hostname in {"firebasehosting.googleapis.com", "upload-firebasehosting.googleapis.com"},
                "Unexpected Firebase API host.")
        data = body if is_upload or body is None else json.dumps(body).encode()
        headers = {"Authorization": "Bearer " + self.token, "Content-Type": "application/octet-stream" if is_upload else "application/json"}
        with urlopen(Request(url, data=data, method=method, headers=headers), timeout=150) as response:
            result = response.read()
        return json.loads(result) if result and not is_upload else {}

    def manifest(self, version):
        rows = {}
        page = {"status": "ACTIVE", "pageSize": 1000}
        while True:
            batch = self.call(version + "/files", query=page)
            for item in batch.get("files", []):
                rows[item["path"]] = item["hash"]
            if not batch.get("nextPageToken"):
                break
            page["pageToken"] = batch["nextPageToken"]
        return rows

    def release(self, channel, version):
        release = self.call(channel + "/releases", "POST", {"message": "Noor Studio architectural finishes"}, {"versionName": version})
        require(release["version"]["name"] == version, "Unexpected version in release response.")
        return release


def public_check(url, expected):
    for path, digest in expected.items():
        require(path.startswith(ROOT) and ".." not in path.split("/"), "Unexpected public file path.")
        with urlopen(Request(url.rstrip("/") + quote(path), headers={"Cache-Control": "no-cache"}), timeout=150) as response:
            require(sha(response.read()) == digest, "Public content mismatch: " + path)


def make_preview(api, source, receipt_path):
    files = studio_files(source)
    live = api.call(LIVE)["release"]
    previous = api.call(live["version"]["name"])
    before = api.manifest(previous["name"])
    require(len(before) == int(previous["fileCount"]) and ROOT + "index.html" in before, "Incomplete live file inventory.")
    compressed = {p: gzip.compress(content, compresslevel=9, mtime=0) for p, content in files.items()}
    by_hash = {sha(content): content for content in compressed.values()}
    expected = {**before, **{p: sha(content) for p, content in compressed.items()}}
    version = api.call(RESOURCE + "/versions", "POST", {"config": previous.get("config", {})})["name"]
    items = list(expected.items())
    for i in range(0, len(items), 1000):
        result = api.call(version + ":populateFiles", "POST", {"files": dict(items[i:i + 1000])})
        for digest in result.get("uploadRequiredHashes", []):
            require(digest in by_hash, "A previously live file is missing from Hosting storage. Preview stopped.")
            api.call(result["uploadUrl"].rstrip("/") + "/" + digest, "POST", by_hash[digest])
    require(api.manifest(version) == expected, "Staged and expected Hosting manifests differ.")
    finalized = api.call(version, "PATCH", {"status": "FINALIZED"}, {"updateMask": "status"})
    require(finalized.get("config", {}) == previous.get("config", {}) and finalized["status"] == "FINALIZED",
            "Staged and live Hosting configurations differ.")
    channel_id = "noor-" + hashlib.sha256(version.encode()).hexdigest()[:12]
    channel = api.call(RESOURCE + "/channels", "POST", {"ttl": "604800s"}, {"channelId": channel_id})
    api.release(channel["name"], version)
    receipt = {"site": SITE, "baseRelease": live["name"], "channel": channel["name"], "url": channel["url"],
               "version": version, "sha256": {p: sha(data) for p, data in files.items()}}
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")
    public_check(channel["url"], receipt["sha256"])
    print("Preview verified", channel["url"] + ROOT, flush=True)


def promote(api, receipt_path):
    receipt = json.loads(receipt_path.read_text())
    require(receipt["site"] == SITE and re.fullmatch(re.escape(CHANNELS) + r"noor-[a-f0-9]{12}", receipt["channel"]),
            "Receipt is not for this studio preview.")
    channel = api.call(receipt["channel"])
    require(channel["release"]["version"]["name"] == receipt["version"], "Preview version changed.")
    public_check(channel["url"], receipt["sha256"])
    live = api.call(LIVE)["release"]
    if live["version"]["name"] != receipt["version"]:
        require(live["name"] == receipt["baseRelease"], "Production changed. Rebuild a preview against the new release.")
        api.release(LIVE, receipt["version"])
    public_check(APEX, receipt["sha256"])
    print("Production verified", APEX + ROOT, flush=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    actions = p.add_subparsers(dest="action", required=True)
    pre = actions.add_parser("preview")
    pre.add_argument("source", type=Path)
    pre.add_argument("receipt", type=Path)
    actions.add_parser("promote").add_argument("receipt", type=Path)
    args = p.parse_args()
    try:
        api = Hosting()
        if args.action == "preview":
            make_preview(api, args.source, args.receipt)
        else:
            promote(api, args.receipt)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
