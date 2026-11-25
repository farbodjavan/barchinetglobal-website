// A small GLB reader for baked showcase models (three.js r180; GLTFLoader is not vendored in this repo).
// Supported: binary glTF 2.0, triangle meshes, node hierarchy with names (including empties),
// POSITION / NORMAL / TEXCOORD_0 / TEXCOORD_1 / COLOR_0, indices, base colour factor and texture,
// emissive texture (used when a bake is exported as emission), KHR_materials_unlit, double-sided,
// alpha blend and mask, embedded PNG / JPEG / WebP images.
// Not supported, and reported with a clear error: Draco, meshopt, KTX2/Basis textures, sparse accessors,
// skins, animations, morph targets, external .bin or image files.
import * as Three from './vendor/three/three.module.min.js';

const typedArrays = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const unsupported = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu', 'KHR_mesh_quantization'];

export function parseGlbContainer(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) throw new Error('This file is not a binary glTF (.glb).');
  if (view.getUint32(4, true) !== 2) throw new Error('Only glTF 2.0 is supported.');
  let offset = 12, json, bin;
  while (offset + 8 <= buffer.byteLength) {
    const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true), start = offset + 8;
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, start, length)));
    else if (type === 0x004e4942) bin = buffer.slice(start, start + length);
    offset = start + length;
  }
  if (!json) throw new Error('The .glb has no JSON chunk.');
  const blocked = (json.extensionsRequired || []).filter(name => unsupported.includes(name));
  if (blocked.length) throw new Error(`This .glb uses ${blocked.join(', ')}. Export it again without mesh or texture compression.`);
  return { json, bin };
}

