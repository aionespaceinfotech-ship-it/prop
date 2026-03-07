import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
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
  Check
} from 'lucide-react';

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
}

export default function PublicCatalog() {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const propertyRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  });

  useEffect(() => {
    fetchProperties();
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
    const text = `Check out this property: ${p.title} at ${p.location}. Price: ₹${p.price.toLocaleString()}\n\nView details: ${url}`;
    if (navigator.share) {
      navigator.share({ title: p.title, text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesType = !filters.type || p.type === filters.type;
    const matchesMinPrice = !filters.minPrice || p.price >= Number(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || p.price <= Number(filters.maxPrice);
    const matchesLocation = !filters.location || p.location.toLowerCase().includes(filters.location.toLowerCase());
    return matchesType && matchesMinPrice && matchesMaxPrice && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Property Catalog</h1>
              <p className="text-sm text-slate-500">Explore our available listings</p>
            </div>
            <button 
              onClick={handleCopyLink}
              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-lg border border-slate-100"
              title="Copy Catalog Link"
            >
              {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search location..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-lg outline-none transition-all w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            <option value="Plot">Plot</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Commercial">Commercial</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', location: '' })}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            Reset
          </button>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const images = JSON.parse(property.images || '[]');
            const mainImage = images[0] || `https://picsum.photos/seed/${property.id}/800/600`;
            const isHighlighted = Number(highlightedId) === property.id;

            return (
              <motion.div
                key={property.id}
                ref={el => { propertyRefs.current[property.id] = el; }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all group ${
                  isHighlighted ? 'ring-2 ring-emerald-500 border-transparent shadow-lg scale-[1.02]' : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={mainImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full shadow-sm">
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => shareProperty(property)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-slate-600 rounded-full shadow-sm hover:text-emerald-600 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg">
                      ₹{property.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Maximize2 size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Area</p>
                        <p className="text-sm font-semibold">{property.area} sqft</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Compass size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Facing</p>
                        <p className="text-sm font-semibold">{property.facing}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in ${property.title} at ${property.location}. Price: ₹${property.price.toLocaleString()}. View details: ${window.location.origin}/catalog?id=${property.id}`)}`, '_blank')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageSquare size={18} />
                      Enquire
                    </button>
                    <button 
                      className="w-12 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 text-slate-400 rounded-full mb-4">
              <Home size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-900 font-bold text-lg mb-2">PropBroker CRM</p>
          <p className="text-slate-500 text-sm">© 2026 Professional Real Estate Management</p>
        </div>
      </footer>
    </div>
  );
}
