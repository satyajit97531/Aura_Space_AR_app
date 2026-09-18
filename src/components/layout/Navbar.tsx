import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { detectARDevice } from "../ar/deviceDetect";
import {
  Undo2,
  Redo2,
  Smartphone,
  Sparkles,
  FolderOpen,
  Plus,
  Edit2,
  Grid,
  Box,
  Sliders,
  Check,
  Shuffle,
  PanelLeft,
  PanelRight,
  AlertCircle,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Globe,
  Trophy,
  Lock,
  Copy,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  onOpenAI: () => void;
  onOpenProjects: () => void;
  onOpenRoomSettings: () => void;
  onOpenNewCanvas?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAI,
  onOpenProjects,
  onOpenRoomSettings,
  onOpenNewCanvas,
}) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    activeViewMode,
    setActiveViewMode,
    snapToGrid,
    setSnapToGrid,
    currentProjectName,
    currentProjectId,
    savedProjects,
    setCurrentProjectName,
    saveProjectToStorageAndCloud,
    createNewProject,
    autosaveStatus,
    setARStatus,
    setIsARFallbackOpen,
    isCanvasActive,
    isReadOnlyProject,
    currentProjectAuthorName,
    forkProject,
    randomizeRealisticRoom,
    currentUser,
    setIsAuthModalOpen,
    logout,
    setIsSettingsModalOpen,
    openPublicProfileTab,
  } = useStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentProjectName);
  const [savedNameSuccess, setSavedNameSuccess] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Sync temp name when project changes
  React.useEffect(() => {
    setTempName(currentProjectName);
  }, [currentProjectName]);

  const handleConfirmRename = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) {
      setIsEditingName(false);
      return;
    }
    if (trimmed === currentProjectName) {
      setIsEditingName(false);
      return;
    }

    // Check duplicate against other saved projects
    const isDuplicate = savedProjects.some(
      (p) =>
        p.id !== currentProjectId &&
        p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setRenameError(`A canvas named "${trimmed}" already exists.`);
      setTimeout(() => setRenameError(null), 4000);
      return;
    }

    setRenameError(null);
    setCurrentProjectName(trimmed);
    await saveProjectToStorageAndCloud();
    setSavedNameSuccess(true);
    setTimeout(() => setSavedNameSuccess(false), 2000);
    setIsEditingName(false);
  };

  const handleCreateNewProject = async () => {
    if (onOpenNewCanvas) {
      onOpenNewCanvas();
    } else {
      await createNewProject();
    }
  };

  const handleARClick = () => {
    const device = detectARDevice();
    if (device.isDesktop) {
      setARStatus("unsupported_desktop");
      setIsARFallbackOpen(true);
    } else {
      setARStatus("camera_passthrough_active");
    }
  };

  return (
    <header
      id="auraspace-navbar"
      className="h-14 px-2 sm:px-4 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 flex items-center justify-between z-30 select-none text-stone-100 gap-2 min-w-0"
    >
      {/* Brand Identity & Editable Project Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/10 shrink-0">
            <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="font-semibold text-stone-100 tracking-tight text-xs sm:text-sm hidden xs:inline">
            AuraSpace
          </span>
        </div>

        {/* Project Name & Tick Mark Renaming */}
        <div className="flex items-center text-xs pl-2 sm:pl-3 border-l border-stone-800 min-w-0 relative">
          {isEditingName ? (
            <div className="flex items-center gap-1 min-w-0">
              <input
                id="navbar-rename-input"
                type="text"
                value={tempName}
                onChange={(e) => {
                  setTempName(e.target.value);
                  if (renameError) setRenameError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmRename();
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                    setRenameError(null);
                  }
                }}
                autoFocus
                className="bg-stone-950 border border-amber-500/60 rounded-md px-2 py-0.5 text-xs text-stone-100 focus:outline-none w-24 sm:w-36 font-medium"
              />
              <button
                id="navbar-rename-confirm-btn"
                onClick={handleConfirmRename}
                title="Save renamed project"
                className="p-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : !isCanvasActive ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-stone-400 font-medium text-xs sm:text-sm italic">
                No Canvas Open
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-stone-800/80 border border-stone-700 text-stone-400">
                Closed
              </span>
            </div>
          ) : isReadOnlyProject ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate max-w-[90px] sm:max-w-[140px] md:max-w-[180px] text-stone-200 font-semibold text-xs sm:text-sm">
                {currentProjectName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium whitespace-nowrap">
                <Lock className="w-2.5 h-2.5" />
                <span>{currentProjectAuthorName ? `@${currentProjectAuthorName}` : "Community"} (Read-Only)</span>
              </span>
              <button
                id="navbar-remix-project-btn"
                onClick={() => forkProject()}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
                title="Copy and remix this blueprint into your own workspace"
              >
                <Copy className="w-3 h-3" />
                <span>Copy / Remix</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group">
              <button
                onClick={() => {
                  setTempName(currentProjectName);
                  setIsEditingName(true);
                }}
                className="truncate max-w-[90px] sm:max-w-[150px] md:max-w-[180px] text-stone-300 hover:text-white font-medium text-left transition-colors"
                title="Click to rename project"
              >
                {currentProjectName}
              </button>
              <button
                onClick={() => {
                  setTempName(currentProjectName);
                  setIsEditingName(true);
                }}
                className="opacity-60 hover:opacity-100 text-stone-400 hover:text-amber-400 p-0.5 transition-opacity"
                title="Rename Project"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              {/* Autosaved Indicator Status */}
              <div
                className="hidden lg:flex items-center gap-1 text-[10px] text-stone-500 ml-1 px-1.5 py-0.5 rounded bg-stone-800/40 border border-stone-800/60"
                title="Canvas changes are automatically saved continuously"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    autosaveStatus === "saving"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-emerald-400"
                  }`}
                />
                <span>
                  {autosaveStatus === "saving"
                    ? "Saving..."
                    : savedNameSuccess
                    ? "Saved!"
                    : "Autosaved"}
                </span>
              </div>
            </div>
          )}

          {/* Rename Duplicate Error Toast */}
          {renameError && (
            <div className="absolute top-10 left-0 z-50 bg-red-950/95 border border-red-800 text-red-200 px-3 py-1.5 rounded-lg text-xs shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{renameError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Tools: Undo, Redo, Camera Views & Grid Snap */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-stone-800/80 rounded-lg p-0.5 border border-stone-700/60">
          <button
            id="navbar-undo-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md hover:bg-stone-700 text-stone-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="navbar-redo-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md hover:bg-stone-700 text-stone-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Selector (Desktop & Tablet) */}
        <div className="hidden md:flex items-center bg-stone-800/80 rounded-lg p-0.5 border border-stone-700/60 text-xs">
          <button
            id="viewmode-perspective-btn"
            onClick={() => setActiveViewMode("3d_perspective")}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeViewMode === "3d_perspective"
                ? "bg-amber-500 text-stone-950 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            3D Studio
          </button>
          <button
            id="viewmode-isometric-btn"
            onClick={() => setActiveViewMode("3d_isometric")}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeViewMode === "3d_isometric"
                ? "bg-amber-500 text-stone-950 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Isometric
          </button>
          <button
            id="viewmode-blueprint-btn"
            onClick={() => setActiveViewMode("2d_blueprint")}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeViewMode === "2d_blueprint"
                ? "bg-amber-500 text-stone-950 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Blueprint
          </button>
        </div>

        {/* Grid Snap Toggle (Desktop) */}
        <button
          id="navbar-gridsnap-btn"
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={`Grid Snapping (${snapToGrid ? "Enabled (0.25m)" : "Disabled"})`}
          className={`hidden sm:flex p-1.5 rounded-lg border text-xs items-center gap-1 transition-colors ${
            snapToGrid
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-stone-800/80 border-stone-700/60 text-stone-400 hover:text-stone-200"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">0.25m</span>
        </button>

        {/* Room Bounds / Dimensions Config (Desktop) */}
        <button
          id="navbar-room-settings-btn"
          onClick={onOpenRoomSettings}
          disabled={!isCanvasActive}
          title="Configure Room Dimensions & Palette"
          className="hidden sm:flex p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white disabled:opacity-30 disabled:hover:bg-stone-800/80 transition-colors items-center gap-1 text-xs"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Room</span>
        </button>
      </div>

      {/* Right Side Actions: Desktop Toolset + Mobile Responsive Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Desktop Only Tools (lg+) */}
        <div className="hidden lg:flex items-center gap-1.5">
          {/* Create New Empty Project */}
          <button
            id="navbar-new-project-btn"
            onClick={handleCreateNewProject}
            title="Create New Project (Empty Canvas)"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
              !isCanvasActive
                ? "bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold shadow-md shadow-amber-500/20"
                : "bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white"
            }`}
          >
            <Plus className={`w-3.5 h-3.5 ${!isCanvasActive ? "text-stone-950" : "text-amber-400"}`} />
            <span className="text-[11px]">New Canvas</span>
          </button>

          {/* Random Room (Procedural Placement) */}
          {isCanvasActive && (
            <button
              id="navbar-random-room-btn"
              onClick={randomizeRealisticRoom}
              title="Generate Random Layout with Random Furniture"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline text-[11px]">Random Room</span>
            </button>
          )}

          {/* Projects / Load */}
          <button
            id="navbar-projects-btn"
            onClick={onOpenProjects}
            title="Manage Saved Spatial Plans"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="text-[11px]">Projects</span>
          </button>

          {/* Public Gallery */}
          <button
            id="navbar-public-gallery-btn"
            onClick={() => openPublicProfileTab("gallery")}
            title="My Public Gallery & Liked Community Designs"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline text-[11px]">Public Gallery</span>
          </button>

          {/* Settings Menu (Theme & Units) */}
          <button
            id="navbar-settings-btn"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Theme (White/Dark/Default) & Spatial Units"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Settings</span>
          </button>

          {/* AI Spatial Advisor */}
          <button
            id="navbar-ai-assistant-btn"
            onClick={onOpenAI}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-1 text-xs font-medium shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">AI</span>
          </button>
        </div>

        {/* AR Mode Trigger Button (Always visible & prominent) */}
        <button
          id="navbar-ar-mode-btn"
          onClick={handleARClick}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">AR Mode</span>
          <span className="xs:hidden">AR</span>
        </button>

        {/* Account / User Authentication */}
        <div className="relative shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                id="navbar-account-btn"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  if (isMobileToolsOpen) setIsMobileToolsOpen(false);
                }}
                className="p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-amber-500/30 text-stone-200 transition-colors flex items-center gap-1.5 text-xs"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-amber-500/50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="hidden xl:inline text-[11px] font-medium max-w-[90px] truncate">
                  {currentUser.name || currentUser.email.split("@")[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:inline" />
              </button>

              {isUserMenuOpen && (
                <div
                  id="navbar-account-dropdown"
                  className="absolute right-0 mt-2 w-60 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-stone-200"
                >
                  <div className="px-3 py-2 border-b border-stone-800/80 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{currentUser.email}</p>
                    {currentUser.username && (
                      <p className="text-[10px] text-amber-400 font-mono mt-0.5">@{currentUser.username}</p>
                    )}
                  </div>

                  <button
                    id="user-menu-profile-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openPublicProfileTab("profile");
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Public Profile & Avatar</span>
                  </button>

                  <button
                    id="user-menu-gallery-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openPublicProfileTab("gallery");
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Public Gallery</span>
                  </button>

                  <button
                    id="user-menu-achievements-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openPublicProfileTab("achievements");
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Achievements & Badges</span>
                  </button>

                  <button
                    id="user-menu-settings-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings & Units</span>
                  </button>

                  <button
                    id="user-menu-projects-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenProjects();
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Saved Projects</span>
                  </button>

                  <div className="border-t border-stone-800/80 my-1" />

                  <button
                    id="user-menu-logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-red-950/40 text-stone-300 hover:text-red-300 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile & Tablet More Tools Dropdown (lg:hidden) */}
        <div className="relative lg:hidden shrink-0">
          <button
            id="navbar-mobile-tools-btn"
            onClick={() => {
              setIsMobileToolsOpen(!isMobileToolsOpen);
              if (isUserMenuOpen) setIsUserMenuOpen(false);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMobileToolsOpen
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-stone-800/90 hover:bg-stone-700 border-stone-700/80 text-stone-300 hover:text-white"
            }`}
            title="More Spatial Design Tools"
          >
            {isMobileToolsOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {isMobileToolsOpen && (
            <div
              id="navbar-mobile-tools-menu"
              className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-stone-200 flex flex-col gap-0.5"
            >
              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  handleCreateNewProject();
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>New Canvas</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  onOpenProjects();
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Saved Projects</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  openPublicProfileTab("gallery");
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Public Gallery</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  onOpenRoomSettings();
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Room Dimensions & Colors</span>
              </button>

              {isCanvasActive && (
                <button
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    randomizeRealisticRoom();
                  }}
                  className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center gap-2.5 transition-colors"
                >
                  <Shuffle className="w-4 h-4 text-amber-400" />
                  <span>Generate Random Room</span>
                </button>
              )}

              <button
                onClick={() => {
                  setSnapToGrid(!snapToGrid);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-200 hover:text-white flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Grid className="w-4 h-4 text-amber-400" />
                  <span>Grid Snapping (0.25m)</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    snapToGrid ? "bg-amber-400" : "bg-stone-600"
                  }`}
                />
              </button>

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  onOpenAI();
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2.5 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Spatial Advisor</span>
              </button>

              <div className="border-t border-stone-800/80 my-1" />

              <button
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-stone-800 text-stone-300 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Settings className="w-4 h-4 text-stone-400" />
                <span>Settings (Theme & Units)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
