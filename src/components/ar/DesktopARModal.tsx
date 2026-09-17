import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, X, Copy, Check, ShieldAlert, Sparkles } from "lucide-react";
import { useStore } from "../../store/useStore";

export const DesktopARModal: React.FC = () => {
  const { isARFallbackOpen, setIsARFallbackOpen } = useStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isARFallbackOpen && typeof window !== "undefined") {
      const url = window.location.href;
      QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        color: {
          dark: "#18181B",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [isARFallbackOpen]);

  if (!isARFallbackOpen) return null;

  const handleCopyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="desktop-ar-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="desktop-ar-modal-card"
        className="relative w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 text-stone-100"
      >
        {/* Close Button */}
        <button
          id="close-ar-modal-btn"
          onClick={() => setIsARFallbackOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100 text-base">
              Mobile Device Required for AR
            </h3>
            <p className="text-xs text-stone-400">
              Desktop & Windows environments cannot access spatial tracking
            </p>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="mb-5 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50 text-xs text-stone-300 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Augmented Reality projects 3D furniture into physical space using
            camera sensors and LiDAR/ARCore. To experience AR, scan the QR code below
            on your iPhone, iPad, or Android phone.
          </span>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl mb-5 shadow-inner">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Scan QR code for mobile AR"
              className="w-48 h-48 block rounded"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-stone-500 text-xs font-mono">
              Generating QR Code...
            </div>
          )}
          <span className="text-[11px] text-stone-600 font-medium mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Scan with your mobile camera to open AuraSpace
          </span>
        </div>

        {/* Copy Link Button */}
        <div className="flex items-center gap-2">
          <button
            id="copy-mobile-link-btn"
            onClick={handleCopyUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-medium text-stone-200 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy App URL for Mobile</span>
              </>
            )}
          </button>
          <button
            id="ar-modal-dismiss-btn"
            onClick={() => setIsARFallbackOpen(false)}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
