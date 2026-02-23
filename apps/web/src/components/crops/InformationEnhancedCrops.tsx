/**
 * INFORMATION ENHANCED CROPS COMPONENTS
 * =====================================
 * Enhanced crop components with integrated information system
 */

import React from 'react';
import { InfoIcon } from '../information/InfoIcon';
import type { InfoIconProps } from '../../types/information';

// ============================================================================
// CROPS OVERVIEW WITH INFO
// ============================================================================

interface CropsOverviewProps {
  className?: string;
}

export function CropsOverviewWithInfo({ className = '' }: CropsOverviewProps) {
  const cropInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'maize_varieties_info',
      pagePath: '/crops',
      componentName: 'CropsOverview',
      tooltip: 'Maize varieties guide',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'planting_calendar_info',
      pagePath: '/crops',
      componentName: 'CropsOverview',
      tooltip: 'Planting calendar',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'climate_requirements_info',
      pagePath: '/crops',
      componentName: 'CropsOverview',
      tooltip: 'Climate requirements',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Crop Information</h3>
        <div className="flex gap-2">
          {cropInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Maize Varieties */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Recommended Maize Varieties</h4>
          <InfoIcon
            contextKey="maize_varieties_info"
            pagePath="/crops"
            componentName="CropsOverview"
            tooltip="Complete maize guide"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="border border-gray-200 rounded p-3">
            <h5 className="font-medium text-green-700 mb-2">White Maize</h5>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>SC 403:</strong> 120-125 days, 8-10 tons/ha
              </p>
              <p>
                <strong>SC 513:</strong> 140-145 days, 10-12 tons/ha
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded p-3">
            <h5 className="font-medium text-yellow-700 mb-2">Yellow Maize</h5>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>PAN 53:</strong> 130-135 days, 9-11 tons/ha
              </p>
              <p>
                <strong>ZM 521:</strong> 125-130 days, 8.5-10.5 tons/ha
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded p-3">
            <h5 className="font-medium text-blue-700 mb-2">Sweet Corn</h5>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>Golden Bantam:</strong> 80-85 days, fresh market
              </p>
              <p>
                <strong>Silver Queen:</strong> 85-90 days, extra sweet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Planting Calendar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Planting Calendar</h4>
          <InfoIcon
            contextKey="planting_calendar_info"
            pagePath="/crops"
            componentName="CropsOverview"
            tooltip="Regional planting guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-green-100 text-green-800 rounded p-2 mb-2">
                <strong>Nov - Dec</strong>
              </div>
              <p className="text-gray-600">Early maize planting</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 rounded p-2 mb-2">
                <strong>Jan - Feb</strong>
              </div>
              <p className="text-gray-600">Summer crops</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-800 rounded p-2 mb-2">
                <strong>Mar - Apr</strong>
              </div>
              <p className="text-gray-600">Winter vegetables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PEST DISEASE MANAGER WITH INFO
// ============================================================================

interface PestDiseaseManagerProps {
  className?: string;
}

export function PestDiseaseManagerWithInfo({ className = '' }: PestDiseaseManagerProps) {
  const pestInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'pest_disease_info',
      pagePath: '/crops',
      componentName: 'PestDiseaseManager',
      tooltip: 'Pest & disease guide',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'ipm_strategies_info',
      pagePath: '/crops',
      componentName: 'PestDiseaseManager',
      tooltip: 'IPM strategies',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'organic_treatment_info',
      pagePath: '/crops',
      componentName: 'PestDiseaseManager',
      tooltip: 'Organic treatments',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pest & Disease Management</h3>
        <div className="flex gap-2">
          {pestInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Common Pests */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Common Pests</h4>
          <InfoIcon
            contextKey="pest_disease_info"
            pagePath="/crops"
            componentName="PestDiseaseManager"
            tooltip="Pest identification guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-red-500 pl-3">
            <h5 className="font-medium text-red-700">Fall Armyworm</h5>
            <p className="text-gray-600 mt-1">
              <strong>Identification:</strong> Dark stripes, Y-shaped mark on head
            </p>
            <p className="text-gray-600">
              <strong>Control:</strong> Early detection, biological control, targeted insecticides
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-3">
            <h5 className="font-medium text-orange-700">Stem Borer</h5>
            <p className="text-gray-600 mt-1">
              <strong>Identification:</strong> White larvae, stem tunnels
            </p>
            <p className="text-gray-600">
              <strong>Control:</strong> Crop rotation, early planting, resistant varieties
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-3">
            <h5 className="font-medium text-yellow-700">Aphids</h5>
            <p className="text-gray-600 mt-1">
              <strong>Identification:</strong> Small pear-shaped insects, cluster on undersides of
              leaves
            </p>
            <p className="text-gray-600">
              <strong>Control:</strong> Natural predators, neem oil, insecticidal soap
            </p>
          </div>
        </div>
      </div>

      {/* Disease Management */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Disease Management</h4>
          <InfoIcon
            contextKey="pest_disease_info"
            pagePath="/crops"
            componentName="PestDiseaseManager"
            tooltip="Disease identification guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-purple-500 pl-3">
            <h5 className="font-medium text-purple-700">Maize Streak Virus</h5>
            <p className="text-gray-600 mt-1">
              <strong>Symptoms:</strong> Yellow streaks, stunted growth
            </p>
            <p className="text-gray-600">
              <strong>Management:</strong> Resistant varieties, vector control
            </p>
          </div>
          <div className="border-l-4 border-gray-500 pl-3">
            <h5 className="font-medium text-gray-700">Gray Leaf Spot</h5>
            <p className="text-gray-600 mt-1">
              <strong>Symptoms:</strong> Gray rectangular spots on leaves
            </p>
            <p className="text-gray-600">
              <strong>Management:</strong> Crop rotation, fungicides, proper spacing
            </p>
          </div>
        </div>
      </div>

      {/* IPM Strategies */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Integrated Pest Management</h4>
          <InfoIcon
            contextKey="ipm_strategies_info"
            pagePath="/crops"
            componentName="PestDiseaseManager"
            tooltip="IPM implementation guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Prevention Strategies</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Use certified, disease-free seeds</li>
              <li>• Practice crop rotation (at least 3-year cycle)</li>
              <li>• Maintain proper plant density for air circulation</li>
              <li>• Monitor fields regularly for early detection</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Economic Thresholds</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Fall Armyworm:</strong> Treat when 20% plants show damage
              </p>
              <p>
                <strong>Stem Borer:</strong> Treat when 10% plants show tunnelling
              </p>
              <p>
                <strong>Aphids:</strong> Treat when 50+ aphids per plant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SOIL HEALTH MONITOR WITH INFO
// ============================================================================

interface SoilHealthMonitorProps {
  className?: string;
}

export function SoilHealthMonitorWithInfo({ className = '' }: SoilHealthMonitorProps) {
  const soilInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'soil_testing_info',
      pagePath: '/crops',
      componentName: 'SoilHealthMonitor',
      tooltip: 'Soil testing guide',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'nutrient_management_info',
      pagePath: '/crops',
      componentName: 'SoilHealthMonitor',
      tooltip: 'Nutrient management',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'organic_matter_info',
      pagePath: '/crops',
      componentName: 'SoilHealthMonitor',
      tooltip: 'Organic matter improvement',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Soil Health</h3>
        <div className="flex gap-2">
          {soilInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Soil Testing */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Soil Testing Guidelines</h4>
          <InfoIcon
            contextKey="soil_testing_info"
            pagePath="/crops"
            componentName="SoilHealthMonitor"
            tooltip="Soil testing procedures"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">When to Test</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Before planting new crops</li>
              <li>• Every 3-4 years for established fields</li>
              <li>• When yields are declining unexpectedly</li>
              <li>• Before making major fertilizer decisions</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Key Parameters</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
              <div>
                <strong>pH:</strong> 6.0-7.0 (most crops)
              </div>
              <div>
                <strong>Organic Matter:</strong> 3-5% (ideal)
              </div>
              <div>
                <strong>Nitrogen:</strong> 20-40 ppm (medium fertility)
              </div>
              <div>
                <strong>Phosphorus:</strong> 15-30 ppm (medium fertility)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrient Management */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Nutrient Management</h4>
          <InfoIcon
            contextKey="nutrient_management_info"
            pagePath="/crops"
            componentName="SoilHealthMonitor"
            tooltip="Fertilizer recommendations"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Maize Requirements</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Nitrogen (N):</strong> 120-150 kg/ha for high yields
              </p>
              <p>
                <strong>Phosphorus (P):</strong> 40-60 kg/ha at planting
              </p>
              <p>
                <strong>Potassium (K):</strong> 50-80 kg/ha based on soil test
              </p>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Application Timing</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Basal Application:</strong> 2-3 weeks before planting
              </p>
              <p>
                <strong>Top Dressing:</strong> 3-4 weeks after emergence
              </p>
              <p>
                <strong>Split Application:</strong> 30% at planting, 70% during growth
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// IRRIGATION OPTIMIZER WITH INFO
// ============================================================================

interface IrrigationOptimizerProps {
  className?: string;
}

export function IrrigationOptimizerWithInfo({ className = '' }: IrrigationOptimizerProps) {
  const irrigationInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'irrigation_scheduling_info',
      pagePath: '/crops',
      componentName: 'IrrigationOptimizer',
      tooltip: 'Irrigation scheduling',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'water_conservation_info',
      pagePath: '/crops',
      componentName: 'IrrigationOptimizer',
      tooltip: 'Water conservation',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'drought_management_info',
      pagePath: '/crops',
      componentName: 'IrrigationOptimizer',
      tooltip: 'Drought management',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Irrigation Management</h3>
        <div className="flex gap-2">
          {irrigationInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Irrigation Scheduling */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Smart Irrigation Scheduling</h4>
          <InfoIcon
            contextKey="irrigation_scheduling_info"
            pagePath="/crops"
            componentName="IrrigationOptimizer"
            tooltip="Irrigation best practices"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Crop Water Requirements</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Maize:</strong> 500-600 mm per season
              </p>
              <p>
                <strong>Vegetables:</strong> 300-500 mm per season
              </p>
              <p>
                <strong>Fruits:</strong> 800-1200 mm per season
              </p>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Growth Stage Timing</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Establishment:</strong> Daily light irrigation for first 2 weeks
              </p>
              <p>
                <strong>Vegetative:</strong> Every 3-4 days, soil moisture monitoring
              </p>
              <p>
                <strong>Flowering:</strong> Critical period, every 2-3 days
              </p>
              <p>
                <strong>Grain Fill:</strong> Reduce frequency, maintain soil moisture
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Water Conservation */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Water Conservation</h4>
          <InfoIcon
            contextKey="water_conservation_info"
            pagePath="/crops"
            componentName="IrrigationOptimizer"
            tooltip="Water saving techniques"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Efficiency Techniques</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Drip irrigation (90-95% efficiency)</li>
              <li>• Mulching to reduce evaporation</li>
              <li>• Night irrigation to reduce wind drift</li>
              <li>• Soil moisture sensors for precise timing</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Drought Strategies</h5>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Drought-tolerant varieties:</strong> Choose adapted cultivars
              </p>
              <p>
                <strong>Conservation tillage:</strong> Maintain soil moisture
              </p>
              <p>
                <strong>Windbreaks:</strong> Reduce evapotranspiration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
