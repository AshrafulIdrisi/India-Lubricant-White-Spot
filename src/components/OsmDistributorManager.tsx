import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Download, 
  Upload, 
  RefreshCw, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Database, 
  Filter, 
  SlidersHorizontal, 
  Store, 
  TrendingUp, 
  Building2, 
  Tag, 
  Cpu, 
  Terminal, 
  FileSpreadsheet, 
  Code,
  Sparkles,
  Info,
  Fuel,
  Copy,
  Check,
  Zap,
  Users,
  Play,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { DistributorRecord, LocationRecord } from '../types';
import { 
  executeOverpassQuery, 
  buildOverpassQuery, 
  exportDistributorsToGeoJSON, 
  exportDistributorsToCSV, 
  convertOsmElementToDistributor,
  STATE_OSM_AREA_MAP,
  OverpassQueryParams,
  PincodeFuelRecord,
  executePincodeFuelQuery,
  buildPincodeOverpassQuery,
  generatePythonPincodeScript,
  TOP_INDIA_LOGISTICS_PINCODES,
  executeBulkStateHarvest,
  executeBulkPincodeHarvest
} from '../services/osmOverpassService';
import { ALL_INDIA_STATES_DATA } from '../data/allIndiaStateData';

interface OsmDistributorManagerProps {
  distributors: DistributorRecord[];
  locations: LocationRecord[];
  onDistributorsChange?: (distributors: DistributorRecord[]) => void;
  onSelectDistributor?: (dist: DistributorRecord) => void;
}

