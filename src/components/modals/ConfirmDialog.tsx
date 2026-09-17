import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        id="confirm-dialog-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-5 text-stone-100 flex flex-col"
      >
        <button
          id="confirm-dialog-close-btn"
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div
            className={`p-2.5 rounded-xl border ${
              variant === "danger"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-sm">{title}</h3>
            <p className="text-[11px] text-stone-400">Confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed mb-5">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
          <button
            id="confirm-dialog-cancel-btn"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-dialog-confirm-btn"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/30"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-900/30"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
