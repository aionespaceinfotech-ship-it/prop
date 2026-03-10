import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  MapPin, 
  Maximize2, 
  Compass, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter,
  Share2,
  Copy,
  Check,
  IndianRupee,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Property {
  id: number;
  title: string;
  type: string;
  location: string;
  price: number;
  area: number;
  facing: string;
  status: string;
  description: string;
  images: string;
  approval_type?: string;
  corner_plot?: number;
  gated_colony?: number;
}

export default function PublicCatalog() {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const propertyRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Initialize filters from URL
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('search') || searchParams.get('location') || '',
    approval: searchParams.get('approval') || '',
    facing: searchParams.get('facing') || '',
    corner: searchParams.get('corner') || '',
    gated: searchParams.get('gated') || '',
  });

  useEffect(() => {
    fetchProperties();
    // If we have many filter params, show the filter bar initially
    if (searchParams.toString().length > 10) {
      setShowFilters(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && highlightedId && propertyRefs.current[Number(highlightedId)]) {
      setTimeout(() => {
        propertyRefs.current[Number(highlightedId)]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading, highlightedId]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/public/properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProperty = (p: Property) => {
    const url = `${window.location.origin}/catalog?id=${p.id}`;
    const text = `🏠 *${p.title}*\n📍 ${p.location}\n💰 Price: ${formatCurrency(p.price)}\n📐 Area: ${p.area} sqft\n\nView details:\n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesType = !filters.type || p.type === filters.type;
      const matchesMinPrice = !filters.minPrice || p.price >= Number(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || p.price <= Number(filters.maxPrice);
      const matchesLocation = !filters.location || 
        p.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        p.title.toLowerCase().includes(filters.location.toLowerCase());
      const matchesApproval = !filters.approval || p.approval_type === filters.approval;
      const matchesFacing = !filters.facing || p.facing === filters.facing;
      const matchesCorner = !filters.corner || String(p.corner_plot) === filters.corner;
      const matchesGated = !filters.gated || String(p.gated_colony) === filters.gated;

      return matchesType && matchesMinPrice && matchesMaxPrice && matchesLocation && 
             matchesApproval && matchesFacing && matchesCorner && matchesGated;
    });
  }, [properties, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Inventory</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase hidden sm:block">PropBroker <span className="text-emerald-600">Catalog</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCopyLink}
              className="p-3 text-slate-400 hover:text-emerald-600 transition-all bg-slate-50 rounded-2xl border border-slate-100 shadow-sm"
            >
              {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-3 rounded-2xl border transition-all flex items-center gap-2",
                showFilters ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 shadow-sm"
              )}
            >
              <Filter size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Filter Results</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100 bg-slate-50/50"
            >
              <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Category</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    <option value="Plot">Residential Plot</option>
                    <option value="Flat">Luxury Flat</option>
                    <option value="Villa">Premium Villa</option>
                    <option value="Independent House">Independent House</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Area</label>
                  <input
                    type="text"
                    placeholder="Locality name..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <button
                    onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', location: '', approval: '', facing: '', corner: '', gated: '' })}
                    className="flex-1 py-3 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:bg-rose-50 rounded-2xl border border-rose-100 transition-all"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl"
                  >
                    View Matches
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((property, idx) => {
              const images = JSON.parse(property.images || '[]');
              const mainImage = images[0] || `https://picsum.photos/seed/prop-${property.id}/1200/800`;
              const isHighlighted = Number(highlightedId) === property.id;

              return (
                <motion.div
                  layout
                  key={property.id}
                  ref={el => { propertyRefs.current[property.id] = el; }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 transition-all duration-500 group relative flex flex-col h-full",
                    isHighlighted ? 'ring-4 ring-emerald-500 border-transparent shadow-2xl scale-[1.02] z-10' : 'hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2'
                  )}
                >
                  <div className="relative h-72 overflow-hidden bg-slate-100">
                    <img src={mainImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
                        {property.type}
                      </span>
                    </div>
                    
                    <div className="absolute top-6 right-6">
                      <button onClick={() => shareProperty(property)} className="p-2.5 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl shadow-xl hover:bg-emerald-500 hover:text-white transition-all">
                        <Share2 size={18} />
                      </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Market Price</p>
                      <h4 className="text-3xl font-black text-white leading-none tracking-tighter">
                        <IndianRupee size={24} className="inline-block mr-1 opacity-70" />
                        {property.price.toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight uppercase tracking-tighter line-clamp-2">{property.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none flex items-center gap-2">
                            <Maximize2 size={12} /> Area
                          </p>
                          <p className="text-base font-black text-slate-900">{property.area} sqft</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none flex items-center gap-2">
                            <Compass size={12} /> Facing
                          </p>
                          <p className="text-base font-black text-slate-900 uppercase">{property.facing || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-8 border-t border-slate-100 mt-auto">
                      <button 
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in: \n*${property.title}*\n📍 ${property.location}\n💰 ₹${property.price.toLocaleString()}\n🔗 ${window.location.origin}/catalog?id=${property.id}`)}`, '_blank')}
                        className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl"
                      >
                        <MessageSquare size={16} />
                        Get Details
                      </button>
                      <button 
                        onClick={() => window.location.href = `tel:+919876543210`}
                        className="w-16 h-14 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center transition-all border border-slate-200"
                      >
                        <Phone size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No items found</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 mb-8">Try adjusting your filter parameters.</p>
            <button onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', location: '', approval: '', facing: '', corner: '', gated: '' })} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl">
              Reset Filters
            </button>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-20 mt-20 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                <Home size={24} className="text-slate-900" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">PropBroker <span className="text-emerald-500">Group</span></h3>
            </div>
            <p className="text-slate-500 text-sm max-w-sm font-medium">Providing premium property inventory since 2026.</p>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 Professional Enterprise Systems</p>
        </div>
      </footer>
    </div>
  );
}
