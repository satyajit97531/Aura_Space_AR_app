import { ARDeviceInfo } from "../../types";

export function detectARDevice(): ARDeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      supportsWebXR: false,
      hasCamera: false,
      isLowEnd: false,
      recommendedMode: "unsupported",
    };
  }

  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 1024;

  const isMobile = (isMobileUA || (hasTouch && isSmallScreen)) && !/Windows NT/i.test(ua);
  const isTablet = hasTouch && !isMobileUA && isSmallScreen;
  const isDesktop = !isMobile && !isTablet;

  // WebXR support check
  const supportsWebXR = Boolean((navigator as any).xr);

  // Hardware capability detection for low-end device detection
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4; // in GB
  const isLowEnd = hardwareConcurrency <= 4 || deviceMemory <= 3;

  const hasCamera = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  let recommendedMode: "webxr" | "camera_passthrough" | "unsupported" = "unsupported";
  if (isDesktop) {
    recommendedMode = "unsupported";
  } else if (supportsWebXR && !isLowEnd) {
    recommendedMode = "webxr";
  } else if (hasCamera) {
    recommendedMode = "camera_passthrough";
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    supportsWebXR,
    hasCamera,
    isLowEnd,
    recommendedMode,
  };
}
