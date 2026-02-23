/**
 * ZIMBABWE AGRICULTURAL DEFAULTS
 * ==============================
 * Default livestock breeds and crop varieties specific to Zimbabwe
 */

import type { Breed, Crop } from '../types/database';

// ============================================================================
// ZIMBABWE INDIGENOUS CATTLE BREEDS
// ============================================================================

export const zimbabweCattleBreeds: Omit<Breed, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Mashona',
    species: 'cattle',
    characteristics:
      'Indigenous Zimbabwean Sanga cattle, small to medium frame, docile temperament, excellent fertility, heat tolerant, disease resistant, superior foragers',
    average_weight_kg: 350,
    maturity_days: 365,
    typical_use: 'mixed',
    climate_suitability: 'Excellent for all Zimbabwe regions, especially smallholder farming',
    is_active: true,
  },
  {
    name: 'Nkone',
    species: 'cattle',
    characteristics:
      'Indigenous Sanga breed with distinctive color patterns, muscular build, hardy, drought tolerant, excellent beef quality',
    average_weight_kg: 450,
    maturity_days: 420,
    typical_use: 'meat',
    climate_suitability: 'Thrives in harsh conditions, ideal for Regions 3-5',
    is_active: true,
  },
  {
    name: 'Tuli',
    species: 'cattle',
    characteristics:
      'Medium frame Sanga breed, good temperament, efficient feed converters, excellent carcass quality',
    average_weight_kg: 400,
    maturity_days: 390,
    typical_use: 'meat',
    climate_suitability: 'Well-adapted to Zimbabwean conditions, good for crossbreeding',
    is_active: true,
  },
];

// ============================================================================
// ZIMBABWE GOAT BREEDS
// ============================================================================

export const zimbabweGoatBreeds: Omit<Breed, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Matabele Goat',
    species: 'goats',
    characteristics:
      'Indigenous to Matabeleland region, good meat production, hardy, excellent foragers',
    average_weight_kg: 35,
    maturity_days: 180,
    typical_use: 'meat',
    climate_suitability: 'Well-suited to semi-arid regions of Zimbabwe',
    is_active: true,
  },
  {
    name: 'Mashona Goat',
    species: 'goats',
    characteristics:
      'Small frame, excellent foragers, disease resistant, adapted to local conditions',
    average_weight_kg: 25,
    maturity_days: 150,
    typical_use: 'mixed',
    climate_suitability: 'Ideal for smallholder farming across Zimbabwe',
    is_active: true,
  },
  {
    name: 'Boer',
    species: 'goats',
    characteristics:
      'Large frame, muscular, fast-growing, excellent meat quality, red head with white body',
    average_weight_kg: 50,
    maturity_days: 120,
    typical_use: 'meat',
    climate_suitability: 'Adapted to Zimbabwe, requires good management',
    is_active: true,
  },
  {
    name: 'Kiko',
    species: 'goats',
    characteristics: 'Hardy, excellent growth on pasture, resistant to parasites, good foragers',
    average_weight_kg: 45,
    maturity_days: 140,
    typical_use: 'meat',
    climate_suitability: 'Excellent for extensive grazing systems',
    is_active: true,
  },
];

// ============================================================================
// ZIMBABWE SHEEP BREEDS
// ============================================================================

export const zimbabweSheepBreeds: Omit<Breed, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Nguni Sheep',
    species: 'sheep',
    characteristics:
      'Indigenous fat-tailed sheep, hardy, tolerant of external/internal parasites, excellent mothering abilities',
    average_weight_kg: 40,
    maturity_days: 180,
    typical_use: 'mixed',
    climate_suitability: 'Perfect for semi-arid Regions 4-5',
    is_active: true,
  },
  {
    name: 'Dorper',
    species: 'sheep',
    characteristics: 'Black head with white body, good meat production, hardy, adaptable',
    average_weight_kg: 55,
    maturity_days: 150,
    typical_use: 'meat',
    climate_suitability: 'Well-adapted to Zimbabwean conditions',
    is_active: true,
  },
];

// ============================================================================
// ZIMBABWE POULTRY BREEDS
// ============================================================================

export const zimbabwePoultryBreeds: Omit<Breed, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Indigenous Village Chicken',
    species: 'poultry',
    characteristics:
      'Hardy, excellent foragers, disease resistant, low input requirements, 60-80 eggs/year',
    average_weight_kg: 1.5,
    maturity_days: 180,
    typical_use: 'mixed',
    climate_suitability: 'Perfect for free-range systems across Zimbabwe',
    is_active: true,
  },
  {
    name: 'Boschveld',
    species: 'poultry',
    characteristics:
      'Hardy, can survive on nature offers, withstand varied climatic conditions, 240 eggs/year',
    average_weight_kg: 2.2,
    maturity_days: 150,
    typical_use: 'mixed',
    climate_suitability: 'Excellent for Southern Africa free-range conditions',
    is_active: true,
  },
  {
    name: 'Rhode Island Red',
    species: 'poultry',
    characteristics: 'Prolific egg layer, 250 light brown eggs/year, dark red/mahogany color',
    average_weight_kg: 3.4,
    maturity_days: 140,
    typical_use: 'eggs',
    climate_suitability: 'Adaptable to Zimbabwean conditions',
    is_active: true,
  },
  {
    name: 'Black Australorp',
    species: 'poultry',
    characteristics:
      'Dual purpose, 200-250 tinted brown eggs/year, record holders for egg production',
    average_weight_kg: 3.7,
    maturity_days: 150,
    typical_use: 'mixed',
    climate_suitability: 'Hardy, good for free-ranging',
    is_active: true,
  },
  {
    name: 'Potchefstroom Koekoek',
    species: 'poultry',
    characteristics:
      'South African heritage breed, excellent foragers, resilient, distinctive barred plumage',
    average_weight_kg: 3.0,
    maturity_days: 160,
    typical_use: 'mixed',
    climate_suitability: 'Excellent for open spaces and free-range',
    is_active: true,
  },
];

// ============================================================================
// ZIMBABWE MAIZE VARIETIES
// ============================================================================

export const zimbabweMaizeVarieties: Omit<Crop, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'SC 403',
    variety: 'Seed Co Zimbabwe Early Maturing',
    category: 'cereals',
    growing_season_days: 125,
    expected_yield_kg_per_hectare: 9000,
    planting_depth_cm: 5,
    spacing_cm: 75,
    water_requirements_mm: 450,
    optimal_temperature_min: 15,
    optimal_temperature_max: 30,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy loam', 'Clay loam', 'Red soils'],
      suitable_climates: ['Regions 3-5'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 120,
        phosphorus: 60,
        potassium: 40,
      },
      common_pests: ['Stem borer', 'Fall armyworm', 'Cutworm'],
      common_diseases: ['Gray leaf spot', 'Northern corn leaf blight', 'Maize streak virus'],
    },
  },
  {
    name: 'SC 513',
    variety: 'Seed Co Zimbabwe Medium Maturing',
    category: 'cereals',
    growing_season_days: 142,
    expected_yield_kg_per_hectare: 11000,
    planting_depth_cm: 5,
    spacing_cm: 75,
    water_requirements_mm: 550,
    optimal_temperature_min: 15,
    optimal_temperature_max: 30,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Clay loam', 'Red soils', 'Black soils'],
      suitable_climates: ['Regions 2-4'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 150,
        phosphorus: 80,
        potassium: 60,
      },
      common_pests: ['Stem borer', 'Fall armyworm'],
      common_diseases: ['Gray leaf spot', 'Common rust'],
    },
  },
  {
    name: 'PAN 53',
    variety: 'Pannar Seed Yellow Maize',
    category: 'cereals',
    growing_season_days: 132,
    expected_yield_kg_per_hectare: 10000,
    planting_depth_cm: 5,
    spacing_cm: 75,
    water_requirements_mm: 500,
    optimal_temperature_min: 15,
    optimal_temperature_max: 30,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy loam', 'Clay loam'],
      suitable_climates: ['Regions 2-3'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 140,
        phosphorus: 70,
        potassium: 50,
      },
      common_pests: ['Stem borer', 'Cutworm'],
      common_diseases: ['Northern corn leaf blight', 'Common smut'],
    },
  },
  {
    name: 'ZM 521',
    variety: 'Zimbabwe Seed Maize Early',
    category: 'cereals',
    growing_season_days: 127,
    expected_yield_kg_per_hectare: 9500,
    planting_depth_cm: 5,
    spacing_cm: 75,
    water_requirements_mm: 480,
    optimal_temperature_min: 15,
    optimal_temperature_max: 30,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy loam', 'Clay loam', 'Red soils'],
      suitable_climates: ['Regions 3-4'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 130,
        phosphorus: 65,
        potassium: 45,
      },
      common_pests: ['Stem borer', 'Fall armyworm'],
      common_diseases: ['Gray leaf spot', 'Maize streak virus'],
    },
  },
];

