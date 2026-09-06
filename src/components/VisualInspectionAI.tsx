import React, { useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Eye, 
  ZoomIn, 
  Layers, 
  Maximize2,
  HardHat,
  FileCheck,
  Building
} from 'lucide-react';
import { ConstructionProject, SitePhotoInspection } from '../types';
import activeSiteStageImage from '../assets/images/active_site_construction_stage_1787752675722.jpg';
import siteRoofGlazingImage from '../assets/images/site_roof_glazing_progress_1787752692277.jpg';

interface VisualInspectionAIProps {
  project: ConstructionProject;
  onUpdateProject: (updated: ConstructionProject) => void;
  onOpenAdvisorModal: () => void;
}

export const VisualInspectionAI: React.FC<VisualInspectionAIProps> = ({
  project,
  onUpdateProject,
  onOpenAdvisorModal,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhotoInspection>(
    project.sitePhotos[0] || {
      id: 'default-photo',
      timestamp: new Date().toISOString(),
      phaseId: 'ms-4',
      phaseName: 'Phase 4: High-Performance Glazing & Enclosure',
      zone: 'Zone A - South Elevation Glazing Track',
      imageUrl: activeSiteStageImage,
      caption: 'Aluminum sub-frame installation and vapor barrier gasket inspection.',
      inspectedBy: 'Marcus Chen, Lead QA/QC Engineer',
      aiAnalysis: {
        overallHealth: 'Optimal',
        completionEstimatePercent: 64,
        detectedElements: ['Aluminum Sub-Frames', 'EPDM Vapor Barrier Gasket', 'Concrete Soffit', 'Laser Level Mounts'],
        complianceScore: 98,
        defectFindings: [],
        safetyObservations: ['Glazing crew anchored to static lifelines', 'Perimeter guardrails fully compliant'],
        executiveSummary: 'Flawless perimeter seal installation. Gaskets installed strictly per architectural specifications.',
      },
    }
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [customZone, setCustomZone] = useState('Zone B - Level 2 Framing');
  const [customCaption, setCustomCaption] = useState('On-site rebar and conduit embedment check prior to slab pour.');
  const [compareMode, setCompareMode] = useState(false);

  // Preset sample inspection photos to test the AI vision inspector
  const sampleInspectionGallery = [
    {
      id: 'sample-glazing',
      phaseName: 'Phase 4: High-Performance Glazing',
      zone: 'South Cantilever Terrace',
      caption: 'Curtain wall extrusion brackets & laser alignment check.',
      imageUrl: activeSiteStageImage,
    },
    {
      id: 'sample-roof',
      phaseName: 'Phase 4: Roofing & Waterproofing',
      zone: 'Level 3 Rooftop Deck',
      caption: 'PIR insulation and dual-layer SBS membrane application.',
      imageUrl: siteRoofGlazingImage,
    },
    {
      id: 'sample-rebar',
      phaseName: 'Phase 3: Structural Framing',
      zone: 'Gridline C-4 Columns',
      caption: 'Architectural concrete column formwork post-striking.',
      imageUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'sample-timber',
      phaseName: 'Phase 2: Heavy Timber Assembly',
      zone: 'East Atrium Glulam Core',
      caption: 'Glulam beam connections and crane hoisting survey.',
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomImageBase64(base64);

      const newPhoto: SitePhotoInspection = {
        id: `upload-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        phaseId: 'custom-phase',
        phaseName: 'Current Active Phase',
        zone: customZone,
        imageUrl: base64,
        caption: customCaption || file.name,
        inspectedBy: 'On-Site Quality Auditor',
      };
      setSelectedPhoto(newPhoto);
      // Run AI inspection automatically on uploaded photo
      runPhotoAnalysis(base64, newPhoto);
    };
    reader.readAsDataURL(file);
  };

  const runPhotoAnalysis = async (imgBase64?: string, photoTarget?: SitePhotoInspection) => {
    const target = photoTarget || selectedPhoto;
    setIsAnalyzing(true);

    try {
      const payload = {
        imageBase64: imgBase64 || target.imageUrl,
        mimeType: 'image/jpeg',
        phaseName: target.phaseName,
        zone: target.zone,
        expectedSpecs: `Adherence to ${project.name} structural drawings and materials specifications: ${project.materialSpecs.structuralCore}, ${project.materialSpecs.facadeType}.`,
      };

      const res = await fetch('/api/ai/analyze-site-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        const updatedPhoto: SitePhotoInspection = {
          ...target,
          aiAnalysis: data.analysis,
        };
        setSelectedPhoto(updatedPhoto);

        // Add or update in project site photos
        const existingIdx = project.sitePhotos.findIndex((p) => p.id === target.id);
        let newPhotos = [...project.sitePhotos];
        if (existingIdx >= 0) {
          newPhotos[existingIdx] = updatedPhoto;
        } else {
          newPhotos = [updatedPhoto, ...newPhotos];
        }

        onUpdateProject({
          ...project,
          sitePhotos: newPhotos,
        });
      }
    } catch (err) {
      console.error('Failed to run AI site photo audit:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-500/20">
                Multimodal AI Vision Quality Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Photographic Situation Reports & AI Forensic Site Audits
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Inspect active on-site photographs, verify structural elements, identify micro-defects, and compare physical progress against the finished building BIM render.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border min-h-[40px] ${
                compareMode
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{compareMode ? 'Exit Comparison' : 'Compare vs 3D Model'}</span>
            </button>

            <label className="px-3.5 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm min-h-[40px]">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Viewer & Image Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Photo View Container */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">
                  {selectedPhoto.zone}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {selectedPhoto.phaseName} • Logged by: {selectedPhoto.inspectedBy}
                </span>
              </div>

              <button
                onClick={() => runPhotoAnalysis()}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 min-h-[36px]"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Running Vision Scan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                    <span>Re-Run AI Vision Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* If Compare Mode is Active: Show side-by-side site photo vs finished render */}
            {compareMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">
                    Active Site Photo (In-Progress)
                  </span>
                  <div className="relative rounded-lg overflow-hidden aspect-[4/3] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={selectedPhoto.imageUrl}
                      alt={selectedPhoto.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Target Finished 3D BIM Model
                  </span>
                  <div className="relative rounded-lg overflow-hidden aspect-[4/3] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={project.finishedBuildingRenderUrl}
                      alt="Finished Architectural Model"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden aspect-[16/10] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Overlay Caption */}
                <div className="absolute bottom-3 left-3 right-3 text-xs text-white">
                  <p className="font-semibold text-white">{selectedPhoto.caption}</p>
                  <span className="text-[10px] text-zinc-300">
                    Inspected {new Date(selectedPhoto.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {/* 3D Spatial Zone Locator & Architectural Specification Tolerances */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-500" />
                  <span>3D Spatial Zone Locator & Engineering Tolerance Matrix</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                  Target Spec: Millimeter-Grade
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-900 dark:text-white">AAMA 501.2 Water Penetration</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">0.00 gpm (Passed)</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Dynamic hose nozzle pressure testing conducted at 500 kPa along facade joints.</p>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-900 dark:text-white">Structural Plumbness</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">±1.2mm (Limit ±3mm)</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Total Station laser triangulation across 8 perimeter columns and slab edges.</p>
                </div>
              </div>
            </div>

            {/* Quick Inspection Gallery Selector */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                Select Site Inspection Zone Sample:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sampleInspectionGallery.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      const samplePhoto: SitePhotoInspection = {
                        id: sample.id,
                        timestamp: new Date().toISOString(),
                        phaseId: 'sample-phase',
                        phaseName: sample.phaseName,
                        zone: sample.zone,
                        imageUrl: sample.imageUrl,
                        caption: sample.caption,
                        inspectedBy: 'QA/QC Inspection Lead',
                        aiAnalysis: {
                          overallHealth: 'Optimal',
                          completionEstimatePercent: 75,
                          detectedElements: ['Structural Elements', 'Safety Perimeter', 'Material Staging'],
                          complianceScore: 96,
                          defectFindings: [],
                          safetyObservations: ['Full PPE compliance on active work deck'],
                          executiveSummary: `Verified ${sample.zone} aligns with structural drawings and quality criteria.`,
                        },
                      };
                      setSelectedPhoto(samplePhoto);
                    }}
                    className={`text-left p-2 rounded-lg border transition ${
                      selectedPhoto.imageUrl === sample.imageUrl
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.zone}
                      className="w-full h-14 object-cover rounded mb-1.5"
                    />
                    <span className="text-[10px] font-medium block truncate">{sample.zone}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Forensic Analysis Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  AI Forensic Quality Audit
                </h3>
              </div>

              {selectedPhoto.aiAnalysis && (
                selectedPhoto.aiAnalysis.complianceScore !== null && selectedPhoto.aiAnalysis.complianceScore !== undefined ? (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {selectedPhoto.aiAnalysis.complianceScore}% Preliminary Score
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Human Review Required
                  </span>
                )
              )}
            </div>

            {/* Mandatory Governance Notice */}
            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[10px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
              <span>Governance Status: AI-Assisted Advisory</span>
              <span className="text-zinc-500 dark:text-zinc-400">Formal Sign-Off Requires Licensed QA/QC Auditor</span>
            </div>

            {selectedPhoto.aiAnalysis ? (
              <div className="space-y-4 text-xs">
                {/* Fallback warning if AI was unavailable */}
                {selectedPhoto.aiAnalysis.overallHealth === 'HUMAN_REVIEW_REQUIRED' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>AI Vision Analysis Unavailable</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      In accordance with Structura Engineering Governance, structural compliance scores and stage approvals cannot be fabricated. A physical audit by a certified Structural QA/QC Engineer is required.
                    </p>
                  </div>
                )}

                {/* Executive Summary */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                    Structural Engineer Evaluation
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {selectedPhoto.aiAnalysis.executiveSummary}
                  </p>
                </div>

                {/* Detected Structural & Mechanical Elements */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                    Detected Structural & Architectural Elements
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPhoto.aiAnalysis.detectedElements.length > 0 ? (
                      selectedPhoto.aiAnalysis.detectedElements.map((el, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium"
                        >
                          {el}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 text-[11px] italic">No automated detections — manual site inspection pending.</span>
                    )}
                  </div>
                </div>

                {/* Defect Findings (if any) */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                    Quality Non-Conformances & Defect Alerts
                  </span>
                  {selectedPhoto.aiAnalysis.defectFindings.length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Preliminary vision check clear. Physical inspection required for statutory sign-off.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPhoto.aiAnalysis.defectFindings.map((defect, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-800 dark:text-amber-300">{defect.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                              Severity: {defect.severity}
                            </span>
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">{defect.description}</p>
                          <p className="text-zinc-500 text-[11px]">
                            <strong className="text-zinc-800 dark:text-zinc-200">Recommendation:</strong> {defect.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Safety Observations */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                    OSHA Safety & Housekeeping Compliance
                  </span>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                    {selectedPhoto.aiAnalysis.safetyObservations.map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 space-y-3">
                <Camera className="w-8 h-8 mx-auto text-zinc-400" />
                <p>Click "Re-Run AI Vision Audit" to analyze this photograph.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
