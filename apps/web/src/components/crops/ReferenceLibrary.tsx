/**
 * REFERENCE LIBRARY COMPONENT
 * ===========================
 * Comprehensive crop reference library with growing guides,
 * variety information, and best practices
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCropVarieties } from '../../api/hooks/useCrops';
import {
  BookOpen,
  Search,
  Filter,
  Sprout,
  Droplets,
  Thermometer,
  Sun,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Leaf,
  Bug,
  Heart,
  TrendingUp,
} from 'lucide-react';

interface ReferenceLibraryProps {
  className?: string;
  onSelectCrop?: (crop: CropReference) => void;
}

interface CropReference {
  id: string;
  name: string;
  category: string;
  varieties: VarietyInfo[];
  growingGuide: GrowingGuide;
  pestAndDiseases: PestDisease[];
  harvestInfo: HarvestInfo;
}

interface VarietyInfo {
  name: string;
  daysToMaturity: number;
  yieldPotential: string;
  characteristics: string[];
  droughtTolerance: 'low' | 'medium' | 'high';
  diseaseResistance: string[];
}

interface GrowingGuide {
  plantingDepth: string;
  spacing: string;
  waterRequirements: string;
  soilType: string;
  phRange: string;
  temperatureRange: string;
  sunlightNeeds: string;
  fertilization: string[];
  plantingSeason: string[];
}

interface PestDisease {
  name: string;
  type: 'pest' | 'disease';
  symptoms: string[];
  prevention: string[];
  treatment: string[];
}

interface HarvestInfo {
  maturitySigns: string[];
  storageConditions: string;
  shelfLife: string;
  postHarvestHandling: string[];
}

// Comprehensive crop reference data
const CROP_REFERENCES: CropReference[] = [
  {
    id: 'maize',
    name: 'Maize (Corn)',
    category: 'cereals',
    varieties: [
      {
        name: 'SC 403',
        daysToMaturity: 120,
        yieldPotential: '8-10 tons/ha',
        characteristics: ['Early maturity', 'Drought tolerant', 'Good grain quality'],
        droughtTolerance: 'high',
        diseaseResistance: ['Maize Streak Virus', 'Gray Leaf Spot'],
      },
      {
        name: 'SC 513',
        daysToMaturity: 140,
        yieldPotential: '10-12 tons/ha',
        characteristics: ['High yield potential', 'Strong stalk', 'Disease resistant'],
        droughtTolerance: 'medium',
        diseaseResistance: ['Northern Leaf Blight', 'Ear Rot'],
      },
      {
        name: 'PAN 53',
        daysToMaturity: 130,
        yieldPotential: '9-11 tons/ha',
        characteristics: ['Yellow grain', 'Good storage quality', 'Versatile'],
        droughtTolerance: 'medium',
        diseaseResistance: ['Rust', 'Leaf Spot'],
      },
    ],
    growingGuide: {
      plantingDepth: '5-8 cm',
      spacing: '75 cm between rows, 25 cm between plants',
      waterRequirements: '500-600 mm per season',
      soilType: 'Well-drained loamy soils',
      phRange: '5.5-7.0',
      temperatureRange: '18-32°C',
      sunlightNeeds: 'Full sun (6-8 hours daily)',
      fertilization: [
        'Apply basal fertilizer at planting: 200-300 kg/ha compound D',
        'Top dress with AN at 4-6 weeks: 150-200 kg/ha',
        'Consider soil test results for precise recommendations',
      ],
      plantingSeason: ['November', 'December', 'January'],
    },
    pestAndDiseases: [
      {
        name: 'Fall Armyworm',
        type: 'pest',
        symptoms: ['Ragged holes in leaves', 'Sawdust-like frass', 'Young larvae feed in whorl'],
        prevention: ['Early planting', 'Crop rotation', 'Regular scouting'],
        treatment: [
          'Biological control with natural enemies',
          'Targeted insecticide application',
          'Remove and destroy affected plants',
        ],
      },
      {
        name: 'Maize Streak Virus',
        type: 'disease',
        symptoms: ['Yellow streaks on leaves', 'Stunted growth', 'Reduced ear size'],
        prevention: [
          'Use resistant varieties',
          'Control leafhopper vectors',
          'Remove infected plants early',
        ],
        treatment: [
          'No chemical cure available',
          'Remove and destroy infected plants',
          'Plant resistant varieties next season',
        ],
      },
    ],
    harvestInfo: {
      maturitySigns: [
        'Black layer formation at grain base',
        'Grain moisture 20-25%',
        'Husks turn dry and brown',
      ],
      storageConditions: 'Dry, well-ventilated area with moisture content below 13%',
      shelfLife: '12-24 months when properly stored',
      postHarvestHandling: [
        'Dry grain to 13% moisture',
        'Sort and remove damaged grains',
        'Store in pest-free containers',
      ],
    },
  },
  {
    id: 'wheat',
    name: 'Wheat',
    category: 'cereals',
    varieties: [
      {
        name: 'Sahara',
        daysToMaturity: 120,
        yieldPotential: '5-7 tons/ha',
        characteristics: ['Heat tolerant', 'Good baking quality', 'Semi-dwarf'],
        droughtTolerance: 'high',
        diseaseResistance: ['Rust', 'Powdery Mildew'],
      },
      {
        name: 'Dande',
        daysToMaturity: 130,
        yieldPotential: '6-8 tons/ha',
        characteristics: ['High yield', 'Disease resistant', 'Good grain quality'],
        droughtTolerance: 'medium',
        diseaseResistance: ['Leaf Rust', 'Stem Rust'],
      },
    ],
    growingGuide: {
      plantingDepth: '3-5 cm',
      spacing: '15-20 cm between rows',
      waterRequirements: '400-600 mm per season',
      soilType: 'Well-drained loam to clay loam',
      phRange: '6.0-7.5',
      temperatureRange: '10-25°C optimal',
      sunlightNeeds: 'Full sun',
      fertilization: [
        'Apply basal fertilizer: 150-200 kg/ha compound D',
        'Top dress at tillering: 100-150 kg/ha AN',
        'Apply additional nitrogen if needed',
      ],
      plantingSeason: ['May', 'June', 'July'],
    },
    pestAndDiseases: [
      {
        name: 'Aphids',
        type: 'pest',
        symptoms: ['Curled leaves', 'Sticky honeydew', 'Yellowing plants'],
        prevention: ['Encourage natural predators', 'Avoid excessive nitrogen', 'Early detection'],
        treatment: ['Insecticidal soap', 'Neem oil spray', 'Biological control agents'],
      },
      {
        name: 'Stem Rust',
        type: 'disease',
        symptoms: ['Reddish-brown pustules on stems', 'Orange spore masses', 'Weakened stems'],
        prevention: ['Use resistant varieties', 'Remove volunteer wheat', 'Timely planting'],
        treatment: ['Fungicide application', 'Remove infected plants', 'Improve air circulation'],
      },
    ],
    harvestInfo: {
      maturitySigns: ['Golden color', 'Grain moisture 12-14%', 'Hard grain texture'],
      storageConditions: 'Cool, dry storage with moisture below 12%',
      shelfLife: '24+ months when properly stored',
      postHarvestHandling: ['Dry thoroughly', 'Clean grain', 'Store in sealed containers'],
    },
  },
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetables',
    varieties: [
      {
        name: 'Roma VF',
        daysToMaturity: 75,
        yieldPotential: '40-60 tons/ha',
        characteristics: ['Determinate', 'Disease resistant', 'Good for processing'],
        droughtTolerance: 'low',
        diseaseResistance: ['Verticillium Wilt', 'Fusarium Wilt'],
      },
      {
        name: 'Money Maker',
        daysToMaturity: 80,
        yieldPotential: '50-70 tons/ha',
        characteristics: ['Indeterminate', 'Large fruits', 'Fresh market'],
        droughtTolerance: 'low',
        diseaseResistance: ['Bacterial Wilt'],
      },
    ],
    growingGuide: {
      plantingDepth: '1-2 cm (seeds), transplant seedlings at 15-20 cm',
      spacing: '90 cm between rows, 60 cm between plants',
      waterRequirements: '25-40 mm per week',
      soilType: 'Well-drained, fertile loam',
      phRange: '6.0-6.8',
      temperatureRange: '20-30°C',
      sunlightNeeds: 'Full sun (8+ hours)',
      fertilization: [
        'Apply compost or well-rotted manure',
        'Basal fertilizer: 500 kg/ha compound D',
        'Top dress with CAN at flowering',
      ],
      plantingSeason: ['February', 'March', 'August', 'September'],
    },
    pestAndDiseases: [
      {
        name: 'Tuta Absoluta',
        type: 'pest',
        symptoms: ['Leaf mines', 'Galleries in fruits', 'Dieback of growing tips'],
        prevention: ['Use pheromone traps', 'Remove crop residues', 'Crop rotation'],
        treatment: ['Biological control', 'Targeted insecticides', 'Remove infested plant parts'],
      },
      {
        name: 'Early Blight',
        type: 'disease',
        symptoms: ['Concentric rings on leaves', 'Yellowing', 'Stem cankers'],
        prevention: ['Crop rotation', 'Proper spacing', 'Avoid overhead irrigation'],
        treatment: ['Fungicide application', 'Remove infected leaves', 'Improve air circulation'],
      },
    ],
    harvestInfo: {
      maturitySigns: [
        'Color change from green to pink/red',
        'Firm but slightly soft',
        'Glossy appearance',
      ],
      storageConditions: 'Cool (12-15°C), avoid refrigeration',
      shelfLife: '1-3 weeks depending on ripeness',
      postHarvestHandling: [
        'Handle carefully to avoid bruising',
        'Sort by ripeness',
        'Store at appropriate temperature',
      ],
    },
  },
  {
    id: 'beans',
    name: 'Common Beans',
    category: 'legumes',
    varieties: [
      {
        name: 'NUA 45',
        daysToMaturity: 90,
        yieldPotential: '2-3 tons/ha',
        characteristics: ['Bush type', 'Disease resistant', 'Good grain quality'],
        droughtTolerance: 'medium',
        diseaseResistance: ['Bean Rust', 'Angular Leaf Spot'],
      },
      {
        name: 'Sugar 131',
        daysToMaturity: 85,
        yieldPotential: '2.5-3.5 tons/ha',
        characteristics: ['High yield', 'Early maturity', 'Sweet taste'],
        droughtTolerance: 'medium',
        diseaseResistance: ['Anthracnose', 'Bean Common Mosaic Virus'],
      },
    ],
    growingGuide: {
      plantingDepth: '3-5 cm',
      spacing: '50 cm between rows, 10 cm between plants',
      waterRequirements: '300-400 mm per season',
      soilType: 'Well-drained, medium fertility',
      phRange: '6.0-7.0',
      temperatureRange: '15-30°C',
      sunlightNeeds: 'Full sun',
      fertilization: [
        'Inoculate seeds with rhizobium bacteria',
        'Apply minimal nitrogen if needed',
        'Add phosphorus at planting: 100 kg/ha SSP',
      ],
      plantingSeason: ['November', 'December', 'February', 'March'],
    },
    pestAndDiseases: [
      {
        name: 'Bean Stem Maggot',
        type: 'pest',
        symptoms: ['Wilting plants', 'Tunneling in stems', 'Yellowing leaves'],
        prevention: ['Early planting', 'Crop rotation', 'Destroy crop residues'],
        treatment: [
          'Apply insecticide at planting',
          'Use resistant varieties',
          'Biological control',
        ],
      },
      {
        name: 'Anthracnose',
        type: 'disease',
        symptoms: ['Sunken lesions on pods', 'Black spots on stems', 'Leaf spots'],
        prevention: ['Use certified seed', 'Crop rotation', 'Avoid working wet plants'],
        treatment: ['Fungicide application', 'Remove infected plants', 'Use resistant varieties'],
      },
    ],
    harvestInfo: {
      maturitySigns: ['Pods turn yellow and dry', 'Seeds rattle inside', 'Leaves drop'],
      storageConditions: 'Dry, cool storage with moisture below 14%',
      shelfLife: '12+ months when properly stored',
      postHarvestHandling: [
        'Thresh when fully dry',
        'Clean and sort',
        'Store in airtight containers',
      ],
    },
  },
  {
    id: 'sweet_potato',
    name: 'Sweet Potato',
    category: 'tubers',
    varieties: [
      {
        name: 'Brondal',
        daysToMaturity: 120,
        yieldPotential: '20-30 tons/ha',
        characteristics: ['Orange flesh', 'High beta-carotene', 'Drought tolerant'],
        droughtTolerance: 'high',
        diseaseResistance: ['Sweet Potato Virus Disease'],
      },
      {
        name: 'Mugande',
        daysToMaturity: 130,
        yieldPotential: '25-35 tons/ha',
        characteristics: ['White flesh', 'High dry matter', 'Good storage'],
        droughtTolerance: 'high',
        diseaseResistance: ['Weevil tolerance'],
      },
    ],
    growingGuide: {
      plantingDepth: 'Plant vines 10-15 cm deep',
      spacing: '100 cm between rows, 30 cm between plants',
      waterRequirements: '400-600 mm per season',
      soilType: 'Sandy loam, well-drained',
      phRange: '5.5-6.5',
      temperatureRange: '20-30°C',
      sunlightNeeds: 'Full sun',
      fertilization: [
        'Apply compost or manure',
        'Minimal nitrogen needed',
        'Add potassium for better tuber development',
      ],
      plantingSeason: ['September', 'October', 'November', 'December'],
    },
    pestAndDiseases: [
      {
        name: 'Sweet Potato Weevil',
        type: 'pest',
        symptoms: ['Tunneling in tubers', 'Vine damage', 'Rotting tubers'],
        prevention: ['Use clean planting material', 'Crop rotation', 'Hilling up soil'],
        treatment: ['Remove infested plants', 'Biological control', 'Proper storage hygiene'],
      },
      {
        name: 'Sweet Potato Virus Disease',
        type: 'disease',
        symptoms: ['Stunted growth', 'Leaf distortion', 'Yellow mottling'],
        prevention: ['Use virus-free cuttings', 'Control aphids', 'Remove infected plants'],
        treatment: ['No cure available', 'Remove infected plants', 'Use resistant varieties'],
      },
    ],
    harvestInfo: {
      maturitySigns: ['Yellowing leaves', 'Skin set on tubers', 'Vines begin to dry'],
      storageConditions: 'Cool (13-15°C), well-ventilated, avoid refrigeration',
      shelfLife: '4-6 months when properly cured and stored',
      postHarvestHandling: [
        'Cure at 30°C for 5-7 days',
        'Handle carefully to avoid damage',
        'Store in dry conditions',
      ],
    },
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  cereals: {
    label: 'Cereals',
    color: 'bg-amber-100 text-amber-800',
    icon: <Sprout className="w-4 h-4" />,
  },
  vegetables: {
    label: 'Vegetables',
    color: 'bg-green-100 text-green-800',
    icon: <Leaf className="w-4 h-4" />,
  },
  legumes: {
    label: 'Legumes',
    color: 'bg-blue-100 text-blue-800',
    icon: <Heart className="w-4 h-4" />,
  },
  tubers: {
    label: 'Tubers',
    color: 'bg-orange-100 text-orange-800',
    icon: <MapPin className="w-4 h-4" />,
  },
  fruits: {
    label: 'Fruits',
    color: 'bg-red-100 text-red-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
};

export function ReferenceLibrary({ className = '', onSelectCrop }: ReferenceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'varieties' | 'pests' | 'harvest'>('guide');

  const { data: apiVarieties, isLoading } = useCropVarieties();

  // Filter crops based on search and category
  const filteredCrops = useMemo(() => {
    let result = CROP_REFERENCES;

    if (selectedCategory !== 'all') {
      result = result.filter(crop => crop.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        crop =>
          crop.name.toLowerCase().includes(query) ||
          crop.varieties.some(v => v.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(CROP_REFERENCES.map(c => c.category));
    return ['all', ...Array.from(cats)];
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Crop Reference Library
          </h2>
          <p className="text-gray-600">Growing guides, varieties, and best practices</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search crops or varieties..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat === 'all' ? 'All Crops' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Crop Cards */}
      <div className="space-y-4">
        {filteredCrops.map(crop => (
          <Card key={crop.id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedCrop(expandedCrop === crop.id ? null : crop.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Sprout className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{crop.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={CATEGORY_CONFIG[crop.category]?.color || 'bg-gray-100'}>
                        {CATEGORY_CONFIG[crop.category]?.label || crop.category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {crop.varieties.length} varieties
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectCrop?.(crop);
                    }}
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  {expandedCrop === crop.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedCrop === crop.id && (
              <div className="border-t">
                {/* Tabs */}
                <div className="flex border-b overflow-x-auto">
                  {[
                    { id: 'guide', label: 'Growing Guide', icon: <BookOpen className="w-4 h-4" /> },
                    { id: 'varieties', label: 'Varieties', icon: <Sprout className="w-4 h-4" /> },
                    { id: 'pests', label: 'Pests & Diseases', icon: <Bug className="w-4 h-4" /> },
                    { id: 'harvest', label: 'Harvest', icon: <CheckCircle className="w-4 h-4" /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-green-600 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {activeTab === 'guide' && <GrowingGuideTab guide={crop.growingGuide} />}
                  {activeTab === 'varieties' && <VarietiesTab varieties={crop.varieties} />}
                  {activeTab === 'pests' && <PestsDiseasesTab items={crop.pestAndDiseases} />}
                  {activeTab === 'harvest' && <HarvestTab info={crop.harvestInfo} />}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

// Growing Guide Tab Component
function GrowingGuideTab({ guide }: { guide: GrowingGuide }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          Planting Requirements
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Planting Depth</span>
            <span className="font-medium">{guide.plantingDepth}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Spacing</span>
            <span className="font-medium">{guide.spacing}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Soil Type</span>
            <span className="font-medium">{guide.soilType}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">pH Range</span>
            <span className="font-medium">{guide.phRange}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600" />
          Water & Climate
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Water Needs</span>
            <span className="font-medium">{guide.waterRequirements}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Temperature</span>
            <span className="font-medium">{guide.temperatureRange}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Sunlight</span>
            <span className="font-medium">{guide.sunlightNeeds}</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          Planting Season
        </h4>
        <div className="flex flex-wrap gap-2">
          {guide.plantingSeason.map(month => (
            <Badge key={month} variant="outline">
              {month}
            </Badge>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          Fertilization Guide
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {guide.fertilization.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Varieties Tab Component
function VarietiesTab({ varieties }: { varieties: VarietyInfo[] }) {
  return (
    <div className="space-y-4">
      {varieties.map((variety, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="font-semibold text-gray-900">{variety.name}</h5>
              <p className="text-sm text-gray-600">{variety.yieldPotential}</p>
            </div>
            <div className="flex gap-2">
              <Badge
                className={
                  variety.droughtTolerance === 'high'
                    ? 'bg-green-100 text-green-800'
                    : variety.droughtTolerance === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {variety.droughtTolerance} drought tolerance
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Days to Maturity:</span>
              <span className="ml-2 font-medium">{variety.daysToMaturity} days</span>
            </div>
            <div>
              <span className="text-gray-600">Characteristics:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {variety.characteristics.map((char, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {variety.diseaseResistance.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-sm text-gray-600">Disease Resistance:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {variety.diseaseResistance.map((disease, i) => (
                  <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {disease}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// Pests & Diseases Tab Component
function PestsDiseasesTab({ items }: { items: PestDisease[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {item.type === 'pest' ? (
              <Bug className="w-5 h-5 text-red-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
            <h5 className="font-semibold text-gray-900">{item.name}</h5>
            <Badge
              className={
                item.type === 'pest' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }
            >
              {item.type}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <h6 className="text-sm font-medium text-gray-700 mb-2">Symptoms</h6>
              <ul className="text-sm text-gray-600 space-y-1">
                {item.symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h6 className="text-sm font-medium text-gray-700 mb-2">Prevention</h6>
              <ul className="text-sm text-gray-600 space-y-1">
                {item.prevention.map((prev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                    {prev}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h6 className="text-sm font-medium text-gray-700 mb-2">Treatment</h6>
              <ul className="text-sm text-gray-600 space-y-1">
                {item.treatment.map((treat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Info className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                    {treat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Harvest Tab Component
function HarvestTab({ info }: { info: HarvestInfo }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Maturity Signs
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {info.maturitySigns.map((sign, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {sign}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            Storage Conditions
          </h4>
          <p className="text-sm text-gray-600">{info.storageConditions}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-600" />
            Shelf Life
          </h4>
          <p className="text-sm text-gray-600">{info.shelfLife}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          Post-Harvest Handling
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {info.postHarvestHandling.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ReferenceLibrary;
