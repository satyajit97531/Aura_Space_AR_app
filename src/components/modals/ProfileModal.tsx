import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { ACHIEVEMENTS_LIST } from "../../data/achievements";
import { formatDistance, formatArea } from "../../utils/units";
import { AuraProject, ProjectComment } from "../../types";
import { ShareModal, ShareModalData } from "./ShareModal";
import {
  X,
  User,
  Globe,
  Trophy,
  Heart,
  MessageSquare,
  Lock,
  Unlock,
  Check,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Send,
  Calendar,
  Layers,
  Award,
  Share2,
  Copy,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "profile" | "gallery" | "achievements";
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = "profile",
}) => {
  const {
    currentUser,
    updateUserProfile,
    savedProjects,
    toggleProjectVisibility,
    likeProject,
    addProjectComment,
    loadProject,
    forkProject,
    measurementUnit,
    setIsAuthModalOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"profile" | "gallery" | "achievements">(initialTab);

  // Edit profile state
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [showcasedBadges, setShowcasedBadges] = useState<string[]>(currentUser?.showcasedBadges || []);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gallery filters and comments state
  const [galleryScope, setGalleryScope] = useState<"community" | "my_blueprints">("community");
  const [communityProjects, setCommunityProjects] = useState<AuraProject[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [remixToast, setRemixToast] = useState<string | null>(null);

  const [galleryFilter, setGalleryFilter] = useState<"all" | "public" | "private">("all");
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [projectId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<string | null>(null);
  const [localLikeAnim, setLocalLikeAnim] = useState<{ [projectId: string]: boolean }>({});

  // Share profile and blueprints state
  const [shareModalData, setShareModalData] = useState<ShareModalData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleSharePublicProfile = () => {
    if (typeof window === "undefined") return;
    const profileHandle = username || currentUser?.username || currentUser?.email?.split("@")[0] || "designer";
    const origin = window.location.origin;
    const path = window.location.pathname;
    const shareUrl = `${origin}${path}?profile=${encodeURIComponent(profileHandle)}&tab=gallery`;

    setShareModalData({
      type: "profile",
      title: displayName || currentUser?.name || `@${profileHandle}`,
      subtitle: bio ? (bio.length > 80 ? bio.slice(0, 80) + "..." : bio) : "AuraSpace Public 3D Designer Portfolio",
      username: profileHandle,
      avatarUrl: avatarUrl || currentUser?.avatarUrl,
      url: shareUrl,
    });
    setIsShareModalOpen(true);
  };

  const handleShareProject = (project: AuraProject) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const projectId = project.id || "";
    const shareUrl = `${origin}${path}?blueprint=${encodeURIComponent(projectId)}&tab=gallery`;
    const author = project.userName || (project.userEmail ? project.userEmail.split("@")[0] : "designer");

    setShareModalData({
      type: "project",
      title: project.name,
      subtitle: `3D Blueprint by @${author}`,
      username: author,
      url: shareUrl,
      description: project.notes,
    });
    setIsShareModalOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when currentUser or initialTab changes
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setShowcasedBadges(currentUser.showcasedBadges || []);
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Fetch community projects across all designers from MongoDB
  const fetchCommunityProjects = async () => {
    setIsLoadingCommunity(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setCommunityProjects(data.projects);
      }
    } catch (e) {
      console.warn("Could not fetch community gallery:", e);
    } finally {
      setIsLoadingCommunity(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "gallery") {
      fetchCommunityProjects();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // If user is not logged in, prompt sign in
  if (!currentUser) {
    return (
      <div
        id="profile-modal-backdrop-guest"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          id="profile-modal-guest-card"
          className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-center text-stone-100 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Sign in to Access Public Profile & Gallery</h2>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            Create an account or log in to showcase your public gallery, customize your designer avatar and bio, unlock achievements, and interact with the community.
          </p>
          <div className="flex items-center gap-3 w-full">
            <button
              id="profile-guest-cancel-btn"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="profile-guest-signin-btn"
              onClick={() => {
                onClose();
                setIsAuthModalOpen(true);
              }}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-all shadow-md shadow-amber-500/20"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const userProjects = savedProjects.filter(
    (p) => !p.userId || p.userId === currentUser.id
  );
  const publicProjects = userProjects.filter((p) => p.isPublic);
  const totalLikesReceived = publicProjects.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const userBadges = currentUser.badges || [];

  // Handle avatar upload via file input
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset avatar choices
  const presetAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  ];

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const success = await updateUserProfile({
      name: displayName.trim(),
      username: username.trim().replace(/^@/, ""),
      bio: bio.trim(),
      avatarUrl: avatarUrl,
      showcasedBadges: showcasedBadges,
    });
    setIsSavingProfile(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Toggle badge showcase
  const handleToggleShowcaseBadge = (badgeId: string) => {
    if (showcasedBadges.includes(badgeId)) {
      setShowcasedBadges(showcasedBadges.filter((b) => b !== badgeId));
    } else {
      if (showcasedBadges.length >= 4) {
        alert("You can showcase up to 4 badges on your profile header.");
        return;
      }
      setShowcasedBadges([...showcasedBadges, badgeId]);
    }
  };

  // Copy and remix project to user's account (protecting original from any mutation)
  const handleCopyAndRemix = async (project: AuraProject) => {
    setForkingId(project.id);
    try {
      const result = await forkProject(project);
      if (result.success) {
        setRemixToast(
          `Blueprint "${project.name}" was copied to your account! You can now freely modify your personal copy while @${project.userName || "the author"}'s original blueprint remains completely protected.`
        );
        setTimeout(() => {
          setRemixToast(null);
          onClose();
        }, 2400);
      }
    } catch (err: any) {
      alert("Failed to copy blueprint: " + err.message);
    } finally {
      setForkingId(null);
    }
  };

  // Toggle like supporting both personal and community gallery
  const handleToggleLike = async (projectId: string) => {
    setLocalLikeAnim((prev) => ({ ...prev, [projectId]: true }));
    setTimeout(() => {
      setLocalLikeAnim((prev) => ({ ...prev, [projectId]: false }));
    }, 300);

    await likeProject(projectId);

    // Update community list optimistically
    const uid = currentUser?.id || "";
    setCommunityProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const likedBy = p.likedBy || [];
          const isLiked = likedBy.includes(uid);
          const newLikedBy = isLiked ? likedBy.filter((x) => x !== uid) : [...likedBy, uid];
          const newCount = isLiked ? Math.max(0, (p.likesCount || 0) - 1) : (p.likesCount || 0) + 1;
          return { ...p, likedBy: newLikedBy, likesCount: newCount };
        }
        return p;
      })
    );
  };

  // Submit comment supporting both personal and community gallery
  const handleSendComment = async (projectId: string) => {
    const text = (newCommentText[projectId] || "").trim();
    if (!text) return;

    setCommentSubmitting(projectId);
    const success = await addProjectComment(projectId, text);
    setCommentSubmitting(null);
    if (success) {
      setNewCommentText((prev) => ({ ...prev, [projectId]: "" }));

      // Optimistically append comment to community projects
      const newComment: ProjectComment = {
        id: `comm_${Date.now()}`,
        userId: currentUser?.id || "guest",
        userName: currentUser?.name || currentUser?.username || "You",
        text,
        createdAt: new Date().toISOString(),
      };

      setCommunityProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, comments: [...(p.comments || []), newComment] }
            : p
        )
      );
    }
  };

  // Filtered gallery projects for "My Blueprints"
  const filteredMyGallery = userProjects.filter((p) => {
    if (galleryFilter === "public") return p.isPublic;
    if (galleryFilter === "private") return !p.isPublic;
    return true;
  });

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="profile-modal-container"
        className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-800 bg-stone-900/95 gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-bold text-base flex items-center justify-center shadow-sm">
                    {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{displayName || "Designer Profile"}</h2>
                  <span className="text-xs text-amber-400 font-mono">@{username || currentUser.email.split("@")[0]}</span>
                  <button
                    id="profile-header-share-btn"
                    onClick={handleSharePublicProfile}
                    title="Share your public designer portfolio"
                    className="p-1 rounded-md text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 truncate">Manage public persona, community gallery, & badges</p>
              </div>
            </div>

            <button
              id="profile-modal-close-mobile-btn"
              onClick={onClose}
              className="sm:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Tabs */}
            <div className="flex bg-stone-950/80 p-1 rounded-xl border border-stone-800 overflow-x-auto no-scrollbar max-w-full">
              <button
                id="tab-btn-profile"
                onClick={() => setActiveTab("profile")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>

              <button
                id="tab-btn-gallery"
                onClick={() => setActiveTab("gallery")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "gallery"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Gallery</span>
                {publicProjects.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "gallery" ? "bg-stone-950 text-amber-400" : "bg-stone-800 text-stone-300"
                  }`}>
                    {publicProjects.length}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-achievements"
                onClick={() => setActiveTab("achievements")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "achievements"
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Badges</span>
                {userBadges.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "achievements" ? "bg-stone-950 text-amber-400" : "bg-stone-800 text-stone-300"
                  }`}>
                    {userBadges.length}
                  </span>
                )}
              </button>
            </div>

            <button
              id="profile-modal-close-btn"
              onClick={onClose}
              className="hidden sm:flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Public Profile Area */}
        {activeTab === "profile" && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Stats summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500/20" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Total Likes</p>
                  <p className="text-xl font-bold font-mono text-white">{totalLikesReceived}</p>
                  <p className="text-[10px] text-stone-400">across public designs</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Public Gallery</p>
                  <p className="text-xl font-bold font-mono text-white">{publicProjects.length} <span className="text-xs font-normal text-stone-400">/ {userProjects.length} total</span></p>
                  <p className="text-[10px] text-stone-400">shared with community</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Badges Earned</p>
                  <p className="text-xl font-bold font-mono text-amber-400">{userBadges.length} <span className="text-xs font-normal text-stone-400">/ {ACHIEVEMENTS_LIST.length}</span></p>
                  <p className="text-[10px] text-stone-400">milestones completed</p>
                </div>
              </div>
            </div>

            {/* Showcased Badges Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 via-stone-950 to-stone-950 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Showcased Badges</h3>
                </div>
                <button
                  onClick={() => setActiveTab("achievements")}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <span>Select from Achievements</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {showcasedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {showcasedBadges.map((badgeId) => {
                    const ach = ACHIEVEMENTS_LIST.find((a) => a.id === badgeId);
                    if (!ach) return null;
                    return (
                      <div
                        key={badgeId}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 border border-amber-500/40 text-stone-200 flex items-center gap-2 shadow-sm text-xs"
                      >
                        <span className="text-base">{ach.badge}</span>
                        <div className="text-left">
                          <p className="font-semibold text-white text-[11px]">{ach.title}</p>
                          <p className="text-[9px] text-amber-400/80">{ach.criteria}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">
                  No badges showcased yet. Visit the Achievements tab to pin your favorite badges here!
                </p>
              )}
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="border-t border-stone-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Edit Profile Info</h3>
                
                {/* Avatar uploader */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800 mb-4">
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 font-bold text-2xl flex items-center justify-center">
                        {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-semibold text-white">Profile Picture</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Image File</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-red-950/40 text-stone-400 hover:text-red-400 text-xs transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400">Presets:</span>
                      {presetAvatars.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-stone-700 hover:border-amber-400 transition-all"
                        >
                          <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Satyajit Samanta"
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-xs text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Username (@handle)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-stone-400">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                        placeholder="username"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-xs text-stone-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Bio / Spatial Design Philosophy
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell other designers about your interior aesthetic, architectural background, or favorite design styles..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-xs text-stone-100 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in">
                    <Check className="w-4 h-4" />
                    Profile changes saved successfully!
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Public Gallery & Community Showcase */}
        {activeTab === "gallery" && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Top Bar with Scope Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Public Gallery & Community Showcase</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Explore and copy community spatial blueprints, or manage your own published designs.
                </p>
              </div>

              {/* Segmented Scope Controller & Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs shrink-0">
                  <button
                    id="scope-btn-community"
                    onClick={() => {
                      setGalleryScope("community");
                      fetchCommunityProjects();
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                      galleryScope === "community"
                        ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Community Showcase</span>
                    {communityProjects.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        galleryScope === "community" ? "bg-stone-950 text-amber-400" : "bg-stone-800 text-stone-300"
                      }`}>
                        {communityProjects.length}
                      </span>
                    )}
                  </button>

                  <button
                    id="scope-btn-my-blueprints"
                    onClick={() => setGalleryScope("my_blueprints")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                      galleryScope === "my_blueprints"
                        ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>My Blueprints</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      galleryScope === "my_blueprints" ? "bg-stone-950 text-amber-400" : "bg-stone-800 text-stone-300"
                    }`}>
                      {userProjects.length}
                    </span>
                  </button>
                </div>

                <button
                  onClick={fetchCommunityProjects}
                  title="Refresh Community Feed"
                  className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCommunity ? "animate-spin text-amber-400" : ""}`} />
                </button>

                {/* Share Public Profile Button */}
                <button
                  id="gallery-share-profile-btn"
                  onClick={handleSharePublicProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                  title="Share your public profile and 3D blueprints via WhatsApp, Link, etc."
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-stone-950" />
                  <span>Share Profile</span>
                </button>
              </div>
            </div>

            {/* Dedicated Public Profile & Portfolio Share Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-stone-950/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Share Your Public Profile & 3D Blueprints</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      WhatsApp & Link
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Send your public spatial portfolio to clients, teammates, or friends on WhatsApp, social platforms, or via direct link.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  id="gallery-whatsapp-share-direct-btn"
                  onClick={handleSharePublicProfile}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-stone-950" />
                  <span>Send via WhatsApp / Share</span>
                </button>
              </div>
            </div>

            {/* Remix Toast notification */}
            {remixToast && (
              <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="leading-relaxed font-medium">{remixToast}</span>
              </div>
            )}

            {/* Sub-view 1: Community Showcase (Protected, Public, Copyable) */}
            {galleryScope === "community" && (
              <div className="space-y-4">
                {/* Immutability & Permission Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-300">
                      Community Protection Active
                    </p>
                    <p className="text-[11px] text-amber-200/70 leading-relaxed">
                      All uploaded blueprints are read-only. Nobody can alter another creator's original design.
                      Click <strong className="text-amber-300 font-bold">Copy / Remix</strong> on any blueprint to clone it directly into your personal workspace and make your own edits.
                    </p>
                  </div>
                </div>

                {isLoadingCommunity ? (
                  <div className="text-center py-16 px-4">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                    <p className="text-xs text-stone-400">Loading community blueprints from database...</p>
                  </div>
                ) : communityProjects.length === 0 ? (
                  <div className="text-center py-14 px-4 border border-dashed border-stone-800 rounded-2xl bg-stone-950/40">
                    <Globe className="w-10 h-10 text-stone-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-stone-300 mb-1">No community designs published yet</p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      Switch to "My Blueprints" tab and toggle one of your designs to Public to become the first contributor!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communityProjects.map((project) => {
                      const isCommentsOpen = expandedCommentsId === project.id;
                      const commentsList: ProjectComment[] = project.comments || [];
                      const isLikedByMe = (project.likedBy || []).includes(currentUser?.id || "");
                      const isMyOwn = currentUser && project.userId === currentUser.id;
                      const isForkingThis = forkingId === project.id;

                      return (
                        <div
                          key={project.id}
                          className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between hover:border-stone-700 transition-all shadow-md group"
                        >
                          <div className="space-y-3">
                            {/* Card Header: Title & Protected Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                    {project.name}
                                  </h4>
                                  {isMyOwn && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      Your Design
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-400 flex items-center gap-2 mt-1">
                                  <span className="text-stone-300 font-medium">
                                    @{project.userName || "creator"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {formatDistance(project.roomDimensions.width, measurementUnit)} ×{" "}
                                    {formatDistance(project.roomDimensions.length, measurementUnit)}
                                  </span>
                                  <span>•</span>
                                  <span>{project.placedObjects?.length || 0} items</span>
                                </p>
                              </div>

                              {/* Protected Badge */}
                              <div
                                title="Original blueprint is locked and cannot be modified by other users"
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-900 border border-stone-700 text-stone-300 flex items-center gap-1 shrink-0"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Protected</span>
                              </div>
                            </div>

                            {/* Color Palette Display */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60 border border-stone-800/80 text-xs">
                              <span className="text-stone-400 text-[11px]">
                                Palette: <strong className="text-stone-200 font-medium">{project.colorPalette?.name || "Architectural"}</strong>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm"
                                  style={{ backgroundColor: project.colorPalette?.baseColor || project.colorPalette?.wallColor || "#D6CFC4" }}
                                />
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-sm"
                                  style={{ backgroundColor: project.colorPalette?.accentColor || "#C8A251" }}
                                />
                              </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 gap-2">
                              <div className="flex items-center gap-2">
                                {/* Like button */}
                                <button
                                  id={`comm-like-${project.id}`}
                                  onClick={() => handleToggleLike(project.id)}
                                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                    isLikedByMe
                                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition-transform ${
                                      localLikeAnim[project.id] ? "scale-125" : ""
                                    } ${isLikedByMe ? "fill-rose-500 text-rose-500" : ""}`}
                                  />
                                  <span>{project.likesCount || 0}</span>
                                </button>

                                {/* Comment button */}
                                <button
                                  id={`comm-comment-toggle-${project.id}`}
                                  onClick={() =>
                                    setExpandedCommentsId(isCommentsOpen ? null : project.id)
                                  }
                                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-800 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{commentsList.length}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Share Blueprint Button */}
                                <button
                                  id={`comm-share-btn-${project.id}`}
                                  onClick={() => handleShareProject(project)}
                                  title="Share this 3D blueprint to WhatsApp or copy link"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Copy / Remix Button */}
                                <button
                                  id={`copy-remix-btn-${project.id}`}
                                  disabled={isForkingThis}
                                  onClick={() => handleCopyAndRemix(project)}
                                  title="Copy blueprint into your personal workspace without changing the original"
                                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                                >
                                  <Copy className={`w-3 h-3 ${isForkingThis ? "animate-spin" : ""}`} />
                                  <span>{isForkingThis ? "Copying..." : "Copy & Remix"}</span>
                                </button>

                                {/* Open 3D Read-Only Button */}
                                <button
                                  id={`load-comm-project-${project.id}`}
                                  onClick={() => {
                                    loadProject(project);
                                    onClose();
                                  }}
                                  title="Inspect 3D scene (Read-Only protected)"
                                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3 text-stone-400" />
                                  <span className="hidden sm:inline">3D</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Comments Drawer */}
                          {isCommentsOpen && (
                            <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2.5 animate-in fade-in duration-150">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                Comments ({commentsList.length})
                              </p>

                              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                                {commentsList.length === 0 ? (
                                  <p className="text-[11px] text-stone-500 italic py-1">
                                    No comments yet. Be the first to share your thoughts!
                                  </p>
                                ) : (
                                  commentsList.map((comm) => (
                                    <div
                                      key={comm.id}
                                      className="p-2 rounded-xl bg-stone-900 border border-stone-800/60 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-amber-400 text-[11px]">
                                          {comm.userName}
                                        </span>
                                        <span className="text-[9px] text-stone-500">
                                          {new Date(comm.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-stone-300 text-[11px] leading-relaxed">
                                        {comm.text}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add comment input */}
                              <div className="flex items-center gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={newCommentText[project.id] || ""}
                                  onChange={(e) =>
                                    setNewCommentText({
                                      ...newCommentText,
                                      [project.id]: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSendComment(project.id);
                                    }
                                  }}
                                  placeholder="Write a comment..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  id={`send-comment-${project.id}`}
                                  disabled={
                                    commentSubmitting === project.id ||
                                    !(newCommentText[project.id] || "").trim()
                                  }
                                  onClick={() => handleSendComment(project.id)}
                                  className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-view 2: My Blueprints (Manage Public/Private, Duplicate, Open) */}
            {galleryScope === "my_blueprints" && (
              <div className="space-y-4">
                {/* Filter tabs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                    <button
                      onClick={() => setGalleryFilter("all")}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        galleryFilter === "all" ? "bg-stone-800 text-white font-medium" : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      All ({userProjects.length})
                    </button>
                    <button
                      onClick={() => setGalleryFilter("public")}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        galleryFilter === "public" ? "bg-emerald-500/20 text-emerald-300 font-medium" : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Public ({publicProjects.length})
                    </button>
                    <button
                      onClick={() => setGalleryFilter("private")}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        galleryFilter === "private" ? "bg-stone-800 text-stone-300 font-medium" : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Private ({userProjects.length - publicProjects.length})
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-400 hidden sm:inline">
                    Click "Public" on any project to feature it in Community Showcase
                  </span>
                </div>

                {filteredMyGallery.length === 0 ? (
                  <div className="text-center py-14 px-4 border border-dashed border-stone-800 rounded-2xl bg-stone-950/40">
                    <Layers className="w-10 h-10 text-stone-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-stone-300 mb-1">No designs found</p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      {galleryFilter === "public"
                        ? "You haven't made any blueprints public yet. Toggle any blueprint to Public to feature it in the community showcase."
                        : "Create and save designs in the 3D canvas to manage them here."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMyGallery.map((project) => {
                      const isCommentsOpen = expandedCommentsId === project.id;
                      const commentsList: ProjectComment[] = project.comments || [];
                      const isLikedByMe = (project.likedBy || []).includes(currentUser?.id || "");
                      const isForkingThis = forkingId === project.id;

                      return (
                        <div
                          key={project.id}
                          className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between hover:border-stone-700 transition-all shadow-md group"
                        >
                          <div className="space-y-3">
                            {/* Title & Visibility Pill */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {project.name}
                                </h4>
                                <p className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                                  <span>
                                    {formatDistance(project.roomDimensions.width, measurementUnit)} ×{" "}
                                    {formatDistance(project.roomDimensions.length, measurementUnit)}
                                  </span>
                                  <span>•</span>
                                  <span>{project.placedObjects?.length || 0} items</span>
                                </p>
                              </div>

                              {/* Public / Private Switcher Button */}
                              <button
                                id={`toggle-visibility-${project.id}`}
                                onClick={() => toggleProjectVisibility(project.id, !project.isPublic)}
                                title="Click to toggle Public / Private status"
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                                  project.isPublic
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-stone-800 text-stone-400 border border-stone-700 hover:text-stone-200"
                                }`}
                              >
                                {project.isPublic ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-400" />
                                    <span>Public</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-stone-400" />
                                    <span>Private</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Visual Palette Preview */}
                            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-stone-400">Palette:</span>
                                <span className="text-[11px] font-medium text-stone-200">
                                  {project.colorPalette?.name || "Architectural"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-stone-700"
                                  style={{ backgroundColor: project.colorPalette?.baseColor || project.colorPalette?.wallColor || "#D6CFC4" }}
                                />
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-stone-700"
                                  style={{ backgroundColor: project.colorPalette?.accentColor || "#C8A251" }}
                                />
                              </div>
                            </div>

                            {/* Social Interaction Bar & Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 gap-2">
                              <div className="flex items-center gap-2">
                                {/* Like Button */}
                                <button
                                  id={`like-btn-${project.id}`}
                                  onClick={() => handleToggleLike(project.id)}
                                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                    isLikedByMe
                                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition-transform ${
                                      localLikeAnim[project.id] ? "scale-125" : ""
                                    } ${isLikedByMe ? "fill-rose-500 text-rose-500" : ""}`}
                                  />
                                  <span>{project.likesCount || 0}</span>
                                </button>

                                {/* Comment Toggle Button */}
                                <button
                                  id={`comment-toggle-${project.id}`}
                                  onClick={() =>
                                    setExpandedCommentsId(isCommentsOpen ? null : project.id)
                                  }
                                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-800 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{commentsList.length}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Share Blueprint Button */}
                                <button
                                  id={`my-share-btn-${project.id}`}
                                  onClick={() => handleShareProject(project)}
                                  title="Share this 3D blueprint to WhatsApp or copy link"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Duplicate / Copy Blueprint */}
                                <button
                                  id={`duplicate-btn-${project.id}`}
                                  disabled={isForkingThis}
                                  onClick={() => handleCopyAndRemix(project)}
                                  title="Create a duplicate copy of this blueprint"
                                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3 text-amber-400" />
                                  <span>Duplicate</span>
                                </button>

                                {/* Open in 3D Button */}
                                <button
                                  id={`load-project-${project.id}`}
                                  onClick={() => {
                                    loadProject(project);
                                    onClose();
                                  }}
                                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open 3D</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Comments Drawer */}
                          {isCommentsOpen && (
                            <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2.5 animate-in fade-in duration-150">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                Comments ({commentsList.length})
                              </p>

                              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                                {commentsList.length === 0 ? (
                                  <p className="text-[11px] text-stone-500 italic py-1">
                                    No comments yet. Be the first to share your thoughts!
                                  </p>
                                ) : (
                                  commentsList.map((comm) => (
                                    <div
                                      key={comm.id}
                                      className="p-2 rounded-xl bg-stone-900 border border-stone-800/60 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-amber-400 text-[11px]">
                                          {comm.userName}
                                        </span>
                                        <span className="text-[9px] text-stone-500">
                                          {new Date(comm.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-stone-300 text-[11px] leading-relaxed">
                                        {comm.text}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add comment box */}
                              <div className="flex items-center gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={newCommentText[project.id] || ""}
                                  onChange={(e) =>
                                    setNewCommentText({
                                      ...newCommentText,
                                      [project.id]: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSendComment(project.id);
                                    }
                                  }}
                                  placeholder="Write a comment..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  id={`send-comment-${project.id}`}
                                  disabled={
                                    commentSubmitting === project.id ||
                                    !(newCommentText[project.id] || "").trim()
                                  }
                                  onClick={() => handleSendComment(project.id)}
                                  className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Achievements & Showcase Badges */}
        {activeTab === "achievements" && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Header progress card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Architectural Achievements</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Complete spatial design milestones to unlock badges and showcase them on your public profile.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-stone-400">Unlocked</span>
                  <p className="text-base font-bold font-mono text-amber-400">
                    {userBadges.length} / {ACHIEVEMENTS_LIST.length}
                  </p>
                </div>
                <div className="w-24 h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${(userBadges.length / ACHIEVEMENTS_LIST.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const isUnlocked = userBadges.includes(ach.id);
                const isShowcased = showcasedBadges.includes(ach.id);

                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isUnlocked
                        ? "bg-stone-950/70 border-amber-500/30 hover:border-amber-500/50 shadow-sm"
                        : "bg-stone-950/30 border-stone-800/60 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isUnlocked
                          ? "bg-amber-500/10 border border-amber-500/30 shadow-sm"
                          : "bg-stone-900 border border-stone-800 grayscale"
                      }`}
                    >
                      {ach.badge}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                        {isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-400 flex items-center gap-1 shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-300 leading-snug">{ach.description}</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">Criteria: {ach.criteria}</p>

                      {/* Showcase on profile toggle */}
                      {isUnlocked && (
                        <div className="pt-2">
                          <button
                            id={`showcase-toggle-${ach.id}`}
                            onClick={() => handleToggleShowcaseBadge(ach.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5 ${
                              isShowcased
                                ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                                : "bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300"
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isShowcased ? "Showcased on Profile" : "Pin to Profile"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between text-xs text-stone-400">
          <span>Signed in as <strong className="text-white font-mono">{currentUser.email}</strong></span>
          <button
            id="profile-modal-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Share Profile & Blueprint Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={shareModalData}
      />
    </div>
  );
};
