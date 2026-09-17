import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useStore } from "../../store/useStore";
import { createProceduralFurniture } from "./proceduralModels";
import { FurnitureItemDef } from "../../types";
import { Compass, Lock, Copy } from "lucide-react";

export const EditorCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    roomWidth,
    roomLength,
    roomHeight,
    wallVisibility,
    cutawayMode,
    activePalette,
    placedObjects,
    selectedObjectId,
    setSelectedObjectId,
    selectedCatalogItem,
    setSelectedCatalogItem,
    addObject,
    updateObject,
    setObjectRotation,
    isDraggingObject,
    setIsDraggingObject,
    activeViewMode,
    snapToGrid,
    gridSize,
    showDimensions,
    showShadows,
    fetchSavedProjects,
    isReadOnlyProject,
    forkProject,
  } = useStore();

  const [readOnlyWarning, setReadOnlyWarning] = useState<string | null>(null);

  // Internal Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const centerCrosshairRef = useRef<THREE.Group | null>(null);
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);
  const rotationGizmoGroupRef = useRef<THREE.Group | null>(null);

  const [isHoveringObject, setIsHoveringObject] = useState(false);
  const [isHoveringRotation, setIsHoveringRotation] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [liveRotationDeg, setLiveRotationDeg] = useState(0);

  // Interactive dragging states
  const isPointerDownRef = useRef(false);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const activeDragIdRef = useRef<string | null>(null);
  const hasDraggedRef = useRef(false);
  const clickedEmptySpaceRef = useRef(false);
  const dragElevationRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isCameraOrbitingRef = useRef(false);

  // 360 Rotation Mouse Interactive states
  const isRotatingRef = useRef(false);
  const activeRotateIdRef = useRef<string | null>(null);

  // 1. Initial Rehydration of Projects
  useEffect(() => {
    fetchSavedProjects();
  }, [fetchSavedProjects]);

    // 2. Setup Three.js Scene, Camera, Renderer & Lights
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#18181B"); // Architectural deep slate studio
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, roomHeight * 2.8, roomLength * 1.8);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // WebGL Renderer - Set pixel ratio FIRST, then size with updateStyle=false so CSS handles display dimensions
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // Ensure canvas element's inline CSS is locked to 100% so it fluidly spans the container without black borders
    if (canvasRef.current) {
      canvasRef.current.style.width = "100%";
      canvasRef.current.style.height = "100%";
    }

    // OrbitControls with constrained tilt to prevent going under the floor
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 28.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above floor level
    controls.minPolarAngle = 0.05;
    controls.target.set(0, 0.5, 0);
    controls.addEventListener("start", () => {
      // Don't mark as dragged on initial pointer down alone
    });
    controls.addEventListener("change", () => {
      hasDraggedRef.current = true;
      isCameraOrbitingRef.current = true;
    });
    controls.addEventListener("end", () => {
      isCameraOrbitingRef.current = false;
    });
    controlsRef.current = controls;

    // Lighting setup for warm, architectural interior visualization
    const hemiLight = new THREE.HemisphereLight("#FFFFFF", "#2D2D30", 0.65);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight("#FFF8E7", 1.25);
    dirLight.position.set(roomWidth * 0.8, roomHeight * 2.2, roomLength * 0.9);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    const shadowBound = Math.max(roomWidth, roomLength) * 1.2;
    dirLight.shadow.camera.left = -shadowBound;
    dirLight.shadow.camera.right = shadowBound;
    dirLight.shadow.camera.top = shadowBound;
    dirLight.shadow.camera.bottom = -shadowBound;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight("#4A4642", 0.7);
    scene.add(ambientLight);

    // Groups
    const wallsGroup = new THREE.Group();
    wallsGroup.name = "walls_group";
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    const furnitureGroup = new THREE.Group();
    furnitureGroup.name = "furniture_group";
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    // 360-degree Ground Rotation Axis Gizmo Group
    const rotationGizmoGroup = new THREE.Group();
    rotationGizmoGroup.name = "rotation_gizmo_group";
    scene.add(rotationGizmoGroup);
    rotationGizmoGroupRef.current = rotationGizmoGroup;

    // Selection helper
    const selectionHelper = new THREE.BoxHelper(new THREE.Mesh(), new THREE.Color("#F59E0B"));
    selectionHelper.visible = false;
    scene.add(selectionHelper);
    selectionBoxRef.current = selectionHelper;

    // Unified canvas buffer synchronizer - guarantees 1:1 crispness & full-bleed coverage
    const syncCanvasSize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current || !canvasRef.current) return;
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      if (cWidth <= 0 || cHeight <= 0) return;

      const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rendererRef.current.getPixelRatio() !== currentDpr) {
        rendererRef.current.setPixelRatio(currentDpr);
      }

      const targetW = Math.floor(cWidth * currentDpr);
      const targetH = Math.floor(cHeight * currentDpr);

      if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
        rendererRef.current.setSize(cWidth, cHeight, false);
        if (cameraRef.current instanceof THREE.PerspectiveCamera) {
          cameraRef.current.aspect = cWidth / cHeight;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });
    resizeObserver.observe(containerRef.current);

    // Window events
    const handleWindowResize = () => syncCanvasSize();
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("fullscreenchange", handleWindowResize);
    window.addEventListener("transitionend", handleWindowResize);

    // Animation Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Continuously sync display dimensions during active CSS sidebar slide transitions
      syncCanvasSize();

      controls.update();

      // Update Selection Box bounding volume
      if (selectedObjectId && furnitureGroupRef.current) {
        const selectedMeshGroup = furnitureGroupRef.current.getObjectByName(`furniture_${selectedObjectId}`);
        if (selectedMeshGroup && selectionBoxRef.current) {
          selectionBoxRef.current.setFromObject(selectedMeshGroup);
          selectionBoxRef.current.visible = true;
        }
      } else {
        if (selectionBoxRef.current) {
          selectionBoxRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("fullscreenchange", handleWindowResize);
      window.removeEventListener("transitionend", handleWindowResize);
      renderer.dispose();
    };
  }, []);

  // 3. Camera View Mode Toggles (Perspective, Isometric, 2D Blueprint)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    if (activeViewMode === "2d_blueprint") {
      // Top-down Orthogonal view
      camera.position.set(0, Math.max(roomWidth, roomLength) * 2.2, 0);
      controls.target.set(0, 0, 0);
      controls.maxPolarAngle = 0.01; // Lock to pure top-down
      controls.minPolarAngle = 0;
      camera.lookAt(0, 0, 0);
    } else if (activeViewMode === "3d_isometric") {
      // Isometric 45-degree angle
      const dist = Math.max(roomWidth, roomLength) * 1.5;
      camera.position.set(dist, dist * 0.9, dist);
      controls.target.set(0, 0.4, 0);
      controls.maxPolarAngle = Math.PI / 3;
      controls.minPolarAngle = Math.PI / 6;
      camera.lookAt(0, 0.4, 0);
    } else {
      // Normal 3D Perspective
      camera.position.set(0, roomHeight * 2.2, roomLength * 1.6);
      controls.target.set(0, 0.5, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.minPolarAngle = 0.05;
    }
    controls.update();
  }, [activeViewMode, roomWidth, roomLength, roomHeight]);

  // 4. Update Dynamic Room Geometry (Floor plane, Procedural Walls, Grids)
  useEffect(() => {
    const scene = sceneRef.current;
    const wallsGroup = wallsGroupRef.current;
    if (!scene || !wallsGroup) return;

    // --- Clean old floor and grid ---
    if (floorMeshRef.current) {
      scene.remove(floorMeshRef.current);
      floorMeshRef.current.geometry.dispose();
      floorMeshRef.current = null;
    }
    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.dispose();
      gridHelperRef.current = null;
    }

    // --- Dynamic Floor ---
    const floorGeo = new THREE.BoxGeometry(roomWidth, 0.08, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activePalette.floorColor),
      roughness: 0.65,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.04, 0); // Top surface at y = 0
    floor.receiveShadow = true;
    floor.name = "interactive_floor";
    scene.add(floor);
    floorMeshRef.current = floor;

    // --- Dynamic Architectural Grid with Darkened Center Lines ---
    const maxDimension = Math.max(roomWidth, roomLength);
    const gridDivisions = Math.min(160, Math.max(10, Math.round(maxDimension * 2)));
    const grid = new THREE.GridHelper(
      maxDimension,
      gridDivisions,
      new THREE.Color("#18181B"), // Deep dark center line
      new THREE.Color("#71717A")  // Secondary grid lines
    );
    grid.position.set(0, 0.001, 0);
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    gridHelperRef.current = grid;

    // --- Clean up previous center crosshairs if any ---
    if (centerCrosshairRef.current) {
      scene.remove(centerCrosshairRef.current);
      centerCrosshairRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      });
      centerCrosshairRef.current = null;
    }

    // --- High-Contrast Darkened Room Center Crosshair & Origin Marker ---
    const centerGroup = new THREE.Group();
    centerGroup.name = "room_center_crosshair";

    const centerLineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#09090B"), // Solid deep dark zinc
      linewidth: 3,
      transparent: false,
      depthTest: true,
    });

    // Darkened X-axis center line across room width (at z = 0)
    const xPoints = [
      new THREE.Vector3(-roomWidth / 2, 0.0025, 0),
      new THREE.Vector3(roomWidth / 2, 0.0025, 0),
    ];
    const xGeo = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeo, centerLineMat);
    centerGroup.add(xLine);

    // Darkened Z-axis center line across room length (at x = 0)
    const zPoints = [
      new THREE.Vector3(0, 0.0025, -roomLength / 2),
      new THREE.Vector3(0, 0.0025, roomLength / 2),
    ];
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeo, centerLineMat);
    centerGroup.add(zLine);

    // Center Origin Bullseye Ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.19, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#09090B"),
      side: THREE.DoubleSide,
      depthTest: true,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0, 0.003, 0);
    centerGroup.add(ringMesh);

    // Center amber core dot
    const dotGeo = new THREE.CircleGeometry(0.065, 24);
    const dotMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#D97706"),
      side: THREE.DoubleSide,
      depthTest: true,
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.rotation.x = -Math.PI / 2;
    dotMesh.position.set(0, 0.0035, 0);
    centerGroup.add(dotMesh);

    scene.add(centerGroup);
    centerCrosshairRef.current = centerGroup;

    // Dynamically adjust camera far plane and orbit limits for rooms up to 100,000m
    if (cameraRef.current && controlsRef.current) {
      const safeFar = Math.max(1000, maxDimension * 6);
      if (cameraRef.current.far !== safeFar) {
        cameraRef.current.far = safeFar;
        cameraRef.current.updateProjectionMatrix();
      }
      controlsRef.current.maxDistance = Math.max(30, maxDimension * 4);
    }

    // --- Dynamic Procedural Walls (North, South, East, West) ---
    // Clear old walls
    while (wallsGroup.children.length > 0) {
      const child = wallsGroup.children[0] as THREE.Mesh;
      wallsGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const wallThick = 0.15;
    const wallColor = new THREE.Color(activePalette.wallColor);
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.85,
      metalness: 0.02,
    });

    const skirtingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activePalette.accentColor),
      roughness: 0.5,
    });

    // Determine wall visibility (cutaway mode auto-hides walls facing camera)
    const isNorthVis = wallVisibility.north;
    const isSouthVis = wallVisibility.south;
    const isEastVis = wallVisibility.east;
    const isWestVis = wallVisibility.west;

    // 1. North Wall (along X, at -Z)
    if (isNorthVis) {
      const nGeo = new THREE.BoxGeometry(roomWidth + wallThick * 2, roomHeight, wallThick);
      const northWall = new THREE.Mesh(nGeo, wallMat);
      northWall.position.set(0, roomHeight / 2, -roomLength / 2 - wallThick / 2);
      northWall.receiveShadow = true;
      northWall.castShadow = true;
      wallsGroup.add(northWall);

      // Baseboard
      const nSkirt = new THREE.Mesh(
        new THREE.BoxGeometry(roomWidth, 0.12, 0.03),
        skirtingMat
      );
      nSkirt.position.set(0, 0.06, -roomLength / 2 + 0.015);
      wallsGroup.add(nSkirt);
    }

    // 2. South Wall (along X, at +Z)
    if (isSouthVis) {
      const sGeo = new THREE.BoxGeometry(roomWidth + wallThick * 2, roomHeight, wallThick);
      const southWall = new THREE.Mesh(sGeo, wallMat);
      southWall.position.set(0, roomHeight / 2, roomLength / 2 + wallThick / 2);
      southWall.receiveShadow = true;
      southWall.castShadow = true;
      wallsGroup.add(southWall);

      // Baseboard
      const sSkirt = new THREE.Mesh(
        new THREE.BoxGeometry(roomWidth, 0.12, 0.03),
        skirtingMat
      );
      sSkirt.position.set(0, 0.06, roomLength / 2 - 0.015);
      wallsGroup.add(sSkirt);
    }

    // 3. West Wall (along Z, at -X)
    if (isWestVis) {
      const wGeo = new THREE.BoxGeometry(wallThick, roomHeight, roomLength);
      const westWall = new THREE.Mesh(wGeo, wallMat);
      westWall.position.set(-roomWidth / 2 - wallThick / 2, roomHeight / 2, 0);
      westWall.receiveShadow = true;
      westWall.castShadow = true;
      wallsGroup.add(westWall);

      // Baseboard
      const wSkirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.12, roomLength),
        skirtingMat
      );
      wSkirt.position.set(-roomWidth / 2 + 0.015, 0.06, 0);
      wallsGroup.add(wSkirt);
    }

    // 4. East Wall (along Z, at +X)
    if (isEastVis) {
      const eGeo = new THREE.BoxGeometry(wallThick, roomHeight, roomLength);
      const eastWall = new THREE.Mesh(eGeo, wallMat);
      eastWall.position.set(roomWidth / 2 + wallThick / 2, roomHeight / 2, 0);
      eastWall.receiveShadow = true;
      eastWall.castShadow = true;
      wallsGroup.add(eastWall);

      // Baseboard
      const eSkirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.12, roomLength),
        skirtingMat
      );
      eSkirt.position.set(roomWidth / 2 - 0.015, 0.06, 0);
      wallsGroup.add(eSkirt);
    }
  }, [roomWidth, roomLength, roomHeight, wallVisibility, cutawayMode, activePalette]);

  // 5. Update Placed Furniture in 3D Scene
  useEffect(() => {
    const furnitureGroup = furnitureGroupRef.current;
    if (!furnitureGroup) return;

    // Clear previous models
    while (furnitureGroup.children.length > 0) {
      const child = furnitureGroup.children[0];
      furnitureGroup.remove(child);
    }

    // Rebuild procedural models
    placedObjects.forEach((item) => {
      const meshGroup = createProceduralFurniture(item);
      furnitureGroup.add(meshGroup);
    });

    // Update selection helper
    if (selectedObjectId && selectionBoxRef.current) {
      const selectedMeshGroup = furnitureGroup.getObjectByName(`furniture_${selectedObjectId}`);
      if (selectedMeshGroup) {
        selectionBoxRef.current.setFromObject(selectedMeshGroup);
        selectionBoxRef.current.visible = true;
      } else {
        selectionBoxRef.current.visible = false;
      }
    }
  }, [placedObjects, selectedObjectId]);

  // 6. Build & Update 360-Degree Ground Rotation Axis Gizmo
  useEffect(() => {
    const gizmoGroup = rotationGizmoGroupRef.current;
    if (!gizmoGroup) return;

    // Clear existing gizmo meshes
    while (gizmoGroup.children.length > 0) {
      const child = gizmoGroup.children[0] as THREE.Mesh;
      gizmoGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const selectedObj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!selectedObj) {
      gizmoGroup.visible = false;
      return;
    }

    gizmoGroup.visible = true;
    gizmoGroup.position.set(selectedObj.position[0], 0.018, selectedObj.position[2]);

    const radius = Math.max(
      0.65,
      Math.max(selectedObj.dimensions.width, selectedObj.dimensions.depth) * 0.72 + 0.35
    );

    // 1. Primary Luminous Ring on Ground (Amber)
    const ringGeo = new THREE.RingGeometry(radius - 0.025, radius + 0.025, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#F59E0B"),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    gizmoGroup.add(ringMesh);

    // 2. Outer Subtle Guide Circle
    const outerRingGeo = new THREE.RingGeometry(radius + 0.05, radius + 0.06, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#78716C"),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = -Math.PI / 2;
    gizmoGroup.add(outerRingMesh);

    // 3. 360° Degree Tick Marks around the Ground Axis
    const tickMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#FBBF24") });
    const minorTickMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#A8A29E"),
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const isCardinal = i % 4 === 0;
      const tickLen = isCardinal ? 0.12 : 0.06;
      const tickWidth = isCardinal ? 0.03 : 0.015;

      const tGeo = new THREE.BoxGeometry(tickWidth, 0.005, tickLen);
      const tMesh = new THREE.Mesh(tGeo, isCardinal ? tickMat : minorTickMat);
      const dist = radius + tickLen / 2;
      tMesh.position.set(dist * Math.sin(ang), 0.002, dist * Math.cos(ang));
      tMesh.rotation.y = ang;
      gizmoGroup.add(tMesh);
    }

    // 4. Orientation Heading Pointer & Spherical Drag Handle
    const currentAngle = selectedObj.rotation[1] || 0;
    const handleGroup = new THREE.Group();
    handleGroup.name = "heading_pointer_handle";

    // Connecting spoke to handle
    const spokeGeo = new THREE.BoxGeometry(0.02, 0.005, radius);
    const spokeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#F59E0B"),
      transparent: true,
      opacity: 0.7,
    });
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(0, 0.002, radius / 2);
    handleGroup.add(spoke);

    // Glowing Sphere Handle at radius
    const handleGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#F59E0B"),
      emissive: new THREE.Color("#D97706"),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.4,
    });
    const handleSphere = new THREE.Mesh(handleGeo, handleMat);
    handleSphere.position.set(0, 0.08, radius);
    handleGroup.add(handleSphere);

    // Directional Arrow Cone pointing outward
    const coneGeo = new THREE.ConeGeometry(0.08, 0.18, 16);
    const coneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FBBF24"),
      emissive: new THREE.Color("#B45309"),
      emissiveIntensity: 0.5,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, 0.04, radius + 0.16);
    coneMesh.rotation.x = Math.PI / 2;
    handleGroup.add(coneMesh);

    // Orient heading group to object's rotation angle
    handleGroup.rotation.y = currentAngle;
    gizmoGroup.add(handleGroup);

    // 5. Broad Invisible Hit Ring for easy mouse clicking & 360° drag
    const hitRingGeo = new THREE.RingGeometry(
      Math.max(0.2, radius - 0.35),
      radius + 0.38,
      32
    );
    const hitRingMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.001,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const hitRingMesh = new THREE.Mesh(hitRingGeo, hitRingMat);
    hitRingMesh.rotation.x = -Math.PI / 2;
    hitRingMesh.userData = {
      isRotationGizmo: true,
      objectId: selectedObj.id,
    };
    gizmoGroup.add(hitRingMesh);
  }, [selectedObjectId, placedObjects]);

  // 7. Raycast helper for any horizontal plane at given elevation Y
  const getPlaneIntersection = useCallback(
    (clientX: number, clientY: number, elevation: number = 0): THREE.Vector3 | null => {
      if (!containerRef.current || !cameraRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -elevation);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) {
        return hit;
      }
      return null;
    },
    []
  );

  // Fallback helper for floor coordinates (elevation = 0)
  const getFloorIntersection = useCallback(
    (clientX: number, clientY: number): THREE.Vector3 | null => {
      return getPlaneIntersection(clientX, clientY, 0);
    },
    [getPlaneIntersection]
  );

  // 8. Raycast helper for 360-Degree Ground Rotation Gizmo
  const getRotationGizmoIntersection = useCallback(
    (clientX: number, clientY: number): { objectId: string } | null => {
      if (!containerRef.current || !cameraRef.current || !rotationGizmoGroupRef.current)
        return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const intersects = raycaster.intersectObjects(
        rotationGizmoGroupRef.current.children,
        true
      );
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr) {
          if (curr.userData?.isRotationGizmo && curr.userData.objectId) {
            return { objectId: curr.userData.objectId };
          }
          curr = curr.parent;
        }
      }
      return null;
    },
    []
  );

  // 9. Raycast helper for furniture objects
  const getFurnitureIntersection = useCallback(
    (clientX: number, clientY: number): { id: string; point: THREE.Vector3 } | null => {
      if (!containerRef.current || !cameraRef.current || !furnitureGroupRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const intersects = raycaster.intersectObjects(furnitureGroupRef.current.children, true);
      if (intersects.length > 0) {
        // Find ancestor group with userData.id
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && !curr.userData?.id && curr.parent) {
          curr = curr.parent;
        }
        if (curr && curr.userData?.id) {
          return { id: curr.userData.id, point: intersects[0].point };
        }
      }
      return null;
    },
    []
  );

  // 10. Pointer Handlers for Direct 3D Dragging & 360-Degree Ground Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click

    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    clickedEmptySpaceRef.current = false;

    // Check if clicked the 360-degree ground rotation axis gizmo
    const hitGizmo = getRotationGizmoIntersection(e.clientX, e.clientY);
    if (hitGizmo) {
      if (isReadOnlyProject) {
        setReadOnlyWarning("This community blueprint is protected (Read-Only). Click 'Copy / Remix' in the top bar to edit your own copy.");
        setTimeout(() => setReadOnlyWarning(null), 3500);
        return;
      }

      isRotatingRef.current = true;
      activeRotateIdRef.current = hitGizmo.objectId;
      setIsRotating(true);
      hasDraggedRef.current = false;

      // Disable OrbitControls during 360-degree rotation
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      // Initial angle update
      const floorPt = getPlaneIntersection(e.clientX, e.clientY, 0);
      const targetObj = placedObjects.find((o) => o.id === hitGizmo.objectId);
      if (floorPt && targetObj) {
        const dx = floorPt.x - targetObj.position[0];
        const dz = floorPt.z - targetObj.position[2];
        const angle = Math.atan2(dx, dz);
        const deg = Math.round(
          (((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI)
        );
        setLiveRotationDeg(deg);
      }
      e.stopPropagation();
      return;
    }

    // Check if clicked a furniture item to drag position (works on floor level or elevated!)
    const hitFurniture = getFurnitureIntersection(e.clientX, e.clientY);
    if (hitFurniture) {
      setSelectedObjectId(hitFurniture.id);

      if (isReadOnlyProject) {
        // Allow inspecting dimensions/details, but block dragging
        setReadOnlyWarning("Blueprint is read-only. Click 'Copy / Remix' to move furniture or make changes.");
        setTimeout(() => setReadOnlyWarning(null), 3500);
        return;
      }

      activeDragIdRef.current = hitFurniture.id;
      isPointerDownRef.current = true;
      hasDraggedRef.current = false;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      setIsDraggingObject(true);

      const obj = placedObjects.find((o) => o.id === hitFurniture.id);
      if (obj) {
        const objElevation = obj.position[1] || 0;
        dragElevationRef.current = objElevation;
        const planePt = getPlaneIntersection(e.clientX, e.clientY, objElevation);
        if (planePt) {
          dragOffsetRef.current.set(
            planePt.x - obj.position[0],
            0,
            planePt.z - obj.position[2]
          );
        }
      }
    } else {
      // Clicked outside / on floor to rotate room or deselect
      clickedEmptySpaceRef.current = true;
      isPointerDownRef.current = true;
      hasDraggedRef.current = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Check if pointer has moved enough to be classified as a drag/orbit gesture
    if (isPointerDownRef.current || isRotatingRef.current) {
      const moveDist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );
      if (moveDist > 4) {
        hasDraggedRef.current = true;
      }
    }

    // 1. If actively rotating 360 degrees
    if (isRotatingRef.current && activeRotateIdRef.current) {
      hasDraggedRef.current = true;
      const floorPt = getPlaneIntersection(e.clientX, e.clientY, 0);
      const targetObj = placedObjects.find((o) => o.id === activeRotateIdRef.current);
      if (floorPt && targetObj) {
        const dx = floorPt.x - targetObj.position[0];
        const dz = floorPt.z - targetObj.position[2];
        const angle = Math.atan2(dx, dz);
        setObjectRotation(activeRotateIdRef.current, angle);

        const deg = Math.round(
          (((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI)
        );
        setLiveRotationDeg(deg);
      }
      return;
    }

    // 2. If actively dragging furniture position (supports floor and elevated objects!)
    if (activeDragIdRef.current && isPointerDownRef.current) {
      hasDraggedRef.current = true;
      const planePt = getPlaneIntersection(e.clientX, e.clientY, dragElevationRef.current);
      if (planePt) {
        let newX = planePt.x - dragOffsetRef.current.x;
        let newZ = planePt.z - dragOffsetRef.current.z;

        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newZ = Math.round(newZ / gridSize) * gridSize;
        }

        const targetObj = placedObjects.find((o) => o.id === activeDragIdRef.current);
        const w = targetObj ? targetObj.dimensions.width : 1;
        const d = targetObj ? targetObj.dimensions.depth : 1;
        const halfW = roomWidth / 2 - w / 2;
        const halfL = roomLength / 2 - d / 2;

        newX = Math.max(-halfW, Math.min(halfW, Number(newX.toFixed(2))));
        newZ = Math.max(-halfL, Math.min(halfL, Number(newZ.toFixed(2))));

        const currentObj = placedObjects.find((o) => o.id === activeDragIdRef.current);
        if (currentObj) {
          updateObject(activeDragIdRef.current, {
            position: [newX, currentObj.position[1], newZ],
          });
        }
      }
      return;
    }

    // 3. Hover state updates
    if (!isPointerDownRef.current && !isRotatingRef.current) {
      const hitGizmo = getRotationGizmoIntersection(e.clientX, e.clientY);
      setIsHoveringRotation(Boolean(hitGizmo));

      const hitFurniture = getFurnitureIntersection(e.clientX, e.clientY);
      setIsHoveringObject(Boolean(hitFurniture));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Release 360-degree rotation
    if (isRotatingRef.current) {
      isRotatingRef.current = false;
      activeRotateIdRef.current = null;
      setIsRotating(false);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      return;
    }

    const moveDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );

    const isStaticClick = moveDist <= 6 && !hasDraggedRef.current;

    // Static click on empty space or floor: unselect furniture and cancel pending item drop
    if (isPointerDownRef.current && isStaticClick && clickedEmptySpaceRef.current && !activeDragIdRef.current) {
      const floorPt = getPlaneIntersection(e.clientX, e.clientY, 0);
      if (selectedCatalogItem && floorPt) {
        let spawnX = floorPt.x;
        let spawnZ = floorPt.z;
        if (snapToGrid) {
          spawnX = Math.round(spawnX / gridSize) * gridSize;
          spawnZ = Math.round(spawnZ / gridSize) * gridSize;
        }
        addObject(selectedCatalogItem, [spawnX, 0, spawnZ]);
        setSelectedCatalogItem(null);
      } else {
        // User clicked on empty space, floor, walls or void: unselect furniture immediately and nothing will be selected
        setSelectedObjectId(null);
        setSelectedCatalogItem(null);
      }
    }

    // Release direct dragging
    isPointerDownRef.current = false;
    clickedEmptySpaceRef.current = false;
    activeDragIdRef.current = null;
    setIsDraggingObject(false);

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  };

  // 11. HTML5 Drag-and-Drop Spawning from Catalog Panel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemJson = e.dataTransfer.getData("application/custom-item");
    if (!itemJson) return;

    if (isReadOnlyProject) {
      setReadOnlyWarning("This community blueprint is protected (Read-Only). Click 'Copy / Remix' in the top bar to add furniture to your own copy.");
      setTimeout(() => setReadOnlyWarning(null), 4000);
      return;
    }

    try {
      const catalogItem: FurnitureItemDef = JSON.parse(itemJson);
      const floorPt = getFloorIntersection(e.clientX, e.clientY);
      if (floorPt) {
        let spawnX = floorPt.x;
        let spawnZ = floorPt.z;
        if (snapToGrid) {
          spawnX = Math.round(spawnX / gridSize) * gridSize;
          spawnZ = Math.round(spawnZ / gridSize) * gridSize;
        }
        addObject(catalogItem, [spawnX, 0, spawnZ]);
      }
    } catch (err) {
      console.error("Drop item parse error:", err);
    }
  };

  return (
    <div
      ref={containerRef}
      id="aura-canvas-container"
      className="relative w-full h-full overflow-hidden bg-[#18181B] select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        cursor: isRotating
          ? "grabbing"
          : isDraggingObject
          ? "grabbing"
          : isHoveringRotation
          ? "crosshair"
          : isHoveringObject
          ? "grab"
          : "default",
      }}
    >
      {/* Read-Only Mode Banner */}
      {isReadOnlyProject && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-amber-500/40 shadow-2xl text-xs text-stone-200">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Community Blueprint (Read-Only)</span>
          </div>
          <span className="text-stone-400 hidden md:inline">• Nobody can alter the creator's original design</span>
          <button
            id="canvas-remix-btn"
            onClick={() => forkProject()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-sm active:scale-95 ml-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy / Remix</span>
          </button>
        </div>
      )}

      {/* Read-Only Action Warning Toast */}
      {readOnlyWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs shadow-2xl animate-bounce">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{readOnlyWarning}</span>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        className="absolute inset-0 block touch-none"
      />

      {/* 360-Degree Mouse Rotation Live Degree Badge */}
      {isRotating && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-full text-xs shadow-2xl pointer-events-none animate-pulse">
          <Compass className="w-4 h-4 animate-spin" />
          <span>360° Mouse Rotation: {liveRotationDeg}°</span>
        </div>
      )}

      {/* Selection & Ground Axis Instruction Pill - elevated to float gracefully above bottom HUD bar */}
      {selectedObjectId && !isRotating && !isDraggingObject && (
        <div className="absolute bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-stone-900/95 backdrop-blur-md border border-amber-500/40 text-stone-200 px-4 py-1.5 rounded-full text-xs shadow-xl pointer-events-none whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>
            Click & hold <span className="text-amber-400 font-semibold">ground ring</span> to rotate 360° • Drag object to move
          </span>
        </div>
      )}

      {/* Architectural Dimension Overlay Badges */}
      {showDimensions && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-stone-900/85 backdrop-blur-md border border-stone-800 text-stone-300 px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg pointer-events-none max-w-[calc(100%-2rem)]">
          <span className="text-amber-400 font-medium whitespace-nowrap">Room Bounds:</span>
          <span className="whitespace-nowrap">{roomWidth.toLocaleString()}m (W)</span>
          <span className="text-stone-600">×</span>
          <span className="whitespace-nowrap">{roomLength.toLocaleString()}m (L)</span>
          <span className="text-stone-600">×</span>
          <span className="whitespace-nowrap">{roomHeight.toLocaleString()}m (H)</span>
          <span className="text-stone-600 hidden sm:inline">•</span>
          <span className="text-stone-400 hidden sm:inline whitespace-nowrap">
            Area: {(roomWidth * roomLength).toLocaleString()} m²
          </span>
        </div>
      )}

      {/* Grid Snap & View Mode Indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
        {snapToGrid && (
          <div className="bg-stone-900/70 backdrop-blur-md border border-stone-800/80 text-stone-400 px-2.5 py-1 rounded-md text-[11px] font-mono">
            Grid Snap: 0.25m
          </div>
        )}
        <div className="bg-stone-900/70 backdrop-blur-md border border-stone-800/80 text-stone-300 px-2.5 py-1 rounded-md text-[11px] font-mono capitalize">
          {activeViewMode.replace("_", " ")}
        </div>
      </div>
    </div>
  );
};
