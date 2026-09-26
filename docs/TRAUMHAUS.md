# Dream house — how to evolve it together

The 3D house is **data-driven**. Most changes are edits to three files, and nothing needs to be modeled in an external tool:

| File | Contains |
|---|---|
| `src/features/house/data/plan.ts` | Floor plan: walls with openings (doors, glass, windows), stairs, roof slab, pool, plateau |
| `src/features/house/data/rooms.ts` | Rooms (bounds, floor type, walk-mode spawn, night lights) and their **items** |
| `src/features/house/models/catalog.ts` | Procedural models (sofa, bed, grill, palms …) built from primitives |

## Conventions
- Meters, `y` up. The valley and the city lie towards **-z** (front); the house spans x ∈ [-10, 10], z ∈ [-6, 6].
- Ground floor at `y = 0`, roof terrace at `ROOF_Y = 3.4` (reached by the stair in the hall).
- Item `at: [x, z]` or `[x, z, yOffset]` in world coordinates; `rot` in degrees — 0° means the model's front faces -z, 90° faces -x, -90° faces +x, 180° faces +z.
- **At most 20 items per room** (`MAX_ITEMS_PER_ROOM`). The unit tests enforce this and also check that items stay inside their room and reference existing models.

## Add an item
```ts
// rooms.ts → room "living"
{ id: "living-piano", type: "sideboard", label: "Klavier", at: [-3.2, 1.1], mats: { wood: "blackLacquer" } },
```
`mats` swaps material slots (`fabric`, `wood`, `metal`, `accent`, `stone`, `cushion`) with any key from `models/materials.ts`.

## Add a model
Add an entry to `CATALOG` in `catalog.ts`:
```ts
piano: {
  footprint: [1.5, 0.6], // collision box in walk mode (if solid)
  height: 1.3,
  solid: true,
  parts: () => [box([1.5, 1.2, 0.6], [0, 0.6, 0], "blackLacquer", { round: 0.02 }) /* … */],
},
```
Parts are merged per material, so a model renders with one draw call per material.

## Change the building
Edit `WALLS` in `plan.ts`: each wall has a start/end point and `openings` (`from`/`to` measured along the wall, `kind`: `passage`, `door`, `slider`, `glass`, `window`). Rendering and walk-mode collisions both derive from this data. Run `npm test` afterwards: the collision tests walk through doors, up the stairs and along the roof railing.

## Ideas backlog
- Guest WC and utility room, a garage/driveway with a car
- Swap furniture styles per room (material presets)
- Save the favorite time of day / camera views
- Room editor in the studio (drag items, persist to the database)
