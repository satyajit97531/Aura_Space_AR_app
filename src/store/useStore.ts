import { create } from "zustand";
import {
  RoomDimensions,
  ColorPalette,
  FurnitureItemDef,
  PlacedObject,
  AuraProject,
  UserAccount,
  ViewMode,
  ARStatus,
  AppTheme,
  MeasurementUnit,
  AppPrivacySettings,
  AppNotificationSettings,
} from "../types";
import { COLOR_PALETTES, FURNITURE_CATALOG } from "../data/catalog";
import { generateRealisticRoom } from "../utils/realisticRoomGenerator";
import { playClickSound, playSnapSound, playSuccessChime } from "../utils/audio";

interface WallVisibility {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

interface AuraState {
  // Room geometry
  roomWidth: number;   // meters (X)
  roomLength: number;  // meters (Z)
  roomHeight: number;  // meters (Y)
  setRoomDimensions: (width: number, length: number, height: number) => void;
  
  // Walls and presentation
  wallVisibility: WallVisibility;
  toggleWall: (wall: keyof WallVisibility) => void;
  setAllWalls: (visible: boolean) => void;
  cutawayMode: boolean;
  setCutawayMode: (enabled: boolean) => void;

  // Active theme color palette
  activePalette: ColorPalette;
  setActivePalette: (palette: ColorPalette) => void;

  // Catalog & Selection
  selectedCatalogItem: FurnitureItemDef | null;
  setSelectedCatalogItem: (item: FurnitureItemDef | null) => void;

  // Placed objects
  placedObjects: PlacedObject[];
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;

  // Spawning & Modifying
  addObject: (item: FurnitureItemDef, position: [number, number, number]) => PlacedObject;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  rotateObject: (id: string, deltaRadians: number) => void; // ±π/4 (±45°)
  setObjectRotation: (id: string, angleRadians: number) => void;
  setObjectDimensions: (id: string, dimensions: { width: number; height: number; depth: number }) => void;
  nudgeObject: (id: string, axis: "x" | "y" | "z", delta: number) => void;
  clearRoom: () => void;
  setPlacedObjects: (objects: PlacedObject[]) => void;
  randomizeRealisticRoom: () => void;

  // Direct 3D dragging lock for OrbitControls
  isDraggingObject: boolean;
  setIsDraggingObject: (isDragging: boolean) => void;

  // View & Helpers
  activeViewMode: ViewMode;
  setActiveViewMode: (mode: ViewMode) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number; // 0.25 meters
  showDimensions: boolean;
  setShowDimensions: (show: boolean) => void;
  showShadows: boolean;
  setShowShadows: (show: boolean) => void;

