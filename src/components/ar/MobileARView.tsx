import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useStore } from "../../store/useStore";
import { createProceduralFurniture } from "../canvas/proceduralModels";
import { FURNITURE_CATALOG } from "../../data/catalog";
import { FurnitureItemDef, CatalogCategory } from "../../types";
import { formatDistance } from "../../utils/units";
import {
  X,
  Camera,
  RotateCcw,
  RotateCw,
  Sparkles,
  Zap,
  Layers,
  Plus,
  RefreshCw,
  Focus,
  Move,
  Compass,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
  Check,
  Armchair,
  Coffee,
  BedDouble,
  Lamp,
  Flower2,
  Box,
  Sliders,
} from "lucide-react";

export const MobileARView: React.FC = () => {
  const {
    placedObjects,
    selectedObjectId,
    setSelectedObjectId,
    updateObject,
    rotateObject,
    setObjectRotation,
    duplicateObject,
    removeObject,
    setARStatus,
    addObject,
    measurementUnit,
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const arGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Anchor to maintain room coordinate stability while furniture moves
  const anchorRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const hasInitializedAnchorRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1.0);
  const [arOffset, setArOffset] = useState<{ x: number; z: number }>({ x: 0, z: -1.8 });
  const [focusSingleMode, setFocusSingleMode] = useState(false);

  // Interaction Mode: "move" (drag selected furniture), "rotate" (360° spin), "calibrate" (pan scene & pinch zoom)
  const [interactionMode, setInteractionMode] = useState<"move" | "rotate" | "calibrate">("move");
  const [showDpad, setShowDpad] = useState(false);
  const [showCatalogSheet, setShowCatalogSheet] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<CatalogCategory | "all">("all");

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const dragPlaneOffsetRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const isDraggingObjectRef = useRef(false);

  const selectedItem = placedObjects.find((o) => o.id === selectedObjectId);

  // Current rotation in degrees (0 - 359)
  const currentRotationDeg = selectedItem
    ? Math.round((((selectedItem.rotation[1] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI))
    : 0;

  // Initialize room anchor once from current objects
  useEffect(() => {
    if (!hasInitializedAnchorRef.current && placedObjects.length > 0) {
      if (selectedObjectId) {
        const item = placedObjects.find((o) => o.id === selectedObjectId);
        if (item) {
          anchorRef.current = { x: item.position[0], z: item.position[2] };
          hasInitializedAnchorRef.current = true;
          return;
        }
      }
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      placedObjects.forEach((o) => {
        minX = Math.min(minX, o.position[0]);
        maxX = Math.max(maxX, o.position[0]);
        minZ = Math.min(minZ, o.position[2]);
        maxZ = Math.max(maxZ, o.position[2]);
      });
      anchorRef.current = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
      hasInitializedAnchorRef.current = true;
    }
  }, [placedObjects, selectedObjectId]);

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
          err.message || "Device camera unavailable. Using simulated AR environment."
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
    camera.position.set(0, 1.25, 0); // Eye-level holding phone slightly elevated
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

  // 3. Synchronize Furniture Meshes & Selection Gizmos in AR
  useEffect(() => {
    const arGroup = arGroupRef.current;
    if (!arGroup) return;

    // Clear existing children
    while (arGroup.children.length > 0) {
      const child = arGroup.children[0];
      arGroup.remove(child);
    }

    if (placedObjects.length === 0) return;

    const anchorX = anchorRef.current.x;
    const anchorZ = anchorRef.current.z;

    // Filter objects if single object focus mode is toggled
    const objectsToRender =
      focusSingleMode && selectedItem ? [selectedItem] : placedObjects;

    objectsToRender.forEach((item) => {
      const isSelected = item.id === selectedObjectId;
      const furnitureGroup = createProceduralFurniture(item);

      // Re-position relative to stable anchor
      const posX = item.position[0] - anchorX;
      const posY = item.position[1];
      const posZ = item.position[2] - anchorZ;
      furnitureGroup.position.set(posX, posY, posZ);

      // Contact shadow disk beneath furniture
      const shadowR = Math.max(item.dimensions.width, item.dimensions.depth) * 0.55;
      const shadowGeo = new THREE.CircleGeometry(shadowR, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xd97706 : 0x0a0a0a,
        transparent: true,
        opacity: isSelected ? 0.6 : 0.35,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(posX, 0.002, posZ);
      arGroup.add(shadowMesh);

      // If Selected: Render interactive ground rotation ring & heading arrow gizmo
      if (isSelected) {
        const gizmoR = Math.max(item.dimensions.width, item.dimensions.depth) * 0.72;
        const ringGeo = new THREE.RingGeometry(gizmoR * 0.94, gizmoR * 1.04, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(posX, 0.005, posZ);
        arGroup.add(ringMesh);

        // Heading arrow cone pointing in direction of furniture rotation
        const coneGeo = new THREE.ConeGeometry(0.08, 0.18, 16);
        const coneMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const coneMesh = new THREE.Mesh(coneGeo, coneMat);
        coneMesh.rotation.x = Math.PI / 2;
        coneMesh.position.set(
          posX + Math.sin(item.rotation[1]) * (gizmoR + 0.12),
          0.04,
          posZ + Math.cos(item.rotation[1]) * (gizmoR + 0.12)
        );
        arGroup.add(coneMesh);
      }

      arGroup.add(furnitureGroup);
    });
  }, [placedObjects, selectedObjectId, focusSingleMode, selectedItem]);

  // 4. Synchronize Position & Scale Updates
  useEffect(() => {
    if (arGroupRef.current) {
      arGroupRef.current.position.set(arOffset.x, 0, arOffset.z);
      arGroupRef.current.scale.set(arScale, arScale, arScale);
    }
  }, [arOffset, arScale]);

  // Raycaster helper to find furniture or floor plane from screen point
  const raycastScreenPoint = useCallback((clientX: number, clientY: number) => {
    if (!cameraRef.current || !arGroupRef.current) return null;
    const normX = (clientX / window.innerWidth) * 2 - 1;
    const normY = -(clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(normX, normY), cameraRef.current);

    // 1. Check if clicked on any furniture piece
    const hits = raycaster.intersectObjects(arGroupRef.current.children, true);
    for (const hit of hits) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== arGroupRef.current) {
        if (curr.userData?.id) {
          return { type: "furniture", id: curr.userData.id, point: hit.point };
        }
        curr = curr.parent;
      }
    }

    // 2. Otherwise intersect horizontal floor plane at y = 0
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorHit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, floorHit)) {
      return { type: "floor", id: null, point: floorHit };
    }

    return null;
  }, []);

  // Convert a 3D floor hit point back to room space coordinates
  const floorPointToRoomCoords = useCallback((floorPoint: THREE.Vector3) => {
    const localX = (floorPoint.x - arOffset.x) / arScale;
    const localZ = (floorPoint.z - arOffset.z) / arScale;
    return {
      x: Number((localX + anchorRef.current.x).toFixed(2)),
      z: Number((localZ + anchorRef.current.z).toFixed(2)),
    };
  }, [arOffset, arScale]);

  // Touch Handlers for Dragging Furniture, Rotating, or Calibrating
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      touchStartRef.current = { x: clientX, y: clientY };

      const hit = raycastScreenPoint(clientX, clientY);
      if (hit && hit.type === "furniture" && hit.id) {
        setSelectedObjectId(hit.id);
        isDraggingObjectRef.current = true;
        if (selectedItem) {
          const roomPos = floorPointToRoomCoords(hit.point);
          dragPlaneOffsetRef.current = {
            x: roomPos.x - selectedItem.position[0],
            z: roomPos.z - selectedItem.position[2],
          };
        }
      } else if (interactionMode === "move" && selectedItem && hit && hit.type === "floor") {
        isDraggingObjectRef.current = true;
        const roomPos = floorPointToRoomCoords(hit.point);
        dragPlaneOffsetRef.current = {
          x: roomPos.x - selectedItem.position[0],
          z: roomPos.z - selectedItem.position[2],
        };
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: 0,
        y: 0,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
      isDraggingObjectRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      if (interactionMode === "move" && selectedItem && isDraggingObjectRef.current) {
        // Move selected furniture across the floor plane in real room coordinates!
        const hit = raycastScreenPoint(clientX, clientY);
        if (hit && hit.point) {
          const roomPos = floorPointToRoomCoords(hit.point);
          const targetX = Number((roomPos.x - dragPlaneOffsetRef.current.x).toFixed(2));
          const targetZ = Number((roomPos.z - dragPlaneOffsetRef.current.z).toFixed(2));
          updateObject(selectedItem.id, {
            position: [targetX, selectedItem.position[1], targetZ],
          });
        }
      } else if (interactionMode === "rotate" && selectedItem) {
        // Horizontal swipe rotates furniture smoothly 360°
        const deltaX = clientX - touchStartRef.current.x;
        const angleChange = (deltaX * 0.015);
        const newAngle = selectedItem.rotation[1] + angleChange;
        setObjectRotation(selectedItem.id, newAngle);
        touchStartRef.current.x = clientX;
      } else {
        // Calibrate / Pan AR scene view
        const deltaX = (clientX - touchStartRef.current.x) * 0.004;
        const deltaZ = (clientY - touchStartRef.current.y) * 0.004;
        setArOffset((prev) => ({
          x: prev.x + deltaX,
          z: Math.max(-6, Math.min(-0.5, prev.z + deltaZ)),
        }));
        touchStartRef.current = { x: clientX, y: clientY };
      }
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      // 2-Finger Pinch: scale AR scene
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = newDist / touchStartRef.current.dist;
      setArScale((prev) => Math.max(0.3, Math.min(2.5, prev * ratio)));
      touchStartRef.current.dist = newDist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingObjectRef.current = false;
  };

  // Directional Nudge (0.1m step)
  const handleNudge = (axis: "x" | "z", delta: number) => {
    if (!selectedItem) return;
    const newPos = [...selectedItem.position] as [number, number, number];
    if (axis === "x") newPos[0] = Number((newPos[0] + delta).toFixed(2));
    if (axis === "z") newPos[2] = Number((newPos[2] + delta).toFixed(2));
    updateObject(selectedItem.id, { position: newPos });
  };

  // Rotation slider change (0° - 359°)
  const handleRotationSlider = (deg: number) => {
    if (!selectedItem) return;
    const rad = (deg * Math.PI) / 180;
    setObjectRotation(selectedItem.id, rad);
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
    if (selectedItem) {
      // Bring selected item directly to center
      updateObject(selectedItem.id, {
        position: [anchorRef.current.x, selectedItem.position[1], anchorRef.current.z],
      });
    }
  };

  const handleAddSampleFurniture = () => {
    const sample = FURNITURE_CATALOG[0];
    if (sample) {
      addObject(sample, [anchorRef.current.x, 0, anchorRef.current.z]);
    }
  };

  const handleQuickAddFromCatalog = (item: FurnitureItemDef) => {
    const newObj = addObject(item, [anchorRef.current.x, 0, anchorRef.current.z]);
    setSelectedObjectId(newObj.id);
    setShowCatalogSheet(false);
  };

  const categories: Array<{ id: CatalogCategory | "all"; label: string; icon: any }> = [
    { id: "all", label: "All", icon: Layers },
    { id: "seating", label: "Seating", icon: Armchair },
    { id: "tables", label: "Tables", icon: Coffee },
    { id: "beds", label: "Beds", icon: BedDouble },
    { id: "storage", label: "Storage", icon: Box },
    { id: "lighting", label: "Lighting", icon: Lamp },
    { id: "plants", label: "Botanical", icon: Flower2 },
  ];

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    const matchesCat = catalogCategory === "all" || item.category === catalogCategory;
    const matchesSearch =
      !catalogSearch.trim() ||
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      id="mobile-ar-container"
      className="fixed inset-0 z-50 bg-stone-950 overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
      <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 text-stone-200 px-3 py-1.5 rounded-full text-xs font-medium shadow-xl">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-stone-100">AR Space</span>
          <span className="text-stone-500">•</span>
          <span className="text-amber-300 font-mono text-[11px]">
            {Math.round(arScale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Add Furniture Button */}
          <button
            id="ar-add-furniture-btn"
            onClick={() => setShowCatalogSheet(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1 transition-transform active:scale-95"
            title="Add Furniture Model into AR"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Furniture</span>
          </button>

          {/* Recenter Button */}
          <button
            onClick={handleResetPlacement}
            className="p-2 rounded-full bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/80 backdrop-blur-md shadow-lg transition-colors"
            title="Recenter Furniture"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Exit AR */}
          <button
            id="exit-mobile-ar-btn"
            onClick={handleExitAR}
            className="p-2 sm:p-2.5 rounded-full bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/80 backdrop-blur-md shadow-lg transition-colors"
            title="Exit AR Mode"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mode Bar & Gesture Hint */}
      <div className="absolute top-14 sm:top-16 inset-x-3 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-auto">
        {/* Interaction Mode Pill Switcher */}
        <div className="flex items-center bg-stone-900/90 backdrop-blur-md border border-stone-700/80 p-1 rounded-full text-xs shadow-xl">
          <button
            onClick={() => setInteractionMode("move")}
            className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
              interactionMode === "move"
                ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          <button
            onClick={() => setInteractionMode("rotate")}
            className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
              interactionMode === "rotate"
                ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>

          <button
            onClick={() => setInteractionMode("calibrate")}
            className={`px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
              interactionMode === "calibrate"
                ? "bg-amber-500 text-stone-950 font-semibold shadow-sm"
                : "text-stone-300 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calibrate</span>
          </button>
        </div>

        {/* Dynamic Context Tooltip */}
        <div className="hidden sm:flex bg-stone-900/80 backdrop-blur-md border border-stone-700/80 text-stone-300 text-[11px] px-3 py-1 rounded-full shadow-md">
          {interactionMode === "move"
            ? "Tap furniture or drag on floor to move"
            : interactionMode === "rotate"
            ? "Swipe horizontally or use slider to rotate 360°"
            : "1-finger pan scene • 2-finger pinch scale"}
        </div>
      </div>

      {/* Camera Fallback Banner if permissions blocked */}
      {cameraError && (
        <div className="absolute top-28 inset-x-4 z-25 p-3 bg-stone-900/90 border border-amber-500/40 text-stone-200 rounded-2xl text-xs backdrop-blur-md shadow-xl flex items-start gap-2.5 pointer-events-auto">
          <Camera className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-amber-300 text-xs">Simulated Passthrough</p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Live camera preview permission optional. Furniture is interactive with full move, 360° rotate, and precision controls.
            </p>
          </div>
        </div>
      )}

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

      {/* Floating Precision D-Pad (Nudge Controls) */}
      {selectedItem && showDpad && (
        <div className="absolute right-4 bottom-48 z-30 bg-stone-900/95 backdrop-blur-xl border border-amber-500/40 p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1">0.1m Nudge</p>
          <button
            onClick={() => handleNudge("z", -0.1)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 transition-colors"
            title="Nudge Forward (0.1m)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNudge("x", -0.1)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 transition-colors"
              title="Nudge Left (0.1m)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <button
              onClick={() => handleNudge("x", 0.1)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 transition-colors"
              title="Nudge Right (0.1m)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleNudge("z", 0.1)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 transition-colors"
            title="Nudge Backward (0.1m)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom AR Control Dock */}
      {placedObjects.length > 0 && (
        <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 z-30 flex flex-col gap-2 pointer-events-auto">
          {/* Furniture Selector Pill Carousel */}
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
                        ? "bg-amber-500 border-amber-400 text-stone-950 scale-105 font-bold"
                        : "bg-stone-900/85 border-stone-700/80 text-stone-300 hover:text-white"
                    }`}
                  >
                    {obj.name}
                  </button>
                );
              })}
            </div>

            {/* Toggle Single Focus vs Full Room */}
            <button
              onClick={() => setFocusSingleMode(!focusSingleMode)}
              className={`p-2 rounded-full backdrop-blur-md border transition-colors shrink-0 shadow-md ${
                focusSingleMode
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-stone-900/85 border-stone-700/80 text-stone-400"
              }`}
              title={focusSingleMode ? "Viewing Single Object" : "Viewing All Placed Items"}
            >
              <Focus className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Item Movement & 360° Rotation Inspector */}
          {selectedItem && (
            <div className="flex flex-col bg-stone-900/95 backdrop-blur-xl border border-stone-700/80 rounded-2xl p-3 shadow-2xl text-stone-200 gap-2.5 animate-in fade-in slide-in-from-bottom-2">
              {/* Row 1: Furniture Info, Dimensions & Quick Actions (Duplicate, Delete, Nudge) */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs text-white truncate">
                      {selectedItem.name}
                    </p>
                    <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                      {currentRotationDeg}°
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                    {formatDistance(selectedItem.dimensions.width, measurementUnit)} W ×{" "}
                    {formatDistance(selectedItem.dimensions.depth, measurementUnit)} D
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle Nudge D-Pad */}
                  <button
                    onClick={() => setShowDpad(!showDpad)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      showDpad
                        ? "bg-amber-500 border-amber-400 text-stone-950 font-bold"
                        : "bg-stone-800 border-stone-700 text-stone-300 hover:text-white"
                    }`}
                    title="Toggle Precision D-Pad Nudge"
                  >
                    <Move className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => duplicateObject(selectedItem.id)}
                    className="p-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors"
                    title="Duplicate Furniture"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeObject(selectedItem.id)}
                    className="p-1.5 rounded-lg bg-stone-800 border border-stone-700 text-red-400 hover:bg-red-950/50 transition-colors"
                    title="Remove Furniture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: 360-Degree Rotation Slider & Step Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
                <button
                  onClick={() => rotateObject(selectedItem.id, -Math.PI / 4)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition-colors shrink-0"
                  title="Rotate -45°"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px]">-45°</span>
                </button>

                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <Compass className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={currentRotationDeg}
                    onChange={(e) => handleRotationSlider(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    title="Rotate 360 Degrees"
                  />
                </div>

                <button
                  onClick={() => rotateObject(selectedItem.id, Math.PI / 4)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition-colors shrink-0"
                  title="Rotate +45°"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px]">+45°</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AR Quick-Add Furniture Sheet Modal */}
      {showCatalogSheet && (
        <div
          id="ar-catalog-sheet-backdrop"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowCatalogSheet(false)}
        >
          <div
            id="ar-catalog-sheet"
            className="w-full max-h-[75vh] bg-stone-900 border-t border-stone-800 rounded-t-3xl shadow-2xl p-4 flex flex-col text-stone-100 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Armchair className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Add 3D Furniture to AR</h3>
              </div>
              <button
                onClick={() => setShowCatalogSheet(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-2.5 relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full bg-stone-800/90 border border-stone-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCatalogCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition-colors ${
                      catalogCategory === cat.id
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "bg-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Models Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 pr-1">
              {filteredCatalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleQuickAddFromCatalog(item)}
                  className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700/70 hover:border-amber-500/50 text-left transition-all flex flex-col justify-between group active:scale-95"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400/80 block">
                      {item.category}
                    </span>
                    <p className="text-xs font-semibold text-stone-200 group-hover:text-white line-clamp-1 mt-0.5">
                      {item.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-700/50 text-[10px] text-stone-400 font-mono">
                    <span>
                      {formatDistance(item.defaultDimensions.width, measurementUnit)} W
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors font-sans font-semibold">
                      + Place
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
