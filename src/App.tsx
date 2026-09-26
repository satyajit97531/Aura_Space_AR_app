import React, { useState, useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { CatalogSidebar } from "./components/layout/CatalogSidebar";
import { PropertiesSidebar } from "./components/layout/PropertiesSidebar";
import { EditorCanvas } from "./components/canvas/EditorCanvas";
import { AIAssistant } from "./components/ai/AIAssistant";
import { RoomSettingsModal } from "./components/modals/RoomSettingsModal";
import { ProjectsModal } from "./components/modals/ProjectsModal";
import { NewCanvasModal } from "./components/modals/NewCanvasModal";
import { DesktopARModal } from "./components/ar/DesktopARModal";
import { MobileARView } from "./components/ar/MobileARView";
import { AuthModal } from "./components/auth/AuthModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { ProfileModal } from "./components/modals/ProfileModal";
import { SignOutConfirmModal } from "./components/modals/SignOutConfirmModal";
import { useStore, applyThemeToDocument } from "./store/useStore";
import { Layers, Plus, FolderOpen } from "lucide-react";

export default function App() {
  const {
    theme,
    undo,
    redo,
    selectedObjectId,
    setSelectedObjectId,
    removeObject,
    arStatus,
    isCanvasActive,
    isAuthModalOpen,
    setIsAuthModalOpen,
    fetchSavedProjects,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalTab,
    openPublicProfileTab,
  } = useStore();

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isNewCanvasOpen, setIsNewCanvasOpen] = useState(false);

  // Initial load of saved projects and theme application
  useEffect(() => {
    fetchSavedProjects();
    applyThemeToDocument(theme);
  }, [fetchSavedProjects, theme]);

  // Handle shared URL links (e.g. ?profile=username, ?tab=gallery, ?blueprint=id)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const profile = params.get("profile");
      const tab = params.get("tab");
      const gallery = params.get("gallery");
      if (profile || tab === "gallery" || gallery === "community") {
        openPublicProfileTab("gallery");
      } else if (tab === "profile") {
        openPublicProfileTab("profile");
      }
    } catch (e) {}
  }, [openPublicProfileTab]);

  // Keyboard Shortcuts & Custom Event Handlers (trigger-undo / trigger-redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y, Cmd+Y, or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
      }

      // Delete / Backspace: Remove selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectId) {
          e.preventDefault();
          removeObject(selectedObjectId);
        }
      }

      // Escape: Deselect object or close modals
      if (e.key === "Escape") {
        setSelectedObjectId(null);
        setIsAIOpen(false);
        setIsProjectsOpen(false);
        setIsRoomSettingsOpen(false);
        setIsNewCanvasOpen(false);
        setIsSettingsModalOpen(false);
        setIsProfileModalOpen(false);
      }
    };

    // Custom window events support
    const handleTriggerUndo = () => undo();
    const handleTriggerRedo = () => redo();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("trigger-undo", handleTriggerUndo);
    window.addEventListener("trigger-redo", handleTriggerRedo);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("trigger-undo", handleTriggerUndo);
      window.removeEventListener("trigger-redo", handleTriggerRedo);
    };
  }, [undo, redo, selectedObjectId, removeObject, setSelectedObjectId]);

  const isARActive =
    arStatus === "camera_passthrough_active" || arStatus === "webxr_active";

  return (
    <div
      id="auraspace-app-root"
      className={`flex flex-col w-screen h-screen overflow-hidden font-sans antialiased select-none transition-colors duration-200 ${
        theme === "white"
          ? "theme-white bg-[#F7F6F2] text-stone-900"
          : theme === "dark"
          ? "theme-dark bg-[#09090B] text-zinc-100"
          : "theme-default bg-stone-950 text-stone-100"
      }`}
    >
      {/* 1. Mobile AR Viewport (Overlays screen when active) */}
      {isARActive ? (
        <MobileARView />
      ) : (
        <>
          {/* 2. Top Navigation Bar */}
          <Navbar
            onOpenAI={() => setIsAIOpen(true)}
            onOpenProjects={() => setIsProjectsOpen(true)}
            onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
            onOpenNewCanvas={() => setIsNewCanvasOpen(true)}
          />

          {/* 3. Main Workspace: Catalog Sidebar (Left) + 3D Canvas / Black Screen (Center) + Properties Sidebar (Right) */}
          <main className="flex-1 flex w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
            <CatalogSidebar />
            <div className="flex-1 h-full relative min-w-0 overflow-hidden bg-black flex items-center justify-center">
              {isCanvasActive ? (
                <EditorCanvas />
              ) : (
                <div
                  id="canvas-empty-black-screen"
                  className="flex flex-col items-center justify-center p-8 max-w-md text-center animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mb-5 shadow-2xl">
                    <Layers className="w-8 h-8 opacity-60 text-amber-500/80" />
                  </div>
                  <h2 className="text-xl font-semibold text-stone-200 mb-2">
                    No Canvas Open
                  </h2>
                  <p className="text-sm text-stone-400 mb-6 leading-relaxed">
                    The active canvas has been removed. You can create a new canvas or open an existing saved spatial plan below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      id="empty-screen-new-canvas-btn"
                      onClick={() => setIsNewCanvasOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create New Canvas</span>
                    </button>
                    <button
                      id="empty-screen-open-projects-btn"
                      onClick={() => setIsProjectsOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-medium text-xs transition-all flex items-center gap-2 active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4 text-stone-400" />
                      <span>Open Saved Projects</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <PropertiesSidebar />
          </main>

          {/* 4. Modals and Drawers */}
          <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
          <RoomSettingsModal
            isOpen={isRoomSettingsOpen}
            onClose={() => setIsRoomSettingsOpen(false)}
          />
          <ProjectsModal
            isOpen={isProjectsOpen}
            onClose={() => setIsProjectsOpen(false)}
            onOpenNewProjectModal={() => setIsNewCanvasOpen(true)}
          />
          <NewCanvasModal
            isOpen={isNewCanvasOpen}
            onClose={() => setIsNewCanvasOpen(false)}
          />
          <DesktopARModal />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            initialTab={profileModalTab}
          />
          <SignOutConfirmModal />
        </>
      )}
    </div>
  );
}
