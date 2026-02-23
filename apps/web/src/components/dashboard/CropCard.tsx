import { Sprout, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import type { Crop } from '../../api';

interface CropCardProps {
  crop: Crop;
  onViewDetails: () => void;
  onAction: () => void;
}

export const CropCard = ({ crop, onViewDetails, onAction }: CropCardProps) => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Sprout className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
              {crop.name || crop.crop_type}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">{crop.variety}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              crop.status === 'growing'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {crop.status}
          </span>
          {crop.health_status && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium ${
                crop.health_status === 'healthy' ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {crop.health_status === 'healthy' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {crop.health_status}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Planted:</span>
          <p className="font-medium text-gray-900">
            {crop.planting_date ? new Date(crop.planting_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Expected:</span>
          <p className="font-medium text-gray-900">
            {crop.expected_harvest_date
              ? new Date(crop.expected_harvest_date).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={onAction}
          className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Activity className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CropCard;
