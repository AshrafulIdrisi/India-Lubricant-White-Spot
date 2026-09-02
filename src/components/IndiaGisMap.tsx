import React, { useState, useRef, useMemo } from 'react';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  MapPin, 
  Building2, 
  Truck, 
  Flame, 
  Fuel, 
  Anchor, 
  Factory, 
  Wheat, 
  Filter,
  Eye,
  EyeOff,
  Store,
  Compass,
  Crosshair,
  Globe,
  SlidersHorizontal,
  Navigation,
  Sparkles
} from 'lucide-react';
import { LocationRecord, WarehouseOptimizationNode, GridResolution, DistributorRecord } from '../types';

interface IndiaGisMapProps {
  locations: LocationRecord[];
  warehouseNodes: WarehouseOptimizationNode[];
  distributors?: DistributorRecord[];
  selectedLocation: LocationRecord | null;
  selectedDistributor?: DistributorRecord | null;
  onSelectLocation: (loc: LocationRecord) => void;
  onSelectDistributor?: (dist: DistributorRecord) => void;
  gridResolution: GridResolution;
  onResolutionChange: (res: GridResolution) => void;
}

type EntityCategory = 'whitespots' | 'distributors' | 'warehouses' | 'industrial' | 'logistics' | 'mining' | 'mesh';
type ZonePreset = 'ALL' | 'WEST' | 'NORTH' | 'SOUTH' | 'EAST' | 'CENTRAL' | 'NORTHEAST';
type LabelMode = 'smart' | 'minimal' | 'all';

interface MeshCell {
  id: string;
  x: number;
  y: number;
  size: number;
  lat: number;
  lng: number;
  demandIntensity: number;
  gapScore: number;
  nearestLocName?: string;
  type: 'critical-gap' | 'high-demand' | 'active-supply' | 'transit-corridor' | 'baseline';
}

// Major Indian States & Union Territories reference coordinates for vector boundary lines & labels
const STATE_ANCHORS = [
  { code: 'MH', name: 'Maharashtra', lat: 19.4, lng: 75.8 },
  { code: 'GJ', name: 'Gujarat', lat: 22.4, lng: 71.5 },
  { code: 'KA', name: 'Karnataka', lat: 14.8, lng: 75.8 },
  { code: 'TN', name: 'Tamil Nadu', lat: 11.2, lng: 78.6 },
  { code: 'AP', name: 'Andhra Pradesh', lat: 15.5, lng: 79.5 },
  { code: 'TS', name: 'Telangana', lat: 17.8, lng: 79.0 },
  { code: 'OD', name: 'Odisha', lat: 20.5, lng: 84.5 },
  { code: 'WB', name: 'West Bengal', lat: 23.5, lng: 87.8 },
  { code: 'JH', name: 'Jharkhand', lat: 23.6, lng: 85.3 },
  { code: 'MP', name: 'Madhya Pradesh', lat: 23.2, lng: 77.8 },
  { code: 'RJ', name: 'Rajasthan', lat: 26.6, lng: 73.8 },
  { code: 'UP', name: 'Uttar Pradesh', lat: 27.1, lng: 80.8 },
  { code: 'PB', name: 'Punjab', lat: 31.0, lng: 75.4 },
  { code: 'HR', name: 'Haryana', lat: 29.2, lng: 76.5 },
  { code: 'UK', name: 'Uttarakhand', lat: 30.1, lng: 79.2 },
  { code: 'AS', name: 'Assam', lat: 26.2, lng: 92.8 },
  { code: 'KL', name: 'Kerala', lat: 10.3, lng: 76.4 },
  { code: 'CG', name: 'Chhattisgarh', lat: 21.3, lng: 81.8 }
];

