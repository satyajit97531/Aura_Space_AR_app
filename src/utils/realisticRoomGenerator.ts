import { PlacedObject, RoomDimensions, ColorPalette, FurnitureItemDef } from "../types";
import { FURNITURE_CATALOG, COLOR_PALETTES } from "../data/catalog";

export interface GeneratedRoomPlan {
  projectName: string;
  dimensions: RoomDimensions;
  palette: ColorPalette;
  objects: PlacedObject[];
}

function getItemDef(id: string): FurnitureItemDef {
  const direct = FURNITURE_CATALOG.find((c) => c.id === id);
  if (direct) return direct;
  console.warn(`Catalog item "${id}" not found in catalog, using fallback.`);
  return FURNITURE_CATALOG[0];
}

function makePlaced(
  def: FurnitureItemDef,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  customColor?: string,
  customAccentColor?: string,
  customDimensions?: { width: number; height: number; depth: number }
): PlacedObject {
  return {
    id: `furn_${Math.random().toString(36).substring(2, 10)}`,
    catalogId: def.id,
    name: def.name,
    proceduralType: def.proceduralType,
    position,
    rotation,
    scale: [1, 1, 1],
    dimensions: customDimensions || { ...def.defaultDimensions },
    color: customColor || def.defaultColor,
    accentColor: customAccentColor || def.defaultAccentColor,
  };
}

// Bounding box collision checker to keep random floor items well-spaced and non-overlapping
interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function boxesOverlap(a: BoundingBox2D, b: BoundingBox2D, margin = 0.15): boolean {
  return !(
    a.maxX + margin < b.minX ||
    a.minX - margin > b.maxX ||
    a.maxZ + margin < b.minZ ||
    a.minZ - margin > b.maxZ
  );
}

