import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  QrCode,
  Download,
  Sparkles,
} from "lucide-react";
import { playClickSound, playSuccessChime } from "../../utils/audio";

export interface ShareModalData {
  type: "profile" | "project";
  title: string;
  subtitle?: string;
  username?: string;
  avatarUrl?: string;
  url: string;
  description?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareModalData | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.url) return;
    setCopied(false);

    // Generate QR code for the shared link
    QRCode.toDataURL(data.url, {
      width: 280,
      margin: 2,
      color: {
        dark: "#1C1917",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn("Failed to generate QR code:", err));
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      playSuccessChime();
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older contexts
      const el = document.createElement("textarea");
      el.value = data.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // WhatsApp share
  const shareWhatsApp = () => {
    playClickSound();
    const text =
      data.type === "profile"
        ? `Check out ${data.title}'s 3D spatial design portfolio & interior blueprints on AuraSpace:\n${data.url}`
        : `Check out the "${data.title}" 3D spatial blueprint on AuraSpace:\n${data.url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Telegram share
  const shareTelegram = () => {
    playClickSound();
    const text =
      data.type === "profile"
        ? `Check out ${data.title}'s 3D interior design portfolio on AuraSpace`
        : `Check out the "${data.title}" 3D spatial plan on AuraSpace`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  // X / Twitter share
  const shareTwitter = () => {
    playClickSound();
    const text =
      data.type === "profile"
        ? `Explore ${data.title}'s 3D interior blueprints & spatial portfolio on @AuraSpace!`
        : `Check out "${data.title}" 3D interior design blueprint created on @AuraSpace!`;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  // Email share
  const shareEmail = () => {
    playClickSound();
    const subject =
      data.type === "profile"
        ? `${data.title}'s 3D Spatial Design Portfolio on AuraSpace`
        : `3D Blueprint: ${data.title} on AuraSpace`;
    const body = `Hi,\n\nTake a look at ${data.title}'s public spatial design profile on AuraSpace:\n\n${data.url}\n\nExplore interactive 3D rooms and community blueprints!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Web Share API (native mobile / system share sheet)
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const handleNativeShare = async () => {
    playClickSound();
    try {
      await navigator.share({
        title: data.title,
        text:
          data.type === "profile"
            ? `Explore ${data.title}'s public spatial design portfolio on AuraSpace`
            : `Check out "${data.title}" on AuraSpace`,
        url: data.url,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="share-modal-content"
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-stone-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {data.type === "profile" ? "Share Public Profile" : "Share Spatial Blueprint"}
              </h3>
              <p className="text-xs text-stone-400">
                Send to WhatsApp, social platforms, or copy direct link
              </p>
            </div>
          </div>
          <button
            id="share-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile / Project Preview Pill */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800/80 flex items-center gap-3">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.title}
              className="w-12 h-12 rounded-xl object-cover border border-stone-700 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
              {data.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-white truncate">{data.title}</h4>
              {data.username && (
                <span className="text-xs text-amber-400 font-mono">@{data.username}</span>
              )}
            </div>
            <p className="text-xs text-stone-400 truncate mt-0.5">
              {data.subtitle || "AuraSpace Public Designer Showcase"}
            </p>
          </div>
        </div>

        {/* Share Platforms Grid */}
        <div className="p-4 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Share Directly Via
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <button
              id="share-platform-whatsapp"
              onClick={shareWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center mb-1.5 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 fill-stone-950" />
              </div>
              <span className="text-xs font-bold text-emerald-300">WhatsApp</span>
              <span className="text-[10px] text-emerald-400/80">Direct Send</span>
            </button>

            {/* Telegram */}
            <button
              id="share-platform-telegram"
              onClick={shareTelegram}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-full bg-sky-500 text-stone-950 flex items-center justify-center mb-1.5 shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-sky-300">Telegram</span>
              <span className="text-[10px] text-sky-400/80">Chat Link</span>
            </button>

            {/* X / Twitter */}
            <button
              id="share-platform-twitter"
              onClick={shareTwitter}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-full bg-stone-950 text-white flex items-center justify-center mb-1.5 border border-stone-700 shadow-sm group-hover:scale-110 transition-transform">
                <span className="font-bold text-xs">𝕏</span>
              </div>
              <span className="text-xs font-bold text-stone-200">X (Twitter)</span>
              <span className="text-[10px] text-stone-400">Post Link</span>
            </button>

            {/* Email */}
            <button
              id="share-platform-email"
              onClick={shareEmail}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center mb-1.5 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Mail className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-amber-300">Email</span>
              <span className="text-[10px] text-amber-400/80">Invite</span>
            </button>
          </div>

          {/* Native Share Sheet (If supported on device) */}
          {canNativeShare && (
            <button
              id="share-platform-native"
              onClick={handleNativeShare}
              className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>More Options (Device Share Sheet)</span>
            </button>
          )}

          {/* Copy Direct Link Section */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>Public Share Link</span>
              {copied && (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3 stroke-[2.5]" /> Copied to clipboard!
                </span>
              )}
            </label>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-800 focus-within:border-amber-500 transition-colors">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={data.url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-2.5 py-1 text-xs bg-transparent text-stone-200 font-mono focus:outline-none select-all truncate"
              />
              <button
                id="share-copy-link-btn"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
                    : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Toggle Section */}
          <div className="pt-1">
            <button
              id="share-toggle-qr-btn"
              onClick={() => setShowQr(!showQr)}
              className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 font-medium transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>{showQr ? "Hide QR Code" : "Show QR Code for Mobile Scanning"}</span>
            </button>

            {showQr && qrDataUrl && (
              <div className="mt-3 p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col items-center justify-center animate-in fade-in duration-150">
                <div className="p-2 bg-white rounded-xl shadow-lg">
                  <img
                    src={qrDataUrl}
                    alt="Public Profile QR Code"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-2.5 text-center">
                  Scan with any smartphone camera to open this public profile instantly
                </p>
                <a
                  href={qrDataUrl}
                  download={`auraspace_${data.username || "profile"}_qr.png`}
                  className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download QR Code</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
