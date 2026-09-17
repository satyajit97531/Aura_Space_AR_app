export type ViewMode = "3d_perspective" | "3d_isometric" | "2d_blueprint";

export interface RoomDimensions {
  width: number;  // in meters (X axis)
  length: number; // in meters (Z axis)
  height: number; // in meters (Y axis)
}

export interface ColorPalette {
  id: string;
  name: string;
  wallColor: string;
  floorColor: string;
  accentColor: string;
  baseColor: string;
  floorTextureType: "oak_wood" | "polished_concrete" | "terrazzo" | "marble" | "slate_tile";
  wallTextureType: "matte" | "limewash" | "warm_plaster" | "linen";
}

export type CatalogCategory =
  | "seating"
  | "tables"
  | "storage"
  | "beds"
  | "lighting"
  | "appliances"
  | "kitchen"
  | "bathroom"
  | "plants"
  | "decor";

export type ProceduralFurnitureType =
  | "modern_sofa"
  | "lounge_chair"
  | "coffee_table"
  | "dining_table"
  | "bookshelf"
  | "platform_bed"
  | "floor_lamp"
  | "potted_monstera"
  | "credenza"
  | "work_desk"
  | "wall_art"
  | "rug"
  | "ottoman"
  | "pendant_light"
  | "air_conditioner"
  | "refrigerator"
  | "ceiling_fan"
  | "smart_tv_unit"
  | "washing_machine"
  | "microwave_oven"
  | "kitchen_island"
  | "gas_cooktop_hood"
  | "bathtub"
  | "toilet_commode"
  | "bathroom_vanity"
  | "shower_enclosure"
  | "sectional_sofa"
  | "wardrobe_closet"
  | "nightstand"
  | "soundbar_system"
  | "gaming_workstation"
  | "air_purifier"
  | "coffee_espresso_bar"
  | "ergonomic_office_chair"
  | "bar_stools"
  | "round_marble_table"
  | "king_bed_deluxe"
  | "pendant_chandelier"
  | "table_lamp"
  | "wall_sconce"
  | "dresser_drawers"
  | "wall_clock"
  | "fiddle_leaf_fig"
  | "loveseat_sofa"
  | "shoe_rack"
  | "full_length_mirror"
  | "standing_desk"
  | "floating_wall_shelf"
  | "acoustic_slat_panel";

export interface FurnitureItemDef {
  id: string;
  name: string;
  category: CatalogCategory;
  proceduralType: ProceduralFurnitureType;
  iconName: string;
  defaultDimensions: {
    width: number;  // meters
    height: number; // meters
    depth: number;  // meters
  };
  defaultColor: string;
  defaultAccentColor?: string;
  description: string;
  tags: string[];
}

export interface PlacedObject {
  id: string;
  catalogId: string;
  name: string;
  proceduralType: ProceduralFurnitureType;
  position: [number, number, number]; // [x, y, z] in meters (y is elevation)
  rotation: [number, number, number]; // Euler angles [rx, ry, rz] in radians
  scale: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
  accentColor?: string;
  materialType?: string;
}

export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface AuraProject {
  id?: string;
  name: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  updatedAt?: string;
  createdAt?: string;
  roomDimensions: RoomDimensions;
  colorPalette: ColorPalette;
  placedObjects: PlacedObject[];
  notes?: string;
  isPublic?: boolean;
  likesCount?: number;
  likedBy?: string[];
  comments?: ProjectComment[];
  forkedFrom?: {
    projectId: string;
    authorName: string;
    authorId?: string | null;
  };
}

export interface AppPrivacySettings {
  isProfilePublic: boolean;
  allowOthersToCopy: boolean;
  showActivityStatus: boolean;
  defaultProjectPublic: boolean;
}

export interface AppNotificationSettings {
  notificationsEnabled: boolean;
  notifyOnLikes: boolean;
  notifyOnComments: boolean;
  notifyOnBadges: boolean;
  soundEffectsEnabled: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  criteria: string;
  unlockedAt?: string;
}

export type MeasurementUnit = "m" | "cm" | "ft" | "in";
export type AppTheme = "default" | "dark" | "white";

export interface UserAccount {
  id: string;
  name: string;
  username?: string;
  email: string;
  createdAt?: string;
  bio?: string;
  avatarUrl?: string;
  totalLikes?: number;
  badges?: string[];
  showcasedBadges?: string[];
  projects?: AuraProject[];
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestion?: AISuggestion;
}

export type ARStatus =
  | "idle"
  | "unsupported_desktop"
  | "checking_hardware"
  | "webxr_active"
  | "camera_passthrough_active"
  | "low_end_fallback";

export interface ARDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsWebXR: boolean;
  hasCamera: boolean;
  isLowEnd: boolean;
  recommendedMode: "webxr" | "camera_passthrough" | "unsupported";
}

export interface AISuggestion {
  title: string;
  advice: string;
  aestheticStyle?: string;
  flowAnalysis?: string;
  recommendedPalette?: {
    name: string;
    wallColor: string;
    floorColor: string;
    accentColor: string;
  };
  suggestedAdditions?: Array<{
    catalogId: string;
    name: string;
    proceduralType: ProceduralFurnitureType;
    suggestedPosition: [number, number, number];
    reason: string;
  }>;
}
