# Pack 1 — Cinematic Crossroads

**Status:** ARCHITECTURE LOCKED / AWAITING ASSETS  
**Do not integrate until clean runtime PNGs land.**  
**References (art direction only):** `public/sprites/references/cinematic-crossroads/`

---

## Multi-model consensus

Reviewed independently by:

- Primary Cursor coding model (this report)
- [Claude](2d8323d4-0376-4c6a-adb2-5e681bcb3063)
- [GPT](3946fc95-cb0a-4cc5-bfe6-38555adece18)
- [Grok](9d2e712b-e21b-4d73-905c-0d5c46c55af4)
- [Reviewer](31fcdb30-5c5e-4dc4-9657-bcc15c82e566)

### Unanimous

1. Keep custom Canvas 2D — **no Phaser**.
2. Preserve engine systems; rewrite **content + numbers**, not the loop.
3. **Do not** “shrink map + raise `CAMERA_ZOOM`” — that constant is dead; emptiness and tiny sprites are the real defects.
4. **Recompose** `Regions.ts` as one diorama — do not crop the 60×45 overworld.
5. Keep `TILE_SIZE = 16` as the logical/collision grid; art can be larger than one tile.
6. **New Pack 1 sprites are mandatory** before the visual rewrite.
7. Trunk/base collision only; canopy overlaps freely; Y-sort by foot baseline.
8. Cool dark world + warm local light (baked in sprites + simple Canvas glow).

### Resolved disagreements (locked decision)

| Topic | Options | **Locked** |
|---|---|---|
| Map size | 36×22 … 52×42 | **42 × 28 tiles (672 × 448 px)** |
| Viewport | 18×12 … 26×21 | **20 × 13 tiles (320 × 208 px)** |
| Focus Y | 0.66 → 0.72–0.73 | **0.72** |
| Player art | 24×32 … 32×48 | **32 × 48** |
| Speed | 48 … 80 | **56 px/s** |
| See all landmarks at spawn? | Full poster vs hints | **Hints only** — full reveal on approach |
| Terrain tile art | 16 vs 32 | **16×16** for Pack 1 proof (32×32 optional polish) |

Rationale: User asked for a compact scene (≈40–50 × 25–35) and said destinations should **not** all be fully visible unless composition only shows hints. A 320×208 view is intimate; a 42×28 world gives short walks + camera reveal without returning to overworld scale.

---

## Proposed architecture (post-asset integration)

### Preserve

| System | Files |
|---|---|
| rAF loop, DPR, integer deviceScale, screen-space HUD | `Game.ts` |
| Smooth biased camera (retune constants) | `Camera.ts` |
| Input | `Input.ts` |
| AABB + axis slide collisions | `AABB.ts`, `CollisionMap.ts` |
| Frustum cull + Y-depth sort | `WorldScene.ts` |
| Sprite preload/cache + strip anim + warm glow | `SpriteLoader.ts`, `SpriteRenderer.ts` |
| Visual box ≠ collision box | `PropFactories` base pattern, `WorldProp` |
| React host | `GameCanvas.tsx` |

### Rewrite / replace

| Target | Action |
|---|---|
| `constants.ts` | New map/view/speed/focus/anchors; delete dead `CAMERA_ZOOM` |
| `Regions.ts` | **Delete** four-biome overworld → `SceneCrossroads.ts` (authored diorama) |
| `MapData.ts` | Single `createCrossroadsMap()` |
| `PropFactories.ts` | Pack 1 sizes + footprint/baseY from manifest |
| `World.ts` | Kill procedural house/gate/tower draws; sprite blit only |
| `RegionTypes.ts` | One forest scene; drop biome taxonomy |
| `SpriteCatalog.ts` + `manifest.json` | Pack 1 catalog |
| `Player.ts` | Traveler sheet blit (idle/walk later full; proof can be back-facing) |
| Cull pad | Raise to **~160** for tall pines |

### Camera (retune, don’t reinvent)

```
VIEW_WIDTH_TILES   = 20   → 320 world px
VIEW_HEIGHT_TILES  = 13   → 208 world px
CAMERA_FOCUS_X     = 0.50
CAMERA_FOCUS_Y     = 0.72   // player ~70–75% down screen
CAMERA_FOLLOW_SPEED = 8–10
LOOKAHEAD_FRAC_X   = 0.05–0.06
LOOKAHEAD_FRAC_Y   = 0.02–0.03
```

