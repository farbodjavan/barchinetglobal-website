from urllib.request import Request, urlopen
from html.parser import HTMLParser
import hashlib, json, re, time
from pathlib import Path
base="https://barchinetglobal.com/education/research-labs/"
urls={"studio":base+"architecture/envelope-studio/", "architecture":base+"architecture/","hub":base,"collectionJS":base+"assets/sketch-app.mjs","hubJS":base+"assets/app.mjs","image":base+"architecture/envelope-studio/preview.jpg"}
def fetch(url):
    request=Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; NoorStudio verification)","Cache-Control":"no-cache"})
    with urlopen(request,timeout=22) as r:
        return r.read(14000000),{"status":r.status,"final_url":r.geturl(),"content_type":r.headers.get("Content-Type")}
class Title(HTMLParser):
    inside=False
    title=""
    def handle_starttag(self,t,a):
        if t=="title": self.inside=True
    def handle_endtag(self,t):
        if t=="title": self.inside=False
    def handle_data(self,s):
        if self.inside: self.title+=s
last={}
for attempt in range(12):
    try:
        result={}
        for name,url in urls.items():
            data,d=fetch(url)
            d["bytes"]=len(data)
            if name=="studio":
                d["sha256"]=hashlib.sha256(data).hexdigest()
                assert d["sha256"]=="c89901bf2dc148a7d6cebdcd9560715310a417c4ba5be1bc5408a85fff554fa0","studio SHA "+d["sha256"]
                title=Title();title.feed(data[:20000].decode());d["title"]=title.title
                assert d["title"]=="Noor Studio · Building Envelope Lab"
                assert b"folioNorth" in data and b"folioSouth" in data and b"LibraryThermalTemplate" in data
            elif name=="image":
                assert data[:3]==b"\xff\xd8\xff" and len(data)>30000
            elif name in ("collectionJS","hubJS"):
                assert b"Noor Studio" in data
            else:
                assert b"Research Labs" in data
            result[name]=d
        last={"success":True,"public":result}
        break
    except Exception as exc:
        last={"success":False,"attempt":attempt+1,"error":str(exc),"verified":result}
        print(last,flush=True)
        time.sleep(8)
Path("noor-live-result.json").write_text(json.dumps(last,ensure_ascii=False))
print(last,flush=True)
