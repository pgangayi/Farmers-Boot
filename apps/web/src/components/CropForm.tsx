/**
 * CROP FORM COMPONENT
 * ===================
 * Form for adding and editing crops with Zimbabwe-specific variety defaults
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sprout, Droplets, Thermometer, Calendar, TrendingUp } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';

import {
  zimbabweDefaultCrops,
  getCropsByCategory,
  getSuitableCropsForRegion,
  getDroughtTolerantCrops,
} from '../data/zimbabweDefaults';
import type { Crop } from '../types/database';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const cropSchema = z.object({
  name: z.string().min(1, 'Crop name is required'),
  variety: z.string().optional(),
  category: z.enum(['cereals', 'vegetables', 'fruits', 'legumes', 'tubers', 'other'], {
    message: 'Category is required',
  }),
  growing_season_days: z.number().positive('Growing season must be positive').optional(),
  expected_yield_kg_per_hectare: z.number().positive('Expected yield must be positive').optional(),
  planting_depth_cm: z.number().positive('Planting depth must be positive').optional(),
  spacing_cm: z.number().positive('Spacing must be positive').optional(),
  water_requirements_mm: z.number().positive('Water requirements must be positive').optional(),
  optimal_temperature_min: z.number().optional(),
  optimal_temperature_max: z.number().optional(),
  optimal_ph_min: z.number().optional(),
  optimal_ph_max: z.number().optional(),
  is_active: z.boolean().default(true),
});

type CropFormData = z.infer<typeof cropSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface CropFormProps {
  initialData?: Partial<Crop>;
  onSubmit: (data: CropFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CropForm({ initialData, onSubmit, onCancel, isLoading = false }: CropFormProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableCrops, setAvailableCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CropFormData>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      is_active: true,
      ...initialData,
    },
  });

  const watchedCategory = watch('category');
  const watchedCropName = watch('name');

  // Update available crops when category changes
  useEffect(() => {
    if (watchedCategory) {
      const crops = getCropsByCategory(watchedCategory);
      setAvailableCrops(crops);
      setSelectedCategory(watchedCategory);
    }
  }, [watchedCategory]);

  // Update selected crop details
  useEffect(() => {
    if (watchedCropName && availableCrops.length > 0) {
      const crop = availableCrops.find(c => c.name === watchedCropName);
      if (crop) {
        setSelectedCrop(crop);
        // Auto-fill form with crop data
        setValue('variety', crop.variety || '');
        setValue('growing_season_days', crop.growing_season_days);
        setValue('expected_yield_kg_per_hectare', crop.expected_yield_kg_per_hectare);
        setValue('planting_depth_cm', crop.planting_depth_cm);
        setValue('spacing_cm', crop.spacing_cm);
        setValue('water_requirements_mm', crop.water_requirements_mm);
        setValue('optimal_temperature_min', crop.optimal_temperature_min);
        setValue('optimal_temperature_max', crop.optimal_temperature_max);
        setValue('optimal_ph_min', crop.optimal_ph_min);
        setValue('optimal_ph_max', crop.optimal_ph_max);
      }
    }
  }, [watchedCropName, availableCrops, setValue]);

  // Set initial crops
  useEffect(() => {
    setAvailableCrops(zimbabweDefaultCrops);
  }, []);

  const handleFormSubmit = async (data: CropFormData) => {
    try {
      await onSubmit(data);
      toast('Crop saved successfully', 'success');
      reset();
    } catch (error) {
      console.error('Failed to save crop:', error);
      toast('Failed to save crop', 'error');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cereals: '🌾',
      vegetables: '🥬',
      fruits: '🍎',
      legumes: '🫘',
      tubers: '🥔',
      other: '🌱',
    };
    return icons[category] || '🌱';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cereals: 'bg-yellow-100 text-yellow-800',
      vegetables: 'bg-green-100 text-green-800',
      fruits: 'bg-red-100 text-red-800',
      legumes: 'bg-orange-100 text-orange-800',
      tubers: 'bg-brown-100 text-brown-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDroughtTolerantBadge = (cropName: string) => {
    const droughtCrops = getDroughtTolerantCrops();
    const isDroughtTolerant = droughtCrops.some(crop => crop.name === cropName);
    return isDroughtTolerant ? (
      <Badge variant="secondary" className="ml-2">
        🌵 Drought Tolerant
      </Badge>
    ) : null;
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="h-5 w-5" />
          {initialData ? 'Edit Crop' : 'Add New Crop'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Category *
              </Label>
              <Select
                value={watchedCategory}
                onValueChange={value => setValue('category', value as any)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cereals">
                    <div className="flex items-center gap-2">
                      <span>🌾</span>
                      <span>Cereals</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="vegetables">
                    <div className="flex items-center gap-2">
                      <span>🥬</span>
                      <span>Vegetables</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fruits">
                    <div className="flex items-center gap-2">
                      <span>🍎</span>
                      <span>Fruits</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="legumes">
                    <div className="flex items-center gap-2">
                      <span>🫘</span>
                      <span>Legumes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tubers">
                    <div className="flex items-center gap-2">
                      <span>🥔</span>
                      <span>Tubers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <span>🌱</span>
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Crop/Variety Name *</Label>
              <Select value={watchedCropName} onValueChange={value => setValue('name', value)}>
                <SelectTrigger className={errors.name ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select crop variety" />
                </SelectTrigger>
                <SelectContent>
                  {availableCrops.map(crop => (
                    <SelectItem key={crop.name} value={crop.name}>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(crop.category)}</span>
                        <span>{crop.name}</span>
                        {getDroughtTolerantBadge(crop.name)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          {/* Variety Information */}
          <div className="space-y-2">
            <Label htmlFor="variety">Variety Description</Label>
            <Input
              id="variety"
              placeholder="e.g., SC 403, SV1, Local Landrace"
              {...register('variety')}
            />
          </div>

          {/* Selected Crop Information */}
          {selectedCrop && (
            <div className={`p-4 rounded-lg ${getCategoryColor(selectedCrop.category)}`}>
              <h4 className="font-semibold mb-2">Crop Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Growing Season:</strong> {selectedCrop.growing_season_days} days
                  </p>
                  <p>
                    <strong>Expected Yield:</strong> {selectedCrop.expected_yield_kg_per_hectare}{' '}
                    kg/ha
                  </p>
                  <p>
                    <strong>Planting Depth:</strong> {selectedCrop.planting_depth_cm} cm
                  </p>
                  <p>
                    <strong>Spacing:</strong> {selectedCrop.spacing_cm} cm
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Water Requirements:</strong> {selectedCrop.water_requirements_mm} mm
                  </p>
                  <p>
                    <strong>Temperature Range:</strong> {selectedCrop.optimal_temperature_min}°C -{' '}
                    {selectedCrop.optimal_temperature_max}°C
                  </p>
                  <p>
                    <strong>pH Range:</strong> {selectedCrop.optimal_ph_min} -{' '}
                    {selectedCrop.optimal_ph_max}
                  </p>
                  <p>
                    <strong>Drought Tolerant:</strong>{' '}
                    {getDroughtTolerantBadge(selectedCrop.name) ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Metadata Information */}
              {selectedCrop.metadata && (
                <div className="mt-4 space-y-3">
                  <h5 className="font-semibold">Growing Requirements</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Suitable Seasons:</strong>{' '}
                        {selectedCrop.metadata.suitable_seasons?.join(', ')}
                      </p>
                      <p>
                        <strong>Suitable Soils:</strong>{' '}
                        {selectedCrop.metadata.suitable_soils?.join(', ')}
                      </p>
                      <p>
                        <strong>Suitable Regions:</strong>{' '}
                        {selectedCrop.metadata.suitable_climates?.join(', ')}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Nitrogen:</strong>{' '}
                        {selectedCrop.metadata.fertilizer_requirements?.nitrogen} kg/ha
                      </p>
                      <p>
                        <strong>Phosphorus:</strong>{' '}
                        {selectedCrop.metadata.fertilizer_requirements?.phosphorus} kg/ha
                      </p>
                      <p>
                        <strong>Potassium:</strong>{' '}
                        {selectedCrop.metadata.fertilizer_requirements?.potassium} kg/ha
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p>
                      <strong>Common Pests:</strong>{' '}
                      {selectedCrop.metadata.common_pests?.join(', ')}
                    </p>
                    <p>
                      <strong>Common Diseases:</strong>{' '}
                      {selectedCrop.metadata.common_diseases?.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Growing Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="growing_season_days" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Growing Season (days)
              </Label>
              <Input
                id="growing_season_days"
                type="number"
                placeholder="e.g., 120"
                {...register('growing_season_days', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_yield_kg_per_hectare" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expected Yield (kg/ha)
              </Label>
              <Input
                id="expected_yield_kg_per_hectare"
                type="number"
                step="100"
                placeholder="e.g., 5000"
                {...register('expected_yield_kg_per_hectare', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water_requirements_mm" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Water Requirements (mm)
              </Label>
              <Input
                id="water_requirements_mm"
                type="number"
                step="10"
                placeholder="e.g., 500"
                {...register('water_requirements_mm', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Planting Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planting_depth_cm">Planting Depth (cm)</Label>
              <Input
                id="planting_depth_cm"
                type="number"
                step="0.5"
                placeholder="e.g., 5.0"
                {...register('planting_depth_cm', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spacing_cm">Spacing (cm)</Label>
              <Input
                id="spacing_cm"
                type="number"
                step="5"
                placeholder="e.g., 75"
                {...register('spacing_cm', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Environmental Requirements */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Environmental Requirements
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optimal_temperature_min">Min Temperature (°C)</Label>
                <Input
                  id="optimal_temperature_min"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 15"
                  {...register('optimal_temperature_min', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optimal_temperature_max">Max Temperature (°C)</Label>
                <Input
                  id="optimal_temperature_max"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 30"
                  {...register('optimal_temperature_max', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optimal_ph_min">Min pH</Label>
                <Input
                  id="optimal_ph_min"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.5"
                  {...register('optimal_ph_min', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optimal_ph_max">Max pH</Label>
                <Input
                  id="optimal_ph_max"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 7.5"
                  {...register('optimal_ph_max', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Crop' : 'Add Crop'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CropForm;
