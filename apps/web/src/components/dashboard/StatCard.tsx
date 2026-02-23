import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  color: 'green' | 'blue' | 'orange' | 'purple' | 'amber' | 'emerald' | 'red' | 'yellow';
  onClick?: () => void;
}

const colorClasses = {
  green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', text: 'text-yellow-700' },
};

export const StatCard = ({ icon: Icon, label, value, sublabel, color, onClick }: StatCardProps) => {
  return (
    <div
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`h-5 w-5 ${colorClasses[color].icon}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {sublabel && <span className="text-xs text-gray-500 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
};

export default StatCard;
