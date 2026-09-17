import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { Plus, X, FolderPlus, Sparkles } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNewProject, savedProjects } = useStore();
  const [projectName, setProjectName] = useState("");

  if (!isOpen) return null;

  const defaultSuggested = `Spatial Plan ${savedProjects.length + 1}`;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = projectName.trim() || defaultSuggested;
    await createNewProject(finalName);
    setProjectName("");
    onClose();
  };

  const templates = [
    "Modern Living Room",
    "Open Concept Kitchen",
    "Master Bedroom Retreat",
    "Luxury Spa Bathroom",
    "Minimalist Home Studio",
  ];

  return (
    <div
      id="new-project-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="new-project-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 text-stone-100 flex flex-col"
      >
        <button
          id="close-new-project-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-base">
              Create New Spatial Project
            </h3>
            <p className="text-xs text-stone-400">
              Set up a clean 3D canvas and name your design
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-project-name-input"
              className="block text-xs font-medium text-stone-300 mb-1.5 uppercase tracking-wider"
            >
              Project Name
            </label>
            <input
              id="new-project-name-input"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={`e.g. ${defaultSuggested}`}
              className="w-full bg-stone-800/80 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors font-medium"
              autoFocus
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-2">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setProjectName(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-xs border border-stone-700/60 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{tpl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-project-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
