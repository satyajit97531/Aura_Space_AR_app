import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "../../store/useStore";
import { createProceduralFurniture } from "../canvas/proceduralModels";
import { FURNITURE_CATALOG } from "../../data/catalog";
import {
  X,
  Camera,
  RotateCcw,
  RotateCw,
  Sparkles,
  Zap,
  Layers,
  Ruler,
  Plus,
  RefreshCw,
  Focus,
  Maximize2,
} from "lucide-react";

export const MobileARView: React.FC = () => {
  const {
    placedObjects,
    selectedObjectId,
    setSelectedObjectId,
    rotateObject,
    setARStatus,
    addObject,
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const arGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1.0);
  const [arOffset, setArOffset] = useState<{ x: number; z: number }>({ x: 0, z: -1.8 });
  const [focusSingleMode, setFocusSingleMode] = useState(false);

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  // 1. Initialize Mobile Camera Stream
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not accessible in this browser context.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn("Camera start failed:", err);
        setCameraError(
          err.message || "Device camera unavailable. Using high-definition simulated AR environment."
        );
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 2. Initialize Three.js WebGL Scene (runs once)
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Perspective Camera matching standard mobile phone FOV
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.05, 100);
    camera.position.set(0, 1.2, 0); // Eye-level holding phone slightly elevated
    camera.lookAt(0, 0.35, -1.8);
    cameraRef.current = camera;

    // Transparent WebGL renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Multi-Directional Lighting for vibrant realistic shading
    const sunLight = new THREE.DirectionalLight("#FFF8EE", 2.2);
    sunLight.position.set(3, 5, 2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight("#DDE8FF", 1.2);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333333, 1.4);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight("#FFFFFF", 0.9);
    scene.add(ambientLight);

    // Root Group for all AR Furniture Objects
    const arGroup = new THREE.Group();
    arGroup.position.set(arOffset.x, 0, arOffset.z);
    scene.add(arGroup);
    arGroupRef.current = arGroup;

    // Continuous Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // 3. Synchronize Furniture Meshes inside arGroup with Centering Guarantee
  useEffect(() => {
    const arGroup = arGroupRef.current;
    if (!arGroup) return;

    // Clear existing children
    while (arGroup.children.length > 0) {
      const child = arGroup.children[0];
      arGroup.remove(child);
    }

    if (placedObjects.length === 0) return;

    // Determine center anchor
    const selectedItem = placedObjects.find((o) => o.id === selectedObjectId);
    let anchorX = 0;
    let anchorZ = 0;

    if (selectedItem) {
      anchorX = selectedItem.position[0];
      anchorZ = selectedItem.position[2];
    } else {
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      placedObjects.forEach((o) => {
        minX = Math.min(minX, o.position[0]);
        maxX = Math.max(maxX, o.position[0]);
        minZ = Math.min(minZ, o.position[2]);
        maxZ = Math.max(maxZ, o.position[2]);
      });
      anchorX = (minX + maxX) / 2;
      anchorZ = (minZ + maxZ) / 2;
    }

    // Filter objects if single object focus mode is toggled
    const objectsToRender =
      focusSingleMode && selectedItem ? [selectedItem] : placedObjects;

    objectsToRender.forEach((item) => {
      const furnitureGroup = createProceduralFurniture(item);

      // Re-position relative to anchor so target is centered directly in front of camera
      furnitureGroup.position.set(
        item.position[0] - anchorX,
        item.position[1],
        item.position[2] - anchorZ
      );

      // Add realistic contact shadow disk beneath furniture
      const shadowR = Math.max(item.dimensions.width, item.dimensions.depth) * 0.55;
      const shadowGeo = new THREE.CircleGeometry(shadowR, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(
        item.position[0] - anchorX,
        0.002,
        item.position[2] - anchorZ
      );
      arGroup.add(shadowMesh);

      arGroup.add(furnitureGroup);
    });
  }, [placedObjects, selectedObjectId, focusSingleMode]);

  // 4. Synchronize Position & Scale Updates
  useEffect(() => {
    if (arGroupRef.current) {
      arGroupRef.current.position.set(arOffset.x, 0, arOffset.z);
      arGroupRef.current.scale.set(arScale, arScale, arScale);
    }
  }, [arOffset, arScale]);

  // Touch Handlers for Dragging and Pinch-to-Zoom in AR
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: 0,
        y: 0,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 1-Finger Drag: move furniture in room space
      const deltaX = (e.touches[0].clientX - touchStartRef.current.x) * 0.004;
      const deltaZ = (e.touches[0].clientY - touchStartRef.current.y) * 0.004;
      setArOffset((prev) => ({
        x: prev.x + deltaX,
        z: Math.max(-5, Math.min(-0.6, prev.z + deltaZ)),
      }));
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      // 2-Finger Pinch: scale furniture
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = newDist / touchStartRef.current.dist;
      setArScale((prev) => Math.max(0.3, Math.min(2.5, prev * ratio)));
      touchStartRef.current.dist = newDist;
    }
  };

  const handleExitAR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setARStatus("idle");
  };

  const handleResetPlacement = () => {
    setArOffset({ x: 0, z: -1.8 });
    setArScale(1.0);
  };

  const handleAddSampleFurniture = () => {
    const sample = FURNITURE_CATALOG[0];
    if (sample) {
      addObject(sample, [0, 0, 0]);
    }
  };

  const selectedItem = placedObjects.find((o) => o.id === selectedObjectId);

  return (
    <div
      id="mobile-ar-container"
      className="fixed inset-0 z-50 bg-stone-950 overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Live Camera Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Transparent Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Top Header Bar */}
      <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-md border border-stone-700/80 text-stone-200 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-stone-100">Mobile AR Space</span>
          <span className="text-stone-500">•</span>
          <span className="text-amber-300 font-mono text-[11px]">
            {Math.round(arScale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Recenter Button */}
          <button
            onClick={handleResetPlacement}
            className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 backdrop-blur-md shadow-lg transition-colors"
            title="Recenter Furniture in Front of Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Exit AR */}
          <button
            id="exit-mobile-ar-btn"
            onClick={handleExitAR}
            className="p-2.5 rounded-full bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/80 backdrop-blur-md shadow-lg transition-colors"
            title="Exit AR Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Fallback Banner if permissions blocked */}
      {cameraError && (
        <div className="absolute top-16 inset-x-4 z-25 p-3.5 bg-stone-900/90 border border-amber-500/40 text-stone-200 rounded-2xl text-xs backdrop-blur-md shadow-xl flex items-start gap-2.5">
          <Camera className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 text-xs">Simulated Passthrough</p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Live camera preview permission is optional. 3D furniture is centered in your viewport with full drag, scale, and rotate controls.
            </p>
          </div>
        </div>
      )}

      {/* Touch Interaction Instructions Pill */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-stone-900/80 backdrop-blur-md border border-stone-700/80 text-stone-300 text-[11px] px-3.5 py-1 rounded-full text-center whitespace-nowrap shadow-md">
        1-Finger Drag to Move • 2-Finger Pinch to Scale
      </div>

      {/* Empty State Prompt: When room has no furniture placed yet */}
      {placedObjects.length === 0 && (
        <div className="absolute inset-x-6 top-1/3 z-30 p-5 bg-stone-900/95 backdrop-blur-xl border border-amber-500/50 rounded-3xl text-center shadow-2xl pointer-events-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-stone-100 text-sm">
            No Furniture in AR Canvas
          </h3>
          <p className="text-xs text-stone-400 mt-1 mb-4">
            Place a sample piece of furniture to visualize real-time scale, textures, and spatial fit in your room.
          </p>
          <button
            onClick={handleAddSampleFurniture}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Place Modern Armchair in AR</span>
          </button>
        </div>
      )}

      {/* Bottom AR Control Dock */}
      {placedObjects.length > 0 && (
        <div className="absolute bottom-6 inset-x-4 z-30 flex flex-col gap-2.5 pointer-events-auto">
          {/* Furniture Selector & Mode Switch */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar flex-1">
              {placedObjects.map((obj) => {
                const isSelected = selectedObjectId === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all backdrop-blur-md border shadow-md ${
                      isSelected
                        ? "bg-amber-500 border-amber-400 text-stone-950 scale-105"
                        : "bg-stone-900/85 border-stone-700/80 text-stone-300 hover:text-white"
                    }`}
                  >
                    {obj.name}
                  </button>
                );
              })}
            </div>

            {/* Toggle Single Focus vs Full Layout */}
            <button
              onClick={() => setFocusSingleMode(!focusSingleMode)}
              className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
                focusSingleMode
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-stone-900/85 border-stone-700/80 text-stone-400"
              }`}
              title={focusSingleMode ? "Viewing Single Object" : "Viewing All Placed Items"}
            >
              <Focus className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Item Inspector & Rotation Bar */}
          {selectedItem && (
            <div className="flex items-center justify-between bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-2xl p-3 shadow-2xl text-stone-200">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-xs text-stone-100 truncate">
                  {selectedItem.name}
                </p>
                <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                  {selectedItem.dimensions.width.toFixed(2)}m W ×{" "}
                  {selectedItem.dimensions.depth.toFixed(2)}m D ×{" "}
                  {selectedItem.dimensions.height.toFixed(2)}m H
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => rotateObject(selectedItem.id, -Math.PI / 4)}
                  className="p-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 text-xs flex items-center gap-1 transition-colors"
                  title="Rotate -45°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => rotateObject(selectedItem.id, Math.PI / 4)}
                  className="p-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 text-xs flex items-center gap-1 transition-colors"
                  title="Rotate +45°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
