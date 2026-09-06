import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, RotateCw, ZoomIn, ZoomOut, Maximize2, Sparkles, Layers, Eye } from 'lucide-react';

interface PanoramaScene {
  id: string;
  name: string;
  type: 'exterior' | 'interior' | 'rooftop' | 'structural';
  equirectangularUrl: string;
  description: string;
}

interface Panorama360ViewerProps {
  scenes: PanoramaScene[];
  activeSceneId: string;
  onSceneChange: (sceneId: string) => void;
  buildingName: string;
}

export const Panorama360Viewer: React.FC<Panorama360ViewerProps> = ({
  scenes,
  activeSceneId,
  onSceneChange,
  buildingName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);

  const [isLoadingTexture, setIsLoadingTexture] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fov, setFov] = useState(75);
  const [azimuthDeg, setAzimuthDeg] = useState(0);

  // Spherical camera state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const lonRef = useRef(90);
  const latRef = useRef(0);
  const targetLonRef = useRef(90);
  const targetLatRef = useRef(0);

  const currentScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Sphere geometry for 360 projection (inward facing)
    const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
    sphereGeo.scale(-1, 1, 1); // Invert inside-out

    const textureLoader = new THREE.TextureLoader();
    textureLoaderRef.current = textureLoader;

    setIsLoadingTexture(true);
    textureLoader.load(
      currentScene.equirectangularUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const sphereMat = new THREE.MeshBasicMaterial({ map: texture });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(sphereMesh);
        sphereMeshRef.current = sphereMesh;
        setIsLoadingTexture(false);
      },
      undefined,
      (err) => {
        console.error('Error loading 360 texture:', err);
        setIsLoadingTexture(false);
      }
    );

    // 5. Animation loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        targetLonRef.current += 0.08;
      }

      // Interpolate
      lonRef.current += (targetLonRef.current - lonRef.current) * 0.1;
      latRef.current += (targetLatRef.current - latRef.current) * 0.1;

      // Limit latitude
      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      targetLatRef.current = Math.max(-85, Math.min(85, targetLatRef.current));

      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);

      // Report Azimuth
      const normLon = Math.round((((lonRef.current % 360) + 360) % 360));
      setAzimuthDeg(normLon);

      renderer.render(scene, camera);
    };

    animate();

    // Event listeners
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetLonRef.current -= deltaX * 0.18;
      targetLatRef.current += deltaY * 0.18;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setFov((prev) => {
        const next = Math.max(30, Math.min(100, prev + e.deltaY * 0.05));
        camera.fov = next;
        camera.updateProjectionMatrix();
        return next;
      });
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      targetLonRef.current -= deltaX * 0.22;
      targetLatRef.current += deltaY * 0.22;

      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
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
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [currentScene.equirectangularUrl]);

  // Handle FOV Zoom Buttons
  const handleZoom = (delta: number) => {
    setFov((prev) => {
      const next = Math.max(30, Math.min(100, prev + delta));
      if (cameraRef.current) {
        cameraRef.current.fov = next;
        cameraRef.current.updateProjectionMatrix();
      }
      return next;
    });
  };

  const getCardinal = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'N (0°)';
    if (deg >= 22.5 && deg < 67.5) return 'NE (45°)';
    if (deg >= 67.5 && deg < 112.5) return 'E (90°)';
    if (deg >= 112.5 && deg < 157.5) return 'SE (135°)';
    if (deg >= 157.5 && deg < 202.5) return 'S (180°)';
    if (deg >= 202.5 && deg < 247.5) return 'SW (225°)';
    if (deg >= 247.5 && deg < 292.5) return 'W (270°)';
    return 'NW (315°)';
  };

  return (
    <div className="space-y-4">
      {/* 360 Panorama Viewport */}
      <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm select-none group">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Overlay */}
        {isLoadingTexture && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-semibold text-zinc-300">Rendering 360° Equirectangular Sphere...</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 pointer-events-auto shadow-sm">
            <Compass className="w-4 h-4 text-zinc-900 dark:text-white" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">{getCardinal(azimuthDeg)}</span>
            <span className="text-[10px] text-zinc-500 font-mono">Azimuth {azimuthDeg}°</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
                autoRotate
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white font-semibold'
                  : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{autoRotate ? 'Auto Orbit On' : 'Manual Orbit'}</span>
            </button>

            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 shadow-sm">
              <button
                onClick={() => handleZoom(-10)}
                className="p-1.5 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(10)}
                className="p-1.5 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Drag Guidance Prompt */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-20">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-lg pointer-events-auto shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/20">
                {currentScene.type.toUpperCase()} 360° PANORAMA
              </span>
              <span className="text-[10px] text-zinc-500">• Click & Drag to explore 360°</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{currentScene.name}</h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">{currentScene.description}</p>
          </div>
        </div>
      </div>

      {/* 360 Scene Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSceneChange(scene.id)}
            className={`p-3 rounded-lg border transition text-left space-y-1.5 ${
              activeSceneId === scene.id
                ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white shadow-sm font-semibold'
                : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{scene.name}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {scene.type}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed font-normal">{scene.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