function randomBetween(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomDistinct<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generates a completely randomized, procedurally composed room layout.
 * Picks random room dimensions, random furniture from the catalog,
 * and distributes them in sensible, randomized spatial zones without collision.
 */
export function generateRealisticRoom(): GeneratedRoomPlan {
  // 1. Procedural room dimensions (width 4.8m to 7.2m, length 4.2m to 6.2m, height 2.7m to 3.2m)
  const width = randomBetween(4.8, 7.2, 1);
  const length = randomBetween(4.2, 6.2, 1);
  const height = randomBetween(2.7, 3.2, 1);

  // 2. Random color palette
  const palette = pickRandom(COLOR_PALETTES);

  // 3. Pick a random creative room concept
  const roomThemes = [
    "Modern Living Sanctuary",
    "Japandi Minimalist Lounge",
    "Executive Atelier Studio",
    "Open Creative Penthouse",
    "Cozy Master Suite",
    "Mid-Century Entertainment Lounge",
    "Nordic Culinary & Living",
    "Contemporary Sunlit Haven",
    "Minimalist Media Salon",
  ];
  const projectName = `${pickRandom(roomThemes)} (${width}m × ${length}m)`;

  const objects: PlacedObject[] = [];
  const placedBoxes: BoundingBox2D[] = [];

  // Helper to test if a candidate floor placement fits without colliding with other floor furniture
  const tryPlaceFloorItem = (
    def: FurnitureItemDef,
    preferredCenter?: [number, number],
    jitter = 0.8,
    customRotation?: number
  ): boolean => {
    const itemW = def.defaultDimensions.width;
    const itemD = def.defaultDimensions.depth;
    const halfRoomW = width / 2 - itemW / 2 - 0.25;
    const halfRoomL = length / 2 - itemD / 2 - 0.25;

    if (halfRoomW <= 0.1 || halfRoomL <= 0.1) return false;

    // Up to 15 attempts to find an open non-colliding spot
    for (let attempt = 0; attempt < 15; attempt++) {
      let x = preferredCenter
        ? preferredCenter[0] + randomBetween(-jitter, jitter)
        : randomBetween(-halfRoomW, halfRoomW);
      let z = preferredCenter
        ? preferredCenter[1] + randomBetween(-jitter, jitter)
        : randomBetween(-halfRoomL, halfRoomL);

      // Clamp inside room boundary
      x = Math.max(-halfRoomW, Math.min(halfRoomW, Number(x.toFixed(2))));
      z = Math.max(-halfRoomL, Math.min(halfRoomL, Number(z.toFixed(2))));

      const candidateBox: BoundingBox2D = {
        minX: x - itemW / 2,
        maxX: x + itemW / 2,
        minZ: z - itemD / 2,
        maxZ: z + itemD / 2,
      };

      const collides = placedBoxes.some((b) => boxesOverlap(candidateBox, b, 0.2));
      if (!collides) {
        placedBoxes.push(candidateBox);
        const rotY =
          customRotation !== undefined
            ? customRotation
            : pickRandom([0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 0.25, -Math.PI * 0.25]);

        objects.push(makePlaced(def, [x, 0, z], [0, rotY, 0], palette.baseColor, palette.accentColor));
        return true;
      }
    }
    return false;
  };

  // --- A. Center Area Rug (Floor level y=0.002, does not block floor furniture) ---
  const rugDef = getItemDef("rug_area_textured");
  const rugOffsetX = randomBetween(-0.4, 0.4);
  const rugOffsetZ = randomBetween(-0.3, 0.5);
  objects.push(
    makePlaced(
      rugDef,
      [rugOffsetX, 0.002, rugOffsetZ],
      [0, pickRandom([0, Math.PI * 0.5]), 0],
      palette.wallColor
    )
  );

  // --- B. Main Primary Anchor Furniture ---
  // Pick from large sofas, beds, workstations, or dining tables
  const anchorCandidates = [
    "sofa_modern_3seat",
    "sofa_sectional_lshape",
    "seating_loveseat_boucle",
    "bed_king_deluxe_upholstered",
    "bed_platform_queen",
    "appliance_gaming_workstation",
    "table_round_marble_dining",
    "table_dining_6seat",
  ];
  const chosenAnchorId = pickRandom(anchorCandidates);
  const anchorDef = getItemDef(chosenAnchorId);

  // Place anchor in a primary quadrant or center
  const anchorX = randomBetween(-0.5, 0.5);
  const anchorZ = randomBetween(0.2, length / 2 - anchorDef.defaultDimensions.depth / 2 - 0.3);
  const anchorRot = pickRandom([Math.PI, 0, Math.PI * 0.5, -Math.PI * 0.5]);

  placedBoxes.push({
    minX: anchorX - anchorDef.defaultDimensions.width / 2,
    maxX: anchorX + anchorDef.defaultDimensions.width / 2,
    minZ: anchorZ - anchorDef.defaultDimensions.depth / 2,
    maxZ: anchorZ + anchorDef.defaultDimensions.depth / 2,
  });
  objects.push(makePlaced(anchorDef, [anchorX, 0, anchorZ], [0, anchorRot, 0], palette.baseColor, palette.floorColor));

  // --- C. Wall-Mounted Features along North, South, East, or West Wall ---
  // North wall feature: TV unit, Bookshelf, or Cooktop/Vanity
  const northWallFeatures = [
    "appliance_smart_tv_unit",
    "bookshelf_modular",
    "credenza_fluted",
    "storage_sliding_wardrobe",
    "bathroom_floating_vanity",
  ];
  const northDef = getItemDef(pickRandom(northWallFeatures));
  const northX = randomBetween(-width / 3, width / 3);
  const northZ = -length / 2 + northDef.defaultDimensions.depth / 2 + 0.05;
  placedBoxes.push({
    minX: northX - northDef.defaultDimensions.width / 2,
    maxX: northX + northDef.defaultDimensions.width / 2,
    minZ: -length / 2,
    maxZ: northZ + northDef.defaultDimensions.depth / 2,
  });
  objects.push(makePlaced(northDef, [northX, 0, northZ], [0, 0, 0], palette.floorColor, palette.accentColor));

  // If North wall feature is TV or Credenza, add soundbar on it
  if (northDef.id === "appliance_smart_tv_unit" || northDef.id === "credenza_fluted") {
    const soundbarDef = getItemDef("appliance_soundbar_subwoofer");
    objects.push(
      makePlaced(
        soundbarDef,
        [northX, 0.45, northZ + 0.05],
        [0, 0, 0],
        "#18181B",
        "#38BDF8"
      )
    );
  }

  // Split AC unit mounted high on North or East wall
  const acDef = getItemDef("appliance_air_conditioner");
  const acSide = Math.random() > 0.5 ? "north" : "east";
  if (acSide === "north") {
    const acX = randomBetween(-width / 2 + 0.8, width / 2 - 0.8);
    objects.push(makePlaced(acDef, [acX, height - 0.55, -length / 2 + 0.15], [0, 0, 0], "#F8F8FA", "#0EA5E9"));
  } else {
    const acZ = randomBetween(-length / 2 + 0.8, length / 2 - 0.8);
    objects.push(makePlaced(acDef, [width / 2 - 0.15, height - 0.55, acZ], [0, -Math.PI / 2, 0], "#F8F8FA", "#0EA5E9"));
  }

  // Wall Art Gallery Canvas mounted on West or South wall
  const artDef = getItemDef("art_gallery_canvas");
  const artX = randomBetween(-width / 3, width / 3);
  objects.push(makePlaced(artDef, [artX, 1.45, -length / 2 + 0.04], [0, 0, 0], "#1E293B", palette.accentColor));

  // --- D. Tables (Coffee table or Side table) ---
  const tableCandidates = ["table_coffee_organic", "bedroom_nightstand", "storage_entryway_shoe_rack"];
  const tableDef = getItemDef(pickRandom(tableCandidates));
  tryPlaceFloorItem(tableDef, [anchorX, anchorZ - 1.1], 0.6);

  // --- E. Lounge / Accent Seating (1 to 2 random chairs/poufs) ---
  const accentSeats = [
    "armchair_scandi",
    "ottoman_round",
    "chair_ergonomic_office",
    "seating_scandi_bar_stools",
  ];
  const numSeats = Math.random() > 0.4 ? 2 : 1;
  const pickedSeats = pickRandomDistinct(accentSeats, numSeats);
  pickedSeats.forEach((seatId) => {
    const seatDef = getItemDef(seatId);
    tryPlaceFloorItem(seatDef, [randomBetween(-width / 2 + 1, width / 2 - 1), randomBetween(-length / 2 + 1, length / 2 - 1)], 1.2);
  });

  // --- F. Storage / Workstation / Secondary Cabinet ---
  const secondaryStorage = [
    "bookshelf_modular",
    "credenza_fluted",
    "storage_dresser_drawers",
    "desk_workspace",
    "tables_standing_desk_smart",
  ];
  const storageDef = getItemDef(pickRandom(secondaryStorage));
  // Place along West wall or South wall
  const westX = -width / 2 + storageDef.defaultDimensions.depth / 2 + 0.05;
  const westZ = randomBetween(-length / 3, length / 3);
  tryPlaceFloorItem(storageDef, [westX, westZ], 0.3, Math.PI * 0.5);

  // --- G. Modern Appliances (Air Purifier / Espresso Bar / Mini Fridge) ---
  const applianceCandidates = [
    "appliance_air_purifier",
    "appliance_espresso_bar",
    "appliance_refrigerator_french",
    "appliance_washing_machine",
  ];
  const appDef = getItemDef(pickRandom(applianceCandidates));
  tryPlaceFloorItem(appDef, [width / 2 - 0.7, randomBetween(-length / 2 + 0.8, length / 2 - 0.8)], 0.5);

  // --- H. Lighting Fixtures ---
  // Ceiling fixture (Ceiling Fan or Sputnik Chandelier)
  const ceilingDef = getItemDef(Math.random() > 0.5 ? "appliance_ceiling_fan" : "light_chandelier_sputnik");
  objects.push(
    makePlaced(
      ceilingDef,
      [randomBetween(-0.3, 0.3), height - 0.38, randomBetween(-0.3, 0.3)],
      [0, randomBetween(0, Math.PI * 2), 0],
      palette.floorColor,
      "#C8A251"
    )
  );

  // Standing Floor Lamp
  const lampDef = getItemDef("lamp_arc_floor");
  tryPlaceFloorItem(lampDef, [-width / 2 + 0.7, randomBetween(0, length / 2 - 0.7)], 0.4);

  // --- I. Biophilic Flora & Organic Decor ---
  const plants = ["plant_monstera_ceramic", "plant_fiddle_leaf_fig"];
  const plantDef = getItemDef(pickRandom(plants));
  // Place in a random corner
  const cornerX = Math.random() > 0.5 ? width / 2 - 0.55 : -width / 2 + 0.55;
  const cornerZ = Math.random() > 0.5 ? length / 2 - 0.55 : -length / 2 + 0.55;
  tryPlaceFloorItem(plantDef, [cornerX, cornerZ], 0.3);

  // Optional 2nd plant if room is spacious
  if (width * length > 24) {
    const secondPlantDef = getItemDef(pickRandom(plants));
    tryPlaceFloorItem(secondPlantDef, [-cornerX, -cornerZ], 0.4);
  }

  // Minimal wall clock or mirror
  const decorDef = getItemDef(Math.random() > 0.5 ? "decor_wall_clock_minimal" : "decor_full_length_mirror");
  if (decorDef.id === "decor_wall_clock_minimal") {
    objects.push(makePlaced(decorDef, [randomBetween(-1, 1), height - 0.8, length / 2 - 0.05], [0, Math.PI, 0]));
  } else {
    tryPlaceFloorItem(decorDef, [width / 2 - 0.4, randomBetween(-0.5, 0.5)], 0.3, -Math.PI * 0.5);
  }

  return {
    projectName,
    dimensions: { width, length, height },
    palette,
    objects,
  };
}
