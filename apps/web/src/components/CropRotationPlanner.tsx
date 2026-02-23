/**
 * CROP ROTATION PLANNER COMPONENT
 * ================================
 * Advanced crop rotation planning with soil health tracking
 * and intelligent rotation recommendations
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCrops } from '../api/hooks/useCrops';
import { useLocations } from '../api/hooks/useLocations';
import { useFarms } from '../api/hooks/useFarms';
import {
  RefreshCw,
  Plus,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  TrendingUp,
  Sprout,
  Droplets,
  Bug,
  Zap,
  Save,
  X,
} from 'lucide-react';

interface CropRotationPlannerProps {
  farmId?: string;
  className?: string;
}

interface RotationPlan {
  id: string;
  fieldId: string;
  fieldName: string;
  seasons: RotationSeason[];
  soilHealthScore: number;
  nitrogenLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

interface RotationSeason {
  id: string;
  year: number;
  season: string;
  crop: string;
  cropType: 'cereal' | 'legume' | 'root' | 'vegetable' | 'fallow';
  status: 'planned' | 'planted' | 'harvested';
  expectedYield?: number;
  actualYield?: number;
  notes?: string;
}

interface RotationRecommendation {
  fieldId: string;
  currentCrop: string;
  recommendedNext: string[];
  reason: string;
  benefits: string[];
  warnings: string[];
}

// Crop families and their rotation properties
const CROP_FAMILIES: Record<
  string,
  { family: string; nitrogenFixer: boolean; heavyFeeder: boolean; soilImprover: boolean }
> = {
  maize: { family: 'grass', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  wheat: { family: 'grass', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  sorghum: { family: 'grass', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  beans: { family: 'legume', nitrogenFixer: true, heavyFeeder: false, soilImprover: true },
  cowpeas: { family: 'legume', nitrogenFixer: true, heavyFeeder: false, soilImprover: true },
  groundnuts: { family: 'legume', nitrogenFixer: true, heavyFeeder: false, soilImprover: true },
  soybeans: { family: 'legume', nitrogenFixer: true, heavyFeeder: false, soilImprover: true },
  sweet_potato: { family: 'root', nitrogenFixer: false, heavyFeeder: false, soilImprover: true },
  cassava: { family: 'root', nitrogenFixer: false, heavyFeeder: false, soilImprover: false },
  potato: { family: 'root', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  tomato: { family: 'solanaceae', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  cabbage: { family: 'brassica', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  onion: { family: 'allium', nitrogenFixer: false, heavyFeeder: false, soilImprover: false },
  cotton: { family: 'malvaceae', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
  sunflower: { family: 'asteraceae', nitrogenFixer: false, heavyFeeder: true, soilImprover: false },
};

// Sample rotation plans
const SAMPLE_ROTATION_PLANS: RotationPlan[] = [
  {
    id: '1',
    fieldId: 'field-1',
    fieldName: 'Field A - North Section',
    soilHealthScore: 78,
    nitrogenLevel: 'medium',
    lastUpdated: new Date().toISOString(),
    seasons: [
      {
        id: 's1',
        year: 2024,
        season: 'Summer',
        crop: 'maize',
        cropType: 'cereal',
        status: 'harvested',
        actualYield: 8.5,
      },
      {
        id: 's2',
        year: 2025,
        season: 'Winter',
        crop: 'beans',
        cropType: 'legume',
        status: 'harvested',
        actualYield: 2.1,
      },
      {
        id: 's3',
        year: 2025,
        season: 'Summer',
        crop: 'maize',
        cropType: 'cereal',
        status: 'planted',
        expectedYield: 9.0,
      },
      {
        id: 's4',
        year: 2026,
        season: 'Winter',
        crop: 'sweet_potato',
        cropType: 'root',
        status: 'planned',
      },
    ],
  },
  {
    id: '2',
    fieldId: 'field-2',
    fieldName: 'Field B - East Section',
    soilHealthScore: 65,
    nitrogenLevel: 'low',
    lastUpdated: new Date().toISOString(),
    seasons: [
      {
        id: 's5',
        year: 2024,
        season: 'Summer',
        crop: 'cotton',
        cropType: 'cereal',
        status: 'harvested',
        actualYield: 2.8,
      },
      {
        id: 's6',
        year: 2025,
        season: 'Winter',
        crop: 'cowpeas',
        cropType: 'legume',
        status: 'harvested',
        actualYield: 1.5,
      },
      {
        id: 's7',
        year: 2025,
        season: 'Summer',
        crop: 'sorghum',
        cropType: 'cereal',
        status: 'planted',
        expectedYield: 4.5,
      },
      {
        id: 's8',
        year: 2026,
        season: 'Winter',
        crop: 'groundnuts',
        cropType: 'legume',
        status: 'planned',
      },
    ],
  },
  {
    id: '3',
    fieldId: 'field-3',
    fieldName: 'Field C - Irrigated',
    soilHealthScore: 85,
    nitrogenLevel: 'high',
    lastUpdated: new Date().toISOString(),
    seasons: [
      {
        id: 's9',
        year: 2024,
        season: 'Summer',
        crop: 'tomato',
        cropType: 'vegetable',
        status: 'harvested',
        actualYield: 45,
      },
      {
        id: 's10',
        year: 2025,
        season: 'Winter',
        crop: 'cabbage',
        cropType: 'vegetable',
        status: 'harvested',
        actualYield: 35,
      },
      {
        id: 's11',
        year: 2025,
        season: 'Summer',
        crop: 'beans',
        cropType: 'legume',
        status: 'planted',
        expectedYield: 2.5,
      },
      {
        id: 's12',
        year: 2026,
        season: 'Winter',
        crop: 'onion',
        cropType: 'vegetable',
        status: 'planned',
      },
    ],
  },
];

// Generate rotation recommendations
const generateRecommendations = (plans: RotationPlan[]): RotationRecommendation[] => {
  return plans.map(plan => {
    const currentSeason =
      plan.seasons.find(s => s.status === 'planted') || plan.seasons[plan.seasons.length - 1];
    const cropInfo = CROP_FAMILIES[currentSeason?.crop || 'maize'];

    let recommendedNext: string[] = [];
    let reason = '';
    let benefits: string[] = [];
    const warnings: string[] = [];

    if (cropInfo?.heavyFeeder) {
      recommendedNext = ['beans', 'cowpeas', 'groundnuts', 'soybeans'];
      reason =
        'Current crop is a heavy nitrogen feeder. Plant nitrogen-fixing legumes to restore soil fertility.';
      benefits = [
        'Restores nitrogen levels',
        'Improves soil structure',
        'Reduces fertilizer costs',
      ];
      if (plan.nitrogenLevel === 'low') {
        warnings.push('Soil nitrogen is already low - legume rotation is critical');
      }
    } else if (cropInfo?.nitrogenFixer) {
      recommendedNext = ['maize', 'wheat', 'sorghum', 'tomato'];
      reason = 'After nitrogen-fixing legumes, plant heavy feeders to utilize the added nitrogen.';
      benefits = ['Utilizes fixed nitrogen', 'Maximizes yield potential', 'Reduces input costs'];
    } else {
      recommendedNext = ['maize', 'beans', 'sweet_potato'];
      reason = 'Maintain balanced rotation with cereals and legumes.';
      benefits = ['Maintains soil health', 'Breaks pest cycles', 'Diversifies income'];
    }

    // Check for consecutive same-family crops
    const lastTwoCrops = plan.seasons.slice(-2).map(s => CROP_FAMILIES[s.crop]?.family);
    if (lastTwoCrops[0] === lastTwoCrops[1]) {
      warnings.push('Same crop family planted consecutively - increased pest/disease risk');
    }

    return {
      fieldId: plan.fieldId,
      currentCrop: currentSeason?.crop || 'Unknown',
      recommendedNext,
      reason,
      benefits,
      warnings,
    };
  });
};

const CROP_TYPE_COLORS: Record<string, string> = {
  cereal: 'bg-amber-100 text-amber-800',
  legume: 'bg-green-100 text-green-800',
  root: 'bg-orange-100 text-orange-800',
  vegetable: 'bg-blue-100 text-blue-800',
  fallow: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  planted: 'bg-yellow-100 text-yellow-800',
  harvested: 'bg-green-100 text-green-800',
};

export function CropRotationPlanner({ farmId, className = '' }: CropRotationPlannerProps) {
  const [rotationPlans] = useState<RotationPlan[]>(SAMPLE_ROTATION_PLANS);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showAddSeason, setShowAddSeason] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Get farm data
  const { data: farms } = useFarms();
  const { data: locations } = useLocations(farmId || farms?.[0]?.id);
  const { data: crops } = useCrops(farmId || farms?.[0]?.id);

  // Generate recommendations
  const recommendations = useMemo(() => generateRecommendations(rotationPlans), [rotationPlans]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    const avgSoilHealth =
      rotationPlans.reduce((sum, p) => sum + p.soilHealthScore, 0) / rotationPlans.length;
    const lowNitrogenFields = rotationPlans.filter(p => p.nitrogenLevel === 'low').length;
    const activePlanted = rotationPlans.reduce(
      (sum, p) => sum + p.seasons.filter(s => s.status === 'planted').length,
      0
    );

    return { avgSoilHealth, lowNitrogenFields, activePlanted };
  }, [rotationPlans]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-green-600" />
            Crop Rotation Planner
          </h2>
          <p className="text-gray-600">Plan and optimize crop rotations for soil health</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Rotation Plan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Soil Health</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgSoilHealth.toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Nitrogen Fields</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowNitrogenFields}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Crops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePlanted}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Sprout className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotation Plans */}
      <div className="space-y-4">
        {rotationPlans.map(plan => {
          const recommendation = recommendations.find(r => r.fieldId === plan.fieldId);
          const isExpanded = expandedPlan === plan.id;

          return (
            <Card key={plan.id} className="overflow-hidden">
              {/* Plan Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.fieldName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">
                          Soil Health:{' '}
                          <span className="font-medium text-gray-900">{plan.soilHealthScore}%</span>
                        </span>
                        <Badge
                          className={
                            plan.nitrogenLevel === 'high'
                              ? 'bg-green-100 text-green-800'
                              : plan.nitrogenLevel === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          N: {plan.nitrogenLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {recommendation?.warnings && recommendation.warnings.length > 0 && (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t">
                  {/* Rotation Timeline */}
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Rotation Timeline
                    </h4>
                    <div className="overflow-x-auto">
                      <div className="flex gap-3 min-w-max">
                        {plan.seasons.map((season, index) => (
                          <div
                            key={season.id}
                            className="flex-1 min-w-[150px] p-3 bg-white rounded-lg border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                {season.year} {season.season}
                              </span>
                              <Badge className={STATUS_COLORS[season.status]}>
                                {season.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sprout className="w-4 h-4 text-green-600" />
                              <span className="font-medium capitalize">
                                {season.crop.replace('_', ' ')}
                              </span>
                            </div>
                            <Badge className={CROP_TYPE_COLORS[season.cropType]}>
                              {season.cropType}
                            </Badge>
                            {season.expectedYield && (
                              <div className="text-xs text-gray-500 mt-2">
                                Expected: {season.expectedYield} t/ha
                              </div>
                            )}
                            {season.actualYield && (
                              <div className="text-xs text-gray-500 mt-2">
                                Actual: {season.actualYield} t/ha
                              </div>
                            )}
                            {index < plan.seasons.length - 1 && (
                              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendation && (
                    <div className="p-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Rotation Recommendations
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{recommendation.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            {recommendation.recommendedNext.map(crop => (
                              <Button key={crop} variant="outline" size="sm" className="capitalize">
                                {crop.replace('_', ' ')}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-1">Benefits:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {recommendation.benefits.map((b, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {recommendation.warnings.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-amber-700 mb-1">Warnings:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {recommendation.warnings.map((w, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddSeason(plan.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Season
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      Save Plan
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Rotation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Rotation Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-900">Cereals</h4>
              </div>
              <p className="text-sm text-amber-800">
                Heavy nitrogen feeders. Plant after legumes to maximize yield.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Legumes</h4>
              </div>
              <p className="text-sm text-green-800">
                Nitrogen fixers. Plant before cereals to restore soil fertility.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">Root Crops</h4>
              </div>
              <p className="text-sm text-orange-800">
                Improve soil structure. Good transition between cereals and vegetables.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Pest Control</h4>
              </div>
              <p className="text-sm text-blue-800">
                Rotate crop families to break pest and disease cycles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Season Modal */}
      {showAddSeason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Season</CardTitle>
              <button
                onClick={() => setShowAddSeason(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    defaultValue={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select
                    title="Select season"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option>Summer</option>
                    <option>Winter</option>
                    <option>Spring</option>
                    <option>Autumn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                  <select
                    title="Select crop"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="maize">Maize</option>
                    <option value="wheat">Wheat</option>
                    <option value="beans">Beans</option>
                    <option value="cowpeas">Cowpeas</option>
                    <option value="groundnuts">Groundnuts</option>
                    <option value="sweet_potato">Sweet Potato</option>
                    <option value="tomato">Tomato</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddSeason(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Season</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ChevronRight icon component
const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default CropRotationPlanner;
