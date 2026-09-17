import React, { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { COLOR_PALETTES } from "../../data/catalog";
import { ColorPalette } from "../../types";
import { formatDistance, formatArea } from "../../utils/units";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import {
  RotateCw,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Copy,
  Trash2,
  Maximize2,
  Palette,
  Sliders,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Home,
  Layers,
  Compass,
  Shuffle,
  Plus,
  Check,
} from "lucide-react";

export const PropertiesSidebar: React.FC = () => {
  const {
    placedObjects,
    selectedObjectId,
    setSelectedObjectId,
    removeObject,
    duplicateObject,
    rotateObject,
    setObjectRotation,
    setObjectDimensions,
    nudgeObject,
    updateObject,
    roomWidth,
    roomLength,
    roomHeight,
    setRoomDimensions,
    wallVisibility,
    toggleWall,
    setAllWalls,
    cutawayMode,
    setCutawayMode,
    activePalette,
    setActivePalette,
    clearRoom,
    randomizeRealisticRoom,
    customColors,
    addCustomColor,
    removeCustomColor,
    customPalettes,
    addCustomPalette,
    removeCustomPalette,
    measurementUnit,
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Custom Palette Creator state
  const [showNewPaletteForm, setShowNewPaletteForm] = useState(false);
  const [customPalName, setCustomPalName] = useState("");
  const [customWallColor, setCustomWallColor] = useState("#F4EFE6");
  const [customFloorColor, setCustomFloorColor] = useState("#BAA082");
  const [customAccentColor, setCustomAccentColor] = useState("#3D4B40");
  const [customBaseColor, setCustomBaseColor] = useState("#E6DEC9");

  // Toggle listener from navbar on mobile
  useEffect(() => {
    const handleToggle = () => setIsCollapsed((prev) => !prev);
    window.addEventListener("toggle-properties-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-properties-sidebar", handleToggle);
  }, []);

  const handleSaveCustomPalette = () => {
    const name = customPalName.trim() || `Custom Palette ${customPalettes.length + 1}`;
    const newPal: ColorPalette = {
      id: `custom_pal_${Date.now()}`,
      name,
      wallColor: customWallColor,
      floorColor: customFloorColor,
      accentColor: customAccentColor,
      baseColor: customBaseColor,
      floorTextureType: "oak_wood",
      wallTextureType: "matte",
    };
    addCustomPalette(newPal);
    setActivePalette(newPal);
    setShowNewPaletteForm(false);
    setCustomPalName("");
  };

  const selectedItem = placedObjects.find((o) => o.id === selectedObjectId);

  // Rotation in degrees (0 - 359)
  const currentRotationRad = selectedItem ? selectedItem.rotation[1] : 0;
  const currentRotationDeg = Math.round(
    (((currentRotationRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) *
      (180 / Math.PI)
  );

  const handleRotationDegChange = (deg: number) => {
    if (!selectedItem) return;
    const normalized = ((deg % 360) + 360) % 360;
    setObjectRotation(selectedItem.id, (normalized * Math.PI) / 180);
  };

  const handleElevationChange = (newY: number) => {
    if (!selectedItem) return;
    const clampedY = Math.max(0, Math.min(roomHeight, Number(newY.toFixed(2))));
    updateObject(selectedItem.id, {
      position: [selectedItem.position[0], clampedY, selectedItem.position[2]],
    });
  };

  const handleDimensionChange = (
    axis: "width" | "height" | "depth",
    val: number
  ) => {
    if (!selectedItem) return;
    const positiveVal = Math.max(0.05, Number(val.toFixed(2)));
    setObjectDimensions(selectedItem.id, {
      ...selectedItem.dimensions,
      [axis]: positiveVal,
    });
  };

  const handleCoordChange = (axis: "x" | "z", val: number) => {
    if (!selectedItem) return;
    const newPos = [...selectedItem.position] as [number, number, number];
    if (axis === "x") newPos[0] = Number(val.toFixed(2));
    if (axis === "z") newPos[2] = Number(val.toFixed(2));
    updateObject(selectedItem.id, { position: newPos });
  };

  // Color Swatches
  const colorPresets = [
    "#D6CFC4",
    "#EDE7DC",
    "#FAF6F0",
    "#3B4A3F",
    "#22201D",
    "#6A4E38",
    "#C97A5E",
    "#4A6B5C",
    "#8E9296",
    "#0EA5E9",
    "#F8F8FA",
    "#1C1C1E",
  ];

  return (
    <>
      {/* Mobile / Tablet Overlay Backdrop */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 top-14 bg-black/60 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      <aside
        id="auraspace-properties-sidebar"
        className={`h-full bg-stone-900/95 backdrop-blur-xl border-l border-stone-800 transition-all duration-200 flex flex-col select-none text-stone-100 z-40 shrink-0 max-lg:fixed max-lg:top-14 max-lg:bottom-0 max-lg:right-0 max-lg:shadow-2xl ${
          isCollapsed ? "max-lg:translate-x-full lg:w-14" : "w-80 max-w-[88vw]"
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          id="toggle-properties-sidebar-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3.5 top-6 z-30 p-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:text-white shadow-md transition-colors"
          title={isCollapsed ? "Expand Inspector" : "Collapse Inspector"}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {isCollapsed ? (
          /* Collapsed Icon Bar */
          <div className="flex-1 flex flex-col items-center py-5 space-y-6">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2.5 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700"
              title="Properties Inspector"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <div className="w-8 h-px bg-stone-800" />
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              title="Room Dimensions"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              title="360° Rotation"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              title="Color & Palette"
            >
              <Palette className="w-4 h-4" />
            </button>
            <div className="w-8 h-px bg-stone-800" />
            <button
              onClick={randomizeRealisticRoom}
              className="p-2.5 rounded-xl text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
              title="Generate Random Realistic Room"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Expanded Inspector Panel */
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {selectedItem ? (
              /* SELECTED OBJECT INSPECTOR */
              <div className="p-4 space-y-5">
                {/* Object Header */}
                <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">
                      Active Selection
                    </span>
                    <h3 className="font-semibold text-stone-100 text-sm truncate mt-0.5">
                      {selectedItem.name}
                    </h3>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                      {selectedItem.proceduralType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <button
                    id="deselect-object-btn"
                    onClick={() => setSelectedObjectId(null)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                    title="Deselect object"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Object Actions (Duplicate & Delete with Confirmation) */}
                <div className="flex items-center gap-2">
                  <button
                    id="duplicate-selected-btn"
                    onClick={() => duplicateObject(selectedItem.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors border border-stone-700/60"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    id="delete-selected-btn"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium transition-colors"
                    title="Delete object"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* 360-DEGREE ROTATION CONTROLS */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>360° Object Rotation</span>
                    </div>
                    {/* Direct Angle Typing Input */}
                    <div className="flex items-center gap-1">
                      <input
                        id="rotation-degree-input"
                        type="number"
                        min="0"
                        max="360"
                        value={currentRotationDeg}
                        onChange={(e) =>
                          handleRotationDegChange(Number(e.target.value) || 0)
                        }
                        className="w-14 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-amber-400 focus:outline-none focus:border-amber-500 font-bold"
                      />
                      <span className="text-xs text-stone-400 font-mono">°</span>
                    </div>
                  </div>

                  {/* 360 Continuous Slider */}
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={currentRotationDeg}
                    onChange={(e) =>
                      handleRotationDegChange(Number(e.target.value))
                    }
                    className="w-full accent-amber-500 bg-stone-700 h-1.5 rounded-lg cursor-pointer"
                  />

                  {/* Quick Angle Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[0, 90, 180, 270].map((ang) => (
                      <button
                        key={ang}
                        onClick={() => handleRotationDegChange(ang)}
                        className={`py-1 text-[11px] font-mono rounded-lg border transition-colors ${
                          currentRotationDeg === ang
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold"
                            : "bg-stone-800 border-stone-700/60 text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>

                  {/* Nudge Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      onClick={() => rotateObject(selectedItem.id, -Math.PI / 4)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700/60 transition-colors"
                      title="-45 Degrees"
                    >
                      <RotateCcw className="w-3 h-3 text-stone-400" />
                      <span>-45°</span>
                    </button>
                    <button
                      onClick={() => rotateObject(selectedItem.id, Math.PI / 4)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700/60 transition-colors"
                      title="+45 Degrees"
                    >
                      <RotateCw className="w-3 h-3 text-stone-400" />
                      <span>+45°</span>
                    </button>
                  </div>
                </div>

                {/* ELEVATION & POSITION */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                      <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Elevation (Floor / Wall / Ceiling)</span>
                    </div>
                    {/* Manual typing for elevation */}
                    <div className="flex items-center gap-1">
                      <input
                        id="object-elevation-input"
                        type="number"
                        step="0.05"
                        min="0"
                        max={roomHeight}
                        value={selectedItem.position[1].toFixed(2)}
                        onChange={(e) =>
                          handleElevationChange(Number(e.target.value) || 0)
                        }
                        className="w-16 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-stone-400 font-mono">m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleElevationChange(0)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 border border-stone-700/60 transition-colors"
                    >
                      Floor (0m)
                    </button>
                    <button
                      onClick={() =>
                        handleElevationChange(
                          Math.max(0, selectedItem.position[1] - 0.05)
                        )
                      }
                      className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 border border-stone-700/60"
                      title="Lower 5cm"
                    >
                      -5cm
                    </button>
                    <button
                      onClick={() =>
                        handleElevationChange(
                          Math.min(roomHeight, selectedItem.position[1] + 0.05)
                        )
                      }
                      className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 border border-stone-700/60"
                      title="Raise 5cm"
                    >
                      +5cm
                    </button>
                  </div>
                </div>

                {/* MANUAL DIMENSIONS TYPING */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <span className="text-xs font-semibold text-stone-200 block">
                    Furniture Dimensions (Manual Typing)
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        Width (X)
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          id="furniture-dim-width-input"
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={selectedItem.dimensions.width.toFixed(2)}
                          onChange={(e) =>
                            handleDimensionChange(
                              "width",
                              Number(e.target.value) || 0.1
                            )
                          }
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        Height (Y)
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          id="furniture-dim-height-input"
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={selectedItem.dimensions.height.toFixed(2)}
                          onChange={(e) =>
                            handleDimensionChange(
                              "height",
                              Number(e.target.value) || 0.1
                            )
                          }
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        Depth (Z)
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          id="furniture-dim-depth-input"
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={selectedItem.dimensions.depth.toFixed(2)}
                          onChange={(e) =>
                            handleDimensionChange(
                              "depth",
                              Number(e.target.value) || 0.1
                            )
                          }
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* POSITION COORDINATES & ARROW NUDGE */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <span className="text-xs font-semibold text-stone-200 block">
                    Position Coordinates & Nudge
                  </span>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        X Coord (m)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedItem.position[0].toFixed(2)}
                        onChange={(e) =>
                          handleCoordChange("x", Number(e.target.value) || 0)
                        }
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        Z Coord (m)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedItem.position[2].toFixed(2)}
                        onChange={(e) =>
                          handleCoordChange("z", Number(e.target.value) || 0)
                        }
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Nudge D-Pad */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => nudgeObject(selectedItem.id, "z", -0.1)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60"
                      title="Nudge Forward (-Z)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => nudgeObject(selectedItem.id, "x", -0.1)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60"
                        title="Nudge Left (-X)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ±10cm
                      </span>
                      <button
                        onClick={() => nudgeObject(selectedItem.id, "x", 0.1)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60"
                        title="Nudge Right (+X)"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => nudgeObject(selectedItem.id, "z", 0.1)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700/60"
                      title="Nudge Backward (+Z)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* COLOR & FINISH */}
                <div className="space-y-3 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200">
                      Material Finish Color
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-stone-400 uppercase">
                        {selectedItem.color || "#D6CFC4"}
                      </span>
                      <input
                        type="color"
                        value={selectedItem.color || "#D6CFC4"}
                        onChange={(e) =>
                          updateObject(selectedItem.id, { color: e.target.value })
                        }
                        className="w-6 h-6 rounded cursor-pointer border border-stone-700 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Standard Quick Swatches */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {colorPresets.map((hex) => (
                      <button
                        key={hex}
                        onClick={() =>
                          updateObject(selectedItem.id, { color: hex })
                        }
                        className={`h-6 rounded-lg border transition-transform hover:scale-105 ${
                          selectedItem.color?.toLowerCase() === hex.toLowerCase()
                            ? "border-amber-400 scale-105 shadow-sm"
                            : "border-stone-700/60"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  {/* Save to Custom Colors Action */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (selectedItem.color) {
                          addCustomColor(selectedItem.color);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400 hover:text-amber-300 py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 transition-colors shadow-xs"
                      title="Save current color to your reusable palette"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save Color</span>
                    </button>
                    {customColors.length > 0 && (
                      <span className="text-[10px] text-stone-500">
                        {customColors.length} custom saved
                      </span>
                    )}
                  </div>

                  {/* Saved Custom Colors List */}
                  {customColors.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                        My Saved Custom Colors
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {customColors.map((hex) => (
                          <div key={hex} className="group relative">
                            <button
                              onClick={() =>
                                updateObject(selectedItem.id, { color: hex })
                              }
                              className={`w-7 h-7 rounded-lg border transition-transform hover:scale-105 ${
                                selectedItem.color?.toLowerCase() === hex.toLowerCase()
                                  ? "border-amber-400 ring-1 ring-amber-400 shadow-sm"
                                  : "border-stone-700/80"
                              }`}
                              style={{ backgroundColor: hex }}
                              title={`Apply custom ${hex}`}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCustomColor(hex);
                              }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-900 border border-stone-600 text-stone-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete color"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* NO OBJECT SELECTED: ROOM ARCHITECTURAL PROPERTIES */
              <div className="p-4 space-y-5">
                <div className="pb-3 border-b border-stone-800">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Room Architecture
                  </span>
                  <h3 className="font-semibold text-stone-100 text-sm mt-0.5">
                    Spatial & Floor Dimensions
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Manual typing enabled (Supports up to 100,000m)
                  </p>
                </div>

                {/* MANUAL TYPING: ROOM WIDTH, LENGTH, HEIGHT */}
                <div className="space-y-3 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <span className="text-xs font-semibold text-stone-200 block">
                    Room Dimensions (Manual Typing)
                  </span>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-300">Room Width (X)</span>
                      <span className="font-mono text-amber-400 text-xs font-semibold">
                        {formatDistance(roomWidth, measurementUnit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="manual-room-width-input"
                        type="number"
                        step="0.5"
                        min="1"
                        max="100000"
                        value={roomWidth}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setRoomDimensions(val, roomLength, roomHeight);
                        }}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-stone-400 font-mono shrink-0">
                        m
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-300">Room Length (Z)</span>
                      <span className="font-mono text-amber-400 text-xs font-semibold">
                        {formatDistance(roomLength, measurementUnit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="manual-room-length-input"
                        type="number"
                        step="0.5"
                        min="1"
                        max="100000"
                        value={roomLength}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setRoomDimensions(roomWidth, val, roomHeight);
                        }}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-stone-400 font-mono shrink-0">
                        m
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-300">Wall Height (Y)</span>
                      <span className="font-mono text-amber-400 text-xs font-semibold">
                        {formatDistance(roomHeight, measurementUnit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="manual-room-height-input"
                        type="number"
                        step="0.1"
                        min="1"
                        max="10000"
                        value={roomHeight}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setRoomDimensions(roomWidth, roomLength, val);
                        }}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-stone-400 font-mono shrink-0">
                        m
                      </span>
                    </div>
                  </div>

                  {/* Quick Scale Presets */}
                  <div className="pt-2 border-t border-stone-800 flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400">Presets:</span>
                    <button
                      onClick={() => setRoomDimensions(5, 4, 2.8)}
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                    >
                      5×4m
                    </button>
                    <button
                      onClick={() => setRoomDimensions(8, 6, 3.0)}
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                    >
                      8×6m
                    </button>
                    <button
                      onClick={() => setRoomDimensions(20, 15, 4.0)}
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                    >
                      20×15m
                    </button>
                    <button
                      onClick={() => setRoomDimensions(100, 100, 6.0)}
                      className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                    >
                      100m Hall
                    </button>
                  </div>
                </div>

                {/* WALL VISIBILITY */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200">
                      Wall Visibility & Cutaway
                    </span>
                    <button
                      onClick={() => setCutawayMode(!cutawayMode)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                        cutawayMode
                          ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                          : "bg-stone-800 border-stone-700 text-stone-400"
                      }`}
                    >
                      {cutawayMode ? "Dollhouse Active" : "Full Enclosure"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {(["north", "south", "east", "west"] as const).map(
                      (wall) => (
                        <button
                          key={wall}
                          onClick={() => toggleWall(wall)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs capitalize transition-colors ${
                            wallVisibility[wall]
                              ? "bg-stone-800/90 border-stone-700 text-stone-200"
                              : "bg-stone-900/60 border-stone-800/80 text-stone-500"
                          }`}
                        >
                          <span>{wall} Wall</span>
                          {wallVisibility[wall] ? (
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-stone-600" />
                          )}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      onClick={() => setAllWalls(true)}
                      className="text-stone-400 hover:text-stone-200 transition-colors"
                    >
                      Show All Walls
                    </button>
                    <button
                      onClick={() => {
                        toggleWall("south");
                      }}
                      className="text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Toggle Front Wall
                    </button>
                  </div>
                </div>

                {/* MATERIAL PALETTE */}
                <div className="space-y-2.5 p-3 rounded-2xl bg-stone-800/40 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200">
                      Material Atmosphere Theme
                    </span>
                    <button
                      onClick={() => setShowNewPaletteForm(!showNewPaletteForm)}
                      className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 border border-stone-700 transition-colors"
                      title="Create a new custom theme palette"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showNewPaletteForm ? "Cancel" : "New Palette"}</span>
                    </button>
                  </div>

                  {/* Custom Palette Creation Form */}
                  {showNewPaletteForm && (
                    <div className="p-3 rounded-xl bg-stone-900 border border-amber-500/40 space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                          Create Custom Palette
                        </span>
                        <button
                          onClick={() => setShowNewPaletteForm(false)}
                          className="text-stone-400 hover:text-stone-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Palette Name (e.g. Modern Sunset)"
                        value={customPalName}
                        onChange={(e) => setCustomPalName(e.target.value)}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center justify-between bg-stone-800/70 p-1.5 rounded-lg border border-stone-700/50">
                          <span className="text-stone-300">Wall</span>
                          <input
                            type="color"
                            value={customWallColor}
                            onChange={(e) => setCustomWallColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border border-stone-700 bg-transparent"
                          />
                        </div>

                        <div className="flex items-center justify-between bg-stone-800/70 p-1.5 rounded-lg border border-stone-700/50">
                          <span className="text-stone-300">Floor</span>
                          <input
                            type="color"
                            value={customFloorColor}
                            onChange={(e) => setCustomFloorColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border border-stone-700 bg-transparent"
                          />
                        </div>

                        <div className="flex items-center justify-between bg-stone-800/70 p-1.5 rounded-lg border border-stone-700/50">
                          <span className="text-stone-300">Accent</span>
                          <input
                            type="color"
                            value={customAccentColor}
                            onChange={(e) => setCustomAccentColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border border-stone-700 bg-transparent"
                          />
                        </div>

                        <div className="flex items-center justify-between bg-stone-800/70 p-1.5 rounded-lg border border-stone-700/50">
                          <span className="text-stone-300">Trim</span>
                          <input
                            type="color"
                            value={customBaseColor}
                            onChange={(e) => setCustomBaseColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border border-stone-700 bg-transparent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveCustomPalette}
                        className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Apply Palette</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                    {[...COLOR_PALETTES, ...customPalettes].map((palette) => {
                      const isCustom = customPalettes.some((cp) => cp.id === palette.id);
                      return (
                        <div
                          key={palette.id}
                          className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all group ${
                            activePalette.id === palette.id
                              ? "bg-stone-800 border-amber-500/70 text-stone-100 shadow-sm"
                              : "bg-stone-900/40 border-stone-800 hover:border-stone-700 text-stone-400"
                          }`}
                        >
                          <button
                            onClick={() => setActivePalette(palette)}
                            className="flex-1 flex items-center justify-between text-left pr-2"
                          >
                            <span className="text-xs font-medium truncate">
                              {palette.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm"
                                style={{ backgroundColor: palette.wallColor }}
                                title={`Wall: ${palette.wallColor}`}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm"
                                style={{ backgroundColor: palette.floorColor }}
                                title={`Floor: ${palette.floorColor}`}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm"
                                style={{ backgroundColor: palette.accentColor }}
                                title={`Accent: ${palette.accentColor}`}
                              />
                            </div>
                          </button>

                          {isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCustomPalette(palette.id);
                              }}
                              className="p-1 text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete custom palette"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RANDOMIZE REALISTIC ROOM ACTION */}
                <div className="pt-3">
                  <button
                    id="randomize-room-inspector-btn"
                    onClick={randomizeRealisticRoom}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold shadow-sm transition-all active:scale-95"
                    title="Generate a realistic, architecturally composed room layout"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate Random Room</span>
                  </button>
                  <p className="text-[10px] text-stone-500 text-center mt-1.5">
                    Architecturally spaced living rooms, master suites, studios & spas
                  </p>
                </div>

                {/* CLEAR ROOM BUTTON WITH CONFIRMATION */}
                {placedObjects.length > 0 && (
                  <div className="pt-2">
                    <button
                      id="clear-room-inspector-btn"
                      onClick={() => setIsConfirmClearOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Furniture ({placedObjects.length})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Confirmation for deleting selected object */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Delete Furniture Object"
        message={`Are you sure you want to delete "${
          selectedItem?.name || "this item"
        }" from your room layout?`}
        confirmLabel="Delete Item"
        variant="danger"
        onConfirm={() => {
          if (selectedItem) {
            removeObject(selectedItem.id);
          }
          setIsConfirmDeleteOpen(false);
        }}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />

      {/* Confirmation for clearing the room */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear Room Items"
        message="Are you sure you want to remove all furniture from the room? This action will reset the canvas."
        confirmLabel="Clear All Items"
        variant="danger"
        onConfirm={() => {
          clearRoom();
          setIsConfirmClearOpen(false);
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </>
  );
};