export const IndiaGisMap: React.FC<IndiaGisMapProps> = ({
  locations,
  warehouseNodes,
  distributors = [],
  selectedLocation,
  selectedDistributor,
  onSelectLocation,
  onSelectDistributor,
  gridResolution,
  onResolutionChange
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState<ZonePreset>('ALL');
  const [labelMode, setLabelMode] = useState<LabelMode>('smart');
  const [meshOpacity, setMeshOpacity] = useState<number>(0.65);
  
  // Category visibility toggles
  const [visibleCategories, setVisibleCategories] = useState<Record<EntityCategory, boolean>>({
    whitespots: true,
    distributors: true,
    warehouses: true,
    industrial: true,
    logistics: true,
    mining: true,
    mesh: true
  });

  const [hoveredLocation, setHoveredLocation] = useState<LocationRecord | null>(null);
  const [hoveredDistributor, setHoveredDistributor] = useState<DistributorRecord | null>(null);
  const [hoveredDepot, setHoveredDepot] = useState<WarehouseOptimizationNode | null>(null);
  const [hoveredMeshCell, setHoveredMeshCell] = useState<MeshCell | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [controlMenuOpen, setControlMenuOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (cat: EntityCategory) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Accurate India Geographic Projection to SVG 860x900 viewport
  // Bounds: Latitude 7.2°N to 37.2°N, Longitude 68.0°E to 97.5°E
  const projectCoordinates = (lat: number, lng: number) => {
    const minLng = 68.0;
    const maxLng = 97.5;
    const minLat = 7.2;
    const maxLat = 37.2;

    const x = ((lng - minLng) / (maxLng - minLng)) * 770 + 45;
    const y = 900 - (((lat - minLat) / (maxLat - minLat)) * 820 + 35);
    return { x, y };
  };

  // Inverse project for cursor coordinate telemetry
  const inverseProject = (x: number, y: number) => {
    const minLng = 68.0;
    const maxLng = 97.5;
    const minLat = 7.2;
    const maxLat = 37.2;

    const lng = minLng + ((x - 45) / 770) * (maxLng - minLng);
    const lat = minLat + ((900 - 35 - y) / 820) * (maxLat - minLat);
    return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
  };

  // Calculate Spatial Grid Mesh cells
  const spatialMeshCells = useMemo<MeshCell[]>(() => {
    if (!visibleCategories.mesh) return [];

    const cells: MeshCell[] = [];
    const sizeMap: Record<GridResolution, { step: number; pixelSize: number }> = {
      '1km': { step: 0.5, pixelSize: 11 },
      '2km': { step: 0.9, pixelSize: 18 },
      '5km': { step: 1.4, pixelSize: 26 },
      '10km': { step: 2.3, pixelSize: 40 }
    };

    const { step, pixelSize } = sizeMap[gridResolution] || sizeMap['5km'];

    for (let lat = 8.5; lat <= 35.5; lat += step) {
      for (let lng = 69.5; lng <= 95.0; lng += step) {
        const isLikelyLand = 
          (lat >= 8.2 && lat <= 20.0 && lng >= 73.5 && lng <= 85.0) || // South & Deccan
          (lat > 20.0 && lat <= 26.0 && lng >= 69.5 && lng <= 89.0) || // West & Central
          (lat > 26.0 && lat <= 32.0 && lng >= 74.0 && lng <= 88.5) || // North & Gangetic
          (lat > 32.0 && lat <= 36.5 && lng >= 74.0 && lng <= 79.5) || // J&K / Ladakh
          (lat >= 22.0 && lat <= 28.5 && lng >= 88.5 && lng <= 96.0);  // Northeast

        if (!isLikelyLand) continue;

        let maxDemand = 10;
        let maxGap = 5;
        let nearestLoc: LocationRecord | null = null;
        let minDist = 9999;

        locations.forEach(loc => {
          const dLat = loc.latitude - lat;
          const dLng = loc.longitude - lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDist) {
            minDist = dist;
            nearestLoc = loc;
          }
          if (dist < 2.5) {
            const influence = (1 - dist / 2.5);
            maxDemand += (loc.totalEstimatedDemandKL / 320) * influence;
            maxGap += (loc.supplyGapKL / 280) * influence;
          }
        });

        let hasIncumbentSupply = false;
        distributors.forEach(dist => {
          const dLat = dist.latitude - lat;
          const dLng = dist.longitude - lng;
          const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
          if (distDeg < 0.6) {
            hasIncumbentSupply = true;
          }
        });

        const { x, y } = projectCoordinates(lat, lng);

        let cellType: MeshCell['type'] = 'baseline';
        if (maxGap > 48) {
          cellType = 'critical-gap';
        } else if (maxDemand > 42) {
          cellType = hasIncumbentSupply ? 'active-supply' : 'high-demand';
        } else if (hasIncumbentSupply) {
          cellType = 'active-supply';
        }

        cells.push({
          id: `cell-${lat.toFixed(2)}-${lng.toFixed(2)}`,
          x,
          y,
          size: pixelSize,
          lat: Number(lat.toFixed(2)),
          lng: Number(lng.toFixed(2)),
          demandIntensity: Math.min(100, Math.round(maxDemand)),
          gapScore: Math.min(100, Math.round(maxGap)),
          nearestLocName: nearestLoc ? (nearestLoc as LocationRecord).name : undefined,
          type: cellType
        });
      }
    }
    return cells;
  }, [locations, distributors, gridResolution, visibleCategories.mesh]);

  // Anti-Collision Position Offsets for Closely Clustered Points
  // Calculates intelligent microscopic angular dispersal when distributors and locations share the same city
  const dispersedDistributors = useMemo(() => {
    return distributors.map((dist, idx) => {
      const base = projectCoordinates(dist.latitude, dist.longitude);
      // Small offset based on index to prevent 100% pixel-level collision with white spot nodes or co-located distributors
      const angle = (idx % 8) * (Math.PI / 4);
      const offsetRadius = 14; 
      return {
        ...dist,
        x: base.x + Math.cos(angle) * offsetRadius,
        y: base.y + Math.sin(angle) * offsetRadius,
        originalX: base.x,
        originalY: base.y
      };
    });
  }, [distributors]);

  // Zone focus presets
  const applyZonePreset = (zone: ZonePreset) => {
    setActiveZone(zone);
    switch (zone) {
      case 'ALL':
        setZoom(1);
        setPan({ x: 0, y: 0 });
        break;
      case 'WEST': // Maharashtra, Gujarat, Rajasthan
        setZoom(1.9);
        setPan({ x: 190, y: -70 });
        break;
      case 'NORTH': // NCR, Punjab, Haryana, Uttarakhand, J&K
        setZoom(2.1);
        setPan({ x: 120, y: 190 });
        break;
      case 'SOUTH': // Karnataka, Tamil Nadu, Andhra Pradesh, Kerala, Telangana
        setZoom(2.0);
        setPan({ x: 70, y: -290 });
        break;
      case 'EAST': // Odisha, Jharkhand, West Bengal, Bihar
        setZoom(2.0);
        setPan({ x: -140, y: -40 });
        break;
      case 'CENTRAL': // MP, Chhattisgarh
        setZoom(2.1);
        setPan({ x: -20, y: -40 });
        break;
      case 'NORTHEAST': // Assam, Meghalaya
        setZoom(2.4);
        setPan({ x: -360, y: 80 });
        break;
    }
  };

  // Dragging & Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const svgX = (rawX - pan.x) / zoom * (860 / rect.width);
      const svgY = (rawY - pan.y) / zoom * (900 / rect.height);
      const coords = inverseProject(svgX, svgY);
      if (coords.lat >= 6 && coords.lat <= 38 && coords.lng >= 66 && coords.lng <= 99) {
        setCursorCoords(coords);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom(z => Math.max(0.75, Math.min(4.5, z * zoomFactor)));
  };

  const handleZoomIn = () => setZoom(z => Math.min(4.5, z + 0.35));
  const handleZoomOut = () => setZoom(z => Math.max(0.75, z - 0.35));

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[640px] bg-[#05070B] border border-[#1F2937] overflow-hidden select-none shadow-2xl flex flex-col font-mono"
    >
      {/* Top Header & Quick Filter Toolbar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Zone Focus & Category Isolation Chips */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Zone Selector */}
          <div className="flex items-center bg-[#0C1017]/95 px-2 py-1 rounded border border-[#2D3748] shadow-xl text-xs gap-1">
            <span className="text-gray-400 font-bold text-[9px] uppercase flex items-center gap-1 mr-1">
              <Globe className="w-3 h-3 text-[#F27D26]" />
              ZONE:
            </span>
            {(['ALL', 'WEST', 'NORTH', 'SOUTH', 'EAST', 'CENTRAL', 'NORTHEAST'] as ZonePreset[]).map(z => (
              <button
                key={z}
                onClick={() => applyZonePreset(z)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all uppercase ${
                  activeZone === z
                    ? 'bg-[#F27D26] text-black shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#1F2937]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="hidden sm:flex items-center bg-[#0C1017]/95 px-2 py-1 rounded border border-[#2D3748] shadow-xl text-xs gap-1.5">
            <button
              onClick={() => toggleCategory('whitespots')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                visibleCategories.whitespots 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'text-gray-500 hover:text-gray-300 opacity-60'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>SPOTS ({locations.length})</span>
            </button>

            <button
              onClick={() => toggleCategory('distributors')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                visibleCategories.distributors 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                  : 'text-gray-500 hover:text-gray-300 opacity-60'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>COMPETITORS ({distributors.length})</span>
            </button>

            <button
              onClick={() => toggleCategory('warehouses')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                visibleCategories.warehouses 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                  : 'text-gray-500 hover:text-gray-300 opacity-60'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>DEPOTS ({warehouseNodes.length})</span>
            </button>

            <button
              onClick={() => toggleCategory('mesh')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                visibleCategories.mesh 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' 
                  : 'text-gray-500 hover:text-gray-300 opacity-60'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>MESH</span>
            </button>
          </div>
        </div>

        {/* Right: Label Declutter & Layer Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Label Density Selector */}
          <div className="flex items-center bg-[#0C1017]/95 px-2 py-1 rounded border border-[#2D3748] shadow-xl text-xs gap-1">
            <span className="text-gray-400 font-bold text-[9px] uppercase mr-1">LABELS:</span>
            {(['smart', 'minimal', 'all'] as LabelMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setLabelMode(mode)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                  labelMode === mode
                    ? 'bg-gray-200 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Detailed Layer Settings Popover */}
          <div className="relative">
            <button
              onClick={() => setControlMenuOpen(!controlMenuOpen)}
              className="flex items-center gap-1.5 bg-[#0C1017]/95 px-2.5 py-1.5 rounded border border-[#2D3748] text-[10px] font-bold text-gray-200 hover:bg-[#1F2937] transition-colors shadow-xl uppercase"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>GIS LAYERS</span>
            </button>

            {controlMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0C1017]/98 border border-[#374151] rounded p-3 shadow-2xl z-50 text-xs font-mono flex flex-col gap-2.5 backdrop-blur-md">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider pb-1.5 border-b border-[#1F2937] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#F27D26]" />
                    SPATIAL OVERLAYS
                  </span>
                  <button onClick={() => setControlMenuOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Mesh Grid Resolution Setting */}
                <div>
                  <div className="text-[9px] text-gray-400 uppercase mb-1 font-bold">GRID RESOLUTION</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['1km', '2km', '5km', '10km'] as GridResolution[]).map(res => (
                      <button
                        key={res}
                        onClick={() => onResolutionChange(res)}
                        className={`py-1 text-center rounded text-[9px] font-bold border transition-colors ${
                          gridResolution === res
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow'
                            : 'bg-[#151B26] text-gray-400 border-[#2D3748] hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Toggles */}
                <div className="space-y-1 pt-1 border-t border-[#1F2937]">
                  {[
                    { id: 'whitespots', label: 'WHITE-SPOT CANDIDATES', icon: Flame, color: 'text-red-400' },
                    { id: 'distributors', label: 'COMPETITOR DISTRIBUTORS', icon: Store, color: 'text-cyan-300' },
                    { id: 'warehouses', label: 'OPTIMIZED DEPOTS', icon: MapPin, color: 'text-purple-400' },
                    { id: 'mesh', label: 'DEMAND & DEFICIT MESH', icon: Layers, color: 'text-amber-400' },
                    { id: 'industrial', label: 'INDUSTRIAL BELTS (MIDC/GIDC)', icon: Factory, color: 'text-blue-400' },
                    { id: 'logistics', label: 'PORTS & FREIGHT CORRIDORS', icon: Truck, color: 'text-emerald-400' },
                    { id: 'mining', label: 'MINING & HEAVY ASSETS', icon: Building2, color: 'text-yellow-400' }
                  ].map(({ id, label, icon: Icon, color }) => (
                    <label
                      key={id}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#151B26] cursor-pointer text-[10px]"
                    >
                      <span className="flex items-center gap-2 text-gray-200">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        {label}
                      </span>
                      <input
                        type="checkbox"
                        checked={visibleCategories[id as EntityCategory]}
                        onChange={() => toggleCategory(id as EntityCategory)}
                        className="rounded bg-[#05070B] border-[#374151] text-[#F27D26] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#F27D26]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0C1017]/95 rounded border border-[#2D3748] p-0.5 shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1F2937] rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1F2937] rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyZonePreset('ALL')}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1F2937] rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div 
        className="w-full flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden bg-[#05070B]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox="0 0 860 900"
          className="w-full h-full object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="spotBeaconGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="highDemandBeaconGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F27D26" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#ea580c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>

            {/* Subtle background coordinate grid */}
            <pattern id="gisPatternGrid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#101726" strokeWidth="0.7" strokeDasharray="2,3" />
              <circle cx="0" cy="0" r="0.8" fill="#1e293b" />
            </pattern>
          </defs>

          {/* Background Grid Pattern */}
          <rect width="860" height="900" fill="url(#gisPatternGrid)" />

          {/* Accurate India Geographic Boundary Polygon with Precise Coastlines & Borders */}
          <path
            d="
              M 265 35 
              C 248 45 220 55 195 65
              C 185 85 200 100 215 115
              C 205 135 210 148 218 158
              C 210 172 205 180 218 188
              C 200 210 195 220 190 236
              C 160 265 130 295 112 320
              C 114 336 122 346 128 354
              C 105 372 80 388 60 402
              C 48 408 50 418 64 452
              C 72 464 78 470 82 470
              C 96 485 106 490 115 495
              C 126 490 136 475 146 467
              C 154 480 160 490 164 498
              C 162 522 163 538 164 548
              C 167 574 172 590 177 602
              C 182 626 186 636 190 644
              C 200 676 208 696 216 716
              C 228 742 235 752 242 764
              C 248 782 251 792 255 800
              C 261 822 265 832 270 838
              C 278 848 282 851 286 851
              C 300 848 320 832 334 815
              C 342 785 345 760 348 742
              C 355 724 359 714 361 708
              C 357 688 355 678 353 672
              C 365 648 375 632 381 621
              C 402 602 422 592 438 579
              C 458 560 474 544 483 532
              C 500 518 515 508 524 504
              C 536 488 543 478 548 468
              C 560 455 566 447 570 442
              C 578 395 568 354 574 322
              C 575 306 576 301 577 298
              C 606 306 637 322 662 335
              C 698 317 729 306 749 298
              C 776 290 791 285 801 283
              C 796 306 781 326 765 342
              C 744 344 734 347 725 349
              C 723 363 721 371 720 374
              C 708 389 698 399 688 406
              C 672 404 662 404 651 403
              C 656 378 662 363 667 354
              C 646 342 615 337 599 337
              C 584 342 578 353 573 373
              C 557 368 547 365 536 363
              C 495 342 464 326 441 317
              C 407 290 381 259 356 237
              C 329 228 314 223 298 217
              C 288 202 283 197 278 195
              C 283 155 285 124 288 105
              C 283 67 274 46 265 35 Z
            "
            fill="#090E17"
            stroke="#223049"
            strokeWidth="1.6"
          />

          {/* State Boundaries Vectors (Subtle Internal Grids) */}
          <g opacity="0.45">
            <path d="M 190 236 C 295 265 395 285 536 363" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="3,3" />
            <path d="M 164 498 C 255 506 358 532 483 532" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="3,3" />
            <path d="M 190 644 C 255 666 316 688 361 708" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="3,3" />
            <path d="M 438 579 C 468 498 500 436 570 442" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="3,3" />
          </g>

          {/* Regional State Watermark Codes */}
          <g opacity="0.25" className="pointer-events-none select-none font-mono font-bold text-[11px] fill-gray-500">
            {STATE_ANCHORS.map(st => {
              const { x, y } = projectCoordinates(st.lat, st.lng);
              return (
                <text key={st.code} x={x} y={y} textAnchor="middle">
                  {st.code}
                </text>
              );
            })}
          </g>

          {/* SPATIAL DEMAND & DEFICIT MESH GRID */}
          {visibleCategories.mesh && (
            <g className="spatial-mesh-grid" opacity={meshOpacity}>
              {spatialMeshCells.map(cell => {
                const isHovered = hoveredMeshCell?.id === cell.id;
                let cellFill = '#1E293B';
                let cellOpacity = 0.12;
                let cellStroke = '#334155';
                let cellStrokeWidth = 0.3;

                if (cell.type === 'critical-gap') {
                  cellFill = '#ef4444';
                  cellOpacity = isHovered ? 0.85 : 0.38;
                  cellStroke = '#f87171';
                  cellStrokeWidth = isHovered ? 1.2 : 0.7;
                } else if (cell.type === 'high-demand') {
                  cellFill = '#F27D26';
                  cellOpacity = isHovered ? 0.8 : 0.32;
                  cellStroke = '#fb923c';
                  cellStrokeWidth = isHovered ? 1.0 : 0.5;
                } else if (cell.type === 'active-supply') {
                  cellFill = '#06b6d4';
                  cellOpacity = isHovered ? 0.75 : 0.25;
                  cellStroke = '#22d3ee';
                  cellStrokeWidth = isHovered ? 1.0 : 0.5;
                }

                return (
                  <rect
                    key={cell.id}
                    x={cell.x - cell.size / 2}
                    y={cell.y - cell.size / 2}
                    width={cell.size}
                    height={cell.size}
                    fill={cellFill}
                    fillOpacity={cellOpacity}
                    stroke={cellStroke}
                    strokeWidth={cellStrokeWidth}
                    className="transition-all duration-150 cursor-crosshair hover:scale-105"
                    onMouseEnter={() => setHoveredMeshCell(cell)}
                    onMouseLeave={() => setHoveredMeshCell(null)}
                  />
                );
              })}
            </g>
          )}

          {/* Freight Corridors (WDFC / EDFC) */}
          {visibleCategories.logistics && (
            <g opacity="0.85">
              {/* WDFC: Dadri - Rewari - Palanpur - Dahej - JNPT */}
              <path
                d="M 335 285 L 305 335 L 235 425 L 164 498 L 164 548"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeDasharray="5,3"
              />
              {/* EDFC: Ludhiana - Dadri - Kanpur - Mughalsarai - Dankuni */}
              <path
                d="M 245 205 L 335 285 L 435 345 L 495 385 L 570 442"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeDasharray="5,3"
              />
            </g>
          )}

          {/* Major Sea Ports */}
          {visibleCategories.logistics && (
            <g>
              {[
                { name: 'JNPT Port', lat: 18.95, lng: 72.95 },
                { name: 'Mundra Port', lat: 22.84, lng: 69.70 },
                { name: 'Paradip Port', lat: 20.31, lng: 86.61 },
                { name: 'Vizag Port', lat: 17.68, lng: 83.21 },
                { name: 'Chennai Port', lat: 13.08, lng: 80.27 }
              ].map((port, idx) => {
                const { x, y } = projectCoordinates(port.lat, port.lng);
                return (
                  <g key={`port-${idx}`} transform={`translate(${x}, ${y})`}>
                    <circle r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    {labelMode === 'all' && (
                      <text x="6" y="3" fill="#93c5fd" fontSize="7.5" fontWeight="600" className="pointer-events-none font-mono">
                        ⚓ {port.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Industrial Belts (MIDC / GIDC / SIPCOT) */}
          {visibleCategories.industrial && (
            <g opacity="0.8">
              {[
                { name: 'MIDC Chakan', lat: 18.75, lng: 73.85 },
                { name: 'GIDC Dahej', lat: 21.62, lng: 72.99 },
                { name: 'SIPCOT Sriperumbudur', lat: 12.97, lng: 79.94 },
                { name: 'KIADB Peenya', lat: 12.74, lng: 77.82 },
                { name: 'SIDCUL Pantnagar', lat: 29.02, lng: 79.40 },
                { name: 'RIICO Neemrana', lat: 27.99, lng: 76.38 }
              ].map((ind, idx) => {
                const { x, y } = projectCoordinates(ind.lat, ind.lng);
                return (
                  <g key={`ind-${idx}`} transform={`translate(${x}, ${y})`}>
                    <rect x="-3" y="-3" width="6" height="6" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8" />
                    {labelMode === 'all' && (
                      <text x="5" y="2.5" fill="#bfdbfe" fontSize="7" fontWeight="600" className="pointer-events-none font-mono">
                        🏭 {ind.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Mining Belts */}
          {visibleCategories.mining && (
            <g opacity="0.8">
              {[
                { name: 'Singrauli Coal', lat: 24.19, lng: 82.66 },
                { name: 'Joda Iron Ore', lat: 22.01, lng: 85.38 },
                { name: 'Korba Mining', lat: 22.35, lng: 82.68 }
              ].map((mine, idx) => {
                const { x, y } = projectCoordinates(mine.lat, mine.lng);
                return (
                  <g key={`mine-${idx}`} transform={`translate(${x}, ${y})`}>
                    <polygon points="0,-3.5 3.5,3.5 -3.5,3.5" fill="#eab308" stroke="#fef08a" strokeWidth="0.8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Optimized Warehouse Hubs / Depots */}
          {visibleCategories.warehouses && warehouseNodes.map(node => {
            const { x, y } = projectCoordinates(node.latitude, node.longitude);
            const isHovered = hoveredDepot?.id === node.id;
            return (
              <g 
                key={`depot-${node.id}`} 
                transform={`translate(${x}, ${y})`} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredDepot(node)}
                onMouseLeave={() => setHoveredDepot(null)}
              >
                {/* Depot Hexagon Icon */}
                <circle r="9" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" className="transition-transform hover:scale-125" />
                <rect x="-3" y="-3" width="6" height="6" fill="#f3e8ff" />
                
                {/* Depot Label Pill */}
                {(labelMode !== 'minimal' || isHovered) && (
                  <g transform="translate(12, -7)">
                    <rect x="0" y="0" width={node.clusterName.split('—')[0].length * 6 + 18} height="15" rx="3" fill="#0C1017" stroke="#9333ea" strokeWidth="0.8" />
                    <text x="5" y="11" fill="#e9d5ff" fontSize="8" fontWeight="700" className="pointer-events-none font-mono">
                      📦 {node.clusterName.split('—')[0].trim()}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Incumbent Competitor Distributors (Rendered as Compact Diamond Glyphs) */}
          {visibleCategories.distributors && dispersedDistributors.map(dist => {
            const isSelected = selectedDistributor?.id === dist.id;
            const isHovered = hoveredDistributor?.id === dist.id;

            return (
              <g key={`dist-pin-${dist.id}`}>
                {/* Leader connecting line to original GPS coord if slightly dispersed */}
                {zoom > 1.4 && (
                  <line
                    x1={dist.originalX}
                    y1={dist.originalY}
                    x2={dist.x}
                    y2={dist.y}
                    stroke="#0891b2"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                    opacity="0.6"
                  />
                )}

                {/* Distributor Pin Marker */}
                <g
                  transform={`translate(${dist.x}, ${dist.y})`}
                  onClick={() => onSelectDistributor?.(dist)}
                  onMouseEnter={() => {
                    setHoveredDistributor(dist);
                    setHoveredLocation(null);
                  }}
                  onMouseLeave={() => setHoveredDistributor(null)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  {/* Selection Glow */}
                  {isSelected && (
                    <circle r="14" fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="3,2" className="animate-spin" />
                  )}

                  {/* Diamond Icon */}
                  <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    transform="rotate(45)"
                    fill={isSelected ? "#22d3ee" : isHovered ? "#06b6d4" : "#0891b2"}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "1.8" : "1.0"}
                  />
                  <circle r="1.5" fill="#05070B" />

                  {/* Detailed Brand Label Pill (Visible when hovered, selected, or in 'all' label mode) */}
                  {(isHovered || isSelected || labelMode === 'all') && (
                    <g transform="translate(9, -8)" className="pointer-events-none">
                      <rect 
                        x="0" 
                        y="0" 
                        width={dist.brand.length * 6 + 45} 
                        height="16" 
                        rx="3" 
                        fill="#05070B" 
                        stroke={isSelected ? "#22d3ee" : "#0891b2"} 
                        strokeWidth="1" 
                      />
                      <text x="5" y="11" fill="#a5f3fc" fontSize="8" fontWeight="700" className="font-mono">
                        🏢 {dist.brand} ({dist.annualVolumeKL.toLocaleString()} KL)
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* White Spot Opportunity Locations (Hero Radar Target Nodes) */}
          {visibleCategories.whitespots && locations.map(loc => {
            const { x, y } = projectCoordinates(loc.latitude, loc.longitude);
            const isSelected = selectedLocation?.id === loc.id;
            const isHovered = hoveredLocation?.id === loc.id;
            const isCritical = loc.opportunityTier === 'Critical White Spot';
            const rankNumber = locations.findIndex(l => l.id === loc.id) + 1;

            return (
              <g
                key={`spot-${loc.id}`}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectLocation(loc)}
                onMouseEnter={() => {
                  setHoveredLocation(loc);
                  setHoveredDistributor(null);
                }}
                onMouseLeave={() => setHoveredLocation(null)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Pulsing Beacon Circle */}
                <circle
                  r={isSelected ? 22 : isCritical ? 16 : 12}
                  fill={isCritical ? 'url(#spotBeaconGrad)' : 'url(#highDemandBeaconGrad)'}
                  className="animate-pulse"
                />

                {/* Selection Orbit */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#F27D26"
                    strokeWidth="1.8"
                    strokeDasharray="4,3"
                    className="animate-spin"
                  />
                )}

                {/* Primary Circle Marker */}
                <circle
                  r={isSelected ? 7.5 : 6}
                  fill={isCritical ? '#ef4444' : '#F27D26'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1.2}
                />
                <circle r="2" fill="#05070B" />

                {/* Clean, Non-Overlapping Label Badge Pill */}
                {(labelMode !== 'minimal' || isSelected || isHovered || rankNumber <= 5) && (
                  <g transform="translate(10, -9)" className="pointer-events-none select-none font-mono">
                    {/* Badge Background Rect to prevent overlap bleeding */}
                    <rect
                      x="0"
                      y="0"
                      width={loc.name.split(' ')[0].length * 6.5 + 46}
                      height="18"
                      rx="3.5"
                      fill="#0C1017"
                      stroke={isSelected ? '#F27D26' : isCritical ? '#ef4444' : '#475569'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      className="drop-shadow-lg"
                    />
                    {/* Rank Indicator */}
                    <text x="5" y="12.5" fill={isCritical ? '#f87171' : '#fb923c'} fontSize="8.5" fontWeight="800">
                      #{rankNumber}
                    </text>
                    {/* District Name & Score */}
                    <text x="20" y="12.5" fill="#ffffff" fontSize="8.5" fontWeight="700">
                      {loc.name.split(' ')[0]} <tspan fill="#F27D26">({loc.whiteSpotScore.toFixed(0)})</tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card: White Spot Node */}
        {hoveredLocation && (
          <div className="absolute bottom-12 left-4 z-40 bg-[#0C1017]/98 backdrop-blur-md border border-[#F27D26] rounded p-3 text-xs text-gray-200 shadow-2xl max-w-sm pointer-events-none font-mono">
            <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] pb-1.5 mb-2">
              <span className="font-bold text-sm text-[#F27D26] uppercase">{hoveredLocation.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1F2937] text-white border border-[#374151]">
                SCORE: {hoveredLocation.whiteSpotScore}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 font-mono">
              <div>
                <span className="text-gray-500 block">TOTAL DEMAND:</span>
                <span className="font-bold text-[#F27D26]">{hoveredLocation.totalEstimatedDemandKL.toLocaleString()} KL/YR</span>
              </div>
              <div>
                <span className="text-gray-500 block">UNMET SUPPLY GAP:</span>
                <span className="font-bold text-red-400">{hoveredLocation.supplyGapKL.toLocaleString()} KL/YR</span>
              </div>
              <div>
                <span className="text-gray-500 block">COVERAGE RATIO:</span>
                <span className="font-bold text-yellow-400">{hoveredLocation.supplyCoverageRatioPct}%</span>
              </div>
              <div>
                <span className="text-gray-500 block">OPPORTUNITY POOL:</span>
                <span className="font-bold text-green-400">₹{hoveredLocation.unmetOpportunityValueINR} CR</span>
              </div>
            </div>
            <div className="text-[9px] text-gray-400 italic">
              CLICK PIN TO DRILL INTO REGIONAL DEMAND &amp; FINANCIAL BUSINESS CASE.
            </div>
          </div>
        )}

        {/* Hover Tooltip Card: Competitor Distributor */}
        {hoveredDistributor && (
          <div className="absolute bottom-12 left-4 z-40 bg-[#0C1017]/98 backdrop-blur-md border border-cyan-500/80 rounded p-3 text-xs text-gray-200 shadow-2xl max-w-sm pointer-events-none font-mono">
            <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-xs text-cyan-300 uppercase truncate">{hoveredDistributor.name}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase">
                {hoveredDistributor.distributorType}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mb-2 font-mono">
              <span>BRAND: <strong className="text-white">{hoveredDistributor.brand}</strong> ({hoveredDistributor.parentCompany})</span>
              <div className="text-gray-500 text-[9px]">{hoveredDistributor.address}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 font-mono bg-[#05070B] p-2 rounded border border-[#1F2937]">
              <div>
                <span className="text-gray-500 block">ANNUAL VOLUME:</span>
                <span className="font-bold text-cyan-400">{hoveredDistributor.annualVolumeKL.toLocaleString()} KL/YR</span>
              </div>
              <div>
                <span className="text-gray-500 block">STORAGE CAP:</span>
                <span className="font-bold text-white">{hoveredDistributor.warehouseCapacityKL} KL</span>
              </div>
              <div>
                <span className="text-gray-500 block">DEALER NETWORK:</span>
                <span className="font-bold text-emerald-400">{hoveredDistributor.dealerNetworkCount} OUTLETS</span>
              </div>
              <div>
                <span className="text-gray-500 block">COVERAGE RADIUS:</span>
                <span className="font-bold text-yellow-400">{hoveredDistributor.coverageRadiusKm} KM ({hoveredDistributor.avgLeadTimeDays}d lead)</span>
              </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip Card: Mesh Cell Live Spatial Inspector */}
        {hoveredMeshCell && !hoveredLocation && !hoveredDistributor && (
          <div className="absolute bottom-12 left-4 z-40 bg-[#0C1017]/95 backdrop-blur-md border border-amber-500/50 rounded p-2.5 text-xs text-gray-200 shadow-2xl max-w-xs pointer-events-none font-mono">
            <div className="flex items-center justify-between gap-2 border-b border-[#1F2937] pb-1 mb-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-amber-400" />
                SPATIAL MESH CELL ({gridResolution})
              </span>
              <span className="text-[9px] text-gray-400">
                {hoveredMeshCell.lat}°N, {hoveredMeshCell.lng}°E
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px]">
              <div>
                <span className="text-gray-500 block">DEMAND INDEX:</span>
                <span className="font-bold text-[#F27D26]">{hoveredMeshCell.demandIntensity} / 100</span>
              </div>
              <div>
                <span className="text-gray-500 block">DEFICIT SCORE:</span>
                <span className="font-bold text-red-400">{hoveredMeshCell.gapScore} / 100</span>
              </div>
            </div>
            {hoveredMeshCell.nearestLocName && (
              <div className="text-[8.5px] text-gray-400 mt-1 border-t border-[#1F2937] pt-1">
                NEAREST CLUSTER: <strong className="text-white">{hoveredMeshCell.nearestLocName}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom GIS Status & Telemetry HUD */}
      <div className="bg-[#0C1017] border-t border-[#1F2937] px-3 py-1.5 flex flex-wrap items-center justify-between text-[10px] text-gray-400 z-10 font-mono">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="font-bold text-gray-300 uppercase flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#F27D26]" />
            GIS LEGEND:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-red-400 font-bold">CRITICAL WHITE SPOT (&gt;80)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F27D26] inline-block" />
            <span className="text-[#F27D26] font-bold">HIGH OPPORTUNITY</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block" />
            <span className="text-cyan-300 font-bold">COMPETITOR DISTRIBUTOR</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span className="text-purple-300 font-bold">DEPOT HUB</span>
          </span>
        </div>

        {/* Telemetry */}
        <div className="flex items-center gap-3 text-[9px] text-gray-400">
          {cursorCoords && (
            <span className="text-cyan-300 font-bold">
              📍 {cursorCoords.lat}°N, {cursorCoords.lng}°E
            </span>
          )}
          <span>RESOLUTION: <strong className="text-white">{gridResolution}</strong></span>
          <span>PROJECTION: <strong className="text-white">WGS84</strong></span>
        </div>
      </div>
    </div>
  );
};
