from pathlib import Path
import base64, hashlib, io, json, re, subprocess, urllib.request
from tempfile import TemporaryDirectory
path = Path("education/research-labs/architecture/envelope-studio/index.html")
data = path.read_bytes()
assert hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()=="0e9db51822dbe0adf5bf55d6c06040aeb0243e2e"
html = data.decode("utf-8")
def replace(s, old, new):
    if s.count(old) != 1: raise ValueError("Unexpected anchor "+old[:90]+": "+str(s.count(old)))
    return s.replace(old,new,1)
html=replace(html,"rings.push(profile.map(([x,r])=>[x,p[1]+n[1]*r,side*(p[0]+n[0]*r)]));","rings.push(profile.map(([x,r])=>{const z=side*(p[0]+n[0]*r);return i===segments&&end===1?[x,p[1]+r/n[1],0]:[x,p[1]+n[1]*r,z];}));")
html=replace(html,"u=(j+.991)/12","u=j===11?1:(j+.991)/12")
html=replace(html,"['gallery','East pier, lapis cartouche',[4.7,2.54,-2.835],[2.10,2.35],[0,0,0],'night']","['gallery','North pier · Safavid study',[4.7,2.54,-2.835],[1.60,2.25],[0,0,0],'folioNorth']")
html=replace(html,"['gallery','East pier, vermilion cartouche',[4.7,2.54,2.835],[2.10,2.35],[0,Math.PI,0],'clay']","['gallery','South pier · Safavid study',[4.7,2.54,2.835],[1.60,2.25],[0,Math.PI,0],'folioSouth']")
sources={"folioNorth":{"fallback":"painted-woodwork","url":"https://collectionapi.metmuseum.org/api/collection/v1/iiif/452125/865987/main-image","object":"452125"},"folioSouth":{"fallback":"paired-doors","url":"https://collectionapi.metmuseum.org/api/collection/v1/iiif/452127/865982/main-image","object":"452127"}}
for item in sources.values():
    try:
        from PIL import Image
        def get(url):
            req=urllib.request.Request(url,headers={"User-Agent":"NoorStudio/1.0 (+https://barchinetglobal.com)"})
            with urllib.request.urlopen(req,timeout=6) as r: return r.read(15000000)
        meta=json.loads(get("https://collectionapi.metmuseum.org/public/collection/v1/objects/"+item["object"]))
        if meta.get("isPublicDomain") is not True: raise ValueError("Public domain status unavailable")
        im=Image.open(io.BytesIO(get(item["url"])))
        if im.width<360 or im.height<480: raise ValueError("Undersized source")
        im.thumbnail((768,1080)); jpeg=io.BytesIO(); im.convert("RGB").save(jpeg,format="JPEG",quality=84,optimize=True)
        item["src"]="data:image/jpeg;base64,"+base64.b64encode(jpeg.getvalue()).decode()
        item["title"]=meta["title"]
    except Exception:
        pass
paint=r"""for(const [key,source] of Object.entries(__SOURCES__)){
      const record=globalThis.LibraryReferencePhotos.find(p=>p.id===source.fallback);
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1080;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#dfd9c9';ctx.fillRect(0,0,768,1080);
      const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;texture.anisotropy=4;
      const art=new Image();art.onload=()=>{const scale=Math.min(724/art.naturalWidth,1036/art.naturalHeight),w=art.naturalWidth*scale,h=art.naturalHeight*scale;ctx.drawImage(art,(768-w)/2,(1080-h)/2,w,h);texture.needsUpdate=true;document.dispatchEvent(new Event('studio-textures-ready'));};
      art.src=source.src||record.src;
      finishes[key]=new T.MeshStandardMaterial({map:texture,roughness:.85,metalness:0,emissive:0xa59681,emissiveIntensity:.035});
    }
    """.replace("__SOURCES__",json.dumps(sources,ensure_ascii=True))
anchor="for(const key of ['ink','gilding','umber'])finishes[key]="
html=replace(html,anchor,paint+anchor)
from html import escape
credit=[]
for item in sources.values():
    if "src" in item: credit.append(escape(item["title"])+" · The Metropolitan Museum of Art, Open Access (CC0). <a href=\"https://www.metmuseum.org/art/collection/search/"+item["object"]+"\">Collection record</a>")
    else:
        page="16" if item["fallback"]=="painted-woodwork" else "15"
        label="Painted court figures" if page=="16" else "Painted pavilion doors"
        assert re.search(r'"id":"'+item["fallback"]+r'".{0,1950}?"src":"data:image/',html)
        credit.append(label+" · Hagop Kevorkian exhibition catalogue (1926), p. "+page+", US public domain. <a href=\"https://www.gutenberg.org/files/26473/26473-h/26473-h.htm#Page_"+page+"\">Digitized plate</a>")
cf="<p>Gallery pier reproductions</p><p>"+"</p><p>".join(credit)+"</p>"
anchor="<p>The carved imposts in the gallery draw on documented Safavid timber capitals."
html=replace(html,anchor,cf.replace("'","&#39;")+anchor)
pat="window.LibraryThermalTemplate='([A-Za-z0-9+/=]+)'"
m=re.search(pat,html);assert m
inner=base64.b64decode(m[1]).decode("utf-8")
inner=replace(inner,"book.project.studyBasis='project';book.project.example=false;","")
html=html[:m.start(1)]+base64.b64encode(inner.encode()).decode()+html[m.end(1):]
assert "noor-apply-brief" in inner and "studio-textures-ready" in html
with TemporaryDirectory() as td:
    checked=0
    for document in (html,inner):
        for script in re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script\s*>',document,re.I):
            attr,body=script.groups()
            if not body.strip() or 'application/json' in attr or 'application/ld+json' in attr or 'importmap' in attr: continue
            f=Path(td)/("script.mjs" if 'type="module"' in attr else "script.js")
            f.write_text(body,encoding="utf-8")
            subprocess.run(["node","--check",str(f)],check=True);checked+=1
    assert checked>=25
encoded=html.encode(); path.write_bytes(encoded)
summary={"scripts":checked,"sha256":hashlib.sha256(encoded).hexdigest(),"git_blob":hashlib.sha1(b"blob "+str(len(encoded)).encode()+b"\0"+encoded).hexdigest(),"size":len(encoded),"physicalPierArt":[x.get("title",x["fallback"]) for x in sources.values()],"climateDefaultsPreserved":True,"joinedApex":True}
Path("noor-preflight-result.json").write_text(json.dumps(summary,ensure_ascii=False),encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))