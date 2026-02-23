/**
 * ZIMBABWE AGROECOLOGICAL ZONES DATA
 * ===================================
 * Comprehensive data for Zimbabwe's 5 natural regions with recommended farming activities
 */

// ============================================================================
// AGROECOLOGICAL ZONES DEFINITIONS
// ============================================================================

export interface AgroecologicalZone {
  id: number;
  name: string;
  description: string;
  characteristics: {
    rainfall_mm: string;
    altitude_m: string;
    temperature_range: string;
    growing_season_days: number;
    soil_types: string[];
    climate_classification: string;
  };
  suitable_crops: string[];
  suitable_livestock: string[];
  farming_activities: FarmingActivity[];
  challenges: string[];
  opportunities: string[];
}

export interface FarmingActivity {
  id: string;
  name: string;
  category:
    | 'crop_production'
    | 'livestock_management'
    | 'soil_management'
    | 'water_management'
    | 'conservation'
    | 'post_harvest';
  timing: {
    start_month: number;
    end_month: number;
    optimal_months: number[];
  };
  description: string;
  requirements: {
    labor: 'low' | 'medium' | 'high';
    equipment: string[];
    inputs: string[];
    skills: string[];
  };
  expected_outcomes: {
    yield_benefits: string[];
    environmental_benefits: string[];
    economic_benefits: string[];
  };
  risk_factors: string[];
  alternatives: string[];
}

// ============================================================================
// ZIMBABWE'S FIVE AGROECOLOGICAL ZONES
// ============================================================================