export const OsmDistributorManager: React.FC<OsmDistributorManagerProps> = ({
  distributors,
  locations,
  onDistributorsChange,
  onSelectDistributor
}) => {
  // State Query state
  const [selectedStateCode, setSelectedStateCode] = useState<string>('MH');
  const [tagFilterType, setTagFilterType] = useState<'all' | 'auto_parts' | 'oil' | 'fuel_depot' | 'warehouse'>('all');
  const [isLiveQuerying, setIsLiveQuerying] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [querySuccessInfo, setQuerySuccessInfo] = useState<{ count: number; duration: number; endpoint: string } | null>(null);
  const [customOverpassQl, setCustomOverpassQl] = useState<string>('');
  const [showQueryEditor, setShowQueryEditor] = useState<boolean>(false);

  // Pincode Query State (based on user's Python script)
  const [inputPincode, setInputPincode] = useState<string>('400001');
  const [inputEsmPop, setInputEsmPop] = useState<number>(50000);
  const [isPincodeQuerying, setIsPincodeQuerying] = useState<boolean>(false);
  const [pincodeRecords, setPincodeRecords] = useState<PincodeFuelRecord[]>([]);
  const [pincodeConvertedDistributors, setPincodeConvertedDistributors] = useState<DistributorRecord[]>([]);
  const [pincodeQueryError, setPincodeQueryError] = useState<string | null>(null);
  const [pincodeSuccessInfo, setPincodeSuccessInfo] = useState<{ count: number; duration: number; endpoint: string } | null>(null);
  const [copiedPythonCode, setCopiedPythonCode] = useState<boolean>(false);
  
  // Staging state for newly fetched OSM distributors before merging
  const [stagedOsmDistributors, setStagedOsmDistributors] = useState<DistributorRecord[]>([]);
  const [selectedInspectorDistributor, setSelectedInspectorDistributor] = useState<DistributorRecord | null>(distributors[0] || null);

  // Filter states
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'bulkHarvester' | 'pincodeFuelExtractor' | 'stateCoverage' | 'overpassConsole'>('directory');

  // Bulk Harvesting States
  const [isBulkHarvesting, setIsBulkHarvesting] = useState<boolean>(false);
  const [bulkHarvestProgress, setBulkHarvestProgress] = useState<{
    completed: number;
    total: number;
    newlyDiscovered: number;
    currentTarget: string;
    mode: 'states' | 'pincodes';
  } | null>(null);
  const [bulkHarvestLog, setBulkHarvestLog] = useState<string[]>([]);
  const [bulkHarvestedDistributors, setBulkHarvestedDistributors] = useState<DistributorRecord[]>([]);
  const [customMultiPincodes, setCustomMultiPincodes] = useState<string>(
    '400001, 110042, 560058, 600060, 700001, 380001, 500077, 411026, 440026, 141001, 452001, 208001, 800001, 831001, 751001, 781001, 263153, 173205'
  );


  // Compute brand and state lists
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(distributors.map(d => d.brand))).sort();
  }, [distributors]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(distributors.map(d => d.stateName))).sort();
  }, [distributors]);

  // Filtered distributor list
  const filteredDistributors = useMemo(() => {
    return distributors.filter(dist => {
      const matchesState = stateFilter === 'all' || dist.stateName === stateFilter || dist.stateCode === stateFilter;
      const matchesBrand = brandFilter === 'all' || dist.brand === brandFilter;
      const matchesSource = sourceFilter === 'all' || 
        (sourceFilter === 'pacs' && (dist.distributorType?.includes('PACS') || dist.osmMeta?.source?.includes('PACS') || dist.primarySector?.includes('Agri'))) ||
        (sourceFilter === 'osm' && (dist.osmMeta?.source.includes('OpenStreetMap') || dist.osmMeta?.osmId || dist.id.startsWith('osm-') || dist.id.startsWith('dist-'))) ||
        (sourceFilter === 'omc' && (dist.distributorType === 'Direct OMC Depot' || dist.distributorType?.includes('OMC'))) ||
        (sourceFilter === 'stockist' && (dist.distributorType === 'Super Stockist' || dist.distributorType === 'Master Distributor')) ||
        (sourceFilter === 'live' && dist.osmMeta?.source === 'Live Overpass Fetch');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        dist.name.toLowerCase().includes(q) ||
        dist.brand.toLowerCase().includes(q) ||
        dist.city.toLowerCase().includes(q) ||
        dist.district.toLowerCase().includes(q) ||
        dist.stateName.toLowerCase().includes(q) ||
        (dist.osmMeta?.osmId && dist.osmMeta.osmId.toLowerCase().includes(q));

      return matchesState && matchesBrand && matchesSource && matchesSearch;
    });
  }, [distributors, stateFilter, brandFilter, sourceFilter, searchQuery]);

  // State-by-State OSM Coverage Matrix
  const stateCoverageMatrix = useMemo(() => {
    return ALL_INDIA_STATES_DATA.map(state => {
      const stateDistributors = distributors.filter(
        d => d.stateCode === state.stateCode || d.stateName.toLowerCase() === state.stateName.toLowerCase()
      );
      const totalVolumeKL = stateDistributors.reduce((sum, d) => sum + d.annualVolumeKL, 0);
      const totalWarehousesKL = stateDistributors.reduce((sum, d) => sum + d.warehouseCapacityKL, 0);
      const omcDepots = stateDistributors.filter(d => d.distributorType === 'Direct OMC Depot').length;
      const mncStockists = stateDistributors.filter(d => d.brand.includes('Castrol') || d.brand.includes('Shell') || d.brand.includes('Mobil')).length;
      
      const brandsPresent = Array.from(new Set(stateDistributors.map(d => d.brand))).slice(0, 3);

      return {
        stateCode: state.stateCode,
        stateName: state.stateName,
        region: state.region,
        distributorCount: stateDistributors.length,
        totalVolumeKL,
        totalWarehousesKL,
        omcDepots,
        mncStockists,
        brandsPresent,
        osmCoverageRating: stateDistributors.length >= 8 ? 'High Coverage' : stateDistributors.length >= 4 ? 'Moderate' : 'Developing'
      };
    }).sort((a, b) => b.distributorCount - a.distributorCount);
  }, [distributors]);

  // Aggregate Metrics
  const totalDistributorsCount = distributors.length;
  const osmVerifiedCount = distributors.filter(d => d.osmMeta?.source.includes('OpenStreetMap') || d.osmMeta?.osmId).length;
  const totalVolumeSuppliedKL = distributors.reduce((sum, d) => sum + d.annualVolumeKL, 0);
  const totalWarehouseStorageKL = distributors.reduce((sum, d) => sum + d.warehouseCapacityKL, 0);

  // Handle Live Overpass API Query Execution
  const handleExecuteLiveOverpass = async () => {
    setIsLiveQuerying(true);
    setQueryError(null);
    setQuerySuccessInfo(null);

    try {
      const params: OverpassQueryParams = {
        stateCode: selectedStateCode,
        stateName: STATE_OSM_AREA_MAP[selectedStateCode]?.name,
        tagType: tagFilterType,
        customQuery: showQueryEditor && customOverpassQl ? customOverpassQl : undefined
      };

      const result = await executeOverpassQuery(params);

      if (result.distributors.length === 0) {
        setQueryError(`No POIs with matching tags found in ${result.stateName} from OpenStreetMap. Try another state or broadening tag criteria.`);
      } else {
        setStagedOsmDistributors(result.distributors);
        setQuerySuccessInfo({
          count: result.distributors.length,
          duration: result.queryTimeMs,
          endpoint: result.sourceEndpoint
        });
      }
    } catch (err: any) {
      console.error("Overpass query execution error:", err);
      setQueryError(`OpenStreetMap Overpass Query Error: ${err.message || 'Network Timeout'}. You can retry or use the pre-curated ground database.`);
    } finally {
      setIsLiveQuerying(false);
    }
  };

  // Handle Live Pincode Fuel Query Execution (based on user Python snippet)
  const handleExecutePincodeQuery = async (targetPin?: string, targetEsmPop?: number) => {
    const pin = (targetPin || inputPincode).trim();
    const esm = targetEsmPop !== undefined ? targetEsmPop : inputEsmPop;
    if (!pin) return;

    setIsPincodeQuerying(true);
    setPincodeQueryError(null);
    setPincodeSuccessInfo(null);

    try {
      const result = await executePincodeFuelQuery(pin, esm);

      if (result.records.length === 0) {
        setPincodeQueryError(`No amenity=fuel / fuel pump nodes found for Postal Code (PIN) "${pin}" via Overpass. Try an adjacent postal code or broadening search.`);
      } else {
        setPincodeRecords(result.records);
        setPincodeConvertedDistributors(result.convertedDistributors);
        setPincodeSuccessInfo({
          count: result.records.length,
          duration: result.queryTimeMs,
          endpoint: result.endpoint
        });
      }
    } catch (err: any) {
      console.error("Pincode query error:", err);
      setPincodeQueryError(`Pincode Overpass Query Failed: ${err.message || 'Timeout'}. You can retry or inspect the generated Python script.`);
    } finally {
      setIsPincodeQuerying(false);
    }
  };

  // Copy Python Snippet to clipboard
  const handleCopyPythonCode = () => {
    const code = generatePythonPincodeScript(inputPincode, inputEsmPop);
    navigator.clipboard.writeText(code);
    setCopiedPythonCode(true);
    setTimeout(() => setCopiedPythonCode(false), 2500);
  };

  // Export Pincode Records as JSON (Exact Python schema)
  const handleExportPincodeJson = () => {
    if (!pincodeRecords.length) return;
    const cleanRecords = pincodeRecords.map(r => ({
      pincode: r.pincode,
      esm_pop: r.esm_pop,
      pump_name: r.pump_name,
      latitude: r.latitude,
      longitude: r.longitude,
      brand: r.brand,
      operator: r.operator,
      osm_id: r.osmId
    }));
    const jsonStr = JSON.stringify(cleanRecords, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fuel_Pumps_PIN_${inputPincode}_Records.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Merge Pincode fetched fuel pumps into live application distributor state
  const handleMergePincodeToLive = () => {
    if (!pincodeConvertedDistributors.length || !onDistributorsChange) return;
    const existingIds = new Set(distributors.map(d => d.id));
    const newItems = pincodeConvertedDistributors.filter(d => !existingIds.has(d.id));
    onDistributorsChange([...distributors, ...newItems]);
    setPincodeSuccessInfo({
      count: newItems.length,
      duration: 0,
      endpoint: 'Merged into All-India Live Map'
    });
  };

  // Merge Staged OSM Distributors into the live application state
  const handleMergeStagedToLive = () => {
    if (!stagedOsmDistributors.length || !onDistributorsChange) return;

    // Merge without duplicates by ID
    const existingIds = new Set(distributors.map(d => d.id));
    const newItems = stagedOsmDistributors.filter(d => !existingIds.has(d.id));
    const merged = [...distributors, ...newItems];

    onDistributorsChange(merged);
    setStagedOsmDistributors([]);
    setQuerySuccessInfo(null);
  };

  // --- BULK HARVESTING HANDLERS ---
  
  // Harvest all 36 States and Union Territories in India
  const handleStartBulkStateHarvest = async (statesToHarvest?: string[]) => {
    const targetStates = statesToHarvest && statesToHarvest.length > 0 
      ? statesToHarvest 
      : Object.keys(STATE_OSM_AREA_MAP);

    setIsBulkHarvesting(true);
    setBulkHarvestLog([`Starting All-India Overpass Bulk State Harvest for ${targetStates.length} states/UTs...`]);
    setBulkHarvestProgress({
      completed: 0,
      total: targetStates.length,
      newlyDiscovered: 0,
      currentTarget: 'Initializing Overpass Engine...',
      mode: 'states'
    });

    try {
      const result = await executeBulkStateHarvest(targetStates, (completed, total, newlyDiscovered, currentState) => {
        setBulkHarvestProgress({
          completed,
          total,
          newlyDiscovered,
          currentTarget: currentState,
          mode: 'states'
        });
        setBulkHarvestLog(prev => [
          `[${completed}/${total}] ${currentState}: Discovered ${newlyDiscovered} aggregate ground nodes`,
          ...prev.slice(0, 19)
        ]);
      });

      setBulkHarvestedDistributors(result.allDistributors);
      
      // Auto-merge directly into the active application state
      if (onDistributorsChange && result.allDistributors.length > 0) {
        const existingIds = new Set(distributors.map(d => d.id));
        const newItems = result.allDistributors.filter(d => !existingIds.has(d.id));
        onDistributorsChange([...distributors, ...newItems]);
        setBulkHarvestLog(prev => [
          `✅ SUCCESS: Ingested ${newItems.length} brand-new verified distributors into the All-India Live Map!`,
          ...prev
        ]);
      }
    } catch (err: any) {
      console.error('Bulk state harvest error:', err);
      setBulkHarvestLog(prev => [`❌ ERROR: Bulk Harvest interrupted - ${err.message}`, ...prev]);
    } finally {
      setIsBulkHarvesting(false);
    }
  };

  // Harvest Top Logistics PIN Codes or Custom PIN Codes
  const handleStartBulkPincodeHarvest = async (customPins?: string[]) => {
    let pinList: Array<{ pin: string; esmPop?: number }> = [];

    if (customPins && customPins.length > 0) {
      pinList = customPins.map(p => ({ pin: p.trim(), esmPop: 65000 }));
    } else {
      // Parse customMultiPincodes textarea or fall back to TOP_INDIA_LOGISTICS_PINCODES
      const parsed = customMultiPincodes
        .split(/[\s,;\n]+/)
        .map(s => s.trim().replace(/\D/g, ''))
        .filter(s => s.length === 6);

      if (parsed.length > 0) {
        pinList = parsed.map(p => ({ pin: p, esmPop: 75000 }));
      } else {
        pinList = TOP_INDIA_LOGISTICS_PINCODES.map(t => ({ pin: t.pin, esmPop: t.esmPop }));
      }
    }

    if (!pinList.length) return;

    setIsBulkHarvesting(true);
    setBulkHarvestLog([`Starting Batch Postal Code Harvester for ${pinList.length} PIN codes...`]);
    setBulkHarvestProgress({
      completed: 0,
      total: pinList.length,
      newlyDiscovered: 0,
      currentTarget: `PIN ${pinList[0].pin}`,
      mode: 'pincodes'
    });

    try {
      const result = await executeBulkPincodeHarvest(pinList, (completed, total, newlyDiscovered, currentPin) => {
        setBulkHarvestProgress({
          completed,
          total,
          newlyDiscovered,
          currentTarget: `PIN ${currentPin}`,
          mode: 'pincodes'
        });
        setBulkHarvestLog(prev => [
          `[${completed}/${total}] PIN ${currentPin}: Ingested ${newlyDiscovered} cumulative fuel & lube outlets`,
          ...prev.slice(0, 19)
        ]);
      });

      setBulkHarvestedDistributors(result.convertedDistributors);

      if (onDistributorsChange && result.convertedDistributors.length > 0) {
        const existingIds = new Set(distributors.map(d => d.id));
        const newItems = result.convertedDistributors.filter(d => !existingIds.has(d.id));
        onDistributorsChange([...distributors, ...newItems]);
        setBulkHarvestLog(prev => [
          `✅ SUCCESS: Ingested ${newItems.length} brand-new PIN-code verified outlets into the All-India Live Map!`,
          ...prev
        ]);
      }
    } catch (err: any) {
      console.error('Bulk PIN harvest error:', err);
      setBulkHarvestLog(prev => [`❌ ERROR: Bulk PIN Harvest interrupted - ${err.message}`, ...prev]);
    } finally {
      setIsBulkHarvesting(false);
    }
  };


  // GeoJSON Export
  const handleExportGeoJson = () => {
    const geojson = exportDistributorsToGeoJSON(filteredDistributors);
    const blob = new Blob([geojson], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `India_Lubricant_Distributors_OSM_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportDistributorsToCSV(filteredDistributors);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `India_Distributors_OSM_Network_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let importedDistributors: DistributorRecord[] = [];

        if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
          // Parse GeoJSON
          importedDistributors = parsed.features.map((f: any) => {
            const coords = f.geometry?.coordinates || [77.0, 28.0];
            const p = f.properties || {};
            return {
              id: p.id || `imported-osm-${Math.random().toString(36).substring(7)}`,
              name: p.name || 'Imported Distributor',
              brand: p.brand || 'Multi-Brand',
              parentCompany: p.parentCompany || 'Channel Partner',
              distributorType: p.distributorType || 'Master Distributor',
              district: p.district || 'District Hub',
              stateCode: p.stateCode || 'MH',
              stateName: p.stateName || 'Maharashtra',
              city: p.city || 'City',
              address: p.address || 'Address',
              latitude: coords[1],
              longitude: coords[0],
              monthlyThroughputKL: p.monthlyThroughputKL || 150,
              annualVolumeKL: p.annualVolumeKL || 1800,
              warehouseCapacityKL: p.warehouseCapacityKL || 200,
              coverageRadiusKm: p.coverageRadiusKm || 45,
              primarySector: p.primarySector || 'Automotive Retail (PCMO/MCO)',
              dealerNetworkCount: p.dealerNetworkCount || 40,
              industrialAccountsCount: p.industrialAccountsCount || 10,
              avgLeadTimeDays: p.avgLeadTimeDays || 2.0,
              marketShareInDistrictPct: p.marketShareInDistrictPct || 15.0,
              performanceTier: p.performanceTier || 'High Performer',
              establishedYear: p.establishedYear || 2012,
              contactPerson: p.contactPerson || 'Hub Operations Manager',
              contactPhone: p.contactPhone || '+91 98000 00000',
              topSellingSKUs: p.topSellingSKUs ? p.topSellingSKUs.split('; ') : ['Engine Oil 15W-40', 'Hydraulic 68'],
              whiteSpotProximityKm: 10.0,
              osmMeta: {
                osmId: p.osmId,
                osmUrl: p.osmUrl,
                source: 'OSM GeoJSON Import'
              }
            };
          });
        } else if (parsed.elements && Array.isArray(parsed.elements)) {
          // Parse Overpass raw JSON
          for (const el of parsed.elements) {
            const dist = convertOsmElementToDistributor(el, 'Maharashtra', 'MH');
            if (dist) importedDistributors.push(dist);
          }
        }

        if (importedDistributors.length > 0 && onDistributorsChange) {
          const existingIds = new Set(distributors.map(d => d.id));
          const newItems = importedDistributors.filter(d => !existingIds.has(d.id));
          onDistributorsChange([...distributors, ...newItems]);
          setQuerySuccessInfo({
            count: importedDistributors.length,
            duration: 0,
            endpoint: 'Local File Import'
          });
        }
      } catch (err: any) {
        setQueryError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview Metrics */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                OPENSTREETMAP GROUND REGISTRY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                36 STATES &amp; UTS AUDITED
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              All-India OpenStreetMap Distributor &amp; Channel Network
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real-world physical distributor hubs, OMC depots, auto parts wholesalers (<code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded text-xs">shop=car_parts</code>, <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded text-xs">shop=oil</code>, <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded text-xs">amenity=fuel</code>), and super stockists mapped via OpenStreetMap and Overpass Turbo.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportGeoJson}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export GeoJSON
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import OSM / GeoJSON
              <input type="file" accept=".json,.geojson" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Metric Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium">TOTAL TRACKED HUBS</div>
            <div className="text-2xl font-black text-white mt-1">{totalDistributorsCount}</div>
            <div className="text-[10px] text-purple-300 mt-0.5">Across 700+ Districts</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium">OSM VERIFIED NODES</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{osmVerifiedCount}</div>
            <div className="text-[10px] text-purple-300 mt-0.5">100% Geocoded WGS84</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium">ANNUAL VOLUME COVERED</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{(totalVolumeSuppliedKL / 1000).toFixed(1)}k KL</div>
            <div className="text-[10px] text-emerald-300 mt-0.5">₹{(totalVolumeSuppliedKL * 0.016).toFixed(0)} Cr Channel Value</div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium">TOTAL WAREHOUSING</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{(totalWarehouseStorageKL / 1000).toFixed(1)}k KL</div>
            <div className="text-[10px] text-amber-300 mt-0.5">Storage Buffer Capacity</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'directory'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          All-India Ground Registry ({filteredDistributors.length})
        </button>

        <button
          onClick={() => setActiveSubTab('bulkHarvester')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'bulkHarvester'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm font-black'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          ⚡ All-India Overpass Bulk Harvester
          {isBulkHarvesting && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
          {bulkHarvestedDistributors.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black">
              +{bulkHarvestedDistributors.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('pincodeFuelExtractor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'pincodeFuelExtractor'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-black'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Fuel className="w-4 h-4 text-amber-300" />
          PIN Code Fuel Pump Extractor (Python)
          {pincodeRecords.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black">
              {pincodeRecords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('stateCoverage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'stateCoverage'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          State-by-State OSM Matrix (36 States &amp; UTs)
        </button>
        <button
          onClick={() => setActiveSubTab('overpassConsole')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'overpassConsole'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Live Overpass Turbo Query Engine
        </button>
      </div>

      {/* VIEW 1: ALL-INDIA GROUND DIRECTORY & OSM INSPECTOR */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, brand, city, district, OSM ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* State Filter */}
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All States ({uniqueStates.length})</option>
                {uniqueStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              {/* Brand Filter */}
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Brands ({uniqueBrands.length})</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Data Sources</option>
                <option value="pacs">🌾 PACS &amp; Agri Cooperatives</option>
                <option value="osm">🌐 OSM Ground Verified</option>
                <option value="omc">🏭 Direct OMC Depots</option>
                <option value="stockist">⭐ Super Stockists</option>
                <option value="live">⚡ Live Overpass Ingested</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredDistributors.length}</strong> of {distributors.length} distributors
            </div>
          </div>

          {/* Directory Split View: Table + Inspector Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table (2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-3 px-4">Distributor / Hub</th>
                      <th className="py-3 px-3">Brand &amp; Operator</th>
                      <th className="py-3 px-3">Location (State / City)</th>
                      <th className="py-3 px-3 text-right">Annual Vol (KL)</th>
                      <th className="py-3 px-3 text-center">OSM ID</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDistributors.map((dist) => {
                      const isSelected = selectedInspectorDistributor?.id === dist.id;
                      return (
                        <tr
                          key={dist.id}
                          onClick={() => {
                            setSelectedInspectorDistributor(dist);
                            onSelectDistributor?.(dist);
                          }}
                          className={`hover:bg-purple-50/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50/80 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 line-clamp-1">{dist.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9.5px]">
                                {dist.distributorType}
                              </span>
                              <span>• {dist.primarySector.split('(')[0]}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-purple-700">{dist.brand}</span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{dist.parentCompany}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-medium">{dist.city}</div>
                            <div className="text-[10px] text-slate-400">{dist.district}, {dist.stateName}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {dist.annualVolumeKL.toLocaleString()} KL
                            <div className="text-[10px] text-slate-400 font-normal">{dist.monthlyThroughputKL} KL/mo</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 border border-purple-200">
                              {dist.osmMeta?.osmId ? dist.osmMeta.osmId.replace('node/', '#') : `#${dist.id.substring(0, 8)}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInspectorDistributor(dist);
                                onSelectDistributor?.(dist);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: OSM Inspector Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              {selectedInspectorDistributor ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                        {selectedInspectorDistributor.distributorType}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                        {selectedInspectorDistributor.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Brand: <strong className="text-purple-700">{selectedInspectorDistributor.brand}</strong> ({selectedInspectorDistributor.parentCompany})
                      </div>
                    </div>
                  </div>

                  {/* OSM Node Tag Metadata Pill Box */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        OSM Node &amp; Verification
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {selectedInspectorDistributor.osmMeta?.source || 'OpenStreetMap Ground Verified'}
                      </span>
                    </div>

                    <div className="font-mono text-[10.5px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div><strong>osm_id:</strong> {selectedInspectorDistributor.osmMeta?.osmId || `node/${selectedInspectorDistributor.id}`}</div>
                      <div><strong>coordinates:</strong> {selectedInspectorDistributor.latitude.toFixed(4)}°N, {selectedInspectorDistributor.longitude.toFixed(4)}°E</div>
                      <div><strong>shop:</strong> {selectedInspectorDistributor.osmMeta?.shop || 'car_parts'}</div>
                      <div><strong>operator:</strong> {selectedInspectorDistributor.parentCompany}</div>
                      <div><strong>addr:city:</strong> {selectedInspectorDistributor.city}</div>
                      <div><strong>addr:district:</strong> {selectedInspectorDistributor.district}</div>
                      <div><strong>addr:state:</strong> {selectedInspectorDistributor.stateName}</div>
                      <div><strong>contact:phone:</strong> {selectedInspectorDistributor.contactPhone}</div>
                    </div>

                    {selectedInspectorDistributor.osmMeta?.osmUrl && (
                      <a
                        href={selectedInspectorDistributor.osmMeta.osmUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline pt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Live Node on OpenStreetMap.org
                      </a>
                    )}
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">MONTHLY THROUGHPUT</span>
                      <span className="font-bold text-purple-700 text-sm">{selectedInspectorDistributor.monthlyThroughputKL} KL/mo</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">ANNUAL VOLUME</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedInspectorDistributor.annualVolumeKL.toLocaleString()} KL</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">WAREHOUSE CAPACITY</span>
                      <span className="font-bold text-slate-800">{selectedInspectorDistributor.warehouseCapacityKL} KL</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] block">DEALER NETWORK</span>
                      <span className="font-bold text-emerald-600">{selectedInspectorDistributor.dealerNetworkCount} Outlets</span>
                    </div>
                  </div>

                  {/* Top Selling SKUs */}
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Key Lubricant SKUs Stocked:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInspectorDistributor.topSellingSKUs.map((sku, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {sku}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs">
                    <div className="text-purple-900 font-bold">Contact &amp; Operations:</div>
                    <div className="text-slate-700 mt-0.5">{selectedInspectorDistributor.contactPerson} ({selectedInspectorDistributor.contactPhone})</div>
                    <div className="text-[10px] text-slate-400 mt-1">{selectedInspectorDistributor.address}</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Store className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Select any distributor from the table to inspect OpenStreetMap tags, coordinates, and operational throughput.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ALL-INDIA BULK OVERPASS HARVESTER */}
      {activeSubTab === 'bulkHarvester' && (
        <div className="space-y-6">
          {/* Main Control Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    MASS OVERPASS HARVEST &amp; INGESTION ENGINE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-purple-600" />
                    Overpass API Interpreter (36 States)
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">All-India Multi-Region OpenStreetMap Auto-Harvester</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  Automate the discovery and ingestion of thousands of ground distributor nodes, OMC depots (IOCL Servo, BPCL MAK, HPCL Milcy, Castrol, Shell, Mobil, Gulf, Valvoline), and lube retail hubs across all 36 Indian states and union territories.
                </p>
              </div>

              {bulkHarvestedDistributors.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onDistributorsChange && bulkHarvestedDistributors.length > 0) {
                        const existingIds = new Set(distributors.map(d => d.id));
                        const newItems = bulkHarvestedDistributors.filter(d => !existingIds.has(d.id));
                        onDistributorsChange([...distributors, ...newItems]);
                        alert(`Successfully merged ${newItems.length} harvested distributors into the live application!`);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Merge All Harvested to Live Map (+{bulkHarvestedDistributors.length})
                  </button>
                </div>
              )}
            </div>

            {/* Quick Batch Ingestion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preset 1: All 36 States & UTs */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 p-5 rounded-2xl border border-amber-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      All 36 States &amp; UTs
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      National Scale
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Harvest Entire Indian Territory</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Sequentially queries ISO3166-2 administrative areas across all 36 States &amp; UTs for verified auto parts, lubricant stockists, and OMC siding hubs.
                  </p>
                </div>

                <button
                  onClick={() => handleStartBulkStateHarvest()}
                  disabled={isBulkHarvesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkHarvesting && bulkHarvestProgress?.mode === 'states' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Harvesting ({bulkHarvestProgress.completed}/{bulkHarvestProgress.total})...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      ⚡ Harvest All 36 States &amp; UTs
                    </>
                  )}
                </button>
              </div>

              {/* Preset 2: Top 60 Logistics & Port PIN Codes */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 p-5 rounded-2xl border border-emerald-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                      Top 60 Strategic Logistics PINs
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      High Density
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Harvest Top Logistics &amp; Port Hubs</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Curls top 60 transport nagars, container terminals (JNPT, Haldia, Cochin), and industrial estates via the exact postal code Overpass script.
                  </p>
                </div>

                <button
                  onClick={() => handleStartBulkPincodeHarvest(TOP_INDIA_LOGISTICS_PINCODES.map(t => t.pin))}
                  disabled={isBulkHarvesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkHarvesting && bulkHarvestProgress?.mode === 'pincodes' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Harvesting PINs ({bulkHarvestProgress.completed}/{bulkHarvestProgress.total})...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      ⚡ Harvest Top 60 Logistics PINs
                    </>
                  )}
                </button>
              </div>

              {/* Preset 3: Top 10 High-Demand Industrial States */}
              <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-slate-50 p-5 rounded-2xl border border-purple-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-purple-800 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                      Top 10 Industrial States
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                      Fast Batch
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Harvest Top 10 Manufacturing Belts</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Focuses on high-consumption states: Maharashtra, Gujarat, Tamil Nadu, Karnataka, Uttar Pradesh, Delhi NCR, Rajasthan, West Bengal, Telangana, Andhra Pradesh.
                  </p>
                </div>

                <button
                  onClick={() => handleStartBulkStateHarvest(['MH', 'GJ', 'TN', 'KA', 'UP', 'DL', 'RJ', 'WB', 'TS', 'AP'])}
                  disabled={isBulkHarvesting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkHarvesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      ⚡ Harvest Top 10 States
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Custom Multi-PIN Code Harvester Input Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Custom Multi-PIN Code Batch Harvester (Paste Any List of Indian Postal Codes)
                </label>
                <button
                  onClick={() => setCustomMultiPincodes(TOP_INDIA_LOGISTICS_PINCODES.map(p => p.pin).join(', '))}
                  className="text-[11px] text-purple-600 hover:text-purple-700 font-bold hover:underline"
                >
                  Load All 60+ Strategic PINs
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  rows={2}
                  value={customMultiPincodes}
                  onChange={(e) => setCustomMultiPincodes(e.target.value)}
                  placeholder="Enter 6-digit PIN codes separated by commas, spaces, or newlines (e.g. 400001, 110001, 560001, 600001...)"
                  className="flex-1 p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={() => handleStartBulkPincodeHarvest()}
                  disabled={isBulkHarvesting}
                  className="sm:w-48 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-mono text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkHarvesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Zap className="w-4 h-4 text-emerald-400" />
                  )}
                  Execute PIN Batch
                </button>
              </div>
            </div>

            {/* Live Progress Bar & Status */}
            {bulkHarvestProgress && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-amber-400 ${isBulkHarvesting ? 'animate-spin' : ''}`} />
                    <span className="font-bold text-xs">
                      {isBulkHarvesting ? 'Overpass Batch Ingestion in Progress:' : 'Batch Harvesting Complete:'}
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      {bulkHarvestProgress.currentTarget}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Progress: {bulkHarvestProgress.completed} / {bulkHarvestProgress.total} (
                    {Math.round((bulkHarvestProgress.completed / Math.max(1, bulkHarvestProgress.total)) * 100)}%)
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((bulkHarvestProgress.completed / Math.max(1, bulkHarvestProgress.total)) * 100))}%`
                    }}
                  />
                </div>

                {/* Real-time Harvest Log Terminal */}
                <div className="mt-3 bg-black/60 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1">
                  {bulkHarvestLog.map((log, idx) => (
                    <div key={idx} className="leading-tight">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Harvested Distributors Grid / Table */}
            {bulkHarvestedDistributors.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Harvested Ground Distributors &amp; Outlets ({bulkHarvestedDistributors.length} Nodes Discovered)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportGeoJson}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                      GeoJSON
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Distributor Name</th>
                        <th className="py-2.5 px-3">Brand / OMC</th>
                        <th className="py-2.5 px-3">State &amp; City</th>
                        <th className="py-2.5 px-3">Coordinates</th>
                        <th className="py-2.5 px-3 text-right">Throughput (KL/mo)</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkHarvestedDistributors.slice(0, 100).map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{d.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {d.brand}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800 font-medium">{d.city}</div>
                            <div className="text-[10px] text-slate-400">{d.stateName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                            {d.monthlyThroughputKL} KL
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <a
                              href={`https://www.openstreetmap.org/search?query=${d.latitude}%2C${d.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              OSM
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PINCODE FUEL PUMP & DISTRIBUTOR EXTRACTOR (PYTHON / OVERPASS SCRIPT) */}
      {activeSubTab === 'pincodeFuelExtractor' && (
        <div className="space-y-6">
          {/* Main Control Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                    PINCODE OVERPASS FUEL &amp; LUBE ENGINE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Code className="w-3 h-3 text-amber-600" />
                    Python Script Integration
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">PIN Code-Level Fuel Pump &amp; Retail Hub Extractor</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  Extract retail fuel stations and commercial lubricant outlets using OpenStreetMap postal code areas (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">area["postal_code"="{inputPincode}"]-&gt;.searchArea</code>) and map them directly into standardized <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono">&#123; pincode, esm_pop, pump_name, latitude, longitude &#125;</code> records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPythonCode}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {copiedPythonCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied Python Code!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Python Script
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Input & Parameters Bar */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pincode Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    India PIN Code (Postal Code)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputPincode}
                      onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 400001"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      {inputPincode.length}/6
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">6-digit Indian Postal Identification Number</span>
                </div>

                {/* Estimated Population Input (esm_pop) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    Catchment Population (esm_pop)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    value={inputEsmPop}
                    onChange={(e) => setInputEsmPop(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Estimated consumer population density in this PIN</span>
                </div>

                {/* Execution Button */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => handleExecutePincodeQuery()}
                    disabled={isPincodeQuerying || inputPincode.length < 3}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPincodeQuerying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Fetching Overpass for PIN {inputPincode}...
                      </>
                    ) : (
                      <>
                        <Fuel className="w-4 h-4" />
                        Query Fuel Outlets for PIN {inputPincode}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Pincode Presets */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Popular Hub Presets (Click to Auto-Query):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { pin: '400001', name: 'Mumbai Fort' },
                    { pin: '110001', name: 'Delhi Connaught' },
                    { pin: '560001', name: 'Bengaluru CBD' },
                    { pin: '600001', name: 'Chennai Central' },
                    { pin: '700001', name: 'Kolkata BBD' },
                    { pin: '411001', name: 'Pune Station' },
                    { pin: '380001', name: 'Ahmedabad Central' },
                    { pin: '500001', name: 'Hyderabad Abids' },
                    { pin: '395001', name: 'Surat Ring Rd' },
                    { pin: '302001', name: 'Jaipur MI Rd' },
                    { pin: '208001', name: 'Kanpur Hub' },
                    { pin: '452001', name: 'Indore Central' },
                    { pin: '440001', name: 'Nagpur Sitabuldi' },
                    { pin: '800001', name: 'Patna Fraser' },
                    { pin: '641001', name: 'Coimbatore RS Puram' },
                    { pin: '141001', name: 'Ludhiana GT Rd' }
                  ].map((preset) => (
                    <button
                      key={preset.pin}
                      onClick={() => {
                        setInputPincode(preset.pin);
                        handleExecutePincodeQuery(preset.pin);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        inputPincode === preset.pin
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="font-mono font-bold mr-1">{preset.pin}</span>
                      <span className="text-[10px] opacity-80">({preset.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Python Script Viewer Accordion */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-white">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 ml-2">
                    fetch_osm_fuel_pumps.py (Python Requests Snippet)
                  </span>
                </div>
                <button
                  onClick={handleCopyPythonCode}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono font-bold"
                >
                  {copiedPythonCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPythonCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <div className="p-4 font-mono text-xs leading-relaxed text-emerald-300 bg-slate-950 overflow-x-auto">
                <pre>{generatePythonPincodeScript(inputPincode, inputEsmPop)}</pre>
              </div>
            </div>

            {/* Error Message */}
            {pincodeQueryError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Overpass Query Feedback</div>
                  <div className="mt-0.5">{pincodeQueryError}</div>
                  <div className="mt-1 text-[11px] text-rose-600">
                    Tip: If OpenStreetMap boundary relations are not indexed for this specific postal code, try adjacent PIN codes or query state-level distributor networks.
                  </div>
                </div>
              </div>
            )}

            {/* Success Info & Merge/Export Action Bar */}
            {pincodeSuccessInfo && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong>Successfully retrieved {pincodeSuccessInfo.count} Fuel &amp; Lube Outlets for PIN {inputPincode}</strong>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Response time: {(pincodeSuccessInfo.duration / 1000).toFixed(2)}s via Overpass Engine
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportPincodeJson}
                    className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    Download JSON ({pincodeRecords.length})
                  </button>

                  <button
                    onClick={handleMergePincodeToLive}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Merge to Live GIS Map &amp; Demand Engine
                  </button>
                </div>
              </div>
            )}

            {/* Extracted Records Table */}
            {pincodeRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    Extracted Fuel Pump &amp; Lube Records for PIN {inputPincode} ({pincodeRecords.length} Outlets)
                  </h4>
                  <div className="text-xs text-slate-400 font-mono">
                    Schema: pincode, esm_pop, pump_name, latitude, longitude
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">PIN Code</th>
                        <th className="py-2.5 px-3">Pump Name (pump_name)</th>
                        <th className="py-2.5 px-3">Brand / OMC</th>
                        <th className="py-2.5 px-3 font-mono">Coordinates (lat, lon)</th>
                        <th className="py-2.5 px-3 text-right">Est Pop (esm_pop)</th>
                        <th className="py-2.5 px-3 text-center">OSM ID</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pincodeRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{r.pincode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{r.pump_name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {r.brand || 'OMC Retailer'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                            {r.esm_pop.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500">
                            {r.osmId}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <a
                              href={`https://www.openstreetmap.org/search?query=${r.latitude}%2C${r.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Map
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: STATE-BY-STATE OPENSTREETMAP MATRIX */}
      {activeSubTab === 'stateCoverage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">All-India State-Level OpenStreetMap Coverage Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution hubs, OMC depots, and audited distributor density across all 36 States and Union Territories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Total 36 States &amp; UTs Audited
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">State / Union Territory</th>
                  <th className="py-3 px-3">Region</th>
                  <th className="py-3 px-3 text-center">Tracked Distributors</th>
                  <th className="py-3 px-3 text-right">Annual Supply Volume (KL)</th>
                  <th className="py-3 px-3 text-right">Warehouse Cap (KL)</th>
                  <th className="py-3 px-3 text-center">OMC Direct Depots</th>
                  <th className="py-3 px-3 text-center">MNC Stockists</th>
                  <th className="py-3 px-3">Top Brands Present</th>
                  <th className="py-3 px-3 text-center">OSM Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stateCoverageMatrix.map((row) => (
                  <tr key={row.stateCode} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.stateName} <span className="text-[10px] text-slate-400 font-mono font-normal">({row.stateCode})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{row.region}</td>
                    <td className="py-3 px-3 text-center font-bold text-purple-700">
                      {row.distributorCount} Hubs
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800">
                      {row.totalVolumeKL.toLocaleString()} KL
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {row.totalWarehousesKL.toLocaleString()} KL
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-amber-600">
                      {row.omcDepots} Depots
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-emerald-600">
                      {row.mncStockists}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {row.brandsPresent.map((b, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-100 text-slate-700 font-medium">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.osmCoverageRating === 'High Coverage'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.osmCoverageRating === 'Moderate'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.osmCoverageRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE OVERPASS TURBO QUERY ENGINE */}
      {activeSubTab === 'overpassConsole' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Live OpenStreetMap Overpass Turbo Engine</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Query live OpenStreetMap servers (<code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">overpass-api.de</code>) for any state in India to fetch real-time POIs, auto part hubs, and distributor depots.
              </p>
            </div>

            {/* Quick Query Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5">Target State in India</label>
                <select
                  value={selectedStateCode}
                  onChange={(e) => setSelectedStateCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500/20"
                >
                  {Object.entries(STATE_OSM_AREA_MAP).map(([code, item]) => (
                    <option key={code} value={code}>{item.name} ({code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5">OSM Tag Classification</label>
                <select
                  value={tagFilterType}
                  onChange={(e) => setTagFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="all">All Auto &amp; Lube POIs (Car parts, oil, fuel depots, warehouses)</option>
                  <option value="auto_parts">Automobile Spare Parts (shop=car_parts / auto_parts)</option>
                  <option value="oil">Motor Oil &amp; Lubricant Specialists (shop=oil / lubricants)</option>
                  <option value="fuel_depot">OMC Bulk Depots &amp; Fuel Outlets (amenity=fuel[brand])</option>
                  <option value="warehouse">Industrial Warehouses (industrial=warehouse)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={handleExecuteLiveOverpass}
                  disabled={isLiveQuerying}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLiveQuerying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Executing Overpass Query...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Execute Live Overpass Fetch
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Query Preview / QL Code toggle */}
            <div>
              <button
                onClick={() => setShowQueryEditor(!showQueryEditor)}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5"
              >
                <Code className="w-4 h-4" />
                {showQueryEditor ? 'Hide Overpass QL Source' : 'View / Edit Raw Overpass QL Query'}
              </button>

              {showQueryEditor && (
                <div className="mt-3">
                  <textarea
                    value={customOverpassQl || buildOverpassQuery({ stateCode: selectedStateCode, tagType: tagFilterType })}
                    onChange={(e) => setCustomOverpassQl(e.target.value)}
                    rows={8}
                    className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Direct Overpass Turbo QL syntax. Responses are automatically parsed into DistributorRecord entities.
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {queryError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Overpass API Notice</div>
                  <div className="mt-0.5">{queryError}</div>
                </div>
              </div>
            )}

            {/* Success Info & Staging Banner */}
            {querySuccessInfo && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <strong>Successfully retrieved {querySuccessInfo.count} POIs from OpenStreetMap</strong> in {(querySuccessInfo.duration / 1000).toFixed(2)}s via {querySuccessInfo.endpoint.replace('https://', '')}
                  </div>
                </div>

                {stagedOsmDistributors.length > 0 && (
                  <button
                    onClick={handleMergeStagedToLive}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    Merge {stagedOsmDistributors.length} Hubs to Live All-India Map
                  </button>
                )}
              </div>
            )}

            {/* Staged Results Table */}
            {stagedOsmDistributors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Fetched OSM Nodes Preview ({stagedOsmDistributors.length} POIs)
                  </h4>
                  <button
                    onClick={() => setStagedOsmDistributors([])}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Dismiss Staged
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">OSM Name</th>
                        <th className="py-2.5 px-3">Brand Tag</th>
                        <th className="py-2.5 px-3">Coordinates</th>
                        <th className="py-2.5 px-3">City / Address</th>
                        <th className="py-2.5 px-3 text-right">Est. Volume (KL)</th>
                        <th className="py-2.5 px-3 text-center">OSM ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stagedOsmDistributors.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{d.name}</td>
                          <td className="py-2.5 px-3 text-purple-700 font-semibold">{d.brand}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{d.address}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">{d.annualVolumeKL} KL</td>
                          <td className="py-2.5 px-3 text-center font-mono text-[10px] text-purple-700">{d.osmMeta?.osmId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
