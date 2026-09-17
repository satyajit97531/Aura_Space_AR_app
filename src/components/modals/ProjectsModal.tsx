import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { AuraProject } from "../../types";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  FolderOpen,
  Plus,
  Trash2,
  X,
  Check,
  Edit2,
  Database,
  FolderPlus,
  AlertCircle,
} from "lucide-react";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProjectModal?: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onOpenNewProjectModal,
}) => {
  const {
    savedProjects,
    loadProject,
    deleteProject,
    renameProject,
    currentProjectName,
    currentProjectId,
    setCurrentProjectName,
    saveProjectToStorageAndCloud,
    currentUser,
    setIsAuthModalOpen,
  } = useStore();

  const [isEditingActiveName, setIsEditingActiveName] = useState(false);
  const [activeTempName, setActiveTempName] = useState(currentProjectName);
  const [modalError, setModalError] = useState<string | null>(null);

  // Per-item rename state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [itemRenameText, setItemRenameText] = useState("");

  // Delete confirmation state
  const [projectToDelete, setProjectToDelete] = useState<AuraProject | null>(null);

  if (!isOpen) return null;

  const handleSaveActiveRename = () => {
    const trimmed = activeTempName.trim();
    if (!trimmed) {
      setIsEditingActiveName(false);
      return;
    }
    if (trimmed === currentProjectName) {
      setIsEditingActiveName(false);
      return;
    }

    const isDuplicate = savedProjects.some(
      (p) =>
        p.id !== currentProjectId &&
        p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setModalError(`A canvas named "${trimmed}" already exists.`);
      setTimeout(() => setModalError(null), 4000);
      return;
    }

    setModalError(null);
    setCurrentProjectName(trimmed);
    saveProjectToStorageAndCloud();
    setIsEditingActiveName(false);
  };

  const handleStartItemRename = (project: AuraProject) => {
    const pId = project.id || (project as any)._id || project.name;
    setEditingProjectId(pId);
    setItemRenameText(project.name);
    setModalError(null);
  };

  const handleSaveItemRename = async (project: AuraProject) => {
    const pId = project.id || (project as any)._id || project.name;
    const trimmed = itemRenameText.trim();
    if (!trimmed) {
      setEditingProjectId(null);
      return;
    }
    if (trimmed === project.name) {
      setEditingProjectId(null);
      return;
    }

    const isDuplicate = savedProjects.some(
      (p) =>
        (p.id !== pId && (p as any)._id !== pId) &&
        p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setModalError(`A canvas named "${trimmed}" already exists.`);
      setTimeout(() => setModalError(null), 4000);
      return;
    }

    setModalError(null);
    await renameProject(pId, trimmed);
    setEditingProjectId(null);
  };

  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      const pId = projectToDelete.id || (projectToDelete as any)._id || projectToDelete.name;
      await deleteProject(pId);
      setProjectToDelete(null);
    }
  };

  return (
    <>
      <div
        id="projects-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      >
        <div
          id="projects-modal-card"
          className="relative w-full max-w-lg bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 text-stone-100 max-h-[85vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            id="close-projects-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-100 text-base">
                Spatial Project Manager
              </h3>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>
                  {currentUser
                    ? `Account: ${currentUser.email} • Private cloud sync`
                    : "Guest mode (Local only) • Sign in to sync across devices"}
                </span>
              </p>
            </div>
          </div>

          {/* User Account Login Banner if Guest */}
          {!currentUser && (
            <div
              id="projects-modal-guest-banner"
              className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs"
            >
              <span className="text-amber-200/90 text-[11px]">
                Sign in to isolate and secure your projects in your private MongoDB cloud account.
              </span>
              <button
                id="projects-modal-signin-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg text-[11px] shrink-0 transition-colors ml-2"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Current Active Project Bar */}
          <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-800 mb-4 flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[10px] uppercase font-medium text-stone-500 tracking-wider block">
                Current Canvas
              </span>
              {isEditingActiveName ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={activeTempName}
                    onChange={(e) => setActiveTempName(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveActiveRename();
                      if (e.key === "Escape") setIsEditingActiveName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveActiveRename}
                    className="p-1 rounded-md bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <p className="font-semibold text-xs text-stone-200 truncate mt-0.5">
                  {currentProjectName}
                </p>
              )}
            </div>

            {!isEditingActiveName && (
              <button
                onClick={() => {
                  setActiveTempName(currentProjectName);
                  setIsEditingActiveName(true);
                }}
                className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                title="Rename active project"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[160px] pr-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Saved Projects ({savedProjects.length})
              </span>
            </div>

            {savedProjects.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-6 text-stone-500 text-xs bg-stone-800/20 rounded-xl border border-dashed border-stone-800">
                <FolderOpen className="w-8 h-8 stroke-[1.2] mb-2 opacity-40" />
                <p className="font-medium text-stone-400">No saved projects yet</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Click "Save" on the top navigation bar or create a new project.
                </p>
              </div>
            ) : (
              savedProjects.map((project: AuraProject) => {
                const pId = project.id || (project as any)._id || project.name;
                const isRenamingThis = editingProjectId === pId;

                return (
                  <div
                    key={pId}
                    className="p-3 rounded-xl bg-stone-800/40 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isRenamingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={itemRenameText}
                            onChange={(e) => setItemRenameText(e.target.value)}
                            className="flex-1 bg-stone-900 border border-amber-500/60 rounded-lg px-2 py-1 text-xs text-stone-100 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveItemRename(project);
                              if (e.key === "Escape") setEditingProjectId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveItemRename(project)}
                            className="p-1 rounded bg-amber-500 text-stone-950 hover:bg-amber-400"
                            title="Save name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="p-1 rounded bg-stone-700 text-stone-300 hover:bg-stone-600"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            loadProject(project);
                            onClose();
                          }}
                        >
                          <p className="font-semibold text-xs text-stone-200 group-hover:text-amber-400 transition-colors truncate">
                            {project.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1 font-mono">
                            <span>
                              {project.roomDimensions?.width || 6}m × {project.roomDimensions?.length || 5}m
                            </span>
                            <span>•</span>
                            <span>{project.placedObjects?.length || 0} items</span>
                            <span>•</span>
                            <span>
                              {new Date(project.updatedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isRenamingThis && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartItemRename(project)}
                          className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                          title="Rename project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            loadProject(project);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-700/80 hover:bg-amber-500 text-stone-200 hover:text-stone-950 text-xs font-medium transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setProjectToDelete(project)}
                          className="p-1.5 rounded-lg hover:bg-red-950/60 text-stone-500 hover:text-red-400 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Duplicate Name Error Alert */}
          {modalError && (
            <div
              id="projects-modal-error-alert"
              className="mb-3 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
            <button
              id="projects-modal-new-btn"
              onClick={() => {
                onClose();
                if (onOpenNewProjectModal) {
                  onOpenNewProjectModal();
                }
              }}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-medium transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Project (Empty Canvas)</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Project Deletion */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        title="Delete Spatial Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This will permanently remove it from both your local workspace and the database.`}
        confirmLabel="Delete Project"
        variant="danger"
        onConfirm={confirmDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
    </>
  );
};