export const zimbabweAgroecologicalZones: AgroecologicalZone[] = [
  {
    id: 1,
    name: 'Region I - Highveld',
    description:
      'High altitude area with reliable rainfall, suitable for intensive agriculture and horticulture',
    characteristics: {
      rainfall_mm: '1000-1500+',
      altitude_m: '1500-2500',
      temperature_range: '15-22°C',
      growing_season_days: 180 - 220,
      soil_types: ['Red clay loams', 'Lateritic soils', 'Granitic sands'],
      climate_classification: 'Temperate highland',
    },
    suitable_crops: [
      'Wheat',
      'Barley',
      'Potatoes',
      'Tobacco',
      'Horticultural crops',
      'Berries',
      'Apples',
      'Peaches',
      'Cut flowers',
      'Vegetables',
    ],
    suitable_livestock: ['Dairy cattle', 'Beef cattle', 'Sheep', 'Poultry', 'Pigs'],
    farming_activities: [
      {
        id: 'region1-winter-planting',
        name: 'Winter Wheat Planting',
        category: 'crop_production',
        timing: {
          start_month: 4,
          end_month: 6,
          optimal_months: [5],
        },
        description: 'Plant winter wheat varieties during the cool season for optimal yields',
        requirements: {
          labor: 'medium',
          equipment: ['Tractor', 'Planter', 'Fertilizer spreader'],
          inputs: ['Certified wheat seed', 'NPK fertilizer', 'Herbicides'],
          skills: ['Crop management', 'Fertilizer application'],
        },
        expected_outcomes: {
          yield_benefits: ['High yields (6-8 tons/ha)', 'Good grain quality'],
          environmental_benefits: ['Soil structure improvement', 'Erosion control'],
          economic_benefits: ['Premium market prices', 'Export potential'],
        },
        risk_factors: ['Early frost', 'Excessive rainfall', 'Wheat rust'],
        alternatives: ['Barley', 'Oats'],
      },
      {
        id: 'region1-tobacco-curing',
        name: 'Tobacco Curing and Marketing',
        category: 'post_harvest',
        timing: {
          start_month: 8,
          end_month: 11,
          optimal_months: [9, 10],
        },
        description: 'Cure harvested tobacco leaves and prepare for market',
        requirements: {
          labor: 'high',
          equipment: ['Curing barns', 'Sorting tables', 'Packaging materials'],
          inputs: ['Curing fuel', 'Packaging materials'],
          skills: ['Tobacco grading', 'Quality control'],
        },
        expected_outcomes: {
          yield_benefits: ['Premium quality leaves', 'Higher market value'],
          environmental_benefits: ['Value addition', 'Reduced post-harvest losses'],
          economic_benefits: ['Export earnings', 'Foreign currency generation'],
        },
        risk_factors: ['Fire hazards', 'Quality deterioration', 'Market price fluctuations'],
        alternatives: ['Contract farming', 'Value-added processing'],
      },
      {
        id: 'region1-dairy-management',
        name: 'Intensive Dairy Management',
        category: 'livestock_management',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [3, 4, 5, 9, 10, 11],
        },
        description: 'Optimize dairy production through improved feeding and breeding',
        requirements: {
          labor: 'high',
          equipment: ['Milking parlors', 'Cooling tanks', 'Feed mixers'],
          inputs: ['Concentrate feeds', 'Mineral supplements', 'Veterinary drugs'],
          skills: ['Dairy management', 'Animal nutrition', 'Reproductive management'],
        },
        expected_outcomes: {
          yield_benefits: ['Increased milk yield', 'Improved milk quality'],
          environmental_benefits: ['Manure management', 'Nutrient cycling'],
          economic_benefits: ['Regular income', 'Value-added products'],
        },
        risk_factors: ['Disease outbreaks', 'Feed shortages', 'Market price drops'],
        alternatives: ['Goat dairy', 'Sheep dairy'],
      },
    ],
    challenges: [
      'High input costs',
      'Labor shortages',
      'Market access limitations',
      'Climate variability',
      'Soil acidity',
    ],
    opportunities: [
      'High-value crops',
      'Export markets',
      'Agro-processing',
      'Contract farming',
      'Organic production',
    ],
  },
  {
    id: 2,
    name: 'Region II - Middleveld',
    description: 'Moderate altitude with good rainfall, suitable for diversified farming',
    characteristics: {
      rainfall_mm: '750-1000',
      altitude_m: '1200-1500',
      temperature_range: '18-25°C',
      growing_season_days: 150 - 180,
      soil_types: ['Red clays', 'Sandy loams', 'Alluvial soils'],
      climate_classification: 'Sub-tropical',
    },
    suitable_crops: [
      'Maize',
      'Soybeans',
      'Groundnuts',
      'Cotton',
      'Tobacco',
      'Sunflower',
      'Sorghum',
      'Horticultural crops',
    ],
    suitable_livestock: ['Beef cattle', 'Dairy cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs'],
    farming_activities: [
      {
        id: 'region2-maize-production',
        name: 'Commercial Maize Production',
        category: 'crop_production',
        timing: {
          start_month: 10,
          end_month: 4,
          optimal_months: [11, 12],
        },
        description: 'Plant high-yield maize varieties with proper fertilization',
        requirements: {
          labor: 'medium',
          equipment: ['Tractor', 'Planter', 'Sprayer', 'Harvester'],
          inputs: ['Hybrid maize seed', 'NPK fertilizer', 'Herbicides', 'Pesticides'],
          skills: ['Crop management', 'Fertilizer application', 'Pest management'],
        },
        expected_outcomes: {
          yield_benefits: ['High yields (8-12 tons/ha)', 'Good grain quality'],
          environmental_benefits: ['Soil fertility maintenance', 'Crop rotation benefits'],
          economic_benefits: ['Food security', 'Market sales', 'Contract farming'],
        },
        risk_factors: ['Drought stress', 'Maize streak virus', 'Fall armyworm'],
        alternatives: ['Sorghum', 'Millet'],
      },
      {
        id: 'region2-soybean-production',
        name: 'Soybean Production',
        category: 'crop_production',
        timing: {
          start_month: 11,
          end_month: 3,
          optimal_months: [12, 1],
        },
        description: 'Grow soybeans for oil and protein markets',
        requirements: {
          labor: 'medium',
          equipment: ['Tractor', 'Planter', 'Harvester'],
          inputs: ['Soybean seed', 'Inoculant', 'Fertilizer', 'Herbicides'],
          skills: ['Legume management', 'Inoculation techniques'],
        },
        expected_outcomes: {
          yield_benefits: ['Good yields (2-3 tons/ha)', 'Soil nitrogen fixation'],
          environmental_benefits: ['Nitrogen fixation', 'Soil improvement'],
          economic_benefits: ['Oil processing', 'Animal feed market'],
        },
        risk_factors: ['Poor inoculation', 'Drought', 'Pest attacks'],
        alternatives: ['Groundnuts', 'Beans'],
      },
      {
        id: 'region2-livestock-finishing',
        name: 'Livestock Finishing Operations',
        category: 'livestock_management',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [4, 5, 6, 10, 11, 12],
        },
        description: 'Finish cattle and goats for market using improved feeding',
        requirements: {
          labor: 'medium',
          equipment: ['Feeding equipment', 'Handling facilities', 'Weight scales'],
          inputs: ['Concentrate feeds', 'Mineral supplements', 'Vaccines'],
          skills: ['Animal nutrition', 'Feed formulation', 'Health management'],
        },
        expected_outcomes: {
          yield_benefits: ['Improved weight gain', 'Better carcass quality'],
          environmental_benefits: ['Efficient feed conversion', 'Manure management'],
          economic_benefits: ['Premium prices', 'Market access'],
        },
        risk_factors: ['Feed price volatility', 'Disease outbreaks', 'Market fluctuations'],
        alternatives: ['Contract finishing', 'Pasture-based finishing'],
      },
    ],
    challenges: [
      'Input costs',
      'Market volatility',
      'Infrastructure limitations',
      'Climate variability',
      'Pest pressure',
    ],
    opportunities: [
      'Contract farming',
      'Agro-processing',
      'Export markets',
      'Value addition',
      'Organic production',
    ],
  },
  {
    id: 3,
    name: 'Region III - Lowveld',
    description: 'Lower altitude with moderate rainfall, suitable for mixed farming',
    characteristics: {
      rainfall_mm: '450-750',
      altitude_m: '900-1200',
      temperature_range: '20-28°C',
      growing_season_days: 120 - 150,
      soil_types: ['Sandy soils', 'Clay loams', 'Red soils'],
      climate_classification: 'Tropical',
    },
    suitable_crops: [
      'Maize',
      'Cotton',
      'Sorghum',
      'Millet',
      'Groundnuts',
      'Sunflower',
      'Tobacco',
      'Horticultural crops',
    ],
    suitable_livestock: ['Beef cattle', 'Goats', 'Sheep', 'Indigenous chickens', 'Pigs'],
    farming_activities: [
      {
        id: 'region3-cotton-production',
        name: 'Cotton Production',
        category: 'crop_production',
        timing: {
          start_month: 10,
          end_month: 3,
          optimal_months: [11, 12],
        },
        description: 'Grow cotton for textile markets with proper pest management',
        requirements: {
          labor: 'high',
          equipment: ['Tractor', 'Planter', 'Sprayer', 'Cotton picker'],
          inputs: ['Cotton seed', 'Fertilizer', 'Pesticides', 'Defoliants'],
          skills: ['Cotton management', 'Pest control', 'Harvest timing'],
        },
        expected_outcomes: {
          yield_benefits: ['Good yields (2-4 tons/ha)', 'Fiber quality'],
          environmental_benefits: ['Crop rotation benefits', 'Soil structure'],
          economic_benefits: ['Export earnings', 'Industrial demand'],
        },
        risk_factors: ['Pest outbreaks', 'Price volatility', 'Weather risks'],
        alternatives: ['Sunflower', 'Hemp'],
      },
      {
        id: 'region3-small-grains',
        name: 'Small Grains Production',
        category: 'crop_production',
        timing: {
          start_month: 11,
          end_month: 2,
          optimal_months: [12, 1],
        },
        description: 'Plant drought-tolerant small grains for food security',
        requirements: {
          labor: 'low',
          equipment: ['Hand tools', 'Animal traction', 'Basic implements'],
          inputs: ['Small grain seed', 'Minimal fertilizer', 'Herbicides'],
          skills: ['Traditional farming', 'Seed selection'],
        },
        expected_outcomes: {
          yield_benefits: ['Reliable yields', 'Food security'],
          environmental_benefits: ['Drought tolerance', 'Low input requirements'],
          economic_benefits: ['Local markets', 'Food security'],
        },
        risk_factors: ['Bird damage', 'Limited markets', 'Processing challenges'],
        alternatives: ['Maize', 'Root crops'],
      },
      {
        id: 'region3-goat-production',
        name: 'Goat Production Systems',
        category: 'livestock_management',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [3, 4, 5, 8, 9, 10],
        },
        description: 'Raise indigenous and improved goat breeds for meat and milk',
        requirements: {
          labor: 'medium',
          equipment: ['Housing', 'Feeding equipment', 'Health tools'],
          inputs: ['Supplemental feeds', 'Minerals', 'Veterinary supplies'],
          skills: ['Goat management', 'Health care', 'Breeding'],
        },
        expected_outcomes: {
          yield_benefits: ['Multiple births', 'Fast growth rates'],
          environmental_benefits: ['Browse utilization', 'Low input requirements'],
          economic_benefits: ['Regular income', 'Market demand'],
        },
        risk_factors: ['Predation', 'Disease', 'Feed shortages'],
        alternatives: ['Sheep production', 'Indigenous chicken'],
      },
    ],
    challenges: [
      'Unreliable rainfall',
      'High temperatures',
      'Pest pressure',
      'Limited infrastructure',
      'Market access',
    ],
    opportunities: [
      'Drought-tolerant crops',
      'Livestock integration',
      'Agro-processing',
      'Contract farming',
      'Traditional crops',
    ],
  },
  {
    id: 4,
    name: 'Region IV - Semi-Arid',
    description: 'Low rainfall area suitable for drought-tolerant crops and extensive livestock',
    characteristics: {
      rainfall_mm: '250-450',
      altitude_m: '600-900',
      temperature_range: '22-32°C',
      growing_season_days: 90 - 120,
      soil_types: ['Sandy soils', 'Calcareous soils', 'Shallow soils'],
      climate_classification: 'Semi-arid',
    },
    suitable_crops: [
      'Sorghum',
      'Millet',
      'Cowpeas',
      'Groundnuts',
      'Sunflower',
      'Drought-tolerant maize',
      'Traditional vegetables',
    ],
    suitable_livestock: ['Indigenous cattle', 'Goats', 'Sheep', 'Indigenous chickens', 'Donkeys'],
    farming_activities: [
      {
        id: 'region4-drought-crops',
        name: 'Drought-Tolerant Crop Production',
        category: 'crop_production',
        timing: {
          start_month: 11,
          end_month: 2,
          optimal_months: [12, 1],
        },
        description: 'Plant drought-tolerant crops with water conservation techniques',
        requirements: {
          labor: 'low',
          equipment: ['Conservation implements', 'Water harvesting structures'],
          inputs: ['Drought-tolerant seed', 'Conservation inputs'],
          skills: ['Water harvesting', 'Conservation agriculture'],
        },
        expected_outcomes: {
          yield_benefits: ['Reliable yields', 'Food security'],
          environmental_benefits: ['Water conservation', 'Soil protection'],
          economic_benefits: ['Risk reduction', 'Food security'],
        },
        risk_factors: ['Total crop failure', 'Severe drought', 'Feed shortages'],
        alternatives: ['Water harvesting', 'Irrigation development'],
      },
      {
        id: 'region4-extensive-livestock',
        name: 'Extensive Livestock Production',
        category: 'livestock_management',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [6, 7, 8, 9, 10, 11],
        },
        description: 'Run extensive livestock systems adapted to arid conditions',
        requirements: {
          labor: 'low',
          equipment: ['Mobile handling', 'Water points', 'Fencing'],
          inputs: ['Supplemental feed', 'Minerals', 'Veterinary supplies'],
          skills: ['Range management', 'Water point management'],
        },
        expected_outcomes: {
          yield_benefits: ['Adapted breeds', 'Low input costs'],
          environmental_benefits: ['Range utilization', 'Biodiversity'],
          economic_benefits: ['Risk spreading', 'Asset accumulation'],
        },
        risk_factors: ['Drought', 'Feed shortages', 'Disease outbreaks'],
        alternatives: ['Game farming', 'Eco-tourism'],
      },
      {
        id: 'region4-water-conservation',
        name: 'Water Conservation and Harvesting',
        category: 'water_management',
        timing: {
          start_month: 9,
          end_month: 4,
          optimal_months: [10, 11, 3, 4],
        },
        description: 'Construct and maintain water harvesting structures',
        requirements: {
          labor: 'medium',
          equipment: ['Construction tools', 'Earth-moving equipment'],
          inputs: ['Construction materials', 'Technical expertise'],
          skills: ['Water engineering', 'Construction'],
        },
        expected_outcomes: {
          yield_benefits: ['Water security', 'Extended growing season'],
          environmental_benefits: ['Groundwater recharge', 'Soil moisture'],
          economic_benefits: ['Risk reduction', 'Increased production'],
        },
        risk_factors: ['Structure failure', 'High costs', 'Technical challenges'],
        alternatives: ['Small dams', 'Sand rivers abstraction'],
      },
    ],
    challenges: [
      'Severe drought',
      'Water scarcity',
      'High temperatures',
      'Soil degradation',
      'Limited services',
    ],
    opportunities: [
      'Drought-tolerant technologies',
      'Water harvesting',
      'Livestock breeds',
      'Renewable energy',
      'Carbon farming',
    ],
  },
  {
    id: 5,
    name: 'Region V - Arid',
    description: 'Very low rainfall area suitable for very drought-tolerant activities',
    characteristics: {
      rainfall_mm: '<250',
      altitude_m: '300-600',
      temperature_range: '25-35°C',
      growing_season_days: 90,
      soil_types: ['Arenosols', 'Calcareous soils', 'Rocky areas'],
      climate_classification: 'Arid',
    },
    suitable_crops: ['Very drought-tolerant sorghum', 'Pearl millet', 'Cowpeas', 'Watermelon'],
    suitable_livestock: ['Indigenous cattle', 'Goats', 'Sheep', 'Donkeys', 'Indigenous chickens'],
    farming_activities: [
      {
        id: 'region5-survival-crops',
        name: 'Survival Crop Production',
        category: 'crop_production',
        timing: {
          start_month: 12,
          end_month: 2,
          optimal_months: [1],
        },
        description: 'Plant extremely drought-tolerant crops for survival',
        requirements: {
          labor: 'low',
          equipment: ['Hand tools', 'Traditional implements'],
          inputs: ['Traditional seed varieties', 'Minimal inputs'],
          skills: ['Traditional knowledge', 'Risk management'],
        },
        expected_outcomes: {
          yield_benefits: ['Basic food security', 'Seed preservation'],
          environmental_benefits: ['Genetic conservation', 'Traditional practices'],
          economic_benefits: ['Survival', 'Cultural preservation'],
        },
        risk_factors: ['Total crop failure', 'Famine risk', 'Seed loss'],
        alternatives: ['Food aid', 'Migration'],
      },
      {
        id: 'region5-minimal-livestock',
        name: 'Minimal Livestock Systems',
        category: 'livestock_management',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [7, 8, 9, 10],
        },
        description: 'Maintain minimal livestock for survival and asset preservation',
        requirements: {
          labor: 'low',
          equipment: ['Basic tools', 'Mobile housing'],
          inputs: ['Minimal supplements', 'Traditional medicines'],
          skills: ['Traditional animal care', 'Risk management'],
        },
        expected_outcomes: {
          yield_benefits: ['Asset preservation', 'Basic products'],
          environmental_benefits: ['Low impact', 'Traditional breeds'],
          economic_benefits: ['Wealth storage', 'Cultural value'],
        },
        risk_factors: ['High mortality', 'Feed shortages', 'Water scarcity'],
        alternatives: ['Wild products', 'Non-farm income'],
      },
      {
        id: 'region5-alternative-livelihoods',
        name: 'Alternative Livelihood Strategies',
        category: 'conservation',
        timing: {
          start_month: 1,
          end_month: 12,
          optimal_months: [6, 7, 8, 9, 10, 11],
        },
        description: 'Develop non-agricultural livelihood strategies',
        requirements: {
          labor: 'medium',
          equipment: ['Varied tools', 'Training materials'],
          inputs: ['Training', 'Markets', 'Infrastructure'],
          skills: ['Diverse skills', 'Business management'],
        },
        expected_outcomes: {
          yield_benefits: ['Income diversification', 'Risk reduction'],
          environmental_benefits: ['Reduced pressure', 'Conservation'],
          economic_benefits: ['Stable income', 'New opportunities'],
        },
        risk_factors: ['Market access', 'Training needs', 'Capital requirements'],
        alternatives: ['Migration', 'Social protection'],
      },
    ],
    challenges: [
      'Extreme drought',
      'Water scarcity',
      'Food insecurity',
      'Limited services',
      'Poverty',
      'Climate change',
    ],
    opportunities: [
      'Renewable energy',
      'Carbon credits',
      'Conservation programs',
      'Tourism',
      'Traditional knowledge',
      'Climate adaptation',
    ],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getZoneById = (id: number): AgroecologicalZone | undefined => {
  return zimbabweAgroecologicalZones.find(zone => zone.id === id);
};

