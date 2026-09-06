import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  Hammer, 
  Calculator, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Maximize2
} from 'lucide-react';
import { 
  LandSpecifications, 
  FloorPlanSpecifications, 
  MaterialSpecifications, 
  ConstructionProject,
  EstimateAndProposeResponse,
  EstimateSpecsPayload
} from '../types';

interface ProjectEstimatorWizardProps {
  onSaveNewProject?: (newProject: ConstructionProject) => void;
  onProjectCreated?: (newProject: ConstructionProject) => void;
  onCancel?: () => void;
  activeProject?: ConstructionProject;
}

export const ProjectEstimatorWizard: React.FC<ProjectEstimatorWizardProps> = ({
  onSaveNewProject,
  onProjectCreated,
  onCancel,
  activeProject,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [projectName, setProjectName] = useState('New Architectural Estate Development');
  const [clientName, setClientName] = useState('Private Family Office');
  const [contractorName, setContractorName] = useState('Premier EPC Construction Partners');
  const [location, setLocation] = useState('Aspen Hillcrest Ridge, CA');

  // Land Specs
  const [landSpecs, setLandSpecs] = useState<LandSpecifications>({
    plotAreaSqm: 1600,
    topography: 'Sloped / Terraced',
    soilType: 'Standard Sandy Clay',
    zoningClassification: 'R-1 Low Density Residential',
    setbackMeters: { front: 7.5, rear: 8.0, left: 3.5, right: 3.5 },
    location: 'Hillcrest Ridge',
  });

  // Floor Plan Specs
  const [floorPlanSpecs, setFloorPlanSpecs] = useState<FloorPlanSpecifications>({
    grossFloorAreaSqm: 540,
    floors: 2,
    buildingStyle: 'Contemporary Minimalist',
    ceilingHeightMeters: 3.6,
    bedroomCount: 4,
    bathroomCount: 5,
    hasBasement: true,
    hasSwimmingPool: true,
    hasRooftopDeck: true,
  });

  // Material Specs
  const [materialSpecs, setMaterialSpecs] = useState<MaterialSpecifications>({
    structuralCore: 'Hybrid Steel-Concrete Core',
    foundationType: 'Deep Bored Piling & Grade Beams',
    facadeType: 'Unitized Glass Curtain Wall & Terracotta',
    roofType: 'Insulated Concrete Flat Deck with Solar PV',
    mepTier: 'High-Efficiency VRF HVAC + Smart Building Controls',
    interiorGrade: 'Ultra-Luxury Bespoke (Marble, Millwork, Smart Automation)',
  });

  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState<string | null>(null);
  const [estimationResult, setEstimationResult] = useState<EstimateAndProposeResponse | null>(null);

  // Architectural Archetypes for Finished Building Render preview
  const buildingStyleGallery: Record<string, { image: string; prompt: string; desc: string }> = {
    'Contemporary Minimalist': {
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
      prompt: 'Photorealistic architectural exterior rendering of an ultra-luxury 2-storey contemporary minimalist villa, floor-to-ceiling glass curtain walls, cantilevered concrete decks, ambient LED warm lighting at dusk, reflecting infinity pool, 8k resolution.',
      desc: 'Sleek geometric lines, full-height glazing, seamless indoor-outdoor transitions with cantilevered overhangs.',
    },
    'Industrial Modern Luxury': {
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
      prompt: 'Architectural masterpiece photograph of an industrial modern luxury residence with exposed black steel columns, board-marked concrete facades, warm timber soffits, large architectural windows, golden hour.',
      desc: 'Exposed structural steel elements, board-formed concrete walls, and dark metal cladding accents.',
    },
    'Mediterranean Coastal': {
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
      prompt: 'High-end architectural villa with natural limestone masonry, terracotta tiled roof accents, lush olive trees, warm cream stucco, azure horizon infinity pool, warm midday sun.',
      desc: 'Natural stone masonry, deep shaded loggias, terracotta accents, and drought-tolerant luxury landscaping.',
    },
    'Scandinavian Mass Timber': {
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
      prompt: 'Sustainable mass-timber architectural residence with vertical cedar batten facade, glulam posts, triple-glazed Scandinavian windows, forest backdrop, soft natural morning light.',
      desc: 'Cross-laminated timber core, natural cedar rain-screen, warm biophilic wood interiors, and low-carbon footprint.',
    },
    'Biophilic Sustainable': {
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
      prompt: 'Futuristic biophilic luxury architecture with integrated vertical garden walls, rooftop green lawn, solar glass panels, natural light atriums, pristine blue sky.',
      desc: 'Living vertical foliage, intensive green roof garden, passive solar orientation, and smart microclimate integration.',
    },
  };

  const handleRunEstimation = async () => {
    setIsEstimating(true);
    setEstimationError(null);
    try {
      const payload: EstimateSpecsPayload = {
        projectName,
        location,
        landArea: landSpecs.plotAreaSqm,
        grossFloorArea: floorPlanSpecs.grossFloorAreaSqm,
        floors: floorPlanSpecs.floors,
        buildingStyle: floorPlanSpecs.buildingStyle,
        structuralCore: materialSpecs.structuralCore,
        foundationType: materialSpecs.foundationType,
        facadeType: materialSpecs.facadeType,
        roofType: materialSpecs.roofType,
        mepTier: materialSpecs.mepTier,
        interiorGrade: materialSpecs.interiorGrade,
        amenities: {
          basement: floorPlanSpecs.hasBasement,
          pool: floorPlanSpecs.hasSwimmingPool,
          rooftop: floorPlanSpecs.hasRooftopDeck,
        },
      };

      const res = await fetch('/api/projects/estimate-and-propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Estimation service error (${res.status}): ${res.statusText}`);
      }

      const data: EstimateAndProposeResponse = await res.json();
      if (data.success && data.calculatedBudget) {
        setEstimationResult(data);
        setStep(4);
      } else {
        throw new Error(data.error || 'Server did not return calculated budget');
      }
    } catch (err: any) {
      console.error('Failed to run AI estimation:', err);
      setEstimationError(err.message || 'Failed to connect to estimation service. Please check network.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleCreateAndAdoptProject = () => {
    if (!estimationResult) return;
    const budget = estimationResult.calculatedBudget;
    const total = budget.totalEstimatedCost;
    const styleInfo = buildingStyleGallery[floorPlanSpecs.buildingStyle] || buildingStyleGallery['Contemporary Minimalist'];

    const newProject: ConstructionProject = {
      id: `proj-${Date.now().toString().slice(-6)}`,
      name: projectName,
      clientName: clientName,
      contractorName: contractorName,
      location: location,
      startDate: new Date().toISOString().split('T')[0],
      targetHandoverDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * budget.takeoff.estimatedDurationMonths).toISOString().split('T')[0],
      currentPhaseIndex: 0,
      overallProgressPercentage: 0,
      totalBaselineBudgetUSD: total,
      actualCostIncurredUSD: 0,
      forecastAtCompletionUSD: total,
      confidenceScore: 98,
      landSpecs,
      floorPlanSpecs,
      materialSpecs,
      finishedBuildingRenderUrl: styleInfo.image,
      finishedBuildingRenderAltViews: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
      ],
      proposedBuildingRenderUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85',
      proposedBuildingRenderAltViews: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1600&q=85',
      ],
      finishedBuilding360Views: [
        { angle: 0, label: '0° North Elevation (Main Portico)', url: styleInfo.image },
        { angle: 90, label: '90° East Elevation (Morning Terrace)', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85' },
        { angle: 180, label: '180° South Elevation (Primary Facade)', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85' },
        { angle: 270, label: '270° West Elevation (Sunset Deck & Pool)', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85' },
      ],
      proposedBuilding360Views: [
        { angle: 0, label: '0° North BIM Schematic', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85' },
        { angle: 90, label: '90° East Massing Model', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85' },
        { angle: 180, label: '180° South Structural Elevation', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85' },
        { angle: 270, label: '270° West Shear Core & Foundation Model', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1600&q=85' },
      ],
      panoramic360Tours: [
        {
          id: 'tour-exterior-new',
          name: `${projectName} - Exterior 360° Panorama`,
          type: 'exterior',
          equirectangularUrl: styleInfo.image,
          description: `Full 360° exterior perspective of the custom ${floorPlanSpecs.buildingStyle} architecture.`,
        },
        {
          id: 'tour-interior-new',
          name: `${projectName} - Interior Living Pavilion 360°`,
          type: 'interior',
          equirectangularUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90',
          description: `360° interior walkthrough with ${materialSpecs.interiorGrade} specifications.`,
        },
      ],
      architecturalPrompt: styleInfo.prompt,
      milestones: (estimationResult.aiInsights?.recommendedPhases || []).map((ph: any, idx: number) => ({
        id: `ms-new-${idx + 1}`,
        name: `Phase ${idx + 1}: ${ph.name}`,
        phaseOrder: idx + 1,
        plannedStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * (idx * 4)).toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * ((idx + 1) * 4)).toISOString().split('T')[0],
        status: idx === 0 ? 'In Progress' : 'Upcoming',
        progressPercentage: 0,
        costAllocationUSD: Math.round((total * (ph.costSharePercent || 16)) / 100),
        payoutApproved: false,
        escrowStatus: idx === 0 ? 'Pending Sign-Off' : 'Not Reached',
        certificationsRequired: ['Geotechnical Inspection', 'Municipal Compliance'],
        certificationsCleared: false,
        contractorClaimUSD: 0,
      })),
      boq: [
        {
          id: 'boq-sub',
          category: 'Substructure',
          description: `Foundation System: ${materialSpecs.foundationType}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.substructure,
          totalCostUSD: budget.substructure,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
        {
          id: 'boq-super',
          category: 'Superstructure',
          description: `Structural Frame: ${materialSpecs.structuralCore}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.superstructure,
          totalCostUSD: budget.superstructure,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
        {
          id: 'boq-encl',
          category: 'Envelope & Facade',
          description: `Facade Envelope: ${materialSpecs.facadeType}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.enclosureGlazing,
          totalCostUSD: budget.enclosureGlazing,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
        {
          id: 'boq-roof',
          category: 'Roofing',
          description: `Roofing System: ${materialSpecs.roofType}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.roofing,
          totalCostUSD: budget.roofing,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
        {
          id: 'boq-mep',
          category: 'MEP & HVAC',
          description: `Mechanical, Electrical & HVAC: ${materialSpecs.mepTier}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.mepHvac,
          totalCostUSD: budget.mepHvac,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
        {
          id: 'boq-fin',
          category: 'Interior Finishes',
          description: `Interior Grade: ${materialSpecs.interiorGrade}`,
          unit: 'Lot',
          quantity: 1,
          unitRateUSD: budget.interiorFitout,
          totalCostUSD: budget.interiorFitout,
          spentUSD: 0,
          variancePercentage: 0,
          status: 'On Target',
        },
      ],
      sitePhotos: [],
      periodicLogs: [],
      situationReports: [],
      curveData: [
        { month: 'Month 1', plannedBudget: Math.round(total * 0.08), actualSpend: 0, earnedValue: 0, targetProgress: 8, actualProgress: 0 },
        { month: 'Month 2', plannedBudget: Math.round(total * 0.20), actualSpend: 0, earnedValue: 0, targetProgress: 20, actualProgress: 0 },
        { month: 'Month 4', plannedBudget: Math.round(total * 0.45), actualSpend: 0, earnedValue: 0, targetProgress: 45, actualProgress: 0 },
        { month: 'Month 6', plannedBudget: Math.round(total * 0.70), actualSpend: 0, earnedValue: 0, targetProgress: 70, actualProgress: 0 },
        { month: 'Month 9', plannedBudget: Math.round(total * 0.90), actualSpend: 0, earnedValue: 0, targetProgress: 90, actualProgress: 0 },
        { month: 'Month 12', plannedBudget: total, actualSpend: 0, earnedValue: 0, targetProgress: 100, actualProgress: 0 },
      ],
    };

    if (onProjectCreated) {
      onProjectCreated(newProject);
    } else if (onSaveNewProject) {
      onSaveNewProject(newProject);
    }
  };

  const currentStyle = buildingStyleGallery[floorPlanSpecs.buildingStyle] || buildingStyleGallery['Contemporary Minimalist'];

  return (
    <div className="space-y-6">
      {/* Top Banner with Stepper */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm relative overflow-hidden transition-colors duration-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800">
                Architectural Estimation & 3D Profer Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Land, Floor Plan & Material Specification Matrix
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
              Input engineering boundaries, structural parameters, and material tiers to generate a bank-grade Bill of Quantities (BOQ), critical path timeline, and finished building 3D visualization.
            </p>
          </div>

          {/* Step Indicators (Next.js segmented tabs) */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                step === 1 ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>1. Land</span>
            </button>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                step === 2 ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Floor Plan</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                step === 3 ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white font-semibold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>3. Materials</span>
            </button>
            {estimationResult && (
              <button
                onClick={() => setStep(4)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  step === 4 ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>4. Calculated BOQ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs vs Live Architectural Render Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields according to active step */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Land & Zoning Specifications */}
          {step === 1 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <Compass className="w-5 h-5 text-zinc-900 dark:text-white" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Land Topography & Geotechnical Parameters</h3>
                  <p className="text-xs text-zinc-500">Define plot boundaries, soil bearing capacity, and municipal setbacks.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Project Title</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Project Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Total Plot Area (m²)</label>
                  <input
                    type="number"
                    value={landSpecs.plotAreaSqm}
                    onChange={(e) => setLandSpecs({ ...landSpecs, plotAreaSqm: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Land Topography</label>
                  <select
                    value={landSpecs.topography}
                    onChange={(e) => setLandSpecs({ ...landSpecs, topography: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Flat / Level Ground">Flat / Level Ground</option>
                    <option value="Sloped / Terraced">Sloped / Terraced (Requires Retaining Structures)</option>
                    <option value="Rocky Hillside">Rocky Hillside (Requires Rock Anchoring)</option>
                    <option value="Coastal / High Water Table">Coastal / High Water Table (Submersible Specs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Soil Condition & Strata</label>
                  <select
                    value={landSpecs.soilType}
                    onChange={(e) => setLandSpecs({ ...landSpecs, soilType: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Standard Sandy Clay">Standard Sandy Clay (200 kPa bearing)</option>
                    <option value="Dense Gravel / Rock">Dense Gravel / Basalt Bedrock (400+ kPa)</option>
                    <option value="Soft Clay / Silt">Soft Clay / Silt (Requires Bored Piles)</option>
                    <option value="Expansive Clay">Expansive Reactive Clay (Special Void Formers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Zoning & Density Code</label>
                  <select
                    value={landSpecs.zoningClassification}
                    onChange={(e) => setLandSpecs({ ...landSpecs, zoningClassification: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="R-1 Low Density Residential">R-1 Low Density Single Family Residential</option>
                    <option value="R-3 Multi-Family Luxury">R-3 Multi-Family Luxury Residential</option>
                    <option value="Commercial Mixed-Use">Commercial Mixed-Use (Retail / Office)</option>
                    <option value="Light Industrial">Light Industrial / Tech Facility</option>
                  </select>
                </div>
              </div>

              {/* Setbacks */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Municipal Setback Envelopes (Meters)</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-zinc-500 block text-[11px]">Front</span>
                    <input
                      type="number"
                      step="0.5"
                      value={landSpecs.setbackMeters.front}
                      onChange={(e) => setLandSpecs({ ...landSpecs, setbackMeters: { ...landSpecs.setbackMeters, front: Number(e.target.value) } })}
                      className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-zinc-500 block text-[11px]">Rear</span>
                    <input
                      type="number"
                      step="0.5"
                      value={landSpecs.setbackMeters.rear}
                      onChange={(e) => setLandSpecs({ ...landSpecs, setbackMeters: { ...landSpecs.setbackMeters, rear: Number(e.target.value) } })}
                      className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-zinc-500 block text-[11px]">Left</span>
                    <input
                      type="number"
                      step="0.5"
                      value={landSpecs.setbackMeters.left}
                      onChange={(e) => setLandSpecs({ ...landSpecs, setbackMeters: { ...landSpecs.setbackMeters, left: Number(e.target.value) } })}
                      className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-zinc-500 block text-[11px]">Right</span>
                    <input
                      type="number"
                      step="0.5"
                      value={landSpecs.setbackMeters.right}
                      onChange={(e) => setLandSpecs({ ...landSpecs, setbackMeters: { ...landSpecs.setbackMeters, right: Number(e.target.value) } })}
                      className="w-full bg-transparent text-center font-bold text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs flex items-center gap-2 transition shadow-sm"
                >
                  <span>Proceed to Floor Plan Specs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Floor Plan & Volumetric Specs */}
          {step === 2 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <Layers className="w-5 h-5 text-zinc-900 dark:text-white" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Floor Plan Dimensions & Architectural Geometry</h3>
                  <p className="text-xs text-zinc-500">Configure gross built area, vertical storeys, ceiling volumes, and style.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Architectural Archetype</label>
                  <select
                    value={floorPlanSpecs.buildingStyle}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, buildingStyle: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Contemporary Minimalist">Contemporary Minimalist</option>
                    <option value="Industrial Modern Luxury">Industrial Modern Luxury</option>
                    <option value="Mediterranean Coastal">Mediterranean Coastal</option>
                    <option value="Scandinavian Mass Timber">Scandinavian Mass Timber</option>
                    <option value="Biophilic Sustainable">Biophilic Sustainable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Total Gross Floor Area (GFA m²)</label>
                  <input
                    type="number"
                    value={floorPlanSpecs.grossFloorAreaSqm}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, grossFloorAreaSqm: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Number of Above-Ground Storeys</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={floorPlanSpecs.floors}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, floors: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Floor-to-Ceiling Clear Height (m)</label>
                  <select
                    value={floorPlanSpecs.ceilingHeightMeters}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, ceilingHeightMeters: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value={3.0}>3.0 m (Standard Residential)</option>
                    <option value={3.6}>3.6 m (High-End Luxury Volume)</option>
                    <option value={4.2}>4.2 m (Grand Gallery Height)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bedrooms / Executive Suites</label>
                  <input
                    type="number"
                    value={floorPlanSpecs.bedroomCount}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, bedroomCount: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bathrooms / Ensuites</label>
                  <input
                    type="number"
                    value={floorPlanSpecs.bathroomCount}
                    onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, bathroomCount: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>
              </div>

              {/* Special Options Checkboxes */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Integrated Architectural Amenities</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                    <input
                      type="checkbox"
                      checked={floorPlanSpecs.hasBasement}
                      onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, hasBasement: e.target.checked })}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block">Underground Basement</span>
                      <span className="text-[10px] text-zinc-500">Subterranean parking & plant</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                    <input
                      type="checkbox"
                      checked={floorPlanSpecs.hasSwimmingPool}
                      onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, hasSwimmingPool: e.target.checked })}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block">Infinity Lap Pool</span>
                      <span className="text-[10px] text-zinc-500">Overflow structural pool</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                    <input
                      type="checkbox"
                      checked={floorPlanSpecs.hasRooftopDeck}
                      onChange={(e) => setFloorPlanSpecs({ ...floorPlanSpecs, hasRooftopDeck: e.target.checked })}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block">Rooftop Living Deck</span>
                      <span className="text-[10px] text-zinc-500">Panoramic terrace & solar canopy</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                >
                  Back to Land Specs
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs flex items-center gap-2 transition shadow-sm"
                >
                  <span>Proceed to Materials & Systems</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Material Engineering & Systems Specs */}
          {step === 3 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <Hammer className="w-5 h-5 text-zinc-900 dark:text-white" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Materials, Core Structure & MEP Systems</h3>
                  <p className="text-xs text-zinc-500">Select structural framework, building envelope, MEP efficiency, and fitout.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Structural Core Framework</label>
                  <select
                    value={materialSpecs.structuralCore}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, structuralCore: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Reinforced Concrete (RC Frame)">Reinforced Concrete (RC Frame & Flat Slab)</option>
                    <option value="Structural Steel & Composite Deck">Structural Steel & Composite Deck</option>
                    <option value="Mass Timber (CLT / Glulam)">Mass Timber (CLT / Glulam Engineered Wood)</option>
                    <option value="Hybrid Steel-Concrete Core">Hybrid Steel-Concrete Core</option>
                    <option value="Reinforced Masonry & Precast">Reinforced Masonry & Precast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Substructure Foundation System</label>
                  <select
                    value={materialSpecs.foundationType}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, foundationType: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Raft / Mat Slab Foundation">Raft / Mat Slab Foundation</option>
                    <option value="Deep Bored Piling & Grade Beams">Deep Bored Piling & Grade Beams (Sloped / Hard Ground)</option>
                    <option value="Continuous Strip Footing">Continuous Strip Footing</option>
                    <option value="Reinforced Pad Footings & Tie Beams">Reinforced Pad Footings & Tie Beams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Facade & Glazing Envelope</label>
                  <select
                    value={materialSpecs.facadeType}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, facadeType: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Unitized Glass Curtain Wall & Terracotta">Unitized Glass Curtain Wall & Terracotta</option>
                    <option value="Natural Limestone & Architectural Concrete">Natural Limestone & Architectural Concrete</option>
                    <option value="High-Performance EIFS & Timber Cladding">High-Performance EIFS & Timber Cladding</option>
                    <option value="Double-Skin Ventilated Facade">Double-Skin Ventilated Facade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Roofing Assembly</label>
                  <select
                    value={materialSpecs.roofType}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, roofType: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Insulated Concrete Flat Deck with Solar PV">Insulated Concrete Flat Deck with Solar PV</option>
                    <option value="Standing Seam Zinc / Aluminum">Standing Seam Zinc / Aluminum</option>
                    <option value="Intensive Green Living Roof">Intensive Green Living Roof</option>
                    <option value="Spanish Clay Tile on Trusses">Spanish Clay Tile on Trusses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">MEP & HVAC Performance Tier</label>
                  <select
                    value={materialSpecs.mepTier}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, mepTier: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="High-Efficiency VRF HVAC + Smart Building Controls">High-Efficiency VRF HVAC + Smart Building Controls</option>
                    <option value="Net-Zero Carbon (Geothermal/Solar PV + Smart Microgrid)">Net-Zero Carbon (Geothermal + Solar Microgrid)</option>
                    <option value="Standard Residential / Commercial Grade">Standard Residential / Commercial Grade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Interior Fitout & Finishes</label>
                  <select
                    value={materialSpecs.interiorGrade}
                    onChange={(e) => setMaterialSpecs({ ...materialSpecs, interiorGrade: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Ultra-Luxury Bespoke (Marble, Millwork, Smart Automation)">Ultra-Luxury Bespoke (Marble, Millwork, Automation)</option>
                    <option value="Premium Contemporary Finish">Premium Contemporary Finish</option>
                    <option value="Minimalist High-Spec Architectural">Minimalist High-Spec Architectural</option>
                    <option value="Standard Commercial Finish">Standard Commercial Finish</option>
                  </select>
                </div>
              </div>

              {/* Error Banner if calculation fails */}
              {estimationError && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{estimationError}</span>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                >
                  Back to Floor Plan
                </button>
                <button
                  onClick={handleRunEstimation}
                  disabled={isEstimating}
                  className="px-6 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs flex items-center gap-2 transition shadow-sm disabled:opacity-50"
                >
                  {isEstimating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Engine Synthesizing BOQ & Finished 3D...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Calculate Comprehensive BOQ & Generate 3D</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Calculated Estimate & Bill of Quantities Result */}
          {step === 4 && estimationResult && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6 transition-colors duration-200">
              {/* Engineering Governance Notice */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  AI-Assisted Preliminary Cost Model
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                  Subject to Chartered Quantity Surveyor & Structural Engineer Verification
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Calculated BOQ Takeoff & Cost Estimation</h3>
                    <p className="text-xs text-zinc-500">Chartered structural cost takeoff and baseline schedule.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Estimated Cost</span>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                    ${estimationResult.calculatedBudget.totalEstimatedCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Top Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Cost per m² GFA</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-white font-mono">${estimationResult.calculatedBudget.costPerSqm.toLocaleString()} / m²</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Estimated Duration</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {estimationResult.calculatedBudget.takeoff.estimatedDurationMonths} Months
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Concrete Volume</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-white font-mono">
                    {estimationResult.calculatedBudget.takeoff.concreteVolumeM3} m³
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[11px]">Rebar Steel Tonnage</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-white font-mono">
                    {estimationResult.calculatedBudget.takeoff.rebarSteelTonnes} Tonnes
                  </span>
                </div>
              </div>

              {/* Trade Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span>Work Package Direct Cost Distribution</span>
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="py-2.5 px-3 font-semibold">Trade Package</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Cost (USD)</th>
                        <th className="py-2.5 px-3 font-semibold text-right">% of Direct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Substructure & Foundations ({materialSpecs.foundationType})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.substructure.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.substructure / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Superstructure & Framing ({materialSpecs.structuralCore})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.superstructure.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.superstructure / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Building Envelope & Glazing ({materialSpecs.facadeType})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.enclosureGlazing.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.enclosureGlazing / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Roofing & Waterproofing ({materialSpecs.roofType})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.roofing.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.roofing / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Mechanical, Electrical & HVAC ({materialSpecs.mepTier})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.mepHvac.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.mepHvac / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Architectural Finishes & Fitout ({materialSpecs.interiorGrade})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${estimationResult.calculatedBudget.interiorFitout.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          {Math.round((estimationResult.calculatedBudget.interiorFitout / estimationResult.calculatedBudget.directSubtotal) * 100)}%
                        </td>
                      </tr>
                      <tr className="bg-zinc-100/70 dark:bg-zinc-900/80 font-bold text-zinc-900 dark:text-white">
                        <td className="py-2.5 px-3">Contingency & Preliminaries Reserve (25%)</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ${(
                            estimationResult.calculatedBudget.prelimsAndSupervision +
                            estimationResult.calculatedBudget.contractorMargin +
                            estimationResult.calculatedBudget.contingency
                          ).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">25%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Value Engineering & Risk Factors */}
              {estimationResult.aiInsights && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>AI Value Engineering Recommendations</span>
                    </div>
                    <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                      {(estimationResult.aiInsights.valueEngineeringNotes || []).map((note: string, idx: number) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Critical Execution & Procurement Risks</span>
                    </div>
                    <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                      {(estimationResult.aiInsights.riskFactors || []).map((risk: string, idx: number) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition"
                >
                  Adjust Parameters
                </button>
                <button
                  onClick={handleCreateAndAdoptProject}
                  className="px-6 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs flex items-center gap-2 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Adopt as Active Project & Initialize Live Monitoring</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Finished Building 3D Architectural Visualization & Spec Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 sticky top-24 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Architectural 3D Render Preview
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium">
                {floorPlanSpecs.buildingStyle}
              </span>
            </div>

            {/* Main Render Image Container */}
            <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group aspect-[16/10] bg-zinc-100 dark:bg-zinc-900">
              <img
                src={currentStyle.image}
                alt={floorPlanSpecs.buildingStyle}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 text-xs text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm tracking-tight">{floorPlanSpecs.buildingStyle}</span>
                  <span className="text-[10px] bg-white text-black font-bold px-2 py-0.5 rounded">
                    {floorPlanSpecs.grossFloorAreaSqm} m² GFA
                  </span>
                </div>
                <p className="text-[11px] text-zinc-200 line-clamp-2">{currentStyle.desc}</p>
              </div>
            </div>

            {/* Architectural Prompt & Specs Breakdown */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-200 font-semibold border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <span>Selected Architectural Matrix</span>
                <span className="text-zinc-900 dark:text-white font-mono">{floorPlanSpecs.floors} Storeys</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Structural Frame:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{materialSpecs.structuralCore}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Foundation:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{materialSpecs.foundationType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Facade:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{materialSpecs.facadeType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Roofing:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{materialSpecs.roofType}</span>
                </div>
              </div>

              {/* Prompt snippet */}
              <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">AI 3D Synthesis Visual Prompt</span>
                <p className="text-[10px] text-zinc-700 dark:text-zinc-300 italic bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 font-mono line-clamp-3">
                  "{currentStyle.prompt}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