  // History (Undo / Redo up to 30 moves)
  history: PlacedObject[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Canvas lifecycle & active state
  isCanvasActive: boolean;
  closeCanvas: () => void;

  // Projects persistence
  currentProjectName: string;
  currentProjectId: string | null;
  setCurrentProjectName: (name: string) => void;
  saveProjectToStorageAndCloud: () => Promise<void>;
  loadProject: (project: AuraProject) => void;
  isReadOnlyProject: boolean;
  currentProjectAuthorId: string | null;
  currentProjectAuthorName: string | null;
  forkProject: (sourceProject?: AuraProject) => Promise<{ success: boolean; project?: AuraProject; error?: string }>;
  createNewProject: (
    name?: string,
    initialObjects?: PlacedObject[],
    roomConfig?: {
      width?: number;
      length?: number;
      height?: number;
      palette?: ColorPalette;
    }
  ) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  savedProjects: AuraProject[];
  fetchSavedProjects: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Custom Colors & Custom Palettes
  customColors: string[];
  addCustomColor: (hex: string) => void;
  removeCustomColor: (hex: string) => void;
  customPalettes: ColorPalette[];
  addCustomPalette: (palette: ColorPalette) => void;
  removeCustomPalette: (id: string) => void;

  // Autosave status badge
  autosaveStatus: "saved" | "saving" | "idle";

  // Sidebars Responsive State
  isCatalogOpen: boolean;
  setIsCatalogOpen: (open: boolean) => void;
  toggleCatalog: () => void;
  isPropertiesOpen: boolean;
  setIsPropertiesOpen: (open: boolean) => void;
  toggleProperties: () => void;

  // AR Pipeline
  arStatus: ARStatus;
  setARStatus: (status: ARStatus) => void;
  isARFallbackOpen: boolean;
  setIsARFallbackOpen: (open: boolean) => void;

  // User Authentication & Account-Specific Cloud Sync
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Settings & Theme & Measurement Units (WhatsApp / Instagram Inspired)
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  privacySettings: AppPrivacySettings;
  updatePrivacySettings: (updates: Partial<AppPrivacySettings>) => void;
  notificationSettings: AppNotificationSettings;
  updateNotificationSettings: (updates: Partial<AppNotificationSettings>) => void;
  performanceMode: "high" | "battery_saver";
  setPerformanceMode: (mode: "high" | "battery_saver") => void;
  showDimensionsOverlay: boolean;
  setShowDimensionsOverlay: (show: boolean) => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;

  // Public Profile, Gallery & Achievements
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileModalTab: "profile" | "gallery" | "achievements";
  setProfileModalTab: (tab: "profile" | "gallery" | "achievements") => void;
  openPublicProfileTab: (tab?: "profile" | "gallery" | "achievements") => void;
  updateUserProfile: (data: Partial<UserAccount>) => Promise<boolean>;
  unlockAchievement: (badgeId: string) => Promise<void>;
  toggleProjectVisibility: (projectId: string, isPublic: boolean) => Promise<void>;
  likeProject: (projectId: string) => Promise<{ success: boolean; hasLiked: boolean; likesCount: number }>;
  addProjectComment: (projectId: string, text: string) => Promise<boolean>;
}

const MAX_HISTORY = 30;
const CUSTOM_COLORS_KEY = "auraspace_custom_colors_v1";
const CUSTOM_PALETTES_KEY = "auraspace_custom_palettes_v1";

function getStoredUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("aura_user_account");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "default";
  try {
    return (localStorage.getItem("auraspace_theme") as AppTheme) || "default";
  } catch {
    return "default";
  }
}

function getStoredUnit(): MeasurementUnit {
  if (typeof window === "undefined") return "m";
  try {
    return (localStorage.getItem("auraspace_unit") as MeasurementUnit) || "m";
  } catch {
    return "m";
  }
}

function getStoredPrivacySettings(): AppPrivacySettings {
  const defaults: AppPrivacySettings = {
    isProfilePublic: true,
    allowOthersToCopy: true,
    showActivityStatus: true,
    defaultProjectPublic: false,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem("auraspace_privacy_settings");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function getStoredNotificationSettings(): AppNotificationSettings {
  const defaults: AppNotificationSettings = {
    notificationsEnabled: true,
    notifyOnLikes: true,
    notifyOnComments: true,
    notifyOnBadges: true,
    soundEffectsEnabled: true,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem("auraspace_notification_settings");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function getStoredPerformanceMode(): "high" | "battery_saver" {
  if (typeof window === "undefined") return "high";
  try {
    return (localStorage.getItem("auraspace_perf_mode") as any) || "high";
  } catch {
    return "high";
  }
}

export function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-white", "theme-dark", "theme-default");
  root.classList.add(`theme-${theme}`);
  root.setAttribute("data-theme", theme);

  const appRoot = document.getElementById("auraspace-app-root");
  if (appRoot) {
    appRoot.classList.remove("theme-white", "theme-dark", "theme-default");
    appRoot.classList.add(`theme-${theme}`);
    appRoot.setAttribute("data-theme", theme);
  }
}

if (typeof window !== "undefined") {
  try {
    const initialTheme = getStoredTheme();
    applyThemeToDocument(initialTheme);
  } catch (e) {}
}

function getUserStorageKey(user: UserAccount | null): string {
  return user?.id ? `aura_projects_user_${user.id}` : "aura_projects_guest";
}

const DEFAULT_CUSTOM_COLORS = [
  "#D6CFC4",
  "#7A6753",
  "#22201D",
  "#6A4E38",
  "#C8A251",
  "#3B4A3F",
  "#A89F91",
  "#C97A5E",
  "#1B3B36",
  "#8E9296",
  "#4F46E5",
  "#0EA5E9",
];

function getStoredCustomColors(): string[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_COLORS;
  try {
    const data = localStorage.getItem(CUSTOM_COLORS_KEY);
    return data ? JSON.parse(data) : DEFAULT_CUSTOM_COLORS;
  } catch {
    return DEFAULT_CUSTOM_COLORS;
  }
}

function getStoredCustomPalettes(): ColorPalette[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CUSTOM_PALETTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

let autosaveTimer: any = null;
function triggerDebouncedAutosave() {
  if (typeof window === "undefined") return;
  const state = useStore.getState();
  if (!state.isCanvasActive) return; // Do not autosave when canvas is closed or deleted!
  if (autosaveTimer) clearTimeout(autosaveTimer);
  useStore.setState({ autosaveStatus: "saving" });
  autosaveTimer = setTimeout(async () => {
    try {
      if (!useStore.getState().isCanvasActive) return;
      await useStore.getState().saveProjectToStorageAndCloud();
      useStore.setState({ autosaveStatus: "saved" });
    } catch {
      useStore.setState({ autosaveStatus: "saved" });
    }
  }, 600);
}

// Default starter scene
const DEFAULT_INITIAL_OBJECTS: PlacedObject[] = [
  {
    id: "init_sofa",
    catalogId: "sofa_modern_3seat",
    name: "Aura Horizon 3-Seat Sofa",
    proceduralType: "modern_sofa",
    position: [0, 0, 0.9],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: 2.2, height: 0.82, depth: 0.92 },
    color: "#D6CFC4",
    accentColor: "#7A6753",
  },
  {
    id: "init_coffee_table",
    catalogId: "table_coffee_organic",
    name: "Kyoto Low Coffee Table",
    proceduralType: "coffee_table",
    position: [0, 0, -0.4],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: 1.25, height: 0.4, depth: 0.7 },
    color: "#826245",
    accentColor: "#2B2824",
  },
  {
    id: "init_rug",
    catalogId: "rug_area_textured",
    name: "Nordic High-Pile Wool Rug",
    proceduralType: "rug",
    position: [0, 0, 0.2],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: 2.6, height: 0.03, depth: 1.8 },
    color: "#EAE5DC",
    accentColor: "#8C8379",
  },
  {
    id: "init_armchair",
    catalogId: "armchair_scandi",
    name: "Oslo Lounge Armchair",
    proceduralType: "lounge_chair",
    position: [1.6, 0, -0.3],
    rotation: [0, -Math.PI / 4, 0], // angled towards center
    scale: [1, 1, 1],
    dimensions: { width: 0.88, height: 0.78, depth: 0.85 },
    color: "#3B4A3F",
    accentColor: "#C19A6B",
  },
  {
    id: "init_plant",
    catalogId: "plant_monstera_ceramic",
    name: "Terracotta Potted Monstera",
    proceduralType: "potted_monstera",
    position: [-2.1, 0, 1.8],
    rotation: [0, 0.4, 0],
    scale: [1, 1, 1],
    dimensions: { width: 0.65, height: 1.15, depth: 0.65 },
    color: "#2D5A3F",
    accentColor: "#C97A5E",
  },
  {
    id: "init_lamp",
    catalogId: "lamp_arc_floor",
    name: "Archimede Arc Floor Lamp",
    proceduralType: "floor_lamp",
    position: [-1.7, 0, 1.0],
    rotation: [0, Math.PI / 6, 0],
    scale: [1, 1, 1],
    dimensions: { width: 0.5, height: 2.05, depth: 1.1 },
    color: "#222222",
    accentColor: "#FFF4D4",
  },
];

// Helper to push history snapshot safely
const pushHistory = (currentHistory: PlacedObject[][], currentIndex: number, newObjects: PlacedObject[]) => {
  const sliced = currentHistory.slice(0, currentIndex + 1);
  const deepCopy = JSON.parse(JSON.stringify(newObjects));
  const next = [...sliced, deepCopy];
  if (next.length > MAX_HISTORY) {
    next.shift();
  }
  triggerDebouncedAutosave();
  return {
    history: next,
    historyIndex: next.length - 1,
    canUndo: next.length > 1,
    canRedo: false,
  };
};

export const useStore = create<AuraState>((set, get) => ({
  // Room dimensions (Width: 6m, Length: 5m, Height: 2.8m standard architectural scale)
  roomWidth: 6.0,
  roomLength: 5.0,
  roomHeight: 2.8,
  setRoomDimensions: (width, length, height) => {
    set({
      roomWidth: Math.max(1.0, Math.min(100000.0, Number(width.toFixed(2)))),
      roomLength: Math.max(1.0, Math.min(100000.0, Number(length.toFixed(2)))),
      roomHeight: Math.max(1.0, Math.min(10000.0, Number(height.toFixed(2)))),
    });
    triggerDebouncedAutosave();
  },

  // Wall visibility
  wallVisibility: {
    north: true,
    south: false, // open by default for perfect isometric/dollhouse viewing
    east: true,
    west: true,
  },
  toggleWall: (wall) =>
    set((state) => ({
      wallVisibility: {
        ...state.wallVisibility,
        [wall]: !state.wallVisibility[wall],
      },
    })),
  setAllWalls: (visible) =>
    set({
      wallVisibility: { north: visible, south: visible, east: visible, west: visible },
    }),
  cutawayMode: true,
  setCutawayMode: (enabled) => set({ cutawayMode: enabled }),

  // Palette
  activePalette: COLOR_PALETTES[0],
  setActivePalette: (palette) => {
    set({ activePalette: palette });
    triggerDebouncedAutosave();
  },

  // Selected catalog item ready for floor placement or drag
  selectedCatalogItem: FURNITURE_CATALOG[0],
  setSelectedCatalogItem: (item) => set({ selectedCatalogItem: item }),

  // Objects in scene
  placedObjects: DEFAULT_INITIAL_OBJECTS,
  selectedObjectId: "init_sofa",
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  // 3D dragging OrbitControls lock
  isDraggingObject: false,
  setIsDraggingObject: (isDragging) => set({ isDraggingObject: isDragging }),

  // View mode
  activeViewMode: "3d_perspective",
  setActiveViewMode: (mode) => set({ activeViewMode: mode }),
  snapToGrid: true,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  gridSize: 0.25, // quarter-meter grid snapping
  showDimensions: true,
  setShowDimensions: (show) => set({ showDimensions: show }),
  showShadows: true,
  setShowShadows: (show) => set({ showShadows: show }),

  // History tracking
  history: [JSON.parse(JSON.stringify(DEFAULT_INITIAL_OBJECTS))],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  addObject: (item, position) => {
    const state = get();
    const newObj: PlacedObject = {
      id: `aura_obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      catalogId: item.id,
      name: item.name,
      proceduralType: item.proceduralType,
      position: [
        Number(position[0].toFixed(2)),
        Number(position[1].toFixed(2)),
        Number(position[2].toFixed(2)),
      ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { ...item.defaultDimensions },
      color: item.defaultColor,
      accentColor: item.defaultAccentColor,
    };

    const newPlaced = [...state.placedObjects, newObj];
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);

    if (state.notificationSettings?.soundEffectsEnabled) {
      playClickSound();
    }

    set({
      placedObjects: newPlaced,
      selectedObjectId: newObj.id,
      ...hist,
    });

    return newObj;
  },

  updateObject: (id, updates) => {
    const state = get();
    const newPlaced = state.placedObjects.map((obj) =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      ...hist,
    });
  },

  removeObject: (id) => {
    const state = get();
    const newPlaced = state.placedObjects.filter((o) => o.id !== id);
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      ...hist,
    });
  },

  duplicateObject: (id) => {
    const state = get();
    const target = state.placedObjects.find((o) => o.id === id);
    if (!target) return;

    if (state.notificationSettings?.soundEffectsEnabled) {
      playClickSound();
    }

    const cloned: PlacedObject = {
      ...JSON.parse(JSON.stringify(target)),
      id: `aura_obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Copy)`,
      position: [
        Math.min(state.roomWidth / 2 - 0.5, target.position[0] + 0.4),
        target.position[1],
        Math.min(state.roomLength / 2 - 0.5, target.position[2] + 0.4),
      ],
    };

    const newPlaced = [...state.placedObjects, cloned];
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      selectedObjectId: cloned.id,
      ...hist,
    });
  },

  rotateObject: (id, deltaRadians) => {
    const state = get();
    const target = state.placedObjects.find((o) => o.id === id);
    if (!target) return;

    const newY = (target.rotation[1] + deltaRadians) % (Math.PI * 2);
    const newPlaced = state.placedObjects.map((o) =>
      o.id === id ? { ...o, rotation: [o.rotation[0], newY, o.rotation[2]] as [number, number, number] } : o
    );
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      ...hist,
    });
  },

  setObjectRotation: (id, angleRadians) => {
    const state = get();
    const target = state.placedObjects.find((o) => o.id === id);
    if (!target) return;

    const normalizedAngle = ((angleRadians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const newPlaced = state.placedObjects.map((o) =>
      o.id === id ? { ...o, rotation: [o.rotation[0], normalizedAngle, o.rotation[2]] as [number, number, number] } : o
    );
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      ...hist,
    });
  },

  setObjectDimensions: (id, dims) => {
    const state = get();
    const target = state.placedObjects.find((o) => o.id === id);
    if (!target) return;

    const newW = Math.max(0.05, Number(dims.width.toFixed(3)));
    const newH = Math.max(0.05, Number(dims.height.toFixed(3)));
    const newD = Math.max(0.05, Number(dims.depth.toFixed(3)));

    const newPlaced = state.placedObjects.map((o) =>
      o.id === id ? { ...o, dimensions: { width: newW, height: newH, depth: newD } } : o
    );
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      ...hist,
    });
  },

  nudgeObject: (id, axis, delta) => {
    const state = get();
    const target = state.placedObjects.find((o) => o.id === id);
    if (!target) return;

    const halfW = state.roomWidth / 2 - target.dimensions.width / 2;
    const halfL = state.roomLength / 2 - target.dimensions.depth / 2;

    const pos = [...target.position] as [number, number, number];
    if (axis === "x") {
      pos[0] = Math.max(-halfW, Math.min(halfW, Number((pos[0] + delta).toFixed(2))));
    } else if (axis === "y") {
      pos[1] = Math.max(0, Math.min(state.roomHeight - 0.2, Number((pos[1] + delta).toFixed(2))));
    } else if (axis === "z") {
      pos[2] = Math.max(-halfL, Math.min(halfL, Number((pos[2] + delta).toFixed(2))));
    }

    const newPlaced = state.placedObjects.map((o) =>
      o.id === id ? { ...o, position: pos } : o
    );
    const hist = pushHistory(state.history, state.historyIndex, newPlaced);
    set({
      placedObjects: newPlaced,
      ...hist,
    });
  },

  clearRoom: () => {
    const state = get();
    const hist = pushHistory(state.history, state.historyIndex, []);
    set({
      placedObjects: [],
      selectedObjectId: null,
      ...hist,
    });
  },

  setPlacedObjects: (objects) => {
    const state = get();
    const hist = pushHistory(state.history, state.historyIndex, objects);
    set({
      placedObjects: objects,
      ...hist,
    });
  },

  randomizeRealisticRoom: () => {
    const state = get();
    const plan = generateRealisticRoom();
    const hist = pushHistory(state.history, state.historyIndex, plan.objects);
    set({
      roomWidth: plan.dimensions.width,
      roomLength: plan.dimensions.length,
      roomHeight: plan.dimensions.height,
      activePalette: plan.palette,
      placedObjects: plan.objects,
      currentProjectName: plan.projectName,
      selectedObjectId: null,
      ...hist,
    });
  },

  // Undo / Redo engine
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const targetObjects = JSON.parse(JSON.stringify(state.history[newIndex]));
      set({
        placedObjects: targetObjects,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const targetObjects = JSON.parse(JSON.stringify(state.history[newIndex]));
      set({
        placedObjects: targetObjects,
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
      });
    }
  },

  // Canvas lifecycle
  isCanvasActive: true,
  closeCanvas: () => {
    set({
      isCanvasActive: false,
      currentProjectId: null,
      currentProjectName: "",
      placedObjects: [],
      selectedObjectId: null,
      selectedCatalogItem: null,
      history: [[]],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
      autosaveStatus: "idle",
    });
  },

  // Projects persistence
  currentProjectName: "Nordic Living Room Concept",
  currentProjectId: "project_default",
  setCurrentProjectName: (name) => set({ currentProjectName: name }),

  isReadOnlyProject: false,
  currentProjectAuthorId: null,
  currentProjectAuthorName: null,

  savedProjects: [],

  saveProjectToStorageAndCloud: async () => {
    const state = get();
    if (!state.isCanvasActive) return; // Do not save when canvas is closed or inactive

    // IMMUTABILITY & PROTECTION:
    // If viewing another designer's blueprint, do NOT overwrite the original!
    if (state.isReadOnlyProject) {
      // Automatically fork and preserve as user's own editable copy
      const currentProjectSnapshot: AuraProject = {
        name: state.currentProjectName,
        roomDimensions: {
          width: state.roomWidth,
          length: state.roomLength,
          height: state.roomHeight,
        },
        colorPalette: state.activePalette,
        placedObjects: state.placedObjects,
        userId: state.currentProjectAuthorId || undefined,
        userName: state.currentProjectAuthorName || undefined,
        id: state.currentProjectId || undefined,
        updatedAt: new Date().toISOString(),
      };
      await state.forkProject(currentProjectSnapshot);
      return;
    }

    const projId = state.currentProjectId || `project_${Date.now()}`;
    const project: AuraProject = {
      id: projId,
      name: state.currentProjectName || "Untitled Spatial Plan",
      userId: state.currentUser?.id,
      userEmail: state.currentUser?.email,
      updatedAt: new Date().toISOString(),
      roomDimensions: {
        width: state.roomWidth,
        length: state.roomLength,
        height: state.roomHeight,
      },
      colorPalette: state.activePalette,
      placedObjects: state.placedObjects,
    };

    const storageKey = getUserStorageKey(state.currentUser);

    // 1. LocalStorage storage with strict ID and Name deduplication per user
    try {
      const existing = localStorage.getItem(storageKey);
      const list: AuraProject[] = existing ? JSON.parse(existing) : [];
      // Remove any existing project with matching ID or matching name (to avoid duplicate ghost saves)
      const filtered = list.filter(
        (p) =>
          p.id !== projId &&
          (p as any)._id !== projId &&
          (p.name || "").trim().toLowerCase() !== (project.name || "").trim().toLowerCase()
      );
      const updatedList = [project, ...filtered];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      set({ savedProjects: updatedList, currentProjectId: projId });
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }

    // 2. Cloud MongoDB synchronization
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const data = await res.json();
      if (data.success && data.project?.id) {
        const canonicalId = data.project.id;
        if (canonicalId !== projId) {
          const currentList = get().savedProjects.map((p) =>
            p.id === projId ? { ...p, id: canonicalId } : p
          );
          try {
            localStorage.setItem(storageKey, JSON.stringify(currentList));
          } catch {}
          set({ savedProjects: currentList, currentProjectId: canonicalId });
        }
      }
    } catch (err) {
      console.warn("Cloud sync will retry:", err);
    }

    // Auto-evaluate milestone achievements
    if (state.currentUser?.id) {
      state.unlockAchievement("first_blueprint");
      if ((get().savedProjects?.length || 0) >= 3) {
        state.unlockAchievement("master_builder");
      }
      if (state.placedObjects?.length >= 5) {
        state.unlockAchievement("furniture_collector");
      }
      if (state.roomWidth * state.roomLength >= 50) {
        state.unlockAchievement("grand_palace");
      }
      if (
        state.placedObjects?.some(
          (o) =>
            o.name.toLowerCase().includes("plant") ||
            o.name.toLowerCase().includes("monstera") ||
            o.name.toLowerCase().includes("fig") ||
            o.name.toLowerCase().includes("olive") ||
            o.proceduralType === "potted_monstera" ||
            o.proceduralType === "fiddle_leaf_fig"
        )
      ) {
        state.unlockAchievement("biophilic_zen");
      }
      if (
        state.placedObjects?.some(
          (o) =>
            o.name.toLowerCase().includes("lamp") ||
            o.name.toLowerCase().includes("light") ||
            o.name.toLowerCase().includes("sconce") ||
            o.name.toLowerCase().includes("chandelier") ||
            o.proceduralType === "floor_lamp" ||
            o.proceduralType === "table_lamp" ||
            o.proceduralType === "pendant_light" ||
            o.proceduralType === "pendant_chandelier" ||
            o.proceduralType === "wall_sconce"
        )
      ) {
        state.unlockAchievement("light_sculptor");
      }
    }
  },

  loadProject: (project) => {
    const deepObjects = JSON.parse(JSON.stringify(project.placedObjects || []));
    const currentUser = get().currentUser;
    const isOtherUserProject = Boolean(
      project.userId && (!currentUser?.id || project.userId !== currentUser.id)
    );

    set({
      isCanvasActive: true,
      currentProjectName: project.name || "Loaded Project",
      currentProjectId: project.id || (project as any)._id || null,
      isReadOnlyProject: isOtherUserProject,
      currentProjectAuthorId: isOtherUserProject ? (project.userId || null) : null,
      currentProjectAuthorName: isOtherUserProject ? (project.userName || "Community Designer") : null,
      roomWidth: project.roomDimensions?.width || 6.0,
      roomLength: project.roomDimensions?.length || 5.0,
      roomHeight: project.roomDimensions?.height || 2.8,
      activePalette: project.colorPalette || COLOR_PALETTES[0],
      placedObjects: deepObjects,
      selectedObjectId: deepObjects.length > 0 ? deepObjects[0].id : null,
      history: [JSON.parse(JSON.stringify(deepObjects))],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  forkProject: async (sourceProject?: AuraProject) => {
    const state = get();
    const effectiveSource: AuraProject = sourceProject || {
      id: state.currentProjectId || undefined,
      name: state.currentProjectName,
      roomDimensions: {
        width: state.roomWidth,
        length: state.roomLength,
        height: state.roomHeight,
      },
      colorPalette: state.activePalette,
      placedObjects: state.placedObjects,
      userId: state.currentProjectAuthorId || undefined,
      userName: state.currentProjectAuthorName || undefined,
      updatedAt: new Date().toISOString(),
    };

    const currentUser = state.currentUser;
    const sourceId = effectiveSource.id || (effectiveSource as any)._id;

    let clonedProject: AuraProject | null = null;
    const cleanSourceTitle = (effectiveSource.name || "Untitled Blueprint").replace(/ \(Remix\)+$| \(Copy\)+$/i, "").trim();
    const clonedName = `${cleanSourceTitle} (Remix)`;
    const newClientProjId = `project_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Attempt server-side clone endpoint
    if (sourceId) {
      try {
        const res = await fetch(`/api/projects/${sourceId}/fork`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser?.id,
            userName: currentUser?.name || currentUser?.username || "Designer",
            userEmail: currentUser?.email,
          }),
        });
        const data = await res.json();
        if (data.success && data.project) {
          clonedProject = data.project;
        }
      } catch (err) {
        console.warn("Server fork endpoint unavailable, creating local copy:", err);
      }
    }

    // 2. Client-side fallback if server offline or source had no canonical ID
    if (!clonedProject) {
      const now = new Date().toISOString();
      clonedProject = {
        id: newClientProjId,
        name: clonedName,
        userId: currentUser?.id,
        userName: currentUser?.name || currentUser?.username || "Designer",
        userEmail: currentUser?.email,
        roomDimensions: {
          width: effectiveSource.roomDimensions?.width || state.roomWidth,
          length: effectiveSource.roomDimensions?.length || state.roomLength,
          height: effectiveSource.roomDimensions?.height || state.roomHeight,
        },
        colorPalette: effectiveSource.colorPalette || state.activePalette,
        placedObjects: JSON.parse(JSON.stringify(effectiveSource.placedObjects || state.placedObjects || [])),
        notes: `Remixed from @${effectiveSource.userName || "community"}`,
        isPublic: false,
        likesCount: 0,
        likedBy: [],
        comments: [],
        forkedFrom: {
          projectId: sourceId || "original",
          authorName: effectiveSource.userName || "Community Designer",
          authorId: effectiveSource.userId,
        },
        createdAt: now,
        updatedAt: now,
      };

      try {
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clonedProject),
        });
      } catch {}
    }

    // 3. Persist into user local storage
    const storageKey = getUserStorageKey(currentUser);
    try {
      const existing = localStorage.getItem(storageKey);
      const list: AuraProject[] = existing ? JSON.parse(existing) : [];
      const updatedList = [clonedProject, ...list.filter((p) => p.id !== clonedProject!.id)];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      set({ savedProjects: updatedList });
    } catch {}

    // 4. Activate the newly cloned project as full editable workspace
    const deepObjects = JSON.parse(JSON.stringify(clonedProject.placedObjects || []));
    set({
      currentProjectId: clonedProject.id,
      currentProjectName: clonedProject.name,
      isReadOnlyProject: false,
      currentProjectAuthorId: null,
      currentProjectAuthorName: null,
      isCanvasActive: true,
      roomWidth: clonedProject.roomDimensions.width,
      roomLength: clonedProject.roomDimensions.length,
      roomHeight: clonedProject.roomDimensions.height,
      activePalette: clonedProject.colorPalette,
      placedObjects: deepObjects,
      selectedObjectId: deepObjects.length > 0 ? deepObjects[0].id : null,
      history: [JSON.parse(JSON.stringify(deepObjects))],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });

    if (state.notificationSettings.soundEffectsEnabled) {
      playSuccessChime();
    }

    return { success: true, project: clonedProject };
  },

  fetchSavedProjects: async () => {
    // Helper to deduplicate projects by ID and Name, keeping the one with higher object count or newer timestamp
    const deduplicate = (projects: AuraProject[]): AuraProject[] => {
      const map = new Map<string, AuraProject>();
      for (const p of projects) {
        const id = p.id || (p as any)._id || p.name;
        const nameKey = (p.name || "").trim().toLowerCase();
        
        let matchKey: string | null = null;
        for (const [k, v] of map.entries()) {
          if (k === id || (v.name || "").trim().toLowerCase() === nameKey) {
            matchKey = k;
            break;
          }
        }

        if (!matchKey) {
          map.set(id, p);
        } else {
          const existing = map.get(matchKey)!;
          const existingCount = existing.placedObjects?.length || 0;
          const newCount = p.placedObjects?.length || 0;
          if (
            newCount > existingCount ||
            (newCount === existingCount &&
              new Date(p.updatedAt).getTime() > new Date(existing.updatedAt).getTime())
          ) {
            map.delete(matchKey);
            map.set(id, p);
          }
        }
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    };

    const user = get().currentUser;
    const storageKey = getUserStorageKey(user);

    // Check localStorage first
    let localList: AuraProject[] = [];
    try {
      const local = localStorage.getItem(storageKey);
      if (local) {
        localList = JSON.parse(local);
      }
    } catch (e) {
      console.warn("Error reading localStorage projects:", e);
    }

    // Then check MongoDB scoped to current logged-in user
    if (user && user.id) {
      try {
        const res = await fetch(`/api/projects?userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          const all = [...data.projects, ...localList];
          const deduped = deduplicate(all);
          set({ savedProjects: deduped });
          return;
        }
      } catch (e) {
        console.warn("Offline or MongoDB fetch failed, using local list:", e);
      }
    }

    set({ savedProjects: deduplicate(localList) });
  },

  createNewProject: async (
    name?: string,
    initialObjects?: PlacedObject[],
    roomConfig?: {
      width?: number;
      length?: number;
      height?: number;
      palette?: ColorPalette;
    }
  ) => {
    const state = get();
    const projName = (name || "").trim() || `Spatial Plan ${state.savedProjects.length + 1}`;
    const newId = `project_${Date.now()}`;
    const objects = initialObjects ? JSON.parse(JSON.stringify(initialObjects)) : [];
    const width = roomConfig?.width ?? 6.0;
    const length = roomConfig?.length ?? 5.0;
    const height = roomConfig?.height ?? 2.8;
    const palette = roomConfig?.palette ?? COLOR_PALETTES[0];

    const emptyHist = {
      history: [JSON.parse(JSON.stringify(objects))],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    };

    set({
      isCanvasActive: true,
      currentProjectName: projName,
      currentProjectId: newId,
      placedObjects: objects,
      selectedObjectId: objects.length > 0 ? objects[0].id : null,
      selectedCatalogItem: null,
      roomWidth: width,
      roomLength: length,
      roomHeight: height,
      activePalette: palette,
      ...emptyHist,
    });

    await get().saveProjectToStorageAndCloud();
  },

  renameProject: async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const state = get();
    const storageKey = getUserStorageKey(state.currentUser);

    const updated = state.savedProjects.map((p) =>
      p.id === id || (p as any)._id === id
        ? { ...p, name: trimmed, updatedAt: new Date().toISOString() }
        : p
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn("LocalStorage rename error:", e);
    }

    set({
      savedProjects: updated,
      currentProjectName:
        state.currentProjectId === id ? trimmed : state.currentProjectName,
    });

    const target = updated.find((p) => p.id === id || (p as any)._id === id);
    if (target) {
      try {
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        });
      } catch (err) {
        console.warn("Cloud rename error:", err);
      }
    }
  },

  deleteProject: async (id) => {
    const state = get();
    const storageKey = getUserStorageKey(state.currentUser);

    // Check if the project being deleted is the currently active canvas
    const targetProject = state.savedProjects.find(
      (p) => p.id === id || (p as any)._id === id
    );
    const isCurrent =
      state.currentProjectId === id ||
      (targetProject && (targetProject.id === state.currentProjectId || (targetProject as any)._id === state.currentProjectId)) ||
      (targetProject && targetProject.name.trim().toLowerCase() === state.currentProjectName.trim().toLowerCase());

    const updated = state.savedProjects.filter(
      (p) => p.id !== id && (p as any)._id !== id
    );

    if (isCurrent) {
      // RESET TO BLACK SCREEN WITHOUT CANVAS WHEN DELETED
      set({
        savedProjects: updated,
        isCanvasActive: false,
        currentProjectId: null,
        currentProjectName: "",
        placedObjects: [],
        selectedObjectId: null,
        selectedCatalogItem: null,
        history: [[]],
        historyIndex: 0,
        canUndo: false,
        canRedo: false,
        autosaveStatus: "idle",
      });
    } else {
      set({ savedProjects: updated });
    }

    // Persist removal to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn("LocalStorage delete error:", e);
    }

    // Persist removal to backend / MongoDB
    try {
      const query = state.currentUser?.id ? `?userId=${encodeURIComponent(state.currentUser.id)}` : "";
      await fetch(`/api/projects/${id}${query}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Server delete error:", e);
    }
  },

  // User Authentication & Account Scoping
  currentUser: getStoredUser(),
  setCurrentUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("aura_user_account", JSON.stringify(user));
      } else {
        localStorage.removeItem("aura_user_account");
      }
    }
    set({ currentUser: user, savedProjects: [] });
    get().fetchSavedProjects();
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aura_user_account");
    }
    set({
      currentUser: null,
      savedProjects: [],
      isCanvasActive: false,
      currentProjectId: null,
      currentProjectName: "",
      placedObjects: [],
    });
    get().fetchSavedProjects();
  },
  isAuthModalOpen: false,
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  // Settings & Theme & Measurement Units
  theme: getStoredTheme(),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auraspace_theme", theme);
      } catch (e) {}
    }
    applyThemeToDocument(theme);
    set({ theme });
  },

  measurementUnit: getStoredUnit(),
  setMeasurementUnit: (unit) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auraspace_unit", unit);
      } catch (e) {}
    }
    set({ measurementUnit: unit });
  },

  isSettingsModalOpen: false,
  setIsSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),

  // WhatsApp / Instagram style extended settings
  privacySettings: getStoredPrivacySettings(),
  updatePrivacySettings: (updates) => {
    const updated = { ...get().privacySettings, ...updates };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auraspace_privacy_settings", JSON.stringify(updated));
      } catch (e) {}
    }
    set({ privacySettings: updated });
  },

  notificationSettings: getStoredNotificationSettings(),
  updateNotificationSettings: (updates) => {
    const updated = { ...get().notificationSettings, ...updates };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auraspace_notification_settings", JSON.stringify(updated));
      } catch (e) {}
    }
    set({ notificationSettings: updated });
  },

  performanceMode: getStoredPerformanceMode(),
  setPerformanceMode: (mode) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("auraspace_perf_mode", mode);
      } catch (e) {}
    }
    set({ performanceMode: mode });
  },

  showDimensionsOverlay: true,
  setShowDimensionsOverlay: (show) => set({ showDimensionsOverlay: show }),

  autoSaveEnabled: true,
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

  // Public Profile, Gallery & Achievements
  isProfileModalOpen: false,
  setIsProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  profileModalTab: "profile",
  setProfileModalTab: (tab) => set({ profileModalTab: tab }),
  openPublicProfileTab: (tab = "profile") => set({ isProfileModalOpen: true, profileModalTab: tab }),

  updateUserProfile: async (data: Partial<UserAccount>) => {
    const user = get().currentUser;
    if (!user || !user.id) return false;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: data.name,
          username: data.username,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          showcasedBadges: data.showcasedBadges,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.user) {
        const updatedUser: UserAccount = {
          ...user,
          ...resData.user,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("aura_user_account", JSON.stringify(updatedUser));
        }
        set({ currentUser: updatedUser });
        return true;
      }
    } catch (e) {
      console.warn("Update profile error:", e);
    }
    return false;
  },

  unlockAchievement: async (badgeId: string) => {
    const user = get().currentUser;
    if (!user || !user.id) return;
    if (user.badges?.includes(badgeId)) return;

    try {
      const res = await fetch("/api/user/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, badgeId }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.badges)) {
        const updated = { ...user, badges: data.badges };
        if (typeof window !== "undefined") {
          localStorage.setItem("aura_user_account", JSON.stringify(updated));
        }
        set({ currentUser: updated });
      }
    } catch (e) {
      console.warn("Unlock badge error:", e);
    }
  },

  toggleProjectVisibility: async (projectId: string, isPublic: boolean) => {
    const user = get().currentUser;
    const currentList = get().savedProjects;
    const updatedList = currentList.map((p) =>
      p.id === projectId || (p as any).clientProjId === projectId ? { ...p, isPublic } : p
    );
    set({ savedProjects: updatedList });

    // Update in localStorage
    const storageKey = getUserStorageKey(user);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {}

    // Cloud sync
    try {
      await fetch(`/api/projects/${projectId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic, userId: user?.id }),
      });
      if (isPublic) {
        get().unlockAchievement("public_curator");
      }
    } catch (e) {
      console.warn("Visibility toggle error:", e);
    }
  },

  likeProject: async (projectId: string) => {
    const user = get().currentUser;
    const uid = user?.id || "anonymous_session";
    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.success) {
        // Also update local list if it exists
        const currentList = get().savedProjects.map((p) => {
          if (p.id === projectId || (p as any).clientProjId === projectId) {
            const likedBy = p.likedBy || [];
            const newLikedBy = data.hasLiked ? [...likedBy, uid] : likedBy.filter((x) => x !== uid);
            return { ...p, likedBy: newLikedBy, likesCount: data.likesCount };
          }
          return p;
        });
        set({ savedProjects: currentList });
        if (data.hasLiked) {
          get().unlockAchievement("community_star");
        }
        return { success: true, hasLiked: data.hasLiked, likesCount: data.likesCount };
      }
    } catch (e) {
      console.warn("Like error:", e);
    }
    return { success: false, hasLiked: false, likesCount: 0 };
  },

  addProjectComment: async (projectId: string, text: string) => {
    const user = get().currentUser;
    try {
      const res = await fetch(`/api/projects/${projectId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "guest",
          userName: user?.username || user?.name || "Guest Designer",
          userAvatar: user?.avatarUrl,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        get().unlockAchievement("design_critic");
        return true;
      }
    } catch (e) {
      console.warn("Comment error:", e);
    }
    return false;
  },

  // Custom Colors & Custom Palettes
  customColors: getStoredCustomColors(),
  addCustomColor: (hex: string) => {
    const normalized = hex.toUpperCase();
    const current = get().customColors;
    if (!current.includes(normalized)) {
      const next = [normalized, ...current];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn("Error saving custom color:", e);
        }
      }
      set({ customColors: next });
    }
  },
  removeCustomColor: (hex: string) => {
    const next = get().customColors.filter((c) => c.toUpperCase() !== hex.toUpperCase());
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Error removing custom color:", e);
      }
    }
    set({ customColors: next });
  },

  customPalettes: getStoredCustomPalettes(),
  addCustomPalette: (palette: ColorPalette) => {
    const current = get().customPalettes;
    const filtered = current.filter((p) => p.id !== palette.id);
    const next = [palette, ...filtered];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Error saving custom palette:", e);
      }
    }
    set({ customPalettes: next, activePalette: palette });
    triggerDebouncedAutosave();
  },
  removeCustomPalette: (id: string) => {
    const next = get().customPalettes.filter((p) => p.id !== id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Error removing custom palette:", e);
      }
    }
    set({ customPalettes: next });
  },

  autosaveStatus: "saved",

  // Responsive sidebar toggles
  isCatalogOpen: typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  setIsCatalogOpen: (open) => set({ isCatalogOpen: open }),
  toggleCatalog: () => set((state) => ({ isCatalogOpen: !state.isCatalogOpen })),

  isPropertiesOpen: typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  setIsPropertiesOpen: (open) => set({ isPropertiesOpen: open }),
  toggleProperties: () => set((state) => ({ isPropertiesOpen: !state.isPropertiesOpen })),

  // AR Pipeline
  arStatus: "idle",
  setARStatus: (status) => set({ arStatus: status }),
  isARFallbackOpen: false,
  setIsARFallbackOpen: (open) => set({ isARFallbackOpen: open }),
}));

// Set up window event listeners for trigger-undo and trigger-redo
if (typeof window !== "undefined") {
  window.addEventListener("trigger-undo", () => {
    useStore.getState().undo();
  });
  window.addEventListener("trigger-redo", () => {
    useStore.getState().redo();
  });
}