Keep: cover-fit (or letterbox-safe) derived scale, integer deviceScale, device-pixel camera snap, ease look-ahead to 0 when idle.  
Optional later: small deadzone at hub so the hero shot doesn’t swim while idling at the fire.

Fit note: prefer guaranteeing the **safe composition frame** is fully visible (min/floor) rather than cover-cropping vertical landmark tops — exact formula locked at integration time.

### World layout (tile anchors)

```
MAP: 42 × 28 tiles = 672 × 448 px

Hub / campfire:     (21, 16)
Spawn (south of fire, facing north): (21, 20)
Hearth Hollow door: (8, 15)     ~208 px → ~3.7 s @ 56 px/s
Mountain threshold: (21, 5)     ~176 px → ~3.1 s (+ path bends → ~3.5–4.5 s)
Fortress door:      (34, 15)    ~208 px → ~3.7 s
```

Paths: 2–3 tiles wide, carved through dense forest. North path may switchback slightly for Mountains timing.

Forest rules after assets land:

- Forest floor everywhere; path carved through (not grass fields with a line on top).
- Multi-row pine banks; canopy overlap; bushes/flowers/rocks between trunks.
- No contiguous open grass patch larger than ~4×4 tiles outside the plaza.
- Invisible corridor blocker strips OK so gaps between trunks aren’t walkable.
- Landmark collision = lower footprint / door surround only.

### Lighting (Pack 1 scope)

- Bake warm windows/torches/lava rims into landmark sprites.
- Bake cool night shading into trees/terrain.
- Runtime: existing radial `drawWarmGlow` on campfire/lanterns only.
- Full lightmap multiply pass = **later polish**, not blocking.

---

## Pack 0 disposition

| Asset | Verdict |
|---|---|
| `campfire.png` (96×24, 4×24) | **Temporary reuse** until Pack 1 campfire lands |
| `signpost_three_way.png` (48×48) | **Retire** — underscaled |
| `lantern_post.png` (16×32) | **Retire** — underscaled |
| `deciduous_tree_*` (32×48) | **Retire** from final scene (wrong scale/style) |
| `bush_*`, `rock_*`, `flower_*` (16×16) | **Retire** for cinematic density (optional micro-filler only) |
| Terrain grass/path 16×16 | **Retire** for proof; replace with denser Pack 1 tiles |
| Loader / catalog / glow / anim strip pattern | **Keep** |

---

# ASSET REQUEST MANIFEST — Pack 1 (must generate)

Send this section to the external asset workflow.

### Global art rules (every file)

1. **Perspective:** top-down 3/4 elevated adventure (match refs).
2. **No text** baked into signboards / UI (Canvas labels later).
3. **Original designs** — original fantasy traveler / landmarks (not franchise lookalikes).
4. **Night-ready:** cool shadows + warm highlight bake where noted.
5. **Ground skirt:** trees/landmarks include a small base of grass/rocks/flowers so they don’t float on tiles.
6. **Tight trim:** transparent padding minimized; silhouette should nearly fill the canvas (avoid invisible bleed breaking collision math).
7. **1 art px = 1 world px** — no “draw at 2×” plan.
8. Do **not** crop from the labeled reference sheets.

---

## TIER A — Mandatory for first cinematic proof

Generate these before any integration rewrite.

### Player

| # | Filename | Size | Mode | Frames / layout | Perspective | Collision / base | Folder | Baked light | Canvas glow | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | `traveler_walk.png` | **256×192** | RGBA | **8×4** grid of **32×48** frames. Rows: down, up, left, right. Cols: idle + 3 walk. | 3/4 top-down | Hitbox ~12×8 at feet (offset ≈ 10,38 inside frame) | `public/sprites/player/` | Staff orb warm pixels **yes** | Soft staff glow optional later | Original wandering mage / traveler; blue hooded cloak OK |

Minimum acceptable if full sheet is heavy: same 32×48 frame size with at least **up idle + up walk ×2** (back view for spawn). Prefer full sheet.

### Terrain (opaque)

