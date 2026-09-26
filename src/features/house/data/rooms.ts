import { ROOF_SLAB, ROOF_Y } from "./plan";
import type { Room } from "./types";

/** Hard limit agreed for the first iteration of the dream house. */
export const MAX_ITEMS_PER_ROOM = 20;

// Coordinates are world meters (see plan.ts). Items: `at` = [x, z] or [x, z, yOffset above the room floor].
// rot is in degrees; at 0° a model faces -z (towards the valley), 90° faces -x, -90° faces +x, 180° faces +z.

export const ROOMS: Room[] = [
  {
    id: "living",
    name: "Wohnzimmer",
    level: "ground",
    bounds: { x0: -10, z0: -6, x1: -1, z1: 1.5 },
    floor: "herringbone",
    spawn: [-3.6, -0.6, 0],
    lights: [
      [-7, -3],
      [-3.5, -3],
    ],
    items: [
      { id: "living-rug", type: "rugLarge", label: "Wollteppich", at: [-7.2, -2.4], rot: 90 },
      { id: "living-sofa", type: "sofaL", label: "Ecksofa", at: [-5.75, -2.5], rot: 90 },
      { id: "living-coffee", type: "coffeeTable", label: "Couchtisch Travertin", at: [-7.5, -2.3], rot: 90 },
      { id: "living-fireplace", type: "fireplace", label: "Kamin", at: [-9.6, -2.4], rot: -90 },
      { id: "living-tv", type: "tvWall", label: "TV", at: [-9.8, -2.4, 1.45], rot: -90 },
      { id: "living-lounge", type: "loungeChair", label: "Lounge Chair", at: [-8.5, -5.0], rot: 35 },
      { id: "living-side", type: "sideTable", label: "Beistelltisch", at: [-9.2, -4.3] },
      { id: "living-lamp", type: "floorLamp", label: "Bogenleuchte", at: [-4.4, -0.5], rot: 90 },
      { id: "living-sideboard", type: "sideboard", label: "Sideboard Nussbaum", at: [-7.6, 1.18] },
      { id: "living-art", type: "artwork", label: "Wandbild", at: [-7.6, 1.39, 1.3] },
      { id: "living-fig", type: "plantLarge", label: "Geigenfeige", at: [-9.4, 0.9] },
      { id: "living-olive", type: "plantOlive", label: "Olivenbäumchen", at: [-1.6, -5.4] },
      { id: "living-chair", type: "armchair", label: "Sessel Cognac", at: [-3.0, -4.6], rot: 150 },
      { id: "living-pouf", type: "pouf", label: "Pouf", at: [-4.1, -4.8] },
      { id: "living-pendant", type: "pendantLamp", label: "Pendelleuchte", at: [-7.4, -2.3] },
    ],
  },
  {
    id: "kitchen",
    name: "Küche & Essen",
    level: "ground",
    bounds: { x0: -1, z0: -6, x1: 4, z1: 1.5 },
    floor: "planks",
    spawn: [1.4, 0.8, 0],
    lights: [
      [1.4, -4.2],
      [2.2, -0.6],
    ],
    items: [
      { id: "kitchen-run", type: "kitchenRun", label: "Küchenzeile", at: [3.61, -1.7], rot: 90 },
      { id: "kitchen-tall", type: "kitchenTall", label: "Hochschränke & Kühlschrank", at: [3.61, 0.75], rot: 90 },
      { id: "kitchen-island", type: "kitchenIsland", label: "Kochinsel Marmor", at: [1.9, -1.0], rot: 90 },
      { id: "kitchen-stool-1", type: "barStool", label: "Barhocker", at: [0.95, -1.8] },
      { id: "kitchen-stool-2", type: "barStool", label: "Barhocker", at: [0.95, -1.0] },
      { id: "kitchen-stool-3", type: "barStool", label: "Barhocker", at: [0.95, -0.2] },
      { id: "kitchen-table", type: "diningTable", label: "Esstisch Eiche", at: [1.3, -4.3] },
      { id: "kitchen-chair-1", type: "diningChair", label: "Stuhl", at: [0.5, -3.5] },
      { id: "kitchen-chair-2", type: "diningChair", label: "Stuhl", at: [1.3, -3.5] },
      { id: "kitchen-chair-3", type: "diningChair", label: "Stuhl", at: [2.1, -3.5] },
      { id: "kitchen-chair-4", type: "diningChair", label: "Stuhl", at: [0.5, -5.1], rot: 180 },
      { id: "kitchen-chair-5", type: "diningChair", label: "Stuhl", at: [1.3, -5.1], rot: 180 },
      { id: "kitchen-chair-6", type: "diningChair", label: "Stuhl", at: [2.1, -5.1], rot: 180 },
      { id: "kitchen-chair-7", type: "diningChair", label: "Stuhl (Kopf)", at: [-0.3, -4.3], rot: -90 },
      { id: "kitchen-chair-8", type: "diningChair", label: "Stuhl (Kopf)", at: [2.9, -4.3], rot: 90 },
      { id: "kitchen-pendant", type: "linearPendant", label: "Linearleuchte", at: [1.3, -4.3] },
      { id: "kitchen-plant", type: "plantLarge", label: "Zimmerpflanze", at: [-0.5, 0.9] },
    ],
  },
  {
    id: "bedroom",
    name: "Schlafzimmer",
    level: "ground",
    bounds: { x0: 4, z0: -6, x1: 10, z1: 1.5 },
    floor: "herringbone",
    spawn: [5.0, 0.6, -25],
    lights: [[7, -2.5]],
    items: [
      { id: "bedroom-rug", type: "rugMedium", label: "Teppich", at: [7.2, -0.5], rot: 90 },
      { id: "bedroom-bed", type: "bed", label: "Kingsize-Bett", at: [7.2, 0.2] },
      { id: "bedroom-ns-1", type: "nightstand", label: "Nachttisch", at: [5.8, 1.1] },
      { id: "bedroom-ns-2", type: "nightstand", label: "Nachttisch", at: [8.6, 1.1] },
      { id: "bedroom-lamp-1", type: "tableLamp", label: "Tischleuchte", at: [5.8, 1.1, 0.48] },
      { id: "bedroom-lamp-2", type: "tableLamp", label: "Tischleuchte", at: [8.6, 1.1, 0.48] },
      { id: "bedroom-bench", type: "bench", label: "Bettbank", at: [7.2, -1.3] },
      { id: "bedroom-wardrobe", type: "wardrobe", label: "Kleiderschrank", at: [4.4, -2.6], rot: -90 },
      { id: "bedroom-lounge", type: "loungeChair", label: "Lesesessel", at: [9.1, -5.0], rot: 20, mats: { fabric: "fabricSage" } },
      { id: "bedroom-floorlamp", type: "floorLamp", label: "Leseleuchte", at: [9.5, -4.0], rot: 160 },
      { id: "bedroom-plant", type: "plantOlive", label: "Olivenbäumchen", at: [5.0, -5.4] },
      { id: "bedroom-art", type: "artwork", label: "Wandbild", at: [7.2, 1.39, 1.5], mats: { accent: "fabricNavy" } },
      { id: "bedroom-dresser", type: "dresser", label: "Kommode", at: [9.58, -1.6], rot: 90 },
    ],
  },
  {
    id: "bath",
    name: "Bad",
    level: "ground",
    bounds: { x0: 6, z0: 1.5, x1: 10, z1: 6 },
    floor: "stone",
    spawn: [9.35, 2.2, 160],
    lights: [[8, 3.8]],
    items: [
      { id: "bath-tub", type: "bathtub", label: "Freistehende Wanne", at: [8.3, 5.1] },
      { id: "bath-shower", type: "walkInShower", label: "Walk-in-Dusche", at: [6.8, 2.2], rot: 180 },
      { id: "bath-vanity", type: "vanity", label: "Doppelwaschtisch", at: [9.58, 3.6], rot: 90 },
      { id: "bath-mirror", type: "mirrorRound", label: "Spiegel", at: [9.83, 3.6, 1.25], rot: 90 },
      { id: "bath-toilet", type: "toilet", label: "WC", at: [6.3, 4.6], rot: -90 },
      { id: "bath-towels", type: "towelLadder", label: "Handtuchleiter", at: [7.0, 5.8], rot: 180 },
      { id: "bath-plant", type: "plantOlive", label: "Pflanze", at: [9.5, 5.5] },
    ],
  },
  {
    id: "office",
    name: "Arbeitszimmer",
    level: "ground",
    bounds: { x0: -10, z0: 1.5, x1: -5, z1: 6 },
    floor: "herringbone",
    spawn: [-5.6, 2.7, 110],
    lights: [[-7.5, 3.7]],
    items: [
      { id: "office-desk", type: "desk", label: "Schreibtisch", at: [-7.5, 5.2] },
      { id: "office-chair", type: "officeChair", label: "Bürostuhl", at: [-7.5, 4.4], rot: 180 },
      { id: "office-monitor", type: "monitor", label: "Monitor", at: [-7.5, 5.35, 0.755] },
      { id: "office-lamp", type: "deskLamp", label: "Schreibtischleuchte", at: [-8.1, 5.35, 0.755], rot: -30 },
      { id: "office-shelf", type: "bookshelf", label: "Bücherregal", at: [-8.4, 1.8], rot: 180 },
      { id: "office-reading", type: "armchair", label: "Lesesessel", at: [-9.3, 3.3], rot: -60, mats: { fabric: "fabricNavy" } },
      { id: "office-rug", type: "rugMedium", label: "Teppich", at: [-7.6, 3.8], mats: { fabric: "rugDark" } },
      { id: "office-plant", type: "plantLarge", label: "Zimmerpflanze", at: [-5.6, 5.4] },
    ],
  },
  {
    id: "hall",
    name: "Eingang & Treppe",
    level: "ground",
    bounds: { x0: -5, z0: 1.5, x1: 6, z1: 6 },
    floor: "stone",
    spawn: [3.2, 5.2, 40],
    lights: [
      [-1.5, 3.2],
      [3.5, 3.5],
    ],
    items: [
      { id: "hall-runner", type: "runner", label: "Läufer", at: [0.3, 3.2] },
      { id: "hall-console", type: "consoleTable", label: "Konsole", at: [5.7, 3.6], rot: 90 },
      { id: "hall-mirror", type: "mirrorRound", label: "Spiegel", at: [5.9, 3.6, 1.2], rot: 90 },
      { id: "hall-bench", type: "bench", label: "Garderobenbank", at: [-4.6, 4.3], rot: -90 },
      { id: "hall-coat", type: "coatRack", label: "Garderobe", at: [-4.5, 5.5] },
      { id: "hall-sculpture", type: "sculpture", label: "Skulptur", at: [-0.6, 4.2] },
      { id: "hall-plant", type: "plantLarge", label: "Pflanze", at: [5.4, 5.4] },
      { id: "hall-art", type: "artwork", label: "Großformat", at: [-0.8, 1.61, 1.25], rot: 180, mats: { accent: "fabricSage" } },
    ],
  },
  {
    id: "roof",
    name: "Dachterrasse",
    level: "roof",
    bounds: ROOF_SLAB,
    floor: "deck",
    spawn: [0.5, 2.5, 0],
    lights: [
      [-5, -4],
      [6.5, -4],
      [7.2, 3],
    ],
    items: [
      { id: "roof-grill", type: "grill", label: "Gasgrill Edelstahl", at: [7.4, 5.55] },
      { id: "roof-kitchen", type: "outdoorKitchen", label: "Outdoor-Küche", at: [5.0, 5.6] },
      { id: "roof-palm-1", type: "palm", label: "Palme", at: [-9.7, -6.9] },
      { id: "roof-palm-2", type: "palm", label: "Palme", at: [9.7, -6.9] },
      { id: "roof-palm-3", type: "palm", label: "Palme", at: [9.7, 5.4] },
      { id: "roof-palm-4", type: "palm", label: "Palme", at: [-9.7, 5.4] },
      { id: "roof-lounge", type: "outdoorSofa", label: "Lounge-Sofa", at: [-6.0, -4.9] },
      { id: "roof-table", type: "outdoorCoffeeTable", label: "Loungetisch", at: [-5.0, -6.85] },
      { id: "roof-firepit", type: "firePit", label: "Feuerschale", at: [-3.4, -4.4] },
      { id: "roof-lounger-1", type: "sunLounger", label: "Sonnenliege", at: [3.6, -6.1] },
      { id: "roof-lounger-2", type: "sunLounger", label: "Sonnenliege", at: [5.2, -6.1] },
      { id: "roof-parasol", type: "parasol", label: "Sonnenschirm", at: [6.6, -6.4] },
      { id: "roof-pergola", type: "pergola", label: "Pergola mit Lichterkette", at: [5.6, 1.4] },
      { id: "roof-dining", type: "outdoorDiningTable", label: "Esstisch Teak", at: [5.6, 1.4] },
      { id: "roof-chair-1", type: "outdoorChair", label: "Stuhl", at: [4.9, 0.55], rot: 180 },
      { id: "roof-chair-2", type: "outdoorChair", label: "Stuhl", at: [6.3, 0.55], rot: 180 },
      { id: "roof-chair-3", type: "outdoorChair", label: "Stuhl", at: [4.9, 2.25] },
      { id: "roof-chair-4", type: "outdoorChair", label: "Stuhl", at: [6.3, 2.25] },
      { id: "roof-planter-1", type: "planterBox", label: "Gräser-Pflanzkasten", at: [-1.2, -7.0] },
      { id: "roof-planter-2", type: "planterBox", label: "Gräser-Pflanzkasten", at: [-10.1, 0.2], rot: 90 },
    ],
  },
  {
    id: "garden",
    name: "Garten & Pool",
    level: "ground",
    bounds: { x0: -14, z0: -14.4, x1: 14, z1: -6.2 },
    floor: "deck",
    spawn: [-4.8, -8.4, 20],
    lights: [
      [5.5, -12.2],
      [-6, -8],
    ],
    items: [
      { id: "garden-lounger-1", type: "sunLounger", label: "Sonnenliege", at: [-1.6, -11.2] },
      { id: "garden-lounger-2", type: "sunLounger", label: "Sonnenliege", at: [-3.2, -11.2] },
      { id: "garden-parasol", type: "parasol", label: "Sonnenschirm", at: [-4.6, -11.6] },
      { id: "garden-olive", type: "oliveTree", label: "Olivenbaum", at: [-10.5, -11.2] },
      { id: "garden-palm-1", type: "palmTall", label: "Palme", at: [12.2, -11.8] },
      { id: "garden-palm-2", type: "palmTall", label: "Palme", at: [-13.0, -7.4] },
      { id: "garden-cypress-1", type: "cypress", label: "Zypresse", at: [13.3, -6.8] },
      { id: "garden-cypress-2", type: "cypress", label: "Zypresse", at: [13.3, -8.4] },
      { id: "garden-cypress-3", type: "cypress", label: "Zypresse", at: [-13.2, -12.8] },
      { id: "garden-shower", type: "outdoorShower", label: "Außendusche", at: [11.4, -9.2], rot: 90 },
      { id: "garden-sofa", type: "sofa", label: "Terrassen-Sofa", at: [-8.2, -8.0], mats: { fabric: "fabricOutdoor", accent: "fabricNavy" } },
      { id: "garden-table", type: "outdoorCoffeeTable", label: "Loungetisch", at: [-8.2, -9.4] },
    ],
  },
];

export function getRoom(id: string): Room | undefined {
  return ROOMS.find((room) => room.id === id);
}

export function roomFloorY(room: Room): number {
  return room.level === "roof" ? ROOF_Y : 0;
}

export function roomArea(room: Room): number {
  const { x0, z0, x1, z1 } = room.bounds;
  return Math.round((x1 - x0) * (z1 - z0) * 10) / 10;
}