// ============================================================================
// ZIMBABWE TRADITIONAL SMALL GRAINS
// ============================================================================

export const zimbabweSmallGrains: Omit<Crop, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Sorghum SV1',
    variety: 'Sorghum Improved Variety 1',
    category: 'cereals',
    growing_season_days: 110,
    expected_yield_kg_per_hectare: 3000,
    planting_depth_cm: 3,
    spacing_cm: 60,
    water_requirements_mm: 350,
    optimal_temperature_min: 20,
    optimal_temperature_max: 35,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy soils', 'Loamy sands', 'Red soils'],
      suitable_climates: ['Regions 4-5'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 40,
        phosphorus: 30,
        potassium: 20,
      },
      common_pests: ['Shoot fly', 'Sorghum midge'],
      common_diseases: ['Sorghum downy mildew', 'Sorghum smut'],
    },
  },
  {
    name: 'Pearl Millet PMV1',
    variety: 'Pearl Millet Improved Variety 1',
    category: 'cereals',
    growing_season_days: 95,
    expected_yield_kg_per_hectare: 2500,
    planting_depth_cm: 2,
    spacing_cm: 50,
    water_requirements_mm: 300,
    optimal_temperature_min: 22,
    optimal_temperature_max: 38,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy soils', 'Loamy sands'],
      suitable_climates: ['Regions 4-5'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 30,
        phosphorus: 25,
        potassium: 15,
      },
      common_pests: ['Shoot fly', 'Ear head bug'],
      common_diseases: ['Downy mildew', 'Ergot'],
    },
  },
  {
    name: 'Finger Millet (Rapoko)',
    variety: 'Traditional Finger Millet',
    category: 'cereals',
    growing_season_days: 120,
    expected_yield_kg_per_hectare: 2000,
    planting_depth_cm: 2,
    spacing_cm: 45,
    water_requirements_mm: 400,
    optimal_temperature_min: 18,
    optimal_temperature_max: 28,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.0,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Red soils', 'Clay loam', 'Andisols'],
      suitable_climates: ['Regions 2-3'],
      optimal_ph: { min: 5.5, max: 7.0 },
      fertilizer_requirements: {
        nitrogen: 35,
        phosphorus: 30,
        potassium: 25,
      },
      common_pests: ['Shoot fly', 'Finger millet blast'],
      common_diseases: ['Blast', 'Tungro'],
    },
  },
];

// ============================================================================
// ZIMBABWE OTHER IMPORTANT CROPS
// ============================================================================

