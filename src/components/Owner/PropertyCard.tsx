import { Home, Bed, Bath, MapPin } from 'lucide-react';
import { Property } from '../../lib/supabase';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
      <div className="h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
        <Home className="w-12 h-12 text-white" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{property.name}</h3>
        <div className="flex items-start text-sm text-slate-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{property.address}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            property.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {property.status === 'active' ? 'Actif' : 'Inactif'}
          </span>
          <span className="text-sm text-slate-600">
            Commission {property.commission_rate}%
          </span>
        </div>
      </div>
    </div>
  );
}