export const getActivitiesByZone = (zoneId: number): FarmingActivity[] => {
  const zone = getZoneById(zoneId);
  return zone ? zone.farming_activities : [];
};

export const getActivitiesByCategory = (
  zoneId: number,
  category: FarmingActivity['category']
): FarmingActivity[] => {
  const activities = getActivitiesByZone(zoneId);
  return activities.filter(activity => activity.category === category);
};

export const getActivitiesByMonth = (zoneId: number, month: number): FarmingActivity[] => {
  const activities = getActivitiesByZone(zoneId);
  return activities.filter(
    activity => month >= activity.timing.start_month && month <= activity.timing.end_month
  );
};

export const getOptimalActivities = (zoneId: number, month: number): FarmingActivity[] => {
  const activities = getActivitiesByZone(zoneId);
  return activities.filter(activity => activity.timing.optimal_months.includes(month));
};

export const getMonthlyActivityCalendar = (zoneId: number): Record<number, FarmingActivity[]> => {
  const calendar: Record<number, FarmingActivity[]> = {};

  for (let month = 1; month <= 12; month++) {
    calendar[month] = getActivitiesByMonth(zoneId, month);
  }

  return calendar;
};

export const getZoneRecommendations = (
  zoneId: number,
  currentMonth?: number
): {
  zone: AgroecologicalZone;
  currentActivities: FarmingActivity[];
  upcomingActivities: FarmingActivity[];
  priorityActivities: FarmingActivity[];
  seasonalAdvice: string[];
} => {
  const zone = getZoneById(zoneId);
  if (!zone) {
    throw new Error(`Zone ${zoneId} not found`);
  }

  const month = currentMonth || new Date().getMonth() + 1;
  const currentActivities = getOptimalActivities(zoneId, month);
  const upcomingActivities = getActivitiesByMonth(zoneId, month + 1);
  const priorityActivities = currentActivities.filter(
    activity =>
      activity.requirements.labor === 'high' ||
      activity.category === 'water_management' ||
      activity.category === 'soil_management'
  );

  const seasonalAdvice = generateSeasonalAdvice(zone, month);

  return {
    zone,
    currentActivities,
    upcomingActivities,
    priorityActivities,
    seasonalAdvice,
  };
};

const generateSeasonalAdvice = (zone: AgroecologicalZone, month: number): string[] => {
  const advice: string[] = [];

  // Season-based advice
  if (month >= 10 && month <= 12) {
    advice.push('Peak planting season - ensure all inputs are ready');
    advice.push('Monitor weather forecasts for optimal planting windows');
  } else if (month >= 1 && month <= 3) {
    advice.push('Early growing season - focus on weed control and fertilization');
    advice.push('Monitor for pest and disease outbreaks');
  } else if (month >= 4 && month <= 6) {
    advice.push('Mid-season - monitor crop development and livestock condition');
    advice.push('Prepare for harvest season');
  } else if (month >= 7 && month <= 9) {
    advice.push('Harvest season - ensure proper storage and marketing');
    advice.push("Plan for next season's activities");
  }

  // Zone-specific advice
  if (zone.id === 1) {
    advice.push('Monitor for frost in high-altitude areas');
    advice.push('Consider greenhouse production for high-value crops');
  } else if (zone.id >= 4) {
    advice.push('Water conservation is critical - check water harvesting structures');
    advice.push('Monitor drought indicators and prepare contingency plans');
  }

  return advice;
};
