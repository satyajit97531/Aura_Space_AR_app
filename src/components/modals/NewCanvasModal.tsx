import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { generateRealisticRoom } from "../../utils/realisticRoomGenerator";
import { Plus, X, AlertCircle, Sparkles, Layout, Shuffle } from "lucide-react";

interface NewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({ isOpen, onClose }) => {
  const {
    savedProjects,
    createNewProject,
  } = useStore();

  const [projectName, setProjectName] = useState("");
  const [startingLayout, setStartingLayout] = useState<"empty" | "random">("empty");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectName("");
      setStartingLayout("empty");
      setErrorMessage(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Use entered name or fall back to default placeholder "Untitled Canvas"
    const chosenName = projectName.trim() || "Untitled Canvas";

    // Case-insensitive duplicate name check
    const existing = savedProjects.find(
      (p) => p.name.trim().toLowerCase() === chosenName.toLowerCase()
    );

    if (existing) {
      // Don't save and display clear existing message
      setErrorMessage(
        `A canvas named "${chosenName}" already exists. Please choose a different name.`
      );
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (startingLayout === "random") {
        const roomPlan = generateRealisticRoom();
        await createNewProject(chosenName, roomPlan.objects, {
          width: roomPlan.dimensions.width,
          length: roomPlan.dimensions.length,
          height: roomPlan.dimensions.height,
          palette: roomPlan.palette,
        });
      } else {
        await createNewProject(chosenName, []);
      }
      onClose();
    } catch (err) {
      setErrorMessage("Failed to create new canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-canvas-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="new-canvas-modal-card"
        className="relative w-full max-w-md bg-stone-900 border border-stone-700/90 rounded-2xl shadow-2xl p-6 text-stone-100 flex flex-col gap-4"
      >
        {/* Close Button */}
        <button
          id="close-new-canvas-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-base">
              New Canvas
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Enter a name and choose a starting space
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <label
              htmlFor="new-canvas-name-input"
              className="block text-xs font-medium text-stone-300 mb-1.5"
            >
              Project Name
            </label>
            <input
              ref={inputRef}
              id="new-canvas-name-input"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Untitled Canvas"
              className={`w-full bg-stone-950 border rounded-xl px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none transition-colors ${
                errorMessage
                  ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/40"
                  : "border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              }`}
            />

            {/* Duplicate / Validation Error Alert */}
            {errorMessage && (
              <div
                id="new-canvas-error-alert"
                className="mt-2.5 p-2.5 rounded-lg bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-stone-500">
            Default name placeholder is{" "}
            <span className="text-stone-400 font-mono">"Untitled Canvas"</span>.
          </p>

          {/* Starting Layout Mode */}
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-2">
              Starting Space Layout
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="layout-empty-choice-btn"
                onClick={() => setStartingLayout("empty")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  startingLayout === "empty"
                    ? "bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm"
                    : "bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layout className={`w-4 h-4 ${startingLayout === "empty" ? "text-amber-400" : "text-stone-500"}`} />
                  <span className="font-semibold text-xs text-stone-200">Empty Canvas</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-snug">
                  Clean open floor plan ready for custom furnishing
                </p>
              </button>

              <button
                type="button"
                id="layout-random-choice-btn"
                onClick={() => setStartingLayout("random")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  startingLayout === "random"
                    ? "bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm"
                    : "bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shuffle className={`w-4 h-4 ${startingLayout === "random" ? "text-amber-400" : "text-stone-500"}`} />
                  <span className="font-semibold text-xs text-stone-200">Random Room</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-snug">
                  Architecturally composed room with realistic furniture
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
            <button
              type="button"
              id="cancel-new-canvas-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-create-canvas-btn"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Creating..." : "Create Canvas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