// bakedEncoding: 'srgb' (the glTF rule for emission textures) or 'linear' for bakes whose pixels hold linear light.
export async function loadGlb(url, { signal, bakedEncoding = 'srgb' } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Model not found (${response.status}).`);
  return buildScene(parseGlbContainer(await response.arrayBuffer()), { bakedEncoding });
}

export async function buildScene({ json, bin }, { bakedEncoding = 'srgb' } = {}) {
  const accessor = index => {
    const a = json.accessors[index];
    if (a.sparse) throw new Error('Sparse accessors are not supported.');
    const bufferView = json.bufferViews[a.bufferView], Type = typedArrays[a.componentType], width = sizes[a.type];
    const start = (bufferView.byteOffset || 0) + (a.byteOffset || 0), stride = bufferView.byteStride || 0, packed = width * Type.BYTES_PER_ELEMENT;
    let array;
    if (!stride || stride === packed) array = new Type(bin.slice(start, start + a.count * packed));
    else { array = new Type(a.count * width); const data = new DataView(bin); const read = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType]; for (let i = 0; i < a.count; i++) for (let k = 0; k < width; k++) array[i * width + k] = data[read](start + i * stride + k * Type.BYTES_PER_ELEMENT, true); }
    return new Three.BufferAttribute(array, width, Boolean(a.normalized));
  };
  const textures = await Promise.all((json.textures || []).map(async (texture, index) => {
    const image = json.images?.[texture.source ?? texture.extensions?.EXT_texture_webp?.source];
    if (!image || image.bufferView === undefined) throw new Error(`Texture ${index} is not embedded in the .glb.`);
    const bufferView = json.bufferViews[image.bufferView], start = bufferView.byteOffset || 0;
    const bitmap = await createImageBitmap(new Blob([bin.slice(start, start + bufferView.byteLength)], { type: image.mimeType || 'image/png' }), { colorSpaceConversion: 'none' });
    const map = new Three.Texture(bitmap);
    const sampler = json.samplers?.[texture.sampler] || {};
    const wrap = { 33071: Three.ClampToEdgeWrapping, 33648: Three.MirroredRepeatWrapping, 10497: Three.RepeatWrapping };
    map.wrapS = wrap[sampler.wrapS] || Three.RepeatWrapping; map.wrapT = wrap[sampler.wrapT] || Three.RepeatWrapping;
    map.flipY = false; map.colorSpace = Three.SRGBColorSpace; map.anisotropy = 8; map.needsUpdate = true;
    return map;
  }));
  const withChannel = (info) => { if (!info) return null; const map = textures[info.index]; if (info.texCoord) { const copy = map.clone(); copy.channel = info.texCoord; copy.needsUpdate = true; return copy; } return map; };
  const materials = (json.materials || []).map(m => {
    const pbr = m.pbrMetallicRoughness || {}, factor = pbr.baseColorFactor || [1, 1, 1, 1];
    const unlit = Boolean(m.extensions?.KHR_materials_unlit), emissive = withChannel(m.emissiveTexture), base = withChannel(pbr.baseColorTexture);
    const common = { name: m.name || '', side: m.doubleSided ? Three.DoubleSide : Three.FrontSide, transparent: m.alphaMode === 'BLEND', alphaTest: m.alphaMode === 'MASK' ? (m.alphaCutoff ?? .5) : 0, opacity: factor[3] };
    // A bake is "unlit" either through the extension, by carrying its picture in the emissive slot,
    // or (lamps, screens) by a plain emissive colour. Emissive strength is applied and clamped to display white.
    const strength = m.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1, glow = m.emissiveFactor || [0, 0, 0];
    const lit = glow.some(v => v > 0);
    if (unlit || emissive || lit) {
      if (emissive && !unlit && bakedEncoding === 'linear') { emissive.colorSpace = Three.LinearSRGBColorSpace; emissive.needsUpdate = true; }
      const tint = unlit ? factor : glow.map(v => Math.min(1, v * strength));
      const material = new Three.MeshBasicMaterial({ ...common, map: unlit ? base : emissive, color: new Three.Color().setRGB(tint[0], tint[1], tint[2], Three.SRGBColorSpace) });
      if (!unlit && !emissive) material.color.setRGB(tint[0], tint[1], tint[2]);
      material.toneMapped = false; material.userData.baked = true; return material;
    }
    const material = new Three.MeshStandardMaterial({ ...common, map: base, color: new Three.Color(factor[0], factor[1], factor[2]), roughness: pbr.roughnessFactor ?? 1, metalness: pbr.metallicFactor ?? 1 });
    material.userData.factor = factor;
    return material;
  });
  // In a baked scene nothing should react to the page's own lights: glass and other plain surfaces become flat tints.
  if (materials.some(m => m.userData.baked)) materials.forEach((m, i) => {
    if (m.userData.baked) return;
    const f = m.userData.factor, flat = new Three.MeshBasicMaterial({ name: m.name, side: m.side, transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, map: m.map, color: new Three.Color(f[0], f[1], f[2]), depthWrite: !m.transparent });
    flat.toneMapped = false; flat.userData.baked = true; materials[i] = flat;
  });
  const fallback = new Three.MeshStandardMaterial({ color: '#bbbbbb', roughness: .8 });
  const meshes = (json.meshes || []).map(mesh => mesh.primitives.filter(p => (p.mode ?? 4) === 4).map(p => {
    const geometry = new Three.BufferGeometry();
    const names = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', TEXCOORD_1: 'uv1', COLOR_0: 'color' };
    for (const [key, name] of Object.entries(names)) if (p.attributes[key] !== undefined) geometry.setAttribute(name, accessor(p.attributes[key]));
    if (p.indices !== undefined) geometry.setIndex(accessor(p.indices));
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const material = p.material === undefined ? fallback : materials[p.material];
    if (geometry.attributes.color && !material.userData.vertexChecked) { material.vertexColors = true; material.userData.vertexChecked = true; }
    return { geometry, material };
  }));
  const nodes = (json.nodes || []).map(node => {
    const parts = node.mesh === undefined ? [] : meshes[node.mesh];
    const object = parts.length === 1 ? new Three.Mesh(parts[0].geometry, parts[0].material) : new Three.Group();
    if (parts.length > 1) for (const part of parts) object.add(new Three.Mesh(part.geometry, part.material));
    object.name = node.name || '';
    if (node.matrix) { object.matrix.fromArray(node.matrix); object.matrix.decompose(object.position, object.quaternion, object.scale); }
    else { if (node.translation) object.position.fromArray(node.translation); if (node.rotation) object.quaternion.fromArray(node.rotation); if (node.scale) object.scale.fromArray(node.scale); }
    return object;
  });
  (json.nodes || []).forEach((node, index) => { for (const child of node.children || []) nodes[index].add(nodes[child]); });
  const root = new Three.Group();
  root.name = 'glb';
  for (const index of json.scenes?.[json.scene ?? 0]?.nodes || []) root.add(nodes[index]);
  root.updateMatrixWorld(true);
  const anchors = {};
  root.traverse(object => { const match = /^ANCHOR_(.+)$/i.exec(object.name); if (match) anchors[match[1].replace(/\.\d+$/, '').toLowerCase()] = object.getWorldPosition(new Three.Vector3()).toArray(); });
  const box = new Three.Box3().setFromObject(root);
  return { scene: root, anchors, box, baked: materials.some(m => m.userData.baked) };
}
