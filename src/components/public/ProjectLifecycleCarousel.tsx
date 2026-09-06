import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Calendar,
  DollarSign
} from 'lucide-react';

interface LifecycleStage {
  id: number;
  name: string;
  category: string;
  durationWeeks: number;
  completionPercent: number;
  status: 'Completed' | 'Active' | 'Scheduled';
  keyDeliverable: string;
}

interface ShowcaseProject {
  id: string;
  title: string;
  type: string;
  grossFloorArea: string;
  location: string;
  structuralCore: string;
  totalBudgetUSD: string;
  evmStatus: string;
  confidenceScore: number;
  renderImageUrl: string;
  architecturalStyle: string;
  summary: string;
  lifecycleStages: LifecycleStage[];
}

const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  {
    id: 'horizon-pavilion',
    title: 'The Horizon Pavilion Estate',
    type: 'High-End Luxury Residential',
    grossFloorArea: '680 m² GFA (3 Levels)',
    location: '1442 Ridgemont Terrace, Bel Air, CA',
    structuralCore: 'Post-Tensioned Concrete & Structural Steel',
    totalBudgetUSD: '$2,450,000',
    evmStatus: 'CPI 1.03 (+$22k Favorable) | SPI 1.04 (3 Days Ahead)',
    confidenceScore: 96,
    renderImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    architecturalStyle: 'Modernist Contemporary with Jura Limestone',
    summary: 'Masterpiece cantilevered villa featuring full-height triple-glazed acoustic curtain walls, structural infinity pool cantilever, and geothermal climate control.',
    lifecycleStages: [
      { id: 1, name: 'Geotechnical & Substructure', category: 'Substructure', durationWeeks: 6, completionPercent: 100, status: 'Completed', keyDeliverable: 'Micropiles, soldier beams & basement waterstop' },
      { id: 2, name: 'Foundation & Ground Slab', category: 'Civil', durationWeeks: 4, completionPercent: 100, status: 'Completed', keyDeliverable: 'Post-tensioned 35 MPa raft foundation' },
      { id: 3, name: 'Superstructure Core & Frame', category: 'Structure', durationWeeks: 8, completionPercent: 100, status: 'Completed', keyDeliverable: 'Board-marked fair-faced concrete columns' },
      { id: 4, name: 'Envelope & Reynaers Glazing', category: 'Enclosure', durationWeeks: 6, completionPercent: 82, status: 'Active', keyDeliverable: 'Triple-glazed Low-E curtain wall & stone rainscreen' },
      { id: 5, name: 'MEP & Architectural Millwork', category: 'Fitout', durationWeeks: 8, completionPercent: 20, status: 'Scheduled', keyDeliverable: 'Calacatta marble slabs & geothermal VRF loops' },
      { id: 6, name: 'Commissioning & Handover', category: 'Closeout', durationWeeks: 3, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Blower-door envelope test & occupancy permit' },
    ],
  },
  {
    id: 'apex-innovation',
    title: 'Apex Innovation Commercial Center',
    type: 'Biophilic Mass-Timber Headquarters',
    grossFloorArea: '1,450 m² GFA (4 Levels)',
    location: '420 Tech Boulevard, Austin Innovation District, TX',
    structuralCore: 'Mass Timber (Glulam Beams + CLT Floor Slabs)',
    totalBudgetUSD: '$4,850,000',
    evmStatus: 'CPI 1.01 (On Budget) | SPI 0.99 (On Critical Path)',
    confidenceScore: 92,
    renderImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
    architecturalStyle: 'Sustainable Biophilic Commercial',
    summary: 'Next-generation carbon-sequestering commercial headquarters utilizing precision CNC-milled cross-laminated timber, motorized solar louvers, and intensive green roof.',
    lifecycleStages: [
      { id: 1, name: 'Site Prep & Deep Piling', category: 'Substructure', durationWeeks: 8, completionPercent: 100, status: 'Completed', keyDeliverable: 'Cast-in-place auger cast piles and ground grid' },
      { id: 2, name: 'Glulam & CLT Erection', category: 'Structure', durationWeeks: 10, completionPercent: 74, status: 'Active', keyDeliverable: 'Crane-lifted timber columns and CLT diaphragm' },
      { id: 3, name: 'Double-Skin Smart Facade', category: 'Enclosure', durationWeeks: 8, completionPercent: 15, status: 'Scheduled', keyDeliverable: 'Automated solar tracking louvers and dynamic tint' },
      { id: 4, name: 'High-Efficiency VRF & BMS', category: 'MEP', durationWeeks: 7, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Dedicated outdoor air system with MERV 16' },
      { id: 5, name: 'Intensive Green Living Roof', category: 'Finishes', durationWeeks: 4, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Drought-tolerant native canopy & rainwater cistern' },
      { id: 6, name: 'LEED Platinum Handover', category: 'Closeout', durationWeeks: 4, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Acoustic verification & Net-Zero audit' },
    ],
  },
  {
    id: 'solarium-heights',
    title: 'Solarium Net-Zero Residential',
    type: 'Multi-Family Urban Passive House',
    grossFloorArea: '920 m² GFA (5 Storeys)',
    location: '88 Pearl Street, Denver Urban Core, CO',
    structuralCore: 'Hybrid Post-Tensioned Slabs & Recycled Steel',
    totalBudgetUSD: '$3,120,000',
    evmStatus: 'CPI 1.02 (+$14k Favorable) | SPI 1.02 (Ahead)',
    confidenceScore: 94,
    renderImageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85',
    architecturalStyle: 'Contemporary Urban Passive Architecture',
    summary: 'Ultra-low carbon multi-family residence designed to PHIUS Passive House standards with building-integrated photovoltaics (BIPV) and heat-recovery ventilation.',
    lifecycleStages: [
      { id: 1, name: 'Excavation & Geothermal Wells', category: 'Substructure', durationWeeks: 5, completionPercent: 100, status: 'Completed', keyDeliverable: '12 closed-loop 400ft borehole heat exchangers' },
      { id: 2, name: 'Precast Concrete Framing', category: 'Structure', durationWeeks: 7, completionPercent: 100, status: 'Completed', keyDeliverable: 'Prestressed hollow-core slabs with seismic joints' },
      { id: 3, name: 'BIPV Solar Façade Cladding', category: 'Enclosure', durationWeeks: 6, completionPercent: 65, status: 'Active', keyDeliverable: 'Photovoltaic glass spandrel panels generating 48 kWp' },
      { id: 4, name: 'Airtight Envelope Sealing', category: 'Enclosure', durationWeeks: 4, completionPercent: 20, status: 'Scheduled', keyDeliverable: 'Continuous vapor-permeable air barrier membrane' },
      { id: 5, name: 'Decentralized HRV System', category: 'MEP', durationWeeks: 5, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Zehender 92% thermal efficiency air exchangers' },
      { id: 6, name: 'Passive House Certification', category: 'Closeout', durationWeeks: 3, completionPercent: 0, status: 'Scheduled', keyDeliverable: 'Blower-door test ≤ 0.60 ACH50 sign-off' },
    ],
  },
];

export const ProjectLifecycleCarousel: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedStageIdx, setSelectedStageIdx] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const currentProject = SHOWCASE_PROJECTS[activeIdx];

  // Auto-advance every 9 seconds if user is not interacting
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SHOWCASE_PROJECTS.length);
      setSelectedStageIdx(3);
    }, 9000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + SHOWCASE_PROJECTS.length) % SHOWCASE_PROJECTS.length);
    setSelectedStageIdx(3);
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % SHOWCASE_PROJECTS.length);
    setSelectedStageIdx(3);
  };

  return (
    <section 
      className="py-16 sm:py-24 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background ambient lighting accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architectural Showcase & Construction Lifecycle</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              From Finished Vision to Step-by-Step Execution.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Explore real landmark structures tracked within Structura OS. Follow the active construction phase progress from initial groundbreak to high-precision engineering handover.
            </p>
          </div>

          {/* Project Switcher Tabs & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {SHOWCASE_PROJECTS.map((proj, idx) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setActiveIdx(idx);
                    setSelectedStageIdx(3);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeIdx === idx
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {proj.title.split(' ')[1]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                aria-label="Previous project"
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next project"
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Showcase Showcase Display Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProject.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="rounded-3xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Column: High-Res Finished Rendering */}
              <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[520px] overflow-hidden group">
                <img
                  src={currentProject.renderImageUrl}
                  alt={currentProject.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                
                {/* Overlay Project Meta Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-white border border-slate-700/80 shadow-sm flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentProject.type}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                    Confidence: {currentProject.confidenceScore}%
                  </span>
                </div>

                {/* Bottom Overlay Title Info */}
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                    {currentProject.location}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {currentProject.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl">
                    {currentProject.summary}
                  </p>
                </div>
              </div>

              {/* Right Column: Architectural Engineering Specifications & Live Metrics */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Engineering Specifications
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {currentProject.grossFloorArea}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Baseline Budget</span>
                      <span className="font-mono font-bold text-white text-base block">
                        {currentProject.totalBudgetUSD}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">Verified Contract BOQ</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Structural Frame</span>
                      <span className="font-semibold text-slate-200 text-xs line-clamp-2">
                        {currentProject.structuralCore}
                      </span>
                    </div>
                  </div>

                  {/* EVM Metric Indicator */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Earned Value Management (EVM) Status</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-400 font-semibold">
                      {currentProject.evmStatus}
                    </p>
                  </div>
                </div>

                {/* Construction Lifecycle Stages Stepper */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Construction Lifecycle Stages
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click stage to view deliverable
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {currentProject.lifecycleStages.map((stage, sIdx) => {
                      const isSelected = selectedStageIdx === sIdx;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => setSelectedStageIdx(sIdx)}
                          className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-between min-h-[58px] ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                              : stage.status === 'Completed'
                              ? 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-600'
                              : stage.status === 'Active'
                              ? 'bg-slate-900 text-amber-400 border-amber-500/50 hover:border-amber-400'
                              : 'bg-slate-900/40 text-slate-500 border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] font-mono block">P{stage.id}</span>
                          <span className="text-[10px] font-bold truncate w-full px-0.5">
                            {stage.completionPercent}%
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Stage Detail Card */}
                  {currentProject.lifecycleStages[selectedStageIdx] && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          Phase {currentProject.lifecycleStages[selectedStageIdx].id}: {currentProject.lifecycleStages[selectedStageIdx].name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          currentProject.lifecycleStages[selectedStageIdx].status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : currentProject.lifecycleStages[selectedStageIdx].status === 'Active'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {currentProject.lifecycleStages[selectedStageIdx].status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Key Deliverable:</strong> {currentProject.lifecycleStages[selectedStageIdx].keyDeliverable} ({currentProject.lifecycleStages[selectedStageIdx].durationWeeks} wks duration)
                      </p>
                    </div>
                  )}
                </div>

                {/* Call to action to inspect project */}
                <div className="pt-2">
                  <Link
                    to="/app"
                    className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <span>Inspect Project in Live OS Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Carousel Navigation Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {SHOWCASE_PROJECTS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIdx(idx);
                setSelectedStageIdx(3);
              }}
              aria-label={`Go to project ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIdx === idx ? 'w-8 bg-amber-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
