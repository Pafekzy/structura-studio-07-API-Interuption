import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ConstructionProject } from '../../types';

interface Building3DModelProps {
  project: ConstructionProject;
  viewMode: 'finished' | 'proposed' | 'split';
  splitPosition?: number; // 0 to 100 percentage for wipe slider
  lightingMode: 'daylight' | 'golden_hour' | 'twilight' | 'night';
  explodedLevel: number; // 0 (assembled) to 100 (fully exploded)
  wireframeOnly: boolean;
  showHotspots: boolean;
  autoRotate: boolean;
  rotationSpeed?: number; // 0.5x, 1x, 2x, etc.
  rotationDirection?: 'cw' | 'ccw';
  activeHotspotId: string | null;
  onSelectHotspot: (id: string | null) => void;
  azimuthAngle: number;
  onAzimuthChange?: (angle: number) => void;
  cameraPreset?: string | null;
  isolatedFloor?: number | null; // null = all floors, 0, 1, 2 = isolated floor
  activeFinishLayer?: 'all' | 'envelope' | 'interior' | 'landscape' | 'roof';
}

export const Building3DModel: React.FC<Building3DModelProps> = ({
  project,
  viewMode,
  splitPosition = 50,
  lightingMode,
  explodedLevel,
  wireframeOnly,
  showHotspots,
  autoRotate,
  rotationSpeed = 1,
  rotationDirection = 'cw',
  activeHotspotId,
  onSelectHotspot,
  azimuthAngle,
  onAzimuthChange,
  cameraPreset,
  isolatedFloor = null,
  activeFinishLayer = 'all',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  const interiorGroupsRef = useRef<THREE.Group[]>([]);
  const landscapeGroupRef = useRef<THREE.Group | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const envelopeGroupsRef = useRef<THREE.Group[]>([]);
  
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const pointLightsRef = useRef<THREE.PointLight[]>([]);
  const poolLightRef = useRef<THREE.PointLight | null>(null);

  // Orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 28, theta: (azimuthAngle * Math.PI) / 180, phi: Math.PI / 3.4 });
  const targetSphericalRef = useRef({ radius: 28, theta: (azimuthAngle * Math.PI) / 180, phi: Math.PI / 3.4 });
  const isCinematicSweepRef = useRef(false);
  const cinematicTimeRef = useRef(0);

  // Update target when azimuthAngle prop changes externally
  useEffect(() => {
    if (!isDraggingRef.current && !isCinematicSweepRef.current) {
      const rad = (azimuthAngle * Math.PI) / 180;
      targetSphericalRef.current.theta = rad;
    }
  }, [azimuthAngle]);

  // Handle camera presets
  useEffect(() => {
    if (!cameraPreset) return;
    isCinematicSweepRef.current = false;

    if (cameraPreset === 'south') {
      targetSphericalRef.current = { radius: 26, theta: Math.PI, phi: Math.PI / 2.5 };
    } else if (cameraPreset === 'north') {
      targetSphericalRef.current = { radius: 26, theta: 0, phi: Math.PI / 2.5 };
    } else if (cameraPreset === 'east') {
      targetSphericalRef.current = { radius: 26, theta: Math.PI / 2, phi: Math.PI / 2.5 };
    } else if (cameraPreset === 'west') {
      targetSphericalRef.current = { radius: 26, theta: (3 * Math.PI) / 2, phi: Math.PI / 2.5 };
    } else if (cameraPreset === 'drone') {
      targetSphericalRef.current = { radius: 36, theta: Math.PI * 0.75, phi: Math.PI / 5 };
    } else if (cameraPreset === 'eye_level') {
      targetSphericalRef.current = { radius: 22, theta: Math.PI * 0.95, phi: Math.PI / 2.05 };
    } else if (cameraPreset === 'rooftop') {
      targetSphericalRef.current = { radius: 18, theta: Math.PI * 1.25, phi: Math.PI / 3.4 };
    } else if (cameraPreset === 'cinematic') {
      isCinematicSweepRef.current = true;
      cinematicTimeRef.current = 0;
    }
  }, [cameraPreset]);

  // Build Procedural Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 600);
    cameraRef.current = camera;

    // 3. Renderer with high visual fidelity
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0xecfeff, 0x1e293b, 0.55);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(28, 42, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 140;
    const d = 26;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Indoor glow point lights for twilight/night & architectural warmth
    const pointLights: THREE.PointLight[] = [];
    const interiorLightPositions = [
      [-2, 2.8, 1],
      [4, 2.8, 2],
      [-3, 6.6, -1],
      [2, 6.6, 1],
      [0, 10.4, 0],
    ];
    interiorLightPositions.forEach(([lx, ly, lz]) => {
      const pl = new THREE.PointLight(0xffb74d, 1.4, 16, 1.4);
      pl.position.set(lx, ly, lz);
      scene.add(pl);
      pointLights.push(pl);
    });
    pointLightsRef.current = pointLights;

    // Exterior Architectural Wall Sconces
    const sconceLight1 = new THREE.PointLight(0xfef08a, 0.9, 8, 1.5);
    sconceLight1.position.set(-8.5, 2.5, 7.2);
    scene.add(sconceLight1);
    pointLights.push(sconceLight1);

    const sconceLight2 = new THREE.PointLight(0xfef08a, 0.9, 8, 1.5);
    sconceLight2.position.set(8.5, 2.5, 7.2);
    scene.add(sconceLight2);
    pointLights.push(sconceLight2);

    // Swimming Pool Underwater Glow Light
    const poolLight = new THREE.PointLight(0x38bdf8, 1.5, 12, 1.2);
    poolLight.position.set(6, -0.2, 8);
    scene.add(poolLight);
    poolLightRef.current = poolLight;
    pointLights.push(poolLight);

    // 5. Main Root Building Group
    const buildingGroup = new THREE.Group();
    buildingGroupRef.current = buildingGroup;
    scene.add(buildingGroup);

    // Substructure Foundation Piles (Proposed/BIM mode)
    const pilesGroup = new THREE.Group();
    const pileGeo = new THREE.CylinderGeometry(0.35, 0.35, 6, 14);
    const pileMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    for (let px = -9; px <= 9; px += 4.5) {
      for (let pz = -7; pz <= 7; pz += 4.5) {
        const pile = new THREE.Mesh(pileGeo, pileMat);
        pile.position.set(px, -3, pz);
        pilesGroup.add(pile);
      }
    }
    buildingGroup.add(pilesGroup);

    // =========================================================
    // LANDSCAPE & PODIUM ENVIRONMENT
    // =========================================================
    const landscapeGroup = new THREE.Group();
    landscapeGroupRef.current = landscapeGroup;
    buildingGroup.add(landscapeGroup);

    // Ground Terrain Base
    const groundGeo = new THREE.BoxGeometry(40, 1.2, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.6;
    groundMesh.receiveShadow = true;
    landscapeGroup.add(groundMesh);

    // Lush Manicured Turf Lawn
    const lawnGeo = new THREE.BoxGeometry(36, 0.3, 36);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.95,
      metalness: 0.05,
    });
    const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
    lawnMesh.position.y = 0.15;
    lawnMesh.receiveShadow = true;
    landscapeGroup.add(lawnMesh);

    // Travertine Patio Deck Surrounding House
    const patioGeo = new THREE.BoxGeometry(26, 0.25, 22);
    const patioMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.6,
      metalness: 0.1,
    });
    const patioMesh = new THREE.Mesh(patioGeo, patioMat);
    patioMesh.position.set(0, 0.3, 1);
    patioMesh.receiveShadow = true;
    landscapeGroup.add(patioMesh);

    // Stepping Stone Walkway to Main Entry
    for (let st = 0; st < 6; st++) {
      const stepGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
      const stepMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.5 });
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(-6, 0.35, 12 + st * 1.8);
      stepMesh.receiveShadow = true;
      landscapeGroup.add(stepMesh);

      // Embedded LED Pathway Lights
      const pathLightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12);
      const pathLightMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });
      const pathLight = new THREE.Mesh(pathLightGeo, pathLightMat);
      pathLight.position.set(-7.5, 0.36, 12 + st * 1.8);
      landscapeGroup.add(pathLight);
    }

    // Architectural Planter Boxes & Trees
    const planterLocations = [
      [-11, 0.6, 6],
      [-11, 0.6, 0],
      [-11, 0.6, -6],
      [11, 0.6, -6],
    ];
    planterLocations.forEach(([px, py, pz]) => {
      const pBoxGeo = new THREE.BoxGeometry(2.2, 0.8, 2.2);
      const pBoxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const pBox = new THREE.Mesh(pBoxGeo, pBoxMat);
      pBox.position.set(px, py, pz);
      pBox.castShadow = true;
      pBox.receiveShadow = true;
      landscapeGroup.add(pBox);

      // Japanese Maple / Boxwood architectural shrub
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(px, py + 1.2, pz);
      trunk.castShadow = true;
      landscapeGroup.add(trunk);

      const foliageGeo = new THREE.DodecahedronGeometry(1.2, 1);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(px, py + 2.4, pz);
      foliage.castShadow = true;
      landscapeGroup.add(foliage);
    });

    // Infinity Pool Feature
    if (project.floorPlanSpecs.hasSwimmingPool) {
      // Pool basin structure
      const poolCopingGeo = new THREE.BoxGeometry(11, 0.35, 6.6);
      const poolCopingMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
      const poolCoping = new THREE.Mesh(poolCopingGeo, poolCopingMat);
      poolCoping.position.set(6, 0.25, 8.5);
      poolCoping.receiveShadow = true;
      landscapeGroup.add(poolCoping);

      // Crystalline Blue Water Body with physical transmission
      const waterGeo = new THREE.BoxGeometry(10, 0.4, 5.6);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.88,
        roughness: 0.08,
        metalness: 0.1,
        transmission: 0.7,
        ior: 1.333,
        reflectivity: 0.9,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(6, 0.32, 8.5);
      landscapeGroup.add(water);

      // Pool Sun Loungers with Teak Framing & Cushions
      for (let l = 0; l < 2; l++) {
        const loungerGroup = new THREE.Group();
        loungerGroup.position.set(2.5 + l * 2.2, 0.5, 12.8);
        loungerGroup.rotation.y = Math.PI;

        const baseGeo = new THREE.BoxGeometry(1.8, 0.15, 0.75);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }); // Teak
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.castShadow = true;
        loungerGroup.add(base);

        const cushionGeo = new THREE.BoxGeometry(1.7, 0.12, 0.7);
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }); // Ivory Fabric
        const cushion = new THREE.Mesh(cushionGeo, cushionMat);
        cushion.position.y = 0.12;
        cushion.castShadow = true;
        loungerGroup.add(cushion);

        // Headrest angle
        const headGeo = new THREE.BoxGeometry(0.5, 0.14, 0.68);
        const headMesh = new THREE.Mesh(headGeo, cushionMat);
        headMesh.position.set(-0.6, 0.22, 0);
        headMesh.rotation.z = 0.35;
        headMesh.castShadow = true;
        loungerGroup.add(headMesh);

        landscapeGroup.add(loungerGroup);
      }

      // Modern Patio Parasol / Umbrella
      const umbrellaPoleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 10);
      const umbrellaPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const umbrellaPole = new THREE.Mesh(umbrellaPoleGeo, umbrellaPoleMat);
      umbrellaPole.position.set(7.5, 1.8, 13);
      umbrellaPole.castShadow = true;
      landscapeGroup.add(umbrellaPole);

      const canopyGeo = new THREE.ConeGeometry(1.8, 0.6, 8);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(7.5, 3.2, 13);
      canopy.castShadow = true;
      landscapeGroup.add(canopy);
    }

    // Grid Floor Helper for Proposed Mode
    const gridHelper = new THREE.GridHelper(38, 19, 0xf59e0b, 0x334155);
    gridHelper.position.y = 0.45;
    buildingGroup.add(gridHelper);

    // =========================================================
    // MULTI-STOREY BUILDING LEVELS & DETAILED FINISHES
    // =========================================================
    const floorsCount = Math.max(1, Math.min(6, project.floorPlanSpecs.floors || 3));
    const floorHeight = 3.8;
    const floorGroups: THREE.Group[] = [];
    const interiorGroups: THREE.Group[] = [];
    const envelopeGroups: THREE.Group[] = [];

    // Shared high-detail materials
    const lowEGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.68,
      ior: 1.52,
      reflectivity: 0.95,
      clearcoat: 0.9,
    });

    const travertineStoneMat = new THREE.MeshStandardMaterial({
      color: 0xe7e5e4,
      roughness: 0.75,
      metalness: 0.08,
    });

    const charredWoodMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.7,
      metalness: 0.12,
    });

    const warmOakMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.65,
      metalness: 0.05,
    });

    const blackAluminumMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.35,
      metalness: 0.85,
    });

    for (let i = 0; i < floorsCount; i++) {
      const floorGroup = new THREE.Group();
      floorGroup.position.y = 0.4 + i * floorHeight;

      const interiorGroup = new THREE.Group();
      interiorGroups.push(interiorGroup);
      floorGroup.add(interiorGroup);

      const envelopeGroup = new THREE.Group();
      envelopeGroups.push(envelopeGroup);
      floorGroup.add(envelopeGroup);

      // Floor Geometry Dimensions
      const slabWidth = i === 0 ? 19 : i === 1 ? 17 : 15;
      const slabDepth = i === 0 ? 15 : i === 1 ? 14 : 12;
      const slabOffsetX = i === 1 ? 1 : 0;
      const slabOffsetZ = i === 2 ? -1 : 0;

      // 1. Structural Post-Tensioned Concrete Floor Slab with Wood Parquet Top
      const slabGeo = new THREE.BoxGeometry(slabWidth, 0.4, slabDepth);
      const slabMesh = new THREE.Mesh(slabGeo, travertineStoneMat);
      slabMesh.position.set(slabOffsetX, 0.2, slabOffsetZ);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      floorGroup.add(slabMesh);

      // Hardwood Parquet Finish on top of slab
      const hardwoodGeo = new THREE.BoxGeometry(slabWidth - 0.2, 0.05, slabDepth - 0.2);
      const hardwoodMesh = new THREE.Mesh(hardwoodGeo, warmOakMat);
      hardwoodMesh.position.set(slabOffsetX, 0.42, slabOffsetZ);
      hardwoodMesh.receiveShadow = true;
      interiorGroup.add(hardwoodMesh);

      // 2. Structural Steel Columns (BIM & Load Bearing)
      const colGeo = new THREE.BoxGeometry(0.5, floorHeight - 0.4, 0.5);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.7 });
      for (let cx = -slabWidth / 2 + 1.2; cx <= slabWidth / 2 - 1.2; cx += (slabWidth - 2.4) / 3) {
        for (let cz = -slabDepth / 2 + 1.2; cz <= slabDepth / 2 - 1.2; cz += (slabDepth - 2.4) / 2) {
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(slabOffsetX + cx, (floorHeight - 0.4) / 2 + 0.4, slabOffsetZ + cz);
          col.castShadow = true;
          col.receiveShadow = true;
          floorGroup.add(col);
        }
      }

      // 3. Exterior Glass Curtain Walls with Black Aluminum Mullions
      const glassGeo = new THREE.BoxGeometry(slabWidth - 0.6, floorHeight - 0.5, slabDepth - 0.6);
      const glassMesh = new THREE.Mesh(glassGeo, lowEGlassMat);
      glassMesh.position.set(slabOffsetX, (floorHeight - 0.5) / 2 + 0.4, slabOffsetZ);
      glassMesh.castShadow = true;
      envelopeGroup.add(glassMesh);

      // Architectural Aluminum Mullion Frames along South Facade
      for (let m = -slabWidth / 2 + 1.5; m <= slabWidth / 2 - 1.5; m += 2.8) {
        const mullionGeo = new THREE.BoxGeometry(0.12, floorHeight - 0.4, 0.25);
        const mullion = new THREE.Mesh(mullionGeo, blackAluminumMat);
        mullion.position.set(slabOffsetX + m, (floorHeight - 0.4) / 2 + 0.4, slabOffsetZ + slabDepth / 2 - 0.2);
        mullion.castShadow = true;
        envelopeGroup.add(mullion);
      }

      // 4. Feature Cladding Walls (Stone & Charred Yakisugi Wood)
      const stoneWallGeo = new THREE.BoxGeometry(slabWidth * 0.42, floorHeight - 0.4, 0.6);
      const stoneWall = new THREE.Mesh(stoneWallGeo, i % 2 === 0 ? travertineStoneMat : charredWoodMat);
      stoneWall.position.set(slabOffsetX - slabWidth * 0.26, (floorHeight - 0.4) / 2 + 0.4, slabOffsetZ + slabDepth / 2 - 0.3);
      stoneWall.castShadow = true;
      stoneWall.receiveShadow = true;
      envelopeGroup.add(stoneWall);

      // Architectural Wood Slat Louvers on Upper Cantilever
      if (i > 0) {
        const louverCount = 8;
        for (let lv = 0; lv < louverCount; lv++) {
          const louverGeo = new THREE.BoxGeometry(0.1, floorHeight - 0.6, 0.4);
          const louver = new THREE.Mesh(louverGeo, warmOakMat);
          louver.position.set(slabOffsetX + slabWidth * 0.2 + lv * 0.45, (floorHeight - 0.4) / 2 + 0.4, slabOffsetZ + slabDepth / 2 + 0.1);
          louver.rotation.y = 0.4;
          louver.castShadow = true;
          envelopeGroup.add(louver);
        }
      }

      // =========================================================
      // INTERIOR ARCHITECTURE & FURNISHINGS PER FLOOR
      // =========================================================
      if (i === 0) {
        // --- LEVEL 1: GROUND FLOOR OPEN LIVING & GOURMET KITCHEN ---
        // Modern Sectional Sofa
        const sofaBaseGeo = new THREE.BoxGeometry(4.2, 0.45, 2.2);
        const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
        const sofaBase = new THREE.Mesh(sofaBaseGeo, sofaMat);
        sofaBase.position.set(slabOffsetX - 2, 0.65, slabOffsetZ + 2.5);
        sofaBase.castShadow = true;
        interiorGroup.add(sofaBase);

        const sofaBackGeo = new THREE.BoxGeometry(4.2, 0.5, 0.4);
        const sofaBack = new THREE.Mesh(sofaBackGeo, sofaMat);
        sofaBack.position.set(slabOffsetX - 2, 1.1, slabOffsetZ + 1.5);
        sofaBack.castShadow = true;
        interiorGroup.add(sofaBack);

        // Calacatta Marble Coffee Table
        const tableGeo = new THREE.BoxGeometry(2.4, 0.35, 1.2);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(slabOffsetX - 2, 0.6, slabOffsetZ + 4.2);
        table.castShadow = true;
        interiorGroup.add(table);

        // Kitchen Island with Waterfall Marble Counter
        const islandGeo = new THREE.BoxGeometry(4.8, 1.0, 1.6);
        const island = new THREE.Mesh(islandGeo, tableMat);
        island.position.set(slabOffsetX + 3.8, 0.95, slabOffsetZ - 1.5);
        island.castShadow = true;
        interiorGroup.add(island);

        // Barstools
        for (let b = 0; b < 3; b++) {
          const stoolGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 12);
          const stoolMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
          const stool = new THREE.Mesh(stoolGeo, stoolMat);
          stool.position.set(slabOffsetX + 2.6 + b * 1.2, 0.8, slabOffsetZ - 2.8);
          stool.castShadow = true;
          interiorGroup.add(stool);
        }

        // Floating Architectural Open-Tread Staircase
        for (let s = 0; s < 10; s++) {
          const treadGeo = new THREE.BoxGeometry(1.4, 0.08, 0.35);
          const tread = new THREE.Mesh(treadGeo, warmOakMat);
          tread.position.set(slabOffsetX - 6, 0.5 + s * 0.34, slabOffsetZ - 4 + s * 0.5);
          tread.castShadow = true;
          interiorGroup.add(tread);
        }
      } else if (i === 1) {
        // --- LEVEL 2: MASTER SUITE & LOUNGE ---
        // Platform King Bed
        const bedFrameGeo = new THREE.BoxGeometry(3.2, 0.4, 3.4);
        const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
        const bedFrame = new THREE.Mesh(bedFrameGeo, bedFrameMat);
        bedFrame.position.set(slabOffsetX - 2.5, 0.6, slabOffsetZ);
        bedFrame.castShadow = true;
        interiorGroup.add(bedFrame);

        const mattressGeo = new THREE.BoxGeometry(2.8, 0.35, 3.0);
        const mattressMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const mattress = new THREE.Mesh(mattressGeo, mattressMat);
        mattress.position.set(slabOffsetX - 2.5, 0.95, slabOffsetZ);
        mattress.castShadow = true;
        interiorGroup.add(mattress);

        // Headboard Feature Wall with Recessed LED Cove
        const headboardGeo = new THREE.BoxGeometry(3.6, 2.4, 0.15);
        const headboard = new THREE.Mesh(headboardGeo, warmOakMat);
        headboard.position.set(slabOffsetX - 2.5, 1.8, slabOffsetZ - 1.7);
        headboard.castShadow = true;
        interiorGroup.add(headboard);
      }

      // Cantilevered Terrace Deck on Upper Floors
      if (i > 0) {
        const balcGeo = new THREE.BoxGeometry(6.5, 0.3, 3.2);
        const balcMesh = new THREE.Mesh(balcGeo, travertineStoneMat);
        balcMesh.position.set(slabOffsetX + 2, 0.15, slabOffsetZ + slabDepth / 2 + 1.6);
        balcMesh.castShadow = true;
        balcMesh.receiveShadow = true;
        floorGroup.add(balcMesh);

        // Frameless Glass Balustrade with Stainless Steel Spigots
        const railGeo = new THREE.BoxGeometry(6.5, 1.15, 0.08);
        const railMat = new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.5,
          roughness: 0.05,
          metalness: 0.2,
          transmission: 0.8,
          ior: 1.5,
        });
        const railMesh = new THREE.Mesh(railGeo, railMat);
        railMesh.position.set(slabOffsetX + 2, 0.72, slabOffsetZ + slabDepth / 2 + 3.15);
        floorGroup.add(railMesh);
      }

      buildingGroup.add(floorGroup);
      floorGroups.push(floorGroup);
    }

    floorGroupsRef.current = floorGroups;
    interiorGroupsRef.current = interiorGroups;
    envelopeGroupsRef.current = envelopeGroups;

    // =========================================================
    // ROOFTOP SKY LOUNGE, TIMBER PERGOLA & SOLAR PV ARRAY
    // =========================================================
    const roofGroup = new THREE.Group();
    roofGroupRef.current = roofGroup;
    buildingGroup.add(roofGroup);

    const roofY = 0.4 + floorsCount * floorHeight;
    const roofGeo = new THREE.BoxGeometry(16, 0.45, 13);
    const roofMesh = new THREE.Mesh(roofGeo, travertineStoneMat);
    roofMesh.position.y = roofY + 0.22;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    roofGroup.add(roofMesh);

    // Modern Cantilevered Timber Pergola
    const pergolaGroup = new THREE.Group();
    pergolaGroup.position.set(-3.5, roofY + 0.45, 1.5);

    // Pergola 4 steel posts
    const postGeo = new THREE.BoxGeometry(0.2, 3.0, 0.2);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.9, roughness: 0.3 });
    [
      [-3, 1.5, -2],
      [3, 1.5, -2],
      [-3, 1.5, 2],
      [3, 1.5, 2],
    ].forEach(([px, py, pz]) => {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(px, py, pz);
      p.castShadow = true;
      pergolaGroup.add(p);
    });

    // Pergola Rafter Slats casting architectural linear shadows
    for (let r = -3.2; r <= 3.2; r += 0.45) {
      const slatGeo = new THREE.BoxGeometry(0.08, 0.25, 4.4);
      const slat = new THREE.Mesh(slatGeo, warmOakMat);
      slat.position.set(r, 3.0, 0);
      slat.castShadow = true;
      pergolaGroup.add(slat);
    }

    // Rooftop Fire Pit & Circular Lounge
    const firePitGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 18);
    const firePitMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });
    const firePit = new THREE.Mesh(firePitGeo, firePitMat);
    firePit.position.set(0, 0.2, 0);
    firePit.castShadow = true;
    pergolaGroup.add(firePit);

    const emberGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16);
    const emberMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 1.5 });
    const ember = new THREE.Mesh(emberGeo, emberMat);
    ember.position.set(0, 0.42, 0);
    pergolaGroup.add(ember);

    roofGroup.add(pergolaGroup);

    // Monocrystalline Solar PV Matrix with realistic metallic frames
    const solarGeo = new THREE.BoxGeometry(2.6, 0.08, 1.5);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.85,
    });
    const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    for (let sx = 1.5; sx <= 6.5; sx += 2.8) {
      for (let sz = -4; sz <= 3.5; sz += 1.8) {
        const panelGroup = new THREE.Group();
        panelGroup.position.set(sx, roofY + 0.65, sz);
        panelGroup.rotation.x = -0.18; // 10 degree tilt for maximum solar insolation

        const panel = new THREE.Mesh(solarGeo, solarMat);
        panel.castShadow = true;
        panelGroup.add(panel);

        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.04, 1.55), solarFrameMat);
        frame.position.y = -0.02;
        panelGroup.add(frame);

        roofGroup.add(panelGroup);
      }
    }

    // =========================================================
    // ANIMATION & ORBITAL RENDER LOOP (FULL 360° SUPPORT)
    // =========================================================
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Handle Continuous 360° Turntable Rotation
      if (autoRotate && !isDraggingRef.current && !isCinematicSweepRef.current) {
        const directionSign = rotationDirection === 'ccw' ? -1 : 1;
        targetSphericalRef.current.theta += 0.005 * rotationSpeed * directionSign;
      }

      // 2. Handle Cinematic Orbital Flight Path
      if (isCinematicSweepRef.current && !isDraggingRef.current) {
        cinematicTimeRef.current += 0.008;
        targetSphericalRef.current.theta += 0.006;
        targetSphericalRef.current.phi = (Math.PI / 3.2) + Math.sin(cinematicTimeRef.current * 0.5) * 0.2;
        targetSphericalRef.current.radius = 28 + Math.cos(cinematicTimeRef.current * 0.4) * 6;
      }

      // 3. Interpolate Smooth Spherical Coordinates
      sphericalRef.current.theta += (targetSphericalRef.current.theta - sphericalRef.current.theta) * 0.08;
      sphericalRef.current.phi += (targetSphericalRef.current.phi - sphericalRef.current.phi) * 0.08;
      sphericalRef.current.radius += (targetSphericalRef.current.radius - sphericalRef.current.radius) * 0.08;

      // Bound polar angle to avoid flipping over poles
      sphericalRef.current.phi = Math.max(0.12, Math.min(Math.PI / 2.04, sphericalRef.current.phi));

      // 4. Calculate Camera Cartesian Position
      const { radius, theta, phi } = sphericalRef.current;
      const cx = radius * Math.sin(phi) * Math.sin(theta);
      const cy = radius * Math.cos(phi);
      const cz = radius * Math.sin(phi) * Math.cos(theta);

      camera.position.set(cx, cy + 4.5, cz);
      camera.lookAt(0, 5, 0);

      // 5. Broadcast Normalized 360° Azimuth Angle (0° to 359°)
      if (onAzimuthChange) {
        const deg = Math.round((((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * (180 / Math.PI));
        onAzimuthChange(deg);
      }

      renderer.render(scene, camera);
    };

    animate();

    // =========================================================
    // SEAMLESS 360° INTERACTIVE DRAG & WHEEL LISTENERS
    // =========================================================
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      isCinematicSweepRef.current = false;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetSphericalRef.current.theta -= deltaX * 0.008;
      targetSphericalRef.current.phi -= deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetSphericalRef.current.radius = Math.max(10, Math.min(65, targetSphericalRef.current.radius + e.deltaY * 0.035));
    };

    // Mobile touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        isCinematicSweepRef.current = false;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      targetSphericalRef.current.theta -= deltaX * 0.009;
      targetSphericalRef.current.phi -= deltaY * 0.009;

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Keyboard navigation (Arrow keys for 360 rotation & zoom)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        targetSphericalRef.current.theta += 0.15;
      } else if (e.key === 'ArrowRight') {
        targetSphericalRef.current.theta -= 0.15;
      } else if (e.key === 'ArrowUp') {
        targetSphericalRef.current.phi = Math.max(0.15, targetSphericalRef.current.phi - 0.1);
      } else if (e.key === 'ArrowDown') {
        targetSphericalRef.current.phi = Math.min(Math.PI / 2.05, targetSphericalRef.current.phi + 0.1);
      } else if (e.key === '+' || e.key === '=') {
        targetSphericalRef.current.radius = Math.max(10, targetSphericalRef.current.radius - 2);
      } else if (e.key === '-') {
        targetSphericalRef.current.radius = Math.min(65, targetSphericalRef.current.radius + 2);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    // Container Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [project]);

  // Handle Dynamic Solar Lighting & Fixture Emittance
  useEffect(() => {
    if (!dirLightRef.current || !ambientLightRef.current || !hemiLightRef.current) return;

    if (lightingMode === 'daylight') {
      dirLightRef.current.intensity = 2.4;
      dirLightRef.current.color.setHex(0xfffaed);
      dirLightRef.current.position.set(25, 40, 22);
      ambientLightRef.current.intensity = 0.75;
      ambientLightRef.current.color.setHex(0xffffff);
      hemiLightRef.current.intensity = 0.65;
      pointLightsRef.current.forEach((pl) => (pl.intensity = 0.3));
    } else if (lightingMode === 'golden_hour') {
      dirLightRef.current.intensity = 2.6;
      dirLightRef.current.color.setHex(0xf59e0b);
      dirLightRef.current.position.set(38, 14, 28);
      ambientLightRef.current.intensity = 0.65;
      ambientLightRef.current.color.setHex(0xfef3c7);
      hemiLightRef.current.intensity = 0.55;
      pointLightsRef.current.forEach((pl) => (pl.intensity = 1.0));
    } else if (lightingMode === 'twilight') {
      dirLightRef.current.intensity = 0.6;
      dirLightRef.current.color.setHex(0x38bdf8);
      dirLightRef.current.position.set(12, 16, -24);
      ambientLightRef.current.intensity = 0.35;
      ambientLightRef.current.color.setHex(0x1e293b);
      hemiLightRef.current.intensity = 0.35;
      pointLightsRef.current.forEach((pl) => (pl.intensity = 2.2));
    } else if (lightingMode === 'night') {
      dirLightRef.current.intensity = 0.18;
      dirLightRef.current.color.setHex(0x1e3a8a);
      ambientLightRef.current.intensity = 0.18;
      ambientLightRef.current.color.setHex(0x0f172a);
      hemiLightRef.current.intensity = 0.22;
      pointLightsRef.current.forEach((pl) => (pl.intensity = 2.8));
    }
  }, [lightingMode]);

  // Handle Exploded Slabs / Isolated Floor Inspection
  useEffect(() => {
    if (!floorGroupsRef.current) return;
    const spacingMultiplier = (explodedLevel / 100) * 3.8;
    const baseFloorHeight = 3.8;

    floorGroupsRef.current.forEach((grp, idx) => {
      if (isolatedFloor !== null) {
        grp.visible = idx === isolatedFloor;
        grp.position.y = 0.4;
      } else {
        grp.visible = true;
        grp.position.y = 0.4 + idx * (baseFloorHeight + spacingMultiplier * idx);
      }
    });

    if (roofGroupRef.current) {
      if (isolatedFloor !== null && isolatedFloor < floorGroupsRef.current.length - 1) {
        roofGroupRef.current.visible = false;
      } else {
        roofGroupRef.current.visible = true;
        const totalFloors = floorGroupsRef.current.length;
        roofGroupRef.current.position.y = (explodedLevel / 100) * 3.8 * totalFloors;
      }
    }
  }, [explodedLevel, isolatedFloor]);

  // Handle Finish Layer Filter (Envelope vs Interior vs Landscape vs Roof)
  useEffect(() => {
    if (landscapeGroupRef.current) {
      landscapeGroupRef.current.visible = activeFinishLayer === 'all' || activeFinishLayer === 'landscape';
    }
    if (roofGroupRef.current) {
      roofGroupRef.current.visible = activeFinishLayer === 'all' || activeFinishLayer === 'roof';
    }
    interiorGroupsRef.current.forEach((grp) => {
      grp.visible = activeFinishLayer === 'all' || activeFinishLayer === 'interior';
    });
    envelopeGroupsRef.current.forEach((grp) => {
      grp.visible = activeFinishLayer === 'all' || activeFinishLayer === 'envelope';
    });
  }, [activeFinishLayer]);

  // Handle Wireframe / Proposed Mode
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as any;
        if (typeof mat.wireframe !== 'undefined') {
          if (viewMode === 'proposed' || wireframeOnly) {
            mat.wireframe = wireframeOnly || (child.geometry.type.includes('BoxGeometry') && viewMode === 'proposed');
            if (viewMode === 'proposed' && mat.color && typeof mat.color.setHex === 'function') {
              mat.color.setHex(0x38bdf8);
            }
          } else {
            mat.wireframe = false;
          }
        }
      }
    });
  }, [viewMode, wireframeOnly]);

  return (
    <div className="relative w-full h-full min-h-[480px] select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden" />

      {/* Interactive 3D Architectural Hotspots */}
      {showHotspots && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Hotspot 1: Low-E Triple Glazed Curtain Wall */}
          <div
            className="absolute top-[40%] left-[45%] pointer-events-auto group/spot"
            onClick={() => onSelectHotspot(activeHotspotId === 'facade' ? null : 'facade')}
          >
            <div className="w-6 h-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-lg animate-pulse hover:scale-110 transition">
              1
            </div>
            <div className="absolute left-8 top-[-14px] w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-900 dark:text-white shadow-xl backdrop-blur-md opacity-0 group-hover/spot:opacity-100 transition duration-200 pointer-events-none z-30">
              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white text-[11px] mb-1">
                <span>{viewMode === 'proposed' ? 'BIM Spec: Thermal Glazing' : 'Low-E Acoustic Triple Glazing'}</span>
                <span className="text-[9px] bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-400 font-medium">SHGC 0.28</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">
                Black anodized aluminum thermally broken framing with acoustic laminated glass (STC 44 rating).
              </p>
            </div>
          </div>

          {/* Hotspot 2: Calacatta Gourmet Kitchen & Floating Staircase */}
          <div
            className="absolute top-[62%] left-[42%] pointer-events-auto group/spot"
            onClick={() => onSelectHotspot(activeHotspotId === 'interior' ? null : 'interior')}
          >
            <div className="w-6 h-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-lg animate-pulse hover:scale-110 transition">
              2
            </div>
            <div className="absolute left-8 top-[-14px] w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-900 dark:text-white shadow-xl backdrop-blur-md opacity-0 group-hover/spot:opacity-100 transition duration-200 pointer-events-none z-30">
              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white text-[11px] mb-1">
                <span>Bespoke Interior Finishes</span>
                <span className="text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-medium">Calacatta Gold</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">
                Waterfall marble kitchen island, open-tread solid oak cantilevered staircase, and chevron hardwood flooring.
              </p>
            </div>
          </div>

          {/* Hotspot 3: Rooftop Pergola & 18kWp Solar Array */}
          <div
            className="absolute top-[20%] left-[60%] pointer-events-auto group/spot"
            onClick={() => onSelectHotspot(activeHotspotId === 'roof' ? null : 'roof')}
          >
            <div className="w-6 h-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-lg animate-pulse hover:scale-110 transition">
              3
            </div>
            <div className="absolute right-8 top-[-14px] w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-900 dark:text-white shadow-xl backdrop-blur-md opacity-0 group-hover/spot:opacity-100 transition duration-200 pointer-events-none z-30">
              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white text-[11px] mb-1">
                <span>Rooftop Pergola & Solar PV</span>
                <span className="text-[9px] bg-purple-500/10 px-1.5 py-0.5 rounded text-purple-700 dark:text-purple-400 font-medium">18 kWp Net-Zero</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">
                Modern timber pergola with integrated fire pit lounge and monocrystalline solar PV microgrid.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
