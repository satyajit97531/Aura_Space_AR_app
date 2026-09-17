import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { COLOR_PALETTES } from "../../data/catalog";
import { ColorPalette } from "../../types";
import {
  X,
  Sliders,
  Palette,
  Eye,
  Maximize2,
  Check,
  Building,
  Plus,
  Trash2,
} from "lucide-react";

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    roomWidth,
    roomLength,
    roomHeight,
    setRoomDimensions,
    wallVisibility,
    toggleWall,
    setAllWalls,
    activePalette,
    setActivePalette,
    customPalettes,
    addCustomPalette,
    removeCustomPalette,
  } = useStore();

  const [showNewPaletteForm, setShowNewPaletteForm] = useState(false);
  const [customPalName, setCustomPalName] = useState("");
  const [customWallColor, setCustomWallColor] = useState("#F4EFE6");
  const [customFloorColor, setCustomFloorColor] = useState("#BAA082");
  const [customAccentColor, setCustomAccentColor] = useState("#3D4B40");
  const [customBaseColor, setCustomBaseColor] = useState("#E6DEC9");

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

  if (!isOpen) return null;

  const floorArea = (roomWidth * roomLength).toFixed(1);
  const roomVolume = (roomWidth * roomLength * roomHeight).toFixed(1);

  return (
    <div
      id="room-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="room-settings-modal-card"
        className="relative w-full max-w-lg bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 text-stone-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-room-settings-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-base">
              Room Geometry & Materials
            </h3>
            <p className="text-xs text-stone-400">
              Customize spatial boundaries, wall presentation & finishes
            </p>
          </div>
        </div>

        {/* 1. Metric Room Dimensions with Manual Typing */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Room Dimensions (Manual Typing up to 100,000m)
            </span>
            <div className="text-[11px] font-mono text-stone-400">
              Area: <span className="text-amber-400 font-bold">{floorArea} m²</span> • Vol: {roomVolume} m³
            </div>
          </div>

          {/* Width Input & Slider */}
          <div className="space-y-2 bg-stone-800/50 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">Width (X-Axis)</span>
              <div className="flex items-center gap-1.5">
                <input
                  id="modal-room-width-input"
                  type="number"
                  min="1"
                  max="100000"
                  step="0.1"
                  value={roomWidth}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setRoomDimensions(val, roomLength, roomHeight);
                  }}
                  className="w-24 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-400 font-semibold text-right focus:outline-none focus:border-amber-500"
                />
                <span className="font-mono text-stone-400 text-xs">m</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={Math.max(30, Math.min(1000, roomWidth * 1.5))}
              step="0.5"
              value={Math.min(1000, roomWidth)}
              onChange={(e) => setRoomDimensions(parseFloat(e.target.value), roomLength, roomHeight)}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Length Input & Slider */}
          <div className="space-y-2 bg-stone-800/50 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">Length (Z-Axis)</span>
              <div className="flex items-center gap-1.5">
                <input
                  id="modal-room-length-input"
                  type="number"
                  min="1"
                  max="100000"
                  step="0.1"
                  value={roomLength}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setRoomDimensions(roomWidth, val, roomHeight);
                  }}
                  className="w-24 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-400 font-semibold text-right focus:outline-none focus:border-amber-500"
                />
                <span className="font-mono text-stone-400 text-xs">m</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={Math.max(30, Math.min(1000, roomLength * 1.5))}
              step="0.5"
              value={Math.min(1000, roomLength)}
              onChange={(e) => setRoomDimensions(roomWidth, parseFloat(e.target.value), roomHeight)}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Height Input & Slider */}
          <div className="space-y-2 bg-stone-800/50 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">Ceiling Height (Y-Axis)</span>
              <div className="flex items-center gap-1.5">
                <input
                  id="modal-room-height-input"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.1"
                  value={roomHeight}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setRoomDimensions(roomWidth, roomLength, val);
                  }}
                  className="w-24 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-400 font-semibold text-right focus:outline-none focus:border-amber-500"
                />
                <span className="font-mono text-stone-400 text-xs">m</span>
              </div>
            </div>
            <input
              type="range"
              min="1.5"
              max={Math.max(6, Math.min(50, roomHeight * 1.5))}
              step="0.1"
              value={Math.min(50, roomHeight)}
              onChange={(e) => setRoomDimensions(roomWidth, roomLength, parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-stone-400">Scale presets:</span>
            <button
              onClick={() => setRoomDimensions(5, 4, 2.8)}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 transition-colors"
            >
              5×4m
            </button>
            <button
              onClick={() => setRoomDimensions(8, 6, 3.0)}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 transition-colors"
            >
              8×6m
            </button>
            <button
              onClick={() => setRoomDimensions(20, 15, 4.0)}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 transition-colors"
            >
              20×15m
            </button>
            <button
              onClick={() => setRoomDimensions(100, 100, 6.0)}
              className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 transition-colors"
            >
              100×100m
            </button>
          </div>
        </div>

        {/* 2. Wall Visibility & Dollhouse View */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Wall Cutaway Visibility
            </span>
            <div className="flex gap-1 text-[11px]">
              <button
                onClick={() => setAllWalls(true)}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                All On
              </button>
              <button
                onClick={() => {
                  toggleWall("south");
                }}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-400"
              >
                Dollhouse
              </button>
              <button
                onClick={() => setAllWalls(false)}
                className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                All Off
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["north", "south", "east", "west"] as const).map((wall) => {
              const isVis = wallVisibility[wall];
              return (
                <button
                  key={wall}
                  onClick={() => toggleWall(wall)}
                  className={`p-2.5 rounded-xl border text-xs capitalize flex items-center justify-between transition-all ${
                    isVis
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200 font-medium"
                      : "bg-stone-800/40 border-stone-800 text-stone-500"
                  }`}
                >
                  <span>{wall} Wall</span>
                  <Eye className={`w-3.5 h-3.5 ${isVis ? "text-amber-400" : "text-stone-600"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Theme Color Palette & Materials */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Architectural Color & Material Palette
            </span>
            <button
              onClick={() => setShowNewPaletteForm(!showNewPaletteForm)}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 border border-stone-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>{showNewPaletteForm ? "Cancel" : "New Palette"}</span>
            </button>
          </div>

          {/* New Palette Creation Form */}
          {showNewPaletteForm && (
            <div className="p-3.5 rounded-xl bg-stone-800/80 border border-amber-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-400 text-xs">
                  Create Custom Atmosphere Palette
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
                placeholder="Palette Name (e.g. Nordic Sunrise)"
                value={customPalName}
                onChange={(e) => setCustomPalName(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-stone-900/80 p-2 rounded-lg border border-stone-700/60">
                  <span className="text-stone-300">Wall Color</span>
                  <input
                    type="color"
                    value={customWallColor}
                    onChange={(e) => setCustomWallColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-700 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between bg-stone-900/80 p-2 rounded-lg border border-stone-700/60">
                  <span className="text-stone-300">Floor Color</span>
                  <input
                    type="color"
                    value={customFloorColor}
                    onChange={(e) => setCustomFloorColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-700 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between bg-stone-900/80 p-2 rounded-lg border border-stone-700/60">
                  <span className="text-stone-300">Accent Trim</span>
                  <input
                    type="color"
                    value={customAccentColor}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-700 bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between bg-stone-900/80 p-2 rounded-lg border border-stone-700/60">
                  <span className="text-stone-300">Base Finish</span>
                  <input
                    type="color"
                    value={customBaseColor}
                    onChange={(e) => setCustomBaseColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-700 bg-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveCustomPalette}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Save & Apply Custom Palette</span>
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {[...COLOR_PALETTES, ...customPalettes].map((palette) => {
              const isSelected = activePalette.id === palette.id;
              const isCustom = customPalettes.some((cp) => cp.id === palette.id);
              return (
                <div
                  key={palette.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/50 shadow-md"
                      : "bg-stone-800/50 hover:bg-stone-800 border-stone-800"
                  }`}
                >
                  <div
                    onClick={() => setActivePalette(palette)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center -space-x-1.5">
                      <div
                        className="w-6 h-6 rounded-full border border-stone-700 shadow-sm"
                        style={{ backgroundColor: palette.wallColor }}
                        title="Wall finish"
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-stone-700 shadow-sm"
                        style={{ backgroundColor: palette.floorColor }}
                        title="Floor finish"
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-stone-700 shadow-sm"
                        style={{ backgroundColor: palette.accentColor }}
                        title="Accent trim"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-stone-200">{palette.name}</p>
                      <p className="text-[10px] text-stone-400 capitalize">
                        {palette.floorTextureType.replace("_", " ")} floor • {palette.wallTextureType} walls
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
