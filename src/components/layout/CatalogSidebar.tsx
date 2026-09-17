import React, { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { FURNITURE_CATALOG } from "../../data/catalog";
import { CatalogCategory, FurnitureItemDef } from "../../types";
import { formatDistance } from "../../utils/units";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import {
  Armchair,
  Coffee,
  Layers,
  BedDouble,
  Lamp,
  Flower2,
  Maximize2,
  Search,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  Tv,
  Utensils,
  Bath,
  Box,
} from "lucide-react";

export const CatalogSidebar: React.FC = () => {
  const {
    selectedCatalogItem,
    setSelectedCatalogItem,
    placedObjects,
    clearRoom,
    selectedObjectId,
    setSelectedObjectId,
    addObject,
    measurementUnit,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [activeTab, setActiveTab] = useState<"catalog" | "placed">("catalog");
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Toggle listener from navbar on mobile
  useEffect(() => {
    const handleToggle = () => setIsCollapsed((prev) => !prev);
    window.addEventListener("toggle-catalog-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-catalog-sidebar", handleToggle);
  }, []);

  const categories: Array<{ id: CatalogCategory | "all"; label: string; icon: any }> = [
    { id: "all", label: "All", icon: Layers },
    { id: "appliances", label: "Appliances", icon: Tv },
    { id: "kitchen", label: "Kitchen", icon: Utensils },
    { id: "bathroom", label: "Bathroom", icon: Bath },
    { id: "seating", label: "Seating", icon: Armchair },
    { id: "tables", label: "Tables", icon: Coffee },
    { id: "beds", label: "Beds", icon: BedDouble },
    { id: "storage", label: "Storage", icon: Box },
    { id: "lighting", label: "Lighting", icon: Lamp },
    { id: "plants", label: "Botanical", icon: Flower2 },
    { id: "decor", label: "Decor", icon: Maximize2 },
  ];

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, item: FurnitureItemDef) => {
    e.dataTransfer.setData("application/custom-item", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
    setSelectedCatalogItem(item);
  };

  const handleQuickAdd = (item: FurnitureItemDef) => {
    // Add to center of room
    addObject(item, [0, 0, 0]);
  };

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
        id="auraspace-catalog-sidebar"
        className={`h-full bg-stone-900/95 backdrop-blur-xl border-r border-stone-800 transition-all duration-200 flex flex-col select-none text-stone-100 z-40 shrink-0 max-lg:fixed max-lg:top-14 max-lg:bottom-0 max-lg:left-0 max-lg:shadow-2xl ${
          isCollapsed ? "max-lg:-translate-x-full lg:w-14" : "w-80 max-w-[88vw]"
        }`}
      >
      {/* Toggle Collapse Button */}
      <button
        id="toggle-sidebar-collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-16 z-30 p-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:text-white shadow-md transition-colors"
        title={isCollapsed ? "Expand Catalog" : "Collapse Catalog"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {isCollapsed ? (
        /* Collapsed Icon Bar */
        <div className="flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("catalog");
            }}
            className="p-2.5 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors"
            title="Open Catalog"
          >
            <Armchair className="w-5 h-5" />
          </button>
          <div className="w-6 h-px bg-stone-800" />
          <div className="text-[10px] font-mono text-stone-500 [writing-mode:vertical-lr] tracking-widest uppercase">
            Furniture Catalog
          </div>
        </div>
      ) : (
        /* Expanded Full Catalog */
        <>
          {/* Tabs: Catalog vs Placed Objects */}
          <div className="p-3 border-b border-stone-800 flex items-center gap-1">
            <button
              id="tab-catalog-btn"
              onClick={() => setActiveTab("catalog")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "catalog"
                  ? "bg-amber-500 text-stone-950 font-semibold"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              Furniture Catalog
            </button>
            <button
              id="tab-placed-btn"
              onClick={() => setActiveTab("placed")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "placed"
                  ? "bg-amber-500 text-stone-950 font-semibold"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
            >
              <span>Placed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-stone-300 text-[10px] font-mono">
                {placedObjects.length}
              </span>
            </button>
          </div>

          {activeTab === "catalog" ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="p-3 border-b border-stone-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="catalog-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search models, tags, materials..."
                    className="w-full bg-stone-800/80 border border-stone-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="px-3 py-2 border-b border-stone-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-stone-700 text-amber-300 border border-amber-500/30 font-semibold"
                          : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instruction banner */}
              <div className="px-3 py-2 bg-amber-500/5 border-b border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Drag to canvas or click floor to spawn</span>
                <span className="text-[10px] font-mono text-amber-400">1:1 Metric</span>
              </div>

              {/* Furniture Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredCatalog.map((item) => {
                  const isSelected = selectedCatalogItem?.id === item.id;
                  const { width, height, depth } = item.defaultDimensions;
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => setSelectedCatalogItem(item)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/50 shadow-md"
                          : "bg-stone-800/50 hover:bg-stone-800/80 border-stone-800 hover:border-stone-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-stone-200 group-hover:text-white truncate">
                              {item.name}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-500/20 text-amber-400 font-medium shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-stone-400">
                            <span className="text-amber-400">
                              {formatDistance(width, measurementUnit)}
                            </span>
                            <span>×</span>
                            <span>{formatDistance(height, measurementUnit)}</span>
                            <span>×</span>
                            <span>{formatDistance(depth, measurementUnit)}</span>
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAdd(item);
                          }}
                          className="p-1.5 rounded-lg bg-stone-700/60 hover:bg-amber-500 text-stone-300 hover:text-stone-950 transition-colors shrink-0"
                          title="Place at center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Drag Handle hint */}
                      <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-500">
                        <span className="capitalize">{item.category}</span>
                        <div className="flex items-center gap-1">
                          <GripHorizontal className="w-3 h-3 text-stone-600" />
                          <span>Drag to place</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Placed Items Manager */
            <div className="flex-1 flex flex-col min-h-0 p-3">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <span className="text-xs font-semibold text-stone-200">
                  Active Room Items ({placedObjects.length})
                </span>
                {placedObjects.length > 0 && (
                  <button
                    onClick={() => setIsConfirmClearOpen(true)}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Room</span>
                  </button>
                )}
              </div>

              {placedObjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-stone-500 text-xs">
                  <Armchair className="w-8 h-8 stroke-[1.2] mb-2 opacity-40" />
                  <p className="text-stone-400 font-medium">Room is empty</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Select furniture from the catalog tab or drag items onto the floor.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 py-2">
                  {placedObjects.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        selectedObjectId === obj.id
                          ? "bg-amber-500/10 border-amber-500/50 text-stone-100"
                          : "bg-stone-800/40 hover:bg-stone-800/80 border-stone-800 text-stone-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold truncate text-xs">{obj.name}</p>
                        <p className="text-[10px] font-mono text-stone-400">
                          Pos: ({obj.position[0].toFixed(1)}, {obj.position[2].toFixed(1)})m
                        </p>
                      </div>
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-stone-700 shrink-0"
                        style={{ backgroundColor: obj.color }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/* Confirmation Dialog for Clearing Room */}
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
    </aside>
    </>
  );
};
