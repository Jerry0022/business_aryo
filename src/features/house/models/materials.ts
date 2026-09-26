import * as THREE from "three";
import {
  createConcreteTexture,
  createFrondTexture,
  createHerringboneTexture,
  createNoiseTexture,
  createPlankTexture,
  createSlatTexture,
  createStoneTileTexture,
  createWaterNormalTexture,
  WOOD_TONES,
} from "../textures/procedural";

/** Named materials shared by the whole scene (one GPU material each → few shader programs). */
export const MATERIAL_KEYS = [
  "plaster",
  "plasterExterior",
  "ceiling",
  "concrete",
  "concreteDark",
  "cladding",
  "soffit",
  "frame",
  "steel",
  "brass",
  "chrome",
  "glass",
  "glassFrosted",
  "mirror",
  "oak",
  "oakLight",
  "walnut",
  "teak",
  "blackWood",
  "whiteLacquer",
  "blackLacquer",
  "greigeLacquer",
  "fabricLinen",
  "fabricSand",
  "fabricCharcoal",
  "fabricTerracotta",
  "fabricSage",
  "fabricNavy",
  "fabricCream",
  "fabricOutdoor",
  "leatherCognac",
  "leatherBlack",
  "rugWool",
  "rugDark",
  "marble",
  "marbleDark",
  "ceramic",
  "travertine",
  "terracotta",
  "planter",
  "leaf",
  "leafDark",
  "palmFrond",
  "palmTrunk",
  "bark",
  "soil",
  "gravel",
  "lampGlow",
  "lampShade",
  "screen",
  "fire",
  "water",
  "poolTile",
  "rubber",
  "bookRed",
  "bookBlue",
  "bookSand",
  "floorHerringbone",
  "floorPlanks",
  "floorStone",
  "floorDeck",
  "paving",
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

/** Swappable material slots per model (e.g. a sofa's fabric). */
export type MaterialSlot = "fabric" | "wood" | "metal" | "accent" | "stone" | "cushion";

export type Quality = "high" | "medium" | "low";

export interface MaterialLibrary {
  materials: Record<MaterialKey, THREE.Material>;
  /** Materials whose emissive glow follows the night factor. */
  nightGlow: THREE.MeshStandardMaterial[];
  water: THREE.MeshStandardMaterial;
  dispose: () => void;
}

/** World-space UV density (meters per texture repeat) for textured materials. */
export const UV_SCALE: Partial<Record<MaterialKey, number>> = {
  floorHerringbone: 1.2,
  floorPlanks: 4.8,
  floorStone: 2.4,
  floorDeck: 3.2,
  paving: 3,
  cladding: 1.6,
  soffit: 1.6,
  concrete: 4,
  concreteDark: 4,
  plaster: 3,
  plasterExterior: 3,
  ceiling: 3,
  travertine: 2,
  poolTile: 1,
  water: 4,
};

export function createMaterialLibrary(quality: Quality): MaterialLibrary {
  const texSize = quality === "high" ? 2048 : quality === "medium" ? 1024 : 512;
  const smallTex = texSize / 2;
  const textures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(texture: T) => {
    textures.push(texture);
    return texture;
  };

  const noise = track(createNoiseTexture({ size: smallTex, scale: 48, contrast: 0.9 }));
  const herringbone = track(createHerringboneTexture({ size: texSize, tone: WOOD_TONES.oakNatural }));
  herringbone.center.set(0.5, 0.5);
  herringbone.rotation = Math.PI / 4;
  const planks = track(createPlankTexture({ size: texSize, tone: WOOD_TONES.oakLight, rows: 12 }));
  const deck = track(createPlankTexture({ size: smallTex, tone: WOOD_TONES.teak, rows: 20, gap: 5, seed: 23 }));
  const stone = track(createStoneTileTexture({ size: smallTex, base: [206, 200, 190], tilesX: 2, tilesY: 4, veins: true }));
  const paving = track(createStoneTileTexture({ size: smallTex, base: [178, 170, 158], tilesX: 3, tilesY: 3, seed: 9 }));
  const travertine = track(createStoneTileTexture({ size: smallTex, base: [214, 199, 176], tilesX: 1, tilesY: 1, seed: 13, veins: true }));
  const poolTile = track(createStoneTileTexture({ size: smallTex / 2, base: [60, 120, 128], tilesX: 8, tilesY: 8, seed: 17 }));
  const concrete = track(createConcreteTexture({ size: smallTex, base: [196, 192, 185] }));
  const concreteDark = track(createConcreteTexture({ size: smallTex, base: [118, 114, 108], seed: 29 }));
  const cladding = track(createSlatTexture({ size: smallTex, tone: WOOD_TONES.oakSmoked, slats: 16 }));
  const soffit = track(createSlatTexture({ size: smallTex, tone: WOOD_TONES.oakNatural, slats: 16, seed: 37 }));
  const waterNormal = track(createWaterNormalTexture(256));
  const frond = track(createFrondTexture(512));

  const std = (params: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(params);
  const fabric = (color: string) => std({ color, roughness: 0.95, bumpMap: noise, bumpScale: 0.6 });
  const lacquer = (color: string, roughness = 0.35) => std({ color, roughness });
  const wood = (color: string, roughness = 0.55) => std({ color, roughness, bumpMap: noise, bumpScale: 0.2 });

  const lampGlow = std({ color: "#fff1d6", emissive: "#ffc97a", emissiveIntensity: 0.2, roughness: 0.4 });
  const fire = std({ color: "#3a1a0a", emissive: "#ff7a2a", emissiveIntensity: 0.3, roughness: 1 });
  const screen = std({ color: "#07080a", roughness: 0.15, metalness: 0.2, emissive: "#1d2a3a", emissiveIntensity: 0 });

  const water = std({
    color: "#2a8fa0",
    roughness: 0.04,
    metalness: 0.1,
    normalMap: waterNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 1.4,
  });

  const materials: Record<MaterialKey, THREE.Material> = {
    plaster: std({ color: "#eeebe5", roughness: 0.92, bumpMap: noise, bumpScale: 0.35 }),
    plasterExterior: std({ color: "#f2f0eb", roughness: 0.9, bumpMap: noise, bumpScale: 0.5 }),
    ceiling: std({ color: "#f4f2ee", roughness: 0.95 }),
    concrete: std({ map: concrete, roughness: 0.85, bumpMap: noise, bumpScale: 0.4 }),
    concreteDark: std({ map: concreteDark, roughness: 0.8, bumpMap: noise, bumpScale: 0.4 }),
    cladding: std({ map: cladding, roughness: 0.75, bumpMap: cladding, bumpScale: 1.2 }),
    soffit: std({ map: soffit, roughness: 0.7, bumpMap: soffit, bumpScale: 0.8 }),
    frame: std({ color: "#1d1e20", roughness: 0.45, metalness: 0.7 }),
    steel: std({ color: "#c9cdd1", roughness: 0.28, metalness: 1 }),
    brass: std({ color: "#c09355", roughness: 0.32, metalness: 1 }),
    chrome: std({ color: "#e6e9ec", roughness: 0.08, metalness: 1 }),
    glass: std({
      color: "#dcebf0",
      roughness: 0.03,
      metalness: 0.2,
      transparent: true,
      opacity: 0.16,
      envMapIntensity: 1.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    glassFrosted: std({ color: "#eef3f4", roughness: 0.4, transparent: true, opacity: 0.55, depthWrite: false }),
    mirror: std({ color: "#e9eef2", roughness: 0.03, metalness: 1, envMapIntensity: 1.3 }),
    oak: wood("#b88958"),
    oakLight: wood("#d2ae84"),
    walnut: wood("#5a3a25", 0.5),
    teak: wood("#94653f", 0.65),
    blackWood: wood("#242120", 0.5),
    whiteLacquer: lacquer("#f1efea"),
    blackLacquer: lacquer("#1c1c1d", 0.3),
    greigeLacquer: lacquer("#b3aa9c", 0.45),
    fabricLinen: fabric("#dfd3bf"),
    fabricSand: fabric("#c9a983"),
    fabricCharcoal: fabric("#3d3d40"),
    fabricTerracotta: fabric("#b5623b"),
    fabricSage: fabric("#8b9a7b"),
    fabricNavy: fabric("#2f3a50"),
    fabricCream: fabric("#ece6da"),
    fabricOutdoor: fabric("#e9e5dc"),
    leatherCognac: std({ color: "#8c512b", roughness: 0.48, bumpMap: noise, bumpScale: 0.25 }),
    leatherBlack: std({ color: "#1f1c1b", roughness: 0.45, bumpMap: noise, bumpScale: 0.25 }),
    rugWool: std({ color: "#d4cabb", roughness: 1, bumpMap: noise, bumpScale: 1.5 }),
    rugDark: std({ color: "#4a4540", roughness: 1, bumpMap: noise, bumpScale: 1.5 }),
    marble: std({ map: travertine, color: "#f6f4f0", roughness: 0.18 }),
    marbleDark: std({ color: "#2b2a29", roughness: 0.2, bumpMap: noise, bumpScale: 0.1 }),
    ceramic: std({ color: "#f8f8f6", roughness: 0.12 }),
    travertine: std({ map: travertine, roughness: 0.55 }),
    terracotta: std({ color: "#b06a43", roughness: 0.85, bumpMap: noise, bumpScale: 0.5 }),
    planter: std({ map: concreteDark, roughness: 0.85 }),
    leaf: std({ color: "#4f7a3d", roughness: 0.75, side: THREE.DoubleSide }),
    leafDark: std({ color: "#2f5230", roughness: 0.8, side: THREE.DoubleSide }),
    palmFrond: std({
      map: frond,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.7,
      color: "#ffffff",
    }),
    palmTrunk: std({ color: "#7a6450", roughness: 0.95, bumpMap: noise, bumpScale: 2 }),
    bark: std({ color: "#5b4636", roughness: 0.95, bumpMap: noise, bumpScale: 2 }),
    soil: std({ color: "#3b2d22", roughness: 1 }),
    gravel: std({ color: "#b9b2a6", roughness: 1, bumpMap: noise, bumpScale: 2 }),
    lampGlow,
    lampShade: std({ color: "#efe6d6", roughness: 0.9, emissive: "#ffcf8f", emissiveIntensity: 0, side: THREE.DoubleSide }),
    screen,
    fire,
    water,
    poolTile: std({ map: poolTile, roughness: 0.3 }),
    rubber: std({ color: "#1a1a1a", roughness: 0.9 }),
    bookRed: lacquer("#8c3b2e", 0.8),
    bookBlue: lacquer("#2f4660", 0.8),
    bookSand: lacquer("#c9b48f", 0.8),
    floorHerringbone: std({ map: herringbone, roughness: 0.48, bumpMap: herringbone, bumpScale: 0.6 }),
    floorPlanks: std({ map: planks, roughness: 0.52, bumpMap: planks, bumpScale: 0.5 }),
    floorStone: std({ map: stone, roughness: 0.3 }),
    floorDeck: std({ map: deck, roughness: 0.78, bumpMap: deck, bumpScale: 1.4 }),
    paving: std({ map: paving, roughness: 0.8, bumpMap: noise, bumpScale: 0.6 }),
  };

  const nightGlow = [lampGlow, fire, materials.lampShade as THREE.MeshStandardMaterial, screen];

  return {
    materials,
    nightGlow,
    water,
    dispose() {
      for (const material of Object.values(materials)) material.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}

/** Called every frame with the night factor (0 day … 1 night). */
export function updateNightMaterials(library: MaterialLibrary, night: number, time: number) {
  const [lampGlow, fire, lampShade, screen] = library.nightGlow as [
    THREE.MeshStandardMaterial,
    THREE.MeshStandardMaterial,
    THREE.MeshStandardMaterial,
    THREE.MeshStandardMaterial,
  ];
  lampGlow.emissiveIntensity = 0.15 + night * 5;
  lampShade.emissiveIntensity = night * 0.9;
  fire.emissiveIntensity = (0.4 + night * 4) * (0.85 + 0.15 * Math.sin(time * 9) * Math.sin(time * 4.3));
  screen.emissiveIntensity = night * 0.25;
  const normalMap = library.water.normalMap;
  if (normalMap) normalMap.offset.set(time * 0.012, time * 0.008);
}