export const zimbabweOtherCrops: Omit<Crop, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Cotton',
    variety: 'Cotton Seed Co Zimbabwe',
    category: 'other',
    growing_season_days: 180,
    expected_yield_kg_per_hectare: 3000,
    planting_depth_cm: 4,
    spacing_cm: 90,
    water_requirements_mm: 600,
    optimal_temperature_min: 20,
    optimal_temperature_max: 32,
    optimal_ph_min: 5.5,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Red soils', 'Clay loam', 'Black soils'],
      suitable_climates: ['Regions 2-4'],
      optimal_ph: { min: 5.5, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 80,
        phosphorus: 60,
        potassium: 40,
      },
      common_pests: ['Bollworm', 'Aphids', 'Red spider mite'],
      common_diseases: ['Boll rot', 'Alternaria leaf spot'],
    },
  },
  {
    name: 'Soybeans',
    variety: 'Soybean Seed Co Zimbabwe',
    category: 'legumes',
    growing_season_days: 120,
    expected_yield_kg_per_hectare: 2500,
    planting_depth_cm: 4,
    spacing_cm: 50,
    water_requirements_mm: 450,
    optimal_temperature_min: 18,
    optimal_temperature_max: 30,
    optimal_ph_min: 6.0,
    optimal_ph_max: 7.0,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Red soils', 'Clay loam', 'Sandy loam'],
      suitable_climates: ['Regions 2-4'],
      optimal_ph: { min: 6.0, max: 7.0 },
      fertilizer_requirements: {
        nitrogen: 20,
        phosphorus: 60,
        potassium: 40,
      },
      common_pests: ['Soybean aphid', 'Bean beetles'],
      common_diseases: ['Soybean rust', 'Frogeye leaf spot'],
    },
  },
  {
    name: 'Groundnuts',
    variety: 'Groundnut Local Variety',
    category: 'legumes',
    growing_season_days: 110,
    expected_yield_kg_per_hectare: 2000,
    planting_depth_cm: 5,
    spacing_cm: 30,
    water_requirements_mm: 400,
    optimal_temperature_min: 20,
    optimal_temperature_max: 30,
    optimal_ph_min: 5.5,
    optimal_ph_max: 6.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Sandy loam', 'Red soils'],
      suitable_climates: ['Regions 2-5'],
      optimal_ph: { min: 5.5, max: 6.5 },
      fertilizer_requirements: {
        nitrogen: 25,
        phosphorus: 50,
        potassium: 30,
      },
      common_pests: ['Groundnut aphid', 'Termites'],
      common_diseases: ['Leaf spot', 'Rust'],
    },
  },
  {
    name: 'Tobacco',
    variety: 'Flue-Cured Tobacco',
    category: 'other',
    growing_season_days: 150,
    expected_yield_kg_per_hectare: 2500,
    planting_depth_cm: 2,
    spacing_cm: 60,
    water_requirements_mm: 500,
    optimal_temperature_min: 18,
    optimal_temperature_max: 28,
    optimal_ph_min: 5.5,
    optimal_ph_max: 6.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Summer'],
      suitable_soils: ['Red soils', 'Sandy loam'],
      suitable_climates: ['Regions 2-3'],
      optimal_ph: { min: 5.5, max: 6.5 },
      fertilizer_requirements: {
        nitrogen: 100,
        phosphorus: 80,
        potassium: 150,
      },
      common_pests: ['Tobacco aphid', 'Cutworms'],
      common_diseases: ['Blue mold', 'Black shank'],
    },
  },
  {
    name: 'Wheat',
    variety: 'Winter Wheat',
    category: 'cereals',
    growing_season_days: 140,
    expected_yield_kg_per_hectare: 6000,
    planting_depth_cm: 4,
    spacing_cm: 15,
    water_requirements_mm: 450,
    optimal_temperature_min: 10,
    optimal_temperature_max: 25,
    optimal_ph_min: 6.0,
    optimal_ph_max: 7.5,
    is_active: true,
    metadata: {
      suitable_seasons: ['Winter'],
      suitable_soils: ['Clay loam', 'Black soils'],
      suitable_climates: ['Regions 1-2'],
      optimal_ph: { min: 6.0, max: 7.5 },
      fertilizer_requirements: {
        nitrogen: 120,
        phosphorus: 80,
        potassium: 60,
      },
      common_pests: ['Aphids', 'Wheat stem sawfly'],
      common_diseases: ['Powdery mildew', 'Leaf rust'],
    },
  },
];

// ============================================================================
// COMBINED DEFAULTS
// ============================================================================

export const zimbabweDefaultBreeds = [
  ...zimbabweCattleBreeds,
  ...zimbabweGoatBreeds,
  ...zimbabweSheepBreeds,
  ...zimbabwePoultryBreeds,
];

export const zimbabweDefaultCrops = [
  ...zimbabweMaizeVarieties,
  ...zimbabweSmallGrains,
  ...zimbabweOtherCrops,
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getBreedsBySpecies = (species: string) => {
  return zimbabweDefaultBreeds.filter(breed => breed.species === species);
};

export const getCropsByCategory = (category: string) => {
  return zimbabweDefaultCrops.filter(crop => crop.category === category);
};

export const getSuitableCropsForRegion = (region: number) => {
  const regionMapping: Record<number, string[]> = {
    1: ['Regions 1-2', 'Regions 2-3'],
    2: ['Regions 1-2', 'Regions 2-3', 'Regions 2-4'],
    3: ['Regions 2-3', 'Regions 2-4', 'Regions 3-4'],
    4: ['Regions 3-4', 'Regions 4-5', 'Regions 2-5'],
    5: ['Regions 4-5', 'Regions 2-5'],
  };

  const suitableRegions = regionMapping[region] || ['Regions 3-4'];

  return zimbabweDefaultCrops.filter(crop => {
    const cropRegions = crop.metadata?.suitable_climates || [];
    return cropRegions.some(region => suitableRegions.includes(region));
  });
};

export const getDroughtTolerantCrops = () => {
  return zimbabweDefaultCrops.filter(crop => {
    const droughtTolerant = [
      'Sorghum SV1',
      'Pearl Millet PMV1',
      'Finger Millet (Rapoko)',
      'SC 403',
      'Groundnuts',
    ];
    return droughtTolerant.includes(crop.name);
  });
};

export const getHighYieldCrops = () => {
  return zimbabweDefaultCrops.filter(crop => crop.expected_yield_kg_per_hectare >= 8000);
};
