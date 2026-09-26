import React, { useEffect } from "react";
import { LogOut, X, AlertCircle } from "lucide-react";
import { useStore } from "../../store/useStore";

export const SignOutConfirmModal: React.FC = () => {
  const {
    isSignOutConfirmOpen,
    setIsSignOutConfirmOpen,
    logout,
    currentUser,
    setIsSettingsModalOpen,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSignOutConfirmOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setIsSignOutConfirmOpen(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSignOutConfirmOpen]);

  if (!isSignOutConfirmOpen) return null;

  const handleConfirm = () => {
    setIsSignOutConfirmOpen(false);
    setIsSettingsModalOpen(false);
    logout();
  };

  const handleCancel = () => {
    setIsSignOutConfirmOpen(false);
  };

  const userIdentifier =
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email ||
    "your account";

  return (
    <div
      id="signout-confirm-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div
        id="signout-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-5 text-stone-100 flex flex-col"
      >
        <button
          id="signout-close-btn"
          onClick={handleCancel}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          title="Close dialog"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400">
            <LogOut className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-sm">Sign Out</h3>
            <p className="text-[11px] text-stone-400">Confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed mb-5">
          Are you sure you want to sign out from <strong className="text-amber-300 font-medium">{userIdentifier}</strong>?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800">
          <button
            id="signout-cancel-btn"
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="signout-ok-btn"
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
