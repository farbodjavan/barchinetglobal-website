# Barchinet World (Research Labs prototype)

Research prototype with fictional data. Location: `education/research-labs/barchinet-world/`.

## What it is
One story in five steps: explore the World, enter the Los Angeles office (Serein Envelope, in the Courtyard studio),
run the instant daylight and shade check, send a simulated request and answer the handoff question, return to the
World and continue. All offices, people, the Cypress House project and the record number are fictional. Nothing is sent.

## Files
- `index.html`, `world.css`, `app.mjs`: page, styles, views and routing (hash routes `#/world`, `#/office/<id>`, `#/about`).
- `data.mjs`: fictional sample data and scripted replies.
- `studio.mjs`: light states, layers, anchors, camera poses, captions and stills for the Courtyard studio.
- `daylight.mjs`: the direct-sun model (pure functions). `drawings.mjs`: places the plan and section drawings inline,
  wires the plan hotspots and overlays, and draws the what-if ray on the section.
- `atlas.mjs`: dot globe on a 2D canvas. `office3d.mjs` + `glb.mjs`: the 3D studio, loaded only when needed.
- `lib/three.mjs`: the only import of three.js. It points at the r180 build already in
  `education/research-labs/assets/vendor/three/`. `lib/site.mjs`: relative paths to shared Research Labs files.
- `assets/models/courtyard-studio.<state>.glb`: four models, one per light state (winter-noon, summer-noon,
  late-afternoon, evening), 3.2 to 3.8 MB each, used byte-for-byte as supplied.
- `assets/stills/`: thirteen path-traced renders and one roof-off plan render, each with a 640 px thumbnail.
- `assets/drawings/`: the plan and the daylight section (SVG).
- `assets/office-still.jpg`: the winter-noon interior render at 1280 px, used by the no-script page and the Research Labs card.

## Dependencies on the site
Only two, both relative: `../assets/vendor/three/three.module.min.js` and `../assets/barchinet-global.svg`.
Fonts load from Google Fonts, as the Research Labs stylesheet already does (plus Instrument Serif for the drawings).
No analytics, sign-in, cookies or other network calls. `sessionStorage` keeps the visitor's choices for the tab;
the page works without it.

## The 3D studio
The four models were made in Blender (Cycles) and supplied by the owner's session. Geometry, node names and UVs are
identical; only the textures differ. The light is path-traced, tone-mapped and baked into an emission texture, so the
page shows the models untouched: unlit materials, tone mapping off, no scene lights, fog or reflections.
The first state requested builds the scene; changing the time of day swaps textures only, so the camera and hidden
layers are kept. Each file is fetched on demand, once, and its bytes are kept; one state's textures are on the GPU at
a time, and phones get them at half size. `glb.mjs` reads only the glTF features these models use, because the vendor
folder has no GLTFLoader. The .blend source is not in this folder.

## Changes made to the supplied drawings
The `metadata` element holding the c2pa manifest and its namespace were removed. Every style rule was prefixed with the
drawing's id and the hatch pattern id was renamed, so the drawings can sit inline without styling the page. In the
section, the description text said the winter sun reaches 3.6 metres while the drawing itself says 2.9; it now says 2.9.

## Copy to keep accurate
The stills are path-traced renders, not photographs. The interactive model shows baked light and looks warmer and
darker than the stills. The neighbouring blocks are schematic massing. The building is fictional.

## Before publishing
`index.html` carries `noindex,nofollow`. Remove it only when the owner approves going live.