| # | Filename | Size | Mode | Frames | Perspective | Collision | Folder | Baked light | Canvas glow | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| A2 | `forest_floor_a.png` | **16×16** | RGB opaque | 1 | Top-down | none | `public/sprites/terrain/forest/` | Cool dark greens | no | Dense vegetation, leaves, tiny pebbles — **not** flat lawn |
| A3 | `forest_floor_b.png` | **16×16** | RGB | 1 | Top-down | none | same | Cool | no | Variant |
| A4 | `forest_floor_c.png` | **16×16** | RGB | 1 | Top-down | none | same | Cool | no | Variant (under-canopy darker) |
| A5 | `dirt_path.png` | **16×16** | RGB | 1 | Top-down | none | same | Warm-brown cool shade | no | Pebbled dirt |
| A6 | `path_edge_n.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | Ragged foliage→dirt (N) |
| A7 | `path_edge_e.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A8 | `path_edge_s.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A9 | `path_edge_w.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A10 | `path_corner_ne.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A11 | `path_corner_nw.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A12 | `path_corner_se.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |
| A13 | `path_corner_sw.png` | **16×16** | RGB | 1 | Top-down | none | same | — | no | |

### Forest props

| # | Filename | Size | Mode | Frames | Perspective | Collision / base | Folder | Baked light | Canvas glow | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| A14 | `pine_s.png` | **48×64** | RGBA | 1 | 3/4 | Trunk ~10×8 at base center | `public/sprites/nature/` | Warm rim OK | no | Small pine |
| A15 | `pine_m.png` | **64×96** | RGBA | 1 | 3/4 | Trunk ~14×10 at base | same | Warm rim OK | no | Workhorse canopy |
| A16 | `pine_l.png` | **80×112** | RGBA | 1 | 3/4 | Trunk ~16×12 at base | same | Warm rim OK | no | Foreground / hero pine |
| A17 | `deciduous_m.png` | **64×80** | RGBA | 1 | 3/4 | Trunk ~14×10 | same | Warm rim OK | no | Round canopy variety |
| A18 | `dead_tree.png` | **48×80** | RGBA | 1 | 3/4 | Trunk ~12×10 | same | Cool grey | no | Fortress pocket |
| A19 | `bush_a.png` | **32×32** | RGBA | 1 | 3/4 | Usually **none** | same | — | no | Dense understory |
| A20 | `bush_b.png` | **32×32** | RGBA | 1 | 3/4 | Usually none | same | Berry/flower accents OK | no | |
| A21 | `rock_a.png` | **16×16** | RGBA | 1 | 3/4 | Full or small base | same | — | no | |
| A22 | `rock_cluster.png` | **48×32** | RGBA | 1 | 3/4 | Lower footprint ~40×14 | same | — | no | |
| A23 | `flower_blue.png` | **24×16** | RGBA | 1 | 3/4 | none | same | — | no | |
| A24 | `flower_orange.png` | **24×16** | RGBA | 1 | 3/4 | none | same | Warm petals | no | |

### Hub

| # | Filename | Size | Mode | Frames / layout | Perspective | Collision / base | Folder | Baked light | Canvas glow | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| A25 | `campfire.png` | **192×48** | RGBA | **4 frames × 48×48** horizontal strip | 3/4 | none (walkable) | `public/sprites/hub/` | Flame pixels **yes** | **Yes** — soft radial glow | Stone ring + logs |
| A26 | `signpost_three_way.png` | **64×80** | RGBA | 1 | 3/4 | Post ~12×14 at base | same | Warm wood rim OK | no | **Blank boards** — no text |
| A27 | `lantern_post.png` | **24×48** | RGBA | 1 | 3/4 | Post ~8×8 at base | same | Lantern warm **yes** | **Yes** — small glow | Path lighting |

### Landmarks

| # | Filename | Size | Mode | Frames | Perspective | Collision / base | Folder | Baked light | Canvas glow | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| A28 | `shire_hillside_home.png` | **144×112** | RGBA | 1 | 3/4 | Lower mound/door band ~ full width × ~32–40 tall; door approach walkable | `public/sprites/landmarks/` | Round windows warm **yes** | Optional window glow later | Hillside Burrow landmark (Hearth Hollow); cozy grassy hillside home; round door; flowers/fence accents OK |
| A29 | `mountain_gate.png` | **160×144** | RGBA | 1 | 3/4 | Stone mass solid; **open arch channel** walkable | same | Torch warm pixels **yes** | Optional torch glow | Ancient gate + stairs read; cliff integrated |
| A30 | `dark_fortress.png` | **144×144** | RGBA | 1 | 3/4 | Wall/gate footprint; approach channel walkable | same | Brazier/lava crack warm **yes** | Optional fire glow | Jagged dark gate; volcanic base |

**Tier A count: 30 files** (player sheet counts as 1).

---

## TIER B — Strongly recommended before polish pass

| # | Filename | Size | Mode | Frames | Folder | Notes |
|---|---|---|---|---|---|---|
| B1 | `pine_xl_foreground.png` | **96×128** | RGBA | 1 | `nature/` | Frame-edge occluder |
| B2 | `lantern_tall.png` | **32×64** | RGBA | 1 | `hub/` | Foreground lantern |
| B3 | `campfire.png` upgrade | **288×48** | RGBA | 6×48 | `hub/` | Smoother fire |
| B4 | `ash_ground.png` | **16×16** | RGB | 1 | `terrain/forest/` | Fortress pocket floor |
| B5 | `moss_ground.png` | **16×16** | RGB | 1 | `terrain/forest/` | Hearth Hollow pocket floor |
| B6 | `cliff_face.png` | **64×64** | RGBA | 1 | `nature/` | Mountain backdrop mass |
| B7 | `volcanic_rock.png` | **32×32** | RGBA | 1 | `nature/` | Fortress clutter |
| B8 | `fence_wood.png` | **32×16** | RGBA | 1 | `nature/` | Hearth Hollow / Hillside Burrow garden |
| B9 | `fern.png` | **24×24** | RGBA | 1 | `nature/` | Understory |
| B10 | `traveler_idle.png` | **128×192** | RGBA | 4×4 @ 32×48 | `player/` | Breathing idle (optional if A1 has idle cols) |

---

## TIER C — Later (not blocking)

- Firefly / ember particles  
- Mist strip  
- Banner flutter on fortress  
- Cobble plaza tiles  
- Separate emissive overlays for landmarks  
- Full lighting multiply pass textures  

---

## Collision cheat-sheet (for generators)

| Sprite | Recommended solid AABB (relative to sprite top-left) |
|---|---|
| pine_s 48×64 | (19, 54, 10, 8) |
| pine_m 64×96 | (25, 84, 14, 10) |
| pine_l 80×112 | (32, 98, 16, 12) |
| deciduous_m 64×80 | (25, 68, 14, 10) |
| dead_tree 48×80 | (18, 68, 12, 10) |
| signpost 64×80 | (26, 66, 12, 14) |
| lantern 24×48 | (8, 40, 8, 8) |
| hillside home 144×112 | lower band y≈72–112, leave door gap |
| mountain gate 160×144 | solid sides; open center ~32–40 wide |
| dark fortress 144×144 | solid sides; open center ~32–40 wide |
| traveler 32×48 | (10, 38, 12, 8) |

Also provide in `manifest.json` later: `anchor` (foot baseline) and `footprint` per prop so code doesn’t hardcode Pack 0 offsets.

---

## Integration plan (AFTER assets arrive — not now)

1. Drop PNGs into the folders above; update `manifest.json` + `SpriteCatalog`.  
2. Retune `constants.ts` (map/view/focus/speed/anchors).  
3. Replace `Regions.ts` with authored crossroads scene + forest scatter.  
4. Strip procedural landmark draws from `World.ts`.  
5. Wire traveler sheet; retire silhouette.  
6. Density + blocker-strip pass; raise cull pad.  
7. Playtest travel times + framing; adjust anchors before Milestone 4.

---

## STOP

No major visual rewrite until Tier A PNGs are delivered and inspected.

References saved at:

- `public/sprites/references/cinematic-crossroads/ref-landmarks.png`
- `public/sprites/references/cinematic-crossroads/ref-forest-props.png`
- `public/sprites/references/cinematic-crossroads/ref-traveler-terrain.png`
- `public/sprites/references/cinematic-crossroads/ref-crossroads-scene.png`
