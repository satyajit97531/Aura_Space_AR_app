import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { AppTheme, MeasurementUnit } from "../../types";
import { formatDistance, formatArea } from "../../utils/units";
import { playClickSound, playSuccessChime } from "../../utils/audio";
import {
  X,
  Sliders,
  Sun,
  Moon,
  Sparkles,
  Ruler,
  Check,
  Grid,
  Info,
  Shield,
  Lock,
  Bell,
  Eye,
  Download,
  Upload,
  Volume2,
  User,
  LogOut,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Copy,
  Zap,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = "appearance" | "privacy" | "notifications" | "account" | "data";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    measurementUnit,
    setMeasurementUnit,
    snapToGrid,
    setSnapToGrid,
    roomWidth,
    roomLength,
    currentUser,
    logout,
    setIsSignOutConfirmOpen,
    privacySettings,
    updatePrivacySettings,
    notificationSettings,
    updateNotificationSettings,
    performanceMode,
    setPerformanceMode,
    showDimensionsOverlay,
    setShowDimensionsOverlay,
    savedProjects,
    createNewProject,
    loadProject,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsSection>("appearance");

  // Password change form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Backup & Restore state
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const themes: {
    id: AppTheme;
    name: string;
    description: string;
    icon: React.ReactNode;
    previewBg: string;
    previewBorder: string;
    previewAccent: string;
  }[] = [
    {
      id: "default",
      name: "Default (Architectural)",
      description: "Warm charcoal stone palette with amber studio accents.",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      previewBg: "bg-stone-900",
      previewBorder: "border-stone-700",
      previewAccent: "bg-amber-500",
    },
    {
      id: "dark",
      name: "Dark (Onyx Studio)",
      description: "Deep obsidian slate with high contrast focus.",
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      previewBg: "bg-zinc-950",
      previewBorder: "border-zinc-800",
      previewAccent: "bg-indigo-500",
    },
    {
      id: "white",
      name: "White (Minimalist Atelier)",
      description: "Crisp gallery daylight environment with architectural neutrals.",
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      previewBg: "bg-stone-100",
      previewBorder: "border-stone-300",
      previewAccent: "bg-stone-900",
    },
  ];

  const units: {
    id: MeasurementUnit;
    label: string;
    fullName: string;
    example: string;
  }[] = [
    {
      id: "m",
      label: "m",
      fullName: "Meters",
      example: "International standard interior metric",
    },
    {
      id: "cm",
      label: "cm",
      fullName: "Centimeters",
      example: "Millimeter & centimeter precision",
    },
    {
      id: "ft",
      label: "ft",
      fullName: "Feet",
      example: "Imperial architectural measurement",
    },
    {
      id: "in",
      label: "in",
      fullName: "Inches",
      example: "Detailed furniture joinery sizing",
    },
  ];

  // Handle password change request
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      setPasswordStatus({
        type: "error",
        message: "Please sign in with your email account first.",
      });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 6 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordStatus({
          type: "success",
          message: "Password updated successfully!",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (notificationSettings.soundEffectsEnabled) {
          playSuccessChime();
        }
      } else {
        setPasswordStatus({
          type: "error",
          message: data.error || "Failed to update password. Please check your current password.",
        });
      }
    } catch {
      setPasswordStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Export all projects as JSON backup
  const handleExportBackup = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: "2.4.0",
        user: currentUser
          ? { id: currentUser.id, username: currentUser.username, email: currentUser.email }
          : null,
        privacySettings,
        notificationSettings,
        projects: savedProjects,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auraspace_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (notificationSettings.soundEffectsEnabled) {
        playSuccessChime();
      }
    } catch {
      alert("Failed to export backup.");
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          // Load the first imported project into active view
          loadProject(parsed.projects[0]);
          setImportStatus(`Successfully restored ${parsed.projects.length} blueprints!`);
          if (notificationSettings.soundEffectsEnabled) {
            playSuccessChime();
          }
        } else {
          setImportStatus("Invalid backup file format: missing projects list.");
        }
      } catch {
        setImportStatus("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const navItems: {
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "appearance", label: "Appearance & Units", icon: <Sun className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy & Permissions", icon: <Shield className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications & Audio", icon: <Bell className="w-4 h-4" /> },
    { id: "account", label: "Account Security", icon: <User className="w-4 h-4" /> },
    { id: "data", label: "Data & Storage", icon: <HardDrive className="w-4 h-4" /> },
  ];

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100">Settings</h2>
              <p className="text-xs text-stone-400">Manage account, privacy, units, and appearance</p>
            </div>
          </div>
          <button
            id="settings-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Segment (WhatsApp/Instagram Style) */}
        <div className="flex border-b border-stone-800 bg-stone-950/70 overflow-x-auto no-scrollbar px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`settings-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (notificationSettings.soundEffectsEnabled) playClickSound();
                }}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-amber-500 text-amber-400 bg-stone-900/50"
                    : "border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/20"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* TAB 1: APPEARANCE & UNITS */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Workspace Theme</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themes.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        id={`settings-theme-btn-${t.id}`}
                        onClick={() => {
                          setTheme(t.id);
                          if (notificationSettings.soundEffectsEnabled) playClickSound();
                        }}
                        className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10"
                            : "border-stone-800 bg-stone-950/60 hover:border-stone-700 hover:bg-stone-800/40 text-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {t.icon}
                            <span className="text-xs font-semibold text-white">
                              {t.name.split(" ")[0]}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`w-full h-8 rounded-lg ${t.previewBg} ${t.previewBorder} border p-1 flex items-center justify-between`}
                        >
                          <div className="w-3 h-3 rounded-full bg-stone-700/80" />
                          <div className={`w-4 h-2 rounded-sm ${t.previewAccent}`} />
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-2 leading-tight">
                          {t.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Measurement Units */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    <span>Spatial Measurement Units</span>
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono font-medium">
                    Current: {measurementUnit.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {units.map((u) => {
                    const isSelected = measurementUnit === u.id;
                    return (
                      <button
                        key={u.id}
                        id={`settings-unit-btn-${u.id}`}
                        onClick={() => {
                          setMeasurementUnit(u.id);
                          if (notificationSettings.soundEffectsEnabled) playClickSound();
                        }}
                        className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/15 text-white shadow-md shadow-amber-500/10"
                            : "border-stone-800 bg-stone-950/60 hover:border-stone-700 text-stone-300 hover:text-white"
                        }`}
                      >
                        <span className="text-base font-bold font-mono text-amber-400">{u.label}</span>
                        <span className="text-xs font-medium text-stone-200">{u.fullName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Conversion Preview */}
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-stone-300">
                    <p className="font-medium text-stone-200">
                      Active Room Dimensions in{" "}
                      <span className="text-amber-400 font-bold">{measurementUnit.toUpperCase()}</span>:
                    </p>
                    <div className="font-mono text-[11px] text-stone-300 flex items-center gap-3">
                      <span>
                        Width:{" "}
                        <strong className="text-white">
                          {formatDistance(roomWidth, measurementUnit)}
                        </strong>
                      </span>
                      <span>
                        Length:{" "}
                        <strong className="text-white">
                          {formatDistance(roomLength, measurementUnit)}
                        </strong>
                      </span>
                      <span>
                        Area:{" "}
                        <strong className="text-amber-300">
                          {formatArea(roomWidth, roomLength, measurementUnit)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas Snapping & Dimension HUD Controls */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-amber-400" />
                  <span>Precision & Overlays</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <div>
                      <p className="text-xs font-medium text-stone-200">Snap to Geometric Grid</p>
                      <p className="text-[11px] text-stone-400">
                        Align placed objects cleanly on 0.25m coordinates
                      </p>
                    </div>
                    <button
                      id="settings-toggle-grid-snap-btn"
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        snapToGrid ? "bg-amber-500" : "bg-stone-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                          snapToGrid ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                    <div>
                      <p className="text-xs font-medium text-stone-200">Live Dimension Overlays</p>
                      <p className="text-[11px] text-stone-400">
                        Display room bounds and clearance tags at the bottom of the canvas
                      </p>
                    </div>
                    <button
                      id="settings-toggle-dim-overlay-btn"
                      onClick={() => setShowDimensionsOverlay(!showDimensionsOverlay)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        showDimensionsOverlay ? "bg-amber-500" : "bg-stone-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                          showDimensionsOverlay ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Mode */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>3D Rendering Performance</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPerformanceMode("high")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      performanceMode === "high"
                        ? "border-amber-500 bg-amber-500/10 text-white"
                        : "border-stone-800 bg-stone-950/60 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <p className="text-xs font-semibold text-stone-200">High Quality (60 FPS)</p>
                    <p className="text-[11px] text-stone-400">Soft PCF shadows, anti-aliasing</p>
                  </button>
                  <button
                    onClick={() => setPerformanceMode("battery_saver")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      performanceMode === "battery_saver"
                        ? "border-amber-500 bg-amber-500/10 text-white"
                        : "border-stone-800 bg-stone-950/60 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <p className="text-xs font-semibold text-stone-200">Battery Saver</p>
                    <p className="text-[11px] text-stone-400">Optimized rendering on mobile</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & PERMISSIONS (WhatsApp / Instagram Inspired) */}
          {activeTab === "privacy" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Control how other designers interact with your profile and blueprints across the
                  AuraSpace community gallery.
                </p>
              </div>

              <div className="space-y-2">
                {/* Profile Visibility */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">Public Profile Visibility</p>
                    <p className="text-[11px] text-stone-400">
                      Allow other designers to view your badges, bio, and showcase gallery
                    </p>
                  </div>
                  <button
                    id="settings-toggle-public-profile"
                    onClick={() =>
                      updatePrivacySettings({ isProfilePublic: !privacySettings.isProfilePublic })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      privacySettings.isProfilePublic ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        privacySettings.isProfilePublic ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Others to Copy */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-xs font-medium text-stone-200">
                        Allow Others to Copy & Remix Blueprints
                      </p>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      When enabled, other users can duplicate your public blueprints as editable remixes.
                      Your original blueprint remains completely protected and untouched.
                    </p>
                  </div>
                  <button
                    id="settings-toggle-allow-copy"
                    onClick={() =>
                      updatePrivacySettings({
                        allowOthersToCopy: !privacySettings.allowOthersToCopy,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      privacySettings.allowOthersToCopy ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        privacySettings.allowOthersToCopy ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Activity Status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">Show Online / Active Status</p>
                    <p className="text-[11px] text-stone-400">
                      Display an active badge next to your avatar when browsing the studio
                    </p>
                  </div>
                  <button
                    id="settings-toggle-activity-status"
                    onClick={() =>
                      updatePrivacySettings({
                        showActivityStatus: !privacySettings.showActivityStatus,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      privacySettings.showActivityStatus ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        privacySettings.showActivityStatus ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Default Visibility */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">
                      Publish New Projects as Public by Default
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Automatically add new blueprints to the community feed
                    </p>
                  </div>
                  <button
                    id="settings-toggle-default-public"
                    onClick={() =>
                      updatePrivacySettings({
                        defaultProjectPublic: !privacySettings.defaultProjectPublic,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      privacySettings.defaultProjectPublic ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        privacySettings.defaultProjectPublic ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & SOUND (WhatsApp / Instagram Inspired) */}
          {activeTab === "notifications" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="space-y-2">
                {/* Master Notifications Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">Push & In-App Notifications</p>
                    <p className="text-[11px] text-stone-400">
                      Receive alerts when community designers interact with your blueprints
                    </p>
                  </div>
                  <button
                    id="settings-toggle-master-notifications"
                    onClick={() =>
                      updateNotificationSettings({
                        notificationsEnabled: !notificationSettings.notificationsEnabled,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notificationSettings.notificationsEnabled ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        notificationSettings.notificationsEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Likes Alert */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">Likes & Appreciation</p>
                    <p className="text-[11px] text-stone-400">
                      Notify me when someone likes my interior blueprints
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateNotificationSettings({
                        notifyOnLikes: !notificationSettings.notifyOnLikes,
                      })
                    }
                    disabled={!notificationSettings.notificationsEnabled}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 ${
                      notificationSettings.notifyOnLikes ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        notificationSettings.notifyOnLikes ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Comments Alert */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <p className="text-xs font-medium text-stone-200">Design Comments & Feedback</p>
                    <p className="text-[11px] text-stone-400">
                      Notify me when someone writes feedback on my project
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateNotificationSettings({
                        notifyOnComments: !notificationSettings.notifyOnComments,
                      })
                    }
                    disabled={!notificationSettings.notificationsEnabled}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 ${
                      notificationSettings.notifyOnComments ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        notificationSettings.notifyOnComments ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Spatial Sound Effects */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-medium text-stone-200">Spatial Audio Effects</p>
                      <p className="text-[11px] text-stone-400">
                        Subtle acoustic feedback on furniture placement, snapping, and milestones
                      </p>
                    </div>
                  </div>
                  <button
                    id="settings-toggle-sound-effects"
                    onClick={() => {
                      const next = !notificationSettings.soundEffectsEnabled;
                      updateNotificationSettings({ soundEffectsEnabled: next });
                      if (next) playClickSound();
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notificationSettings.soundEffectsEnabled ? "bg-amber-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow-lg transition duration-200 ${
                        notificationSettings.soundEffectsEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SECURITY & CREDENTIALS */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {currentUser ? (
                <>
                  {/* Account Overview Card */}
                  <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
                        {(currentUser.name || currentUser.username || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-stone-100">
                            {currentUser.name || currentUser.username}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Spatial Designer
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono">{currentUser.email}</p>
                        {currentUser.createdAt && (
                          <p className="text-[10px] text-stone-500">
                            Member since: {new Date(currentUser.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      id="settings-account-logout-btn"
                      type="button"
                      onClick={() => setIsSignOutConfirmOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Change Account Password</span>
                    </label>

                    {passwordStatus.message && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                          passwordStatus.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                        }`}
                      >
                        {passwordStatus.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span>{passwordStatus.message}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Current password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="password"
                        placeholder="New password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-semibold transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="p-6 rounded-xl bg-stone-950/60 border border-stone-800 text-center space-y-3">
                  <User className="w-8 h-8 text-stone-500 mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-stone-200">Guest Mode Active</p>
                    <p className="text-[11px] text-stone-400">
                      Sign in or create an account to persist your blueprints across devices and join
                      the public design gallery.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATA, STORAGE & BACKUP */}
          {activeTab === "data" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Blueprints Storage & Backup</span>
                </label>

                {importStatus && (
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-amber-300">
                    {importStatus}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-200">
                        Export All Projects & Settings (.json)
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Download a complete portable offline backup of all your blueprints ({savedProjects.length}{" "}
                        saved)
                      </p>
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="border-t border-stone-800/80 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-200">Import / Restore Backup</p>
                      <p className="text-[11px] text-stone-400">
                        Restore your previously exported blueprints file
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800/60 text-xs text-stone-400 space-y-1">
                  <p className="font-semibold text-stone-300">AuraSpace Pro v2.4.0</p>
                  <p>Database: MongoDB Atlas Cloud Sync • Real-Time Protection Active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-900/90 flex justify-end">
          <button
            id="settings-modal-done-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
