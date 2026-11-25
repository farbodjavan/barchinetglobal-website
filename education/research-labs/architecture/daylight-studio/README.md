# Daylight Studio: assets and how the page reads them

Everything the page shows is listed in `manifest.json`; paths are relative to this folder.

| Folder | Files | Notes |
|---|---|---|
| `model/` | `courtyard-studio-los-angeles.<state>.glb` for `winter-noon`, `summer-noon`, `late-afternoon`, `evening` | Baked light exported as an emission texture over a black base colour. Same geometry, node names and UVs in all four |
| `stills/` | `<state>-<view>.webp` (1600 × 900) and `<state>-<view>-640.webp` | Path-traced Cycles stills. Views: `exterior`, `interior`, `table`, `courtyard`; summer has `interior` only |
| `plan/` | `courtyard-studio-plan.svg`, `courtyard-studio-section.svg`, `summer-noon-plan.webp` | Drawn plan and daylight section (c2pa metadata removed), and the roof-off orthographic render |

## What the page depends on

- **GLB:** binary glTF 2.0, Y up, metres, embedded PNG / JPEG / WebP. **No Draco, meshopt or KTX2**: the reader is
  `assets/glb-lite.mjs`, because three.js's GLTFLoader is not vendored. Emission textures, `KHR_materials_unlit`,
  `KHR_materials_emissive_strength` and plain emissive colours are shown as authored, with no tone mapping.
  Non-emissive materials in a baked file (the glazing) are drawn as flat tints, so the glass has no reflections.
- **Orientation:** origin at the room centre on the finished floor; north is −Z, east is +X. Checked against the plan:
  `ANCHOR_bay_opening` is at z = +4.35 (south) and `ANCHOR_entry` at x = −7 (west).
- **Anchors:** empties named `ANCHOR_<id>` place the numbered points; the plan's `data-anchor="<id>"` groups use the same ids.
  Camera poses for each anchor are in `manifest.anchors[].view` (position and target in metres).
- **Cutaway and layers:** top-level node names. `manifest.cutaway` lists the prefixes hidden by "Hide roof";
  `manifest.layers` lists the nodes offered as layer toggles.
- **Plan overlays:** a state's `planLayer` names the SVG group shown for that state (`layer-daylight-winter`, `layer-daylight-summer`).
- **Sky:** the GLBs carry no sky, so each state has two colours (`sky`: top, horizon) for a flat gradient behind the model.
