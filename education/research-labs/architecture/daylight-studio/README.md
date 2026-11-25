# Daylight Studio: dropping in the baked model

The page runs today on a stand-in model built in the browser. To switch it to the baked Blender model,
put the files below in this folder and set `"ready": true` in `manifest.json`. No code change is needed.

## Files

| File | What | Notes |
|---|---|---|
| `model/studio-morning.glb`, `-noon.glb`, `-afternoon.glb`, `-dusk.glb` | One unlit GLB per light state | About 3.5 MB each. Same geometry and node names in all four. |
| `stills/studio-morning.webp` (and the other three) | Rendered still per state | 1920 × 1080, WebP quality 82. Shown when the browser has no WebGL. |
| `plan/studio-plan.webp` | Orthographic rendered plan, roof hidden | 2048 × 2048, straight down, north up. Set `plan.ready` to true and `plan.bounds` to the extent in metres `[west, north, east, south]` in plan coordinates. |

## Export settings the page depends on

- Binary glTF 2.0 (`.glb`), **Y up, metres**, images embedded (PNG, JPEG or WebP).
- **No Draco, no meshopt, no KTX2/Basis.** The page uses a small built-in reader (`assets/glb-lite.mjs`) because
  three.js's GLTFLoader and its decoders are not vendored in this repo. A compressed file is rejected with a
  message and the stand-in model is shown instead.
- Baked light as **base colour with `KHR_materials_unlit`** (Blender: Background/Emission-only material exports this way),
  or as an emission texture. Either is displayed exactly as authored, with no tone mapping in the browser, so bake
  with the view transform you want to see.
- No animations, skins or shape keys.
- **Origin** at the centre of the plan on the finished floor. `planOrigin` in the manifest is the world X, Z of the
  plan's north-west corner (the stand-in uses `[-5, -5]` for a 10 × 10 m plot). North is −Z, east is +X.

## Names the page looks for

- **Cutaway:** every node whose name starts with `Roof` or `Ceiling` (any case) is hidden by "Hide roof".
  Change the prefixes in `manifest.cutaway` if the layers are named differently.
- **Hotspots:** an empty named `ANCHOR_desk`, `ANCHOR_glazing`, `ANCHOR_tree`, `ANCHOR_kitchen` places each numbered
  point. To change the set, add `"hotspots": [{ "anchor": "desk", "label": "…", "text": "…" }]` to the manifest.
- **Rooms on the plan:** if the baked layout differs from the stand-in, add `"rooms"` to the manifest in the same
  shape as `studio-data.mjs` (id, number, name, poly in metres), and update the wall linework in `studio-data.mjs`.
- `modelHasGround: true` hides the page's own ground plane. Set it to false if the GLB has no ground mesh.
