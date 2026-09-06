import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Compass, 
  Sun, 
  Moon, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  HardHat, 
  RotateCw, 
  Columns, 
  Grid, 
  Camera, 
  Download, 
  Info, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  Flame, 
  Globe, 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  Home, 
  Waves, 
  Trees, 
  Box
} from 'lucide-react';
import { ConstructionProject } from '../types';
import { Building3DModel } from './3d/Building3DModel';
import { Panorama360Viewer } from './3d/Panorama360Viewer';

interface FinishedBuildingVisualizerProps {
  project: ConstructionProject;
  onOpenAdvisorModal: () => void;
}

export const FinishedBuildingVisualizer: React.FC<FinishedBuildingVisualizerProps> = ({
  project,
  onOpenAdvisorModal,
}) => {
  // Main View Type
  const [activeTabMode, setActiveTabMode] = useState<'3d_interactive' | 'split_360' | 'panorama_360' | 'turntable_gallery'>('3d_interactive');
  
  // 3D Model Parameters
  const [modelViewMode, setModelViewMode] = useState<'finished' | 'proposed' | 'split'>('finished');
  const [lightingMode, setLightingMode] = useState<'daylight' | 'golden_hour' | 'twilight' | 'night'>('twilight');
  const [explodedLevel, setExplodedLevel] = useState<number>(0);
  const [wireframeOnly, setWireframeOnly] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1);
  const [rotationDirection, setRotationDirection] = useState<'cw' | 'ccw'>('cw');
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [azimuthAngle, setAzimuthAngle] = useState<number>(180);
  const [cameraPreset, setCameraPreset] = useState<string | null>('south');
  const [isolatedFloor, setIsolatedFloor] = useState<number | null>(null);
  const [activeFinishLayer, setActiveFinishLayer] = useState<'all' | 'envelope' | 'interior' | 'landscape' | 'roof'>('all');
  const [activeDetailSection, setActiveDetailSection] = useState<'materials' | 'interiors' | 'lighting' | 'systems'>('materials');

  // Split-Screen Wipe Position (0 to 100)
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Turntable Gallery Active Angle
  const [selectedGalleryAngleIndex, setSelectedGalleryAngleIndex] = useState<number>(4); // default 180° South
  const [galleryCompareMode, setGalleryCompareMode] = useState<'finished' | 'proposed' | 'side_by_side'>('finished');

  // 360 Panorama Tour Active Scene
  const [activePanoramaSceneId, setActivePanoramaSceneId] = useState<string>(
    project.panoramic360Tours?.[0]?.id || 'tour-south-pool'
  );

  // Snapshot toast notification
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);

  // Safe 360 view lists with fallback
  const finished360Views = project.finishedBuilding360Views || [
    { angle: 0, label: '0° North Elevation (Main Courtyard)', url: project.finishedBuildingRenderUrl },
    { angle: 45, label: '45° North-East Perspective', url: project.finishedBuildingRenderAltViews?.[0] || project.finishedBuildingRenderUrl },
    { angle: 90, label: '90° East Elevation (Morning Terrace)', url: project.finishedBuildingRenderAltViews?.[1] || project.finishedBuildingRenderUrl },
    { angle: 135, label: '135° South-East Cantilever Angle', url: project.finishedBuildingRenderAltViews?.[2] || project.finishedBuildingRenderUrl },
    { angle: 180, label: '180° South Elevation (Primary Facade & Pool)', url: project.finishedBuildingRenderUrl },
    { angle: 225, label: '225° South-West Sunset Wing', url: project.finishedBuildingRenderAltViews?.[0] || project.finishedBuildingRenderUrl },
    { angle: 270, label: '270° West Elevation (Master Suite Cantilever)', url: project.finishedBuildingRenderAltViews?.[1] || project.finishedBuildingRenderUrl },
    { angle: 315, label: '315° North-West Subterranean Ramp', url: project.finishedBuildingRenderAltViews?.[2] || project.finishedBuildingRenderUrl },
  ];

  const proposed360Views = project.proposedBuilding360Views || [
    { angle: 0, label: '0° North BIM Schematic (Core & Axis)', url: project.proposedBuildingRenderUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85' },
    { angle: 45, label: '45° North-East Structural Wireframe', url: project.proposedBuildingRenderAltViews?.[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1600&q=85' },
    { angle: 90, label: '90° East Massing Model & Setback Grid', url: project.proposedBuildingRenderAltViews?.[1] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85' },
    { angle: 135, label: '135° South-East MEP Conduit Matrix', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85' },
    { angle: 180, label: '180° South Primary Structural Elevation', url: project.proposedBuildingRenderUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85' },
    { angle: 225, label: '225° South-West Solar Insolation Study', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1600&q=85' },
    { angle: 270, label: '270° West Shear Core & Cantilever Calc', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85' },
    { angle: 315, label: '315° North-West Substructure Piling Model', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85' },
  ];

  const panoramicScenes = project.panoramic360Tours || [
    {
      id: 'tour-south-pool',
      name: 'South Infinity Terrace 360°',
      type: 'exterior' as const,
      equirectangularUrl: project.finishedBuildingRenderUrl,
      description: '360° panoramic scan of the main South elevation with infinity edge pool, cantilevered decks, and glass curtain wall.',
    },
    {
      id: 'tour-great-room',
      name: 'Double-Height Atrium & Living Pavilion',
      type: 'interior' as const,
      equirectangularUrl: project.finishedBuildingRenderAltViews?.[0] || project.finishedBuildingRenderUrl,
      description: '360° interior walkthrough with bespoke architectural finishes, natural stone masonry, and high-performance glazing.',
    },
  ];

  const handleStepRotate = (delta: number) => {
    setCameraPreset(null);
    setAutoRotate(false);
    setAzimuthAngle((prev) => (prev + delta + 360) % 360);
  };

  const handleCaptureSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 3000);
  };

  const getCardinalHeading = (angle: number) => {
    const norm = (((angle % 360) + 360) % 360);
    if (norm >= 337.5 || norm < 22.5) return 'North (0°)';
    if (norm >= 22.5 && norm < 67.5) return 'North-East (45°)';
    if (norm >= 67.5 && norm < 112.5) return 'East (90°)';
    if (norm >= 112.5 && norm < 157.5) return 'South-East (135°)';
    if (norm >= 157.5 && norm < 202.5) return 'South (180°)';
    if (norm >= 202.5 && norm < 247.5) return 'South-West (225°)';
    if (norm >= 247.5 && norm < 292.5) return 'West (270°)';
    return 'North-West (315°)';
  };

  const activeFinished360 = finished360Views[selectedGalleryAngleIndex] || finished360Views[0];
  const activeProposed360 = proposed360Views[selectedGalleryAngleIndex] || proposed360Views[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800">
                Architectural 360° Visualizer
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-500/20">
                Proposed BIM vs. Turnkey Finished
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              360° Proposed Building & Finished Architectural Visualizer
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Continuous 360° orbital spatial inspection with interactive turntable controls, architectural material layers, interior layout furnishings, and photorealistic turnkey finishes.
            </p>
          </div>

          {/* Mode Switcher Tabs (Next.js Segmented Control) */}
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTabMode('3d_interactive')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                activeTabMode === '3d_interactive'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>3D Orbit Canvas</span>
            </button>

            <button
              onClick={() => setActiveTabMode('split_360')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                activeTabMode === 'split_360'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Proposed vs Finished Split</span>
            </button>

            <button
              onClick={() => setActiveTabMode('panorama_360')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                activeTabMode === 'panorama_360'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>360° Spherical Tour</span>
            </button>

            <button
              onClick={() => setActiveTabMode('turntable_gallery')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                activeTabMode === 'turntable_gallery'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>8-Angle Elevation Dial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6 transition-colors duration-200">
        
        {/* TAB 1: 3D INTERACTIVE ORBIT CANVAS */}
        {activeTabMode === '3d_interactive' && (
          <div className="space-y-4">
            {/* Top Primary Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              {/* Proposed vs Finished Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Model State:</span>
                <div className="bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                  <button
                    onClick={() => setModelViewMode('finished')}
                    className={`px-3 py-1 rounded font-medium transition ${
                      modelViewMode === 'finished' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Finished Turnkey
                  </button>
                  <button
                    onClick={() => setModelViewMode('proposed')}
                    className={`px-3 py-1 rounded font-medium transition ${
                      modelViewMode === 'proposed' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Proposed BIM
                  </button>
                </div>
              </div>

              {/* Lighting Simulator */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Solar Time:</span>
                <div className="bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                  <button
                    onClick={() => setLightingMode('daylight')}
                    className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                      lightingMode === 'daylight' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="12:00 Noon Sunlight"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Day</span>
                  </button>
                  <button
                    onClick={() => setLightingMode('golden_hour')}
                    className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                      lightingMode === 'golden_hour' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="17:30 Golden Hour Sunset"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Golden</span>
                  </button>
                  <button
                    onClick={() => setLightingMode('twilight')}
                    className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                      lightingMode === 'twilight' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="20:00 Architectural Twilight"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Twilight</span>
                  </button>
                  <button
                    onClick={() => setLightingMode('night')}
                    className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                      lightingMode === 'night' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title="22:00 Night Illumination"
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Night</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCameraPreset('cinematic'); setAutoRotate(false); }}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition border ${
                    cameraPreset === 'cinematic'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white font-semibold'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Fly around the building with an orbital cinematic camera"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Cinematic Fly-Around</span>
                </button>

                <button
                  onClick={() => setWireframeOnly(!wireframeOnly)}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition border ${
                    wireframeOnly
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Toggle Structural Wireframe Mode"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{wireframeOnly ? 'Solid Mode' : 'Wireframe'}</span>
                </button>

                <button
                  onClick={handleCaptureSnapshot}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium flex items-center gap-1.5 transition"
                  title="Save high-resolution 360 angle snapshot"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snapshot</span>
                </button>
              </div>
            </div>

            {/* Continuous 360° Rotational Control Deck */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
              {/* Continuous Turntable Player */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCameraPreset(null);
                    setAutoRotate(!autoRotate);
                  }}
                  className={`px-3.5 py-2 rounded-lg font-medium flex items-center gap-2 transition border ${
                    autoRotate
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white font-semibold'
                      : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{autoRotate ? 'Pause 360° Orbit' : 'Auto 360° Orbit'}</span>
                </button>

                {/* Direction Toggle */}
                <button
                  onClick={() => setRotationDirection((prev) => (prev === 'cw' ? 'ccw' : 'cw'))}
                  className="px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 font-medium"
                  title="Reverse rotation direction"
                >
                  {rotationDirection === 'cw' ? <RotateCw className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>{rotationDirection === 'cw' ? '↻ CW' : '↺ CCW'}</span>
                </button>

                {/* Speed Selectors */}
                <div className="bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                  {[0.5, 1, 2, 3].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => { setRotationSpeed(spd); setAutoRotate(true); }}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                        rotationSpeed === spd && autoRotate
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotational Step Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[11px] font-medium hidden lg:inline">Step:</span>
                <button
                  onClick={() => handleStepRotate(-45)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium"
                >
                  ↺ -45°
                </button>
                <button
                  onClick={() => handleStepRotate(-15)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium"
                >
                  ↺ -15°
                </button>
                <button
                  onClick={() => handleStepRotate(15)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium"
                >
                  ↻ +15°
                </button>
                <button
                  onClick={() => handleStepRotate(45)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium"
                >
                  ↻ +45°
                </button>
                <button
                  onClick={() => handleStepRotate(180)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-medium"
                >
                  180° Flip
                </button>
              </div>

              {/* 360° Scrub Range Slider */}
              <div className="flex-1 flex items-center gap-3 min-w-[180px]">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-mono text-xs whitespace-nowrap font-semibold">
                  <Compass className="w-4 h-4" />
                  <span>{azimuthAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={azimuthAngle}
                  onChange={(e) => {
                    setCameraPreset(null);
                    setAutoRotate(false);
                    setAzimuthAngle(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>
            </div>

            {/* 3D WebGL Canvas Viewport */}
            <div className="relative rounded-lg overflow-hidden aspect-[16/9] min-h-[480px] bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Building3DModel
                project={project}
                viewMode={modelViewMode}
                lightingMode={lightingMode}
                explodedLevel={explodedLevel}
                wireframeOnly={wireframeOnly}
                showHotspots={showHotspots}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
                rotationDirection={rotationDirection}
                activeHotspotId={activeHotspotId}
                onSelectHotspot={setActiveHotspotId}
                azimuthAngle={azimuthAngle}
                onAzimuthChange={setAzimuthAngle}
                cameraPreset={cameraPreset}
                isolatedFloor={isolatedFloor}
                activeFinishLayer={activeFinishLayer}
              />

              {/* Compass Indicator Overlay */}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 pointer-events-auto shadow-sm">
                <Compass className="w-4 h-4 text-zinc-900 dark:text-white" />
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block">{getCardinalHeading(azimuthAngle)}</span>
                  <span className="text-[10px] text-zinc-500">Azimuth {azimuthAngle}°</span>
                </div>
              </div>

              {/* Material Layer Filter Floating Pill */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                <span className="px-2 text-zinc-400 text-[10px] uppercase font-semibold">Layers:</span>
                {(['all', 'envelope', 'interior', 'landscape', 'roof'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setActiveFinishLayer(layer)}
                    className={`px-2 py-1 rounded capitalize transition ${
                      activeFinishLayer === layer ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              {/* Camera Presets Quick Bar */}
              <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 shadow-sm">
                <span className="px-2 text-zinc-400 text-[10px] uppercase tracking-wider">Angle:</span>
                <button
                  onClick={() => { setCameraPreset('south'); setAzimuthAngle(180); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'south' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  South (180°)
                </button>
                <button
                  onClick={() => { setCameraPreset('north'); setAzimuthAngle(0); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'north' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  North (0°)
                </button>
                <button
                  onClick={() => { setCameraPreset('east'); setAzimuthAngle(90); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'east' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  East (90°)
                </button>
                <button
                  onClick={() => { setCameraPreset('west'); setAzimuthAngle(270); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'west' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  West (270°)
                </button>
                <button
                  onClick={() => { setCameraPreset('drone'); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'drone' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  Drone
                </button>
                <button
                  onClick={() => { setCameraPreset('eye_level'); }}
                  className={`px-2.5 py-1 rounded transition ${cameraPreset === 'eye_level' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  Eye Level
                </button>
              </div>

              {/* Exploded Floor Slider Overlay */}
              <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-xs space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                    <span>Explode Floors</span>
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white font-mono">{explodedLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explodedLevel}
                  onChange={(e) => setExplodedLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
              </div>

              {/* Snapshot confirmation toast */}
              {snapshotTaken && (
                <div className="absolute top-4 right-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>360° Snapshot Captured!</span>
                </div>
              )}
            </div>

            {/* Floor Isolation Quick Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Storey Isolation:</span>
                <div className="bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                  <button
                    onClick={() => setIsolatedFloor(null)}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      isolatedFloor === null ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    All Levels ({project.floorPlanSpecs.floors} Storeys)
                  </button>
                  <button
                    onClick={() => setIsolatedFloor(0)}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      isolatedFloor === 0 ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Level 1 (Living)
                  </button>
                  <button
                    onClick={() => setIsolatedFloor(1)}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      isolatedFloor === 1 ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Level 2 (Master)
                  </button>
                  {project.floorPlanSpecs.floors > 2 && (
                    <button
                      onClick={() => setIsolatedFloor(2)}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        isolatedFloor === 2 ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      Penthouse
                    </button>
                  )}
                </div>
              </div>

              <div className="text-zinc-500 text-[11px] flex items-center gap-3">
                <span>Use mouse drag, arrow keys, or touch to orbit 360° around the model.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYNCHRONIZED PROPOSED VS FINISHED SPLIT SCREEN */}
        {activeTabMode === 'split_360' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold border border-blue-500/20">
                  Left: Proposed Building (BIM Wireframe)
                </span>
                <span className="text-zinc-400 font-bold">VS</span>
                <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-200 dark:border-zinc-700">
                  Right: Finished Building (Turnkey Photoreal)
                </span>
              </div>
              <div className="text-zinc-500 text-[11px]">
                Drag center slider to compare BIM vs finished turnkey.
              </div>
            </div>

            {/* Interactive Wipe Split Viewport */}
            <div
              className="relative rounded-lg overflow-hidden aspect-[16/9] min-h-[480px] bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm select-none group"
              onMouseMove={(e) => {
                if (!isDraggingSplit) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                setSplitSliderPos(x);
              }}
              onMouseUp={() => setIsDraggingSplit(false)}
              onTouchMove={(e) => {
                if (!isDraggingSplit || e.touches.length !== 1) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(5, Math.min(95, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
                setSplitSliderPos(x);
              }}
              onTouchEnd={() => setIsDraggingSplit(false)}
            >
              {/* Background: Proposed Building BIM */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={activeProposed360.url}
                  alt="Proposed Building"
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-blue-950/20 pointer-events-none" />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/30 text-xs text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2">
                  <HardHat className="w-4 h-4" />
                  <span>PROPOSED BUILDING (BIM SPEC)</span>
                </div>
              </div>

              {/* Foreground: Finished Building (Clipped by splitSliderPos) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `polygon(${splitSliderPos}% 0, 100% 0, 100% 100%, ${splitSliderPos}% 100%)` }}
              >
                <img
                  src={activeFinished360.url}
                  alt="Finished Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>FINISHED BUILDING (TURNKEY)</span>
                </div>
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                style={{ left: `${splitSliderPos}%` }}
                onMouseDown={() => setIsDraggingSplit(true)}
                onTouchStart={() => setIsDraggingSplit(true)}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950 text-white border-2 border-white flex items-center justify-center shadow-lg font-bold text-xs">
                  ↔
                </div>
              </div>

              {/* Bottom Angle Indicator */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 pointer-events-auto flex items-center gap-3 text-xs">
                  <span className="text-zinc-500 font-medium">Viewing Angle:</span>
                  <span className="text-zinc-900 dark:text-white font-bold">{activeFinished360.label}</span>
                </div>
              </div>
            </div>

            {/* Angle Selector Strip for Split Mode */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {finished360Views.map((view, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGalleryAngleIndex(idx)}
                  className={`p-2 rounded-lg border text-center transition ${
                    selectedGalleryAngleIndex === idx
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span className="text-xs block font-bold">{view.angle}°</span>
                  <span className="text-[10px] block truncate text-zinc-500">{view.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 360° SPHERICAL PANORAMA VIRTUAL TOUR */}
        {activeTabMode === 'panorama_360' && (
          <Panorama360Viewer
            scenes={panoramicScenes}
            activeSceneId={activePanoramaSceneId}
            onSceneChange={setActivePanoramaSceneId}
            buildingName={project.name}
          />
        )}

        {/* TAB 4: 8-ANGLE ELEVATION TURNTABLE DIAL */}
        {activeTabMode === 'turntable_gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Display Stage:</span>
                <div className="bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                  <button
                    onClick={() => setGalleryCompareMode('finished')}
                    className={`px-3 py-1 rounded font-medium transition ${
                      galleryCompareMode === 'finished' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Finished Building
                  </button>
                  <button
                    onClick={() => setGalleryCompareMode('proposed')}
                    className={`px-3 py-1 rounded font-medium transition ${
                      galleryCompareMode === 'proposed' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Proposed BIM
                  </button>
                  <button
                    onClick={() => setGalleryCompareMode('side_by_side')}
                    className={`px-3 py-1 rounded font-medium transition ${
                      galleryCompareMode === 'side_by_side' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Dual View
                  </button>
                </div>
              </div>

              <span className="text-zinc-500 text-[11px]">
                Showing {finished360Views.length} calibrated cardinal rotational perspectives (0° to 315°).
              </span>
            </div>

            {/* Main Stage Image / Side-by-Side View */}
            {galleryCompareMode === 'side_by_side' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proposed */}
                <div className="relative rounded-lg overflow-hidden aspect-[16/10] bg-zinc-950 border border-blue-500/30 shadow-sm group">
                  <img
                    src={activeProposed360.url}
                    alt={activeProposed360.label}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded border border-blue-500/30 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    Proposed BIM: {activeProposed360.label}
                  </div>
                </div>

                {/* Finished */}
                <div className="relative rounded-lg overflow-hidden aspect-[16/10] bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm group">
                  <img
                    src={activeFinished360.url}
                    alt={activeFinished360.label}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-900 dark:text-white">
                    Finished Turnkey: {activeFinished360.label}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm group">
                <img
                  src={galleryCompareMode === 'finished' ? activeFinished360.url : activeProposed360.url}
                  alt="Rotational Angle"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-xs text-white">
                  <div className="bg-zinc-950/80 backdrop-blur-md px-4 py-3 rounded-lg border border-zinc-700 max-w-lg">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[10px]">
                      {galleryCompareMode === 'finished' ? 'Turnkey Finished Architecture' : 'Proposed BIM Architectural Core'} • {project.floorPlanSpecs.buildingStyle}
                    </span>
                    <p className="font-bold text-base text-white mt-0.5">
                      {galleryCompareMode === 'finished' ? activeFinished360.label : activeProposed360.label}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive 360 Rotational Turntable Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {finished360Views.map((view, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGalleryAngleIndex(idx)}
                  className={`p-2 rounded-lg border transition text-left space-y-1.5 ${
                    selectedGalleryAngleIndex === idx
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-semibold'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <img
                    src={galleryCompareMode === 'proposed' ? proposed360Views[idx]?.url || view.url : view.url}
                    alt={view.label}
                    className="w-full h-16 object-cover rounded"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold font-mono">{view.angle}°</span>
                    <span className="text-zinc-500 truncate">{view.label.split(' ')[1] || 'Elevation'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FINISHED 3D DETAILS & MATERIAL SPECIFICATION MATRIX */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Finished 3D Architectural Systems & Material Specifications
              </h3>
            </div>
            
            <div className="bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveDetailSection('materials')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  activeDetailSection === 'materials' ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Materials & Finishes
              </button>
              <button
                onClick={() => setActiveDetailSection('interiors')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  activeDetailSection === 'interiors' ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Interior Layouts
              </button>
              <button
                onClick={() => setActiveDetailSection('lighting')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  activeDetailSection === 'lighting' ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Architectural Lighting
              </button>
              <button
                onClick={() => setActiveDetailSection('systems')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  activeDetailSection === 'systems' ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                MEP & Microgrid
              </button>
            </div>
          </div>

          {/* Section 1: Materials & Finishes */}
          {activeDetailSection === 'materials' && (
            <div className="space-y-4">
              {/* High-Resolution Material Board Reference Banner */}
              {project.finishedBuildingRenderAltViews?.[0] && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-[21/9] max-h-48 group">
                  <img
                    src={project.finishedBuildingRenderAltViews[0]}
                    alt="Architectural Material Specifications Board"
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3.5">
                    <div>
                      <span className="text-white text-xs font-bold block">Engineered Material Swatch Board</span>
                      <span className="text-zinc-300 text-[10px]">Honed Italian Travertine, Low-E Acoustic Glazing, Shou Sugi Ban Cedar & Calacatta Gold</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-950 font-bold font-mono">
                      Physical Lab Certified
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-500 uppercase text-[10px]">Exterior Facade</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[9px] font-medium">Class A Fire</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Travertine & Charred Cedar</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Italian honed travertine stone panels paired with Shou Sugi Ban charred Japanese cedar timber slats for weather resistance and organic elegance.
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-500 font-mono">Thermal U-Value: 0.18 W/m²K</div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-500 uppercase text-[10px]">Fenestration</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-medium">SHGC 0.28</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Low-E Triple Glazing</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Argon-filled triple laminated glass with acoustic interlayer (STC 44 rating) set in thermally broken slimline black anodized aluminum frames.
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-500 font-mono">Light Transmittance: 68%</div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-500 uppercase text-[10px]">Flooring & Joinery</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium">FSC-Certified</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Chevron White Oak</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    European engineered white oak flooring in classic chevron pattern with matte UV polyurethane finish, rated for hydronic underfloor heating.
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-500 font-mono">Plank: 19mm / 4mm Wear</div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-500 uppercase text-[10px]">Gourmet Countertops</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[9px] font-medium">Bookmatched</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Calacatta Gold Marble</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Waterfall edge island countertop in polished Italian Calacatta gold marble with seamless undermount sink and flush-mount induction cooktop.
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-500 font-mono">Slab: 30mm Solid Edge</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Interior Layouts */}
          {activeDetailSection === 'interiors' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Home className="w-3.5 h-3.5" />
                  <span>Ground Floor Living & Atrium</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Open-Concept Great Room</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Features a floating steel & oak open-tread staircase, custom sectional lounge in textured charcoal wool, and 3.4m floor-to-ceiling glass corner sliders opening to the pool terrace.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>First Floor Suite</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Primary Master Sanctuary</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Includes a cantilevered private sunset balcony with frameless glass balustrade, walnut slat headboard with integrated coving lights, and ensuite wet room.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Outdoor Living Deck</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Infinity Pool & Teak Loungers</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Submerged baja shelf, underwater LED fiber-optic lighting, solid teak sun loungers with marine-grade ivory fabric cushions, and architectural Japanese maple planters.
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Architectural Lighting */}
          {activeDetailSection === 'lighting' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Circadian Lighting Engine</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Tunable 2700K - 5000K LEDs</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Recessed trimless architectural downlights with DALI-2 automation, automatically adjusting color temperature to synchronize with natural solar altitude.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Exterior Sconces & Uplighting</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Dark-Sky Compliant Fixtures</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Grazing wall sconces on travertine feature walls and recessed linear step lights highlighting the limestone entryway with zero light pollution.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Aquatic Illumination</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Submerged Pool Glow Matrix</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Multi-channel underwater LED fixtures casting deep aquamarine refraction patterns through the water volume and reflecting across the glass facade.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: MEP & Microgrid */}
          {activeDetailSection === 'systems' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Solar Generation</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">18 kWp Monocrystalline PV</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  High-efficiency roof array with Enphase IQ8 microinverters, providing 26,400 kWh annual generation with 20kWh lithium iron phosphate battery backup.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HVAC Heat Recovery</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">VRV / ERV Air Filtration</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Multi-zone variable refrigerant flow system with MERV 16 medical-grade filtration and 88% thermal energy recovery ventilation.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold text-[10px] uppercase">
                  <Trees className="w-3.5 h-3.5" />
                  <span>Stormwater & Sedum Roof</span>
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Living Green Roof Deck</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Extensive drought-tolerant sedum vegetation layer retaining 70% of stormwater runoff and improving rooftop solar panel efficiency via cooling effect.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
