/**
 * LIVESTOCK FORM COMPONENT
 * ========================
 * Form for adding and editing livestock with Zimbabwe-specific breed defaults
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, MapPin, Tag, Heart, Weight } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';

import { zimbabweDefaultBreeds, getBreedsBySpecies } from '../data/zimbabweDefaults';
import type { Livestock, Breed } from '../types/database';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const livestockSchema = z.object({
  tag_id: z.string().min(1, 'Tag ID is required'),
  breed_id: z.string().min(1, 'Breed is required'),
  name: z.string().optional(),
  gender: z.enum(['male', 'female'], { message: 'Gender is required' }),
  birth_date: z.string().optional(),
  weight_kg: z.number().positive('Weight must be positive').optional(),
  status: z.enum(['healthy', 'sick', 'sold', 'deceased'], { message: 'Status is required' }),
  location: z.string().optional(),
  notes: z.string().optional(),
  mother_id: z.string().optional(),
  father_id: z.string().optional(),
});

type LivestockFormData = z.infer<typeof livestockSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface LivestockFormProps {
  initialData?: Partial<Livestock>;
  onSubmit: (data: LivestockFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LivestockForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: LivestockFormProps) {
  const { toast } = useToast();
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [availableBreeds, setAvailableBreeds] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LivestockFormData>({
    resolver: zodResolver(livestockSchema),
    defaultValues: {
      status: 'healthy',
      gender: 'female',
      ...initialData,
    },
  });

  const watchedSpecies = watch('breed_id');
  const watchedGender = watch('gender');

  // Update available breeds when species changes
  useEffect(() => {
    if (watchedSpecies) {
      const selectedBreed = zimbabweDefaultBreeds.find(breed => breed.name === watchedSpecies);
      if (selectedBreed) {
        setSelectedSpecies(selectedBreed.species);
        const breeds = getBreedsBySpecies(selectedBreed.species);
        setAvailableBreeds(breeds);
      }
    }
  }, [watchedSpecies]);

  // Set initial breeds
  useEffect(() => {
    setAvailableBreeds(zimbabweDefaultBreeds);
  }, []);

  const handleFormSubmit = async (data: LivestockFormData) => {
    try {
      await onSubmit(data);
      toast('Livestock saved successfully', 'success');
      reset();
    } catch (error) {
      console.error('Failed to save livestock:', error);
      toast('Failed to save livestock', 'error');
    }
  };

  const getSpeciesIcon = (species: string) => {
    const icons: Record<string, string> = {
      cattle: '🐄',
      goats: '🐐',
      sheep: '🐑',
      poultry: '🐔',
      pigs: '🐷',
    };
    return icons[species] || '🐾';
  };

  const getSpeciesColor = (species: string) => {
    const colors: Record<string, string> = {
      cattle: 'bg-amber-100 text-amber-800',
      goats: 'bg-green-100 text-green-800',
      sheep: 'bg-blue-100 text-blue-800',
      poultry: 'bg-red-100 text-red-800',
      pigs: 'bg-pink-100 text-pink-800',
    };
    return colors[species] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {initialData ? 'Edit Livestock' : 'Add New Livestock'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tag_id" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tag ID *
              </Label>
              <Input
                id="tag_id"
                placeholder="e.g., COW001, GOAT045"
                {...register('tag_id')}
                className={errors.tag_id ? 'border-red-500' : ''}
              />
              {errors.tag_id && <p className="text-sm text-red-500">{errors.tag_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input id="name" placeholder="e.g., Daisy, Bessie" {...register('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={watchedGender}
                onValueChange={value => setValue('gender', value as 'male' | 'female')}
              >
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
            </div>
          </div>

          {/* Breed Selection */}
          <div className="space-y-4">
            <Label htmlFor="breed_id" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Breed *
            </Label>
            <Select value={watchedSpecies} onValueChange={value => setValue('breed_id', value)}>
              <SelectTrigger className={errors.breed_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent>
                {zimbabweDefaultBreeds.map(breed => (
                  <SelectItem key={breed.name} value={breed.name}>
                    <div className="flex items-center gap-2">
                      <span>{getSpeciesIcon(breed.species)}</span>
                      <span>{breed.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {breed.species}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.breed_id && <p className="text-sm text-red-500">{errors.breed_id.message}</p>}

            {/* Selected Breed Information */}
            {selectedSpecies && (
              <div className={`p-4 rounded-lg ${getSpeciesColor(selectedSpecies)}`}>
                <h4 className="font-semibold mb-2">Breed Information</h4>
                {availableBreeds.map(breed => (
                  <div key={breed.name} className="text-sm">
                    <p>
                      <strong>Characteristics:</strong> {breed.characteristics}
                    </p>
                    <p>
                      <strong>Average Weight:</strong> {breed.average_weight_kg} kg
                    </p>
                    <p>
                      <strong>Maturity:</strong> {breed.maturity_days} days
                    </p>
                    <p>
                      <strong>Primary Use:</strong> {breed.typical_use}
                    </p>
                    <p>
                      <strong>Climate Suitability:</strong> {breed.climate_suitability}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Birth Date
              </Label>
              <Input id="birth_date" type="date" {...register('birth_date')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg" className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Weight (kg)
              </Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                placeholder="e.g., 250.5"
                {...register('weight_kg', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch('status')}
                onValueChange={value => setValue('status', value as any)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
          </div>

          {/* Location and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Main Pasture, Barn A"
                {...register('location')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this animal..."
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>

          {/* Parent Information (for breeding records) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mother_id">Mother Tag ID</Label>
              <Input id="mother_id" placeholder="e.g., COW001" {...register('mother_id')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="father_id">Father Tag ID</Label>
              <Input id="father_id" placeholder="e.g., BULL001" {...register('father_id')} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Livestock' : 'Add Livestock'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LivestockForm;
