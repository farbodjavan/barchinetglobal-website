// Minimal glTF 2.0 binary (.glb) reader for the Courtyard studio models in this folder.
// The Research Labs vendor folder ships three.js core and OrbitControls only, so this reads the subset the
// models use: one buffer, static meshes with node translations, embedded JPEG textures and empty anchor nodes.
// The models carry their light in an emission texture over a black base colour. They are shown untouched:
// each baked layer becomes a MeshBasicMaterial with that texture as its map and tone mapping off.
import * as T from './lib/three.mjs';

const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ARRAYS = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

export async function fetchWithProgress(url, onProgress = () => {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model request failed (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) { const all = await res.arrayBuffer(); onProgress(1); return all; }
  const reader = res.body.getReader(), parts = []; let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onProgress(Math.min(1, got / total)); }
  const out = new Uint8Array(got); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out.buffer;
}

function open(buffer) {
  const dv = new DataView(buffer);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Not a GLB file');
  const jsonLen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLen)));
  const binStart = 20 + jsonLen + 8, bin = buffer.slice(binStart, binStart + dv.getUint32(20 + jsonLen, true));
  const view = i => { const v = json.bufferViews[i]; return bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  return { json, bin, view };
}

// Decode the embedded images. Returns a Map from image name (the layer's texture name) to a three.js texture.
export async function readTextures(buffer, { maxAnisotropy = 4, maxEdge = 0 } = {}) {
  const { json, view } = open(buffer), out = new Map();
  await Promise.all((json.images || []).map(async (img, i) => {
    const blob = new Blob([view(img.bufferView)], { type: img.mimeType });
    const full = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).catch(() => createImageBitmap(blob));
    let bitmap = full;
    if (maxEdge && full.width > maxEdge) {            // smaller textures on phones
      bitmap = await createImageBitmap(full, { resizeWidth: maxEdge, resizeHeight: Math.round(full.height * maxEdge / full.width), resizeQuality: 'high' }).catch(() => full);
      if (bitmap !== full) full.close?.();
    }
    const tex = new T.Texture(bitmap);
    tex.flipY = false; tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = maxAnisotropy; tex.name = img.name || `image-${i}`; tex.needsUpdate = true;
    out.set(tex.name, tex);
  }));
  return out;
}

// Build the scene graph once. Baked layers get their texture later, by image name (see OfficeScene.applyState).
export function readScene(buffer) {
  const { json, bin } = open(buffer);
  const accessor = i => {
    const a = json.accessors[i], size = TYPE_SIZE[a.type], Arr = ARRAYS[a.componentType], v = json.bufferViews[a.bufferView];
    const start = (v.byteOffset || 0) + (a.byteOffset || 0);
    return new T.BufferAttribute(new Arr(bin.slice(start, start + a.count * size * Arr.BYTES_PER_ELEMENT)), size, !!a.normalized);
  };
  const materials = (json.materials || []).map(m => {
    const p = m.pbrMetallicRoughness || {}, c = p.baseColorFactor || [1, 1, 1, 1], e = m.emissiveFactor || [0, 0, 0];
    const mat = new T.MeshBasicMaterial({ toneMapped: false, fog: false, side: m.doubleSided ? T.DoubleSide : T.FrontSide });
    mat.name = (m.name || '').split(' · ')[0];
    if (m.emissiveTexture) { mat.userData.image = json.images[json.textures[m.emissiveTexture.index].source].name; mat.color.setRGB(1, 1, 1); }
    else if (m.alphaMode === 'BLEND') { mat.color.setRGB(c[0], c[1], c[2]); mat.transparent = true; mat.opacity = c[3]; mat.depthWrite = false; }
    else mat.color.setRGB(Math.min(1, e[0] || c[0]), Math.min(1, e[1] || c[1]), Math.min(1, e[2] || c[2]));   // lamps and screens: plain emissive colour
    return mat;
  });
  const root = new T.Group(), layers = {}, anchors = {};
  for (const ni of json.scenes[json.scene || 0].nodes) {
    const n = json.nodes[ni];
    if (n.mesh == null) { if (n.name?.startsWith('ANCHOR_')) anchors[n.name.slice(7)] = { at: n.translation || [0, 0, 0], ...(n.extras || {}) }; continue; }
    const group = new T.Group(); group.name = n.name;
    if (n.translation) group.position.fromArray(n.translation);
    for (const prim of json.meshes[n.mesh].primitives) {
      const g = new T.BufferGeometry(), a = prim.attributes;
      g.setAttribute('position', accessor(a.POSITION));
      if (a.TEXCOORD_0 != null) g.setAttribute('uv', accessor(a.TEXCOORD_0));
      g.setIndex(accessor(prim.indices));
      const mesh = new T.Mesh(g, materials[prim.material]);
      if (materials[prim.material].transparent) mesh.renderOrder = 2;
      group.add(mesh);
    }
    layers[n.name] = group; root.add(group);
  }
  return { root, layers, anchors, materials };
}
