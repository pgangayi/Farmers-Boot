import { apiClient } from '../lib';
import { Breed } from '../api/types';

export interface CropVariety {
  id: string;
  cropType: string;
  name: string;
  description?: string;
  daysToMaturity?: number;
}

export const LookupService = {
  async getBreeds(species?: string): Promise<Breed[]> {
    const params = new URLSearchParams();
    if (species) params.append('species', species);
    const response = await apiClient.get<{ data: Breed[] }>(
      `/rest/v1/lookup_breeds?${params.toString()}`
    );
    return response.data.map(b => ({
      id: String(b.id),
      name: b.name,
      species: b.species,
      characteristics: (b as Breed & { description?: string }).description || '',
      created_at: b.created_at,
      updated_at: b.updated_at || b.created_at,
    }));
  },

  async addBreed(breed: Omit<Breed, 'id' | 'created_at' | 'updated_at'>): Promise<Breed> {
    const response = await apiClient.post<{ data: Breed }>('lookup_breeds', {
      ...breed,
      description: breed.characteristics,
    });
    const b = response.data;
    return {
      id: String(b.id),
      name: b.name,
      species: b.species,
      characteristics: (b as Breed & { description?: string }).description || '',
      created_at: b.created_at,
      updated_at: b.updated_at || b.created_at,
    };
  },

  async getCropVarieties(cropType?: string): Promise<CropVariety[]> {
    const params = new URLSearchParams();
    if (cropType) params.append('crop_type', cropType);
    const response = await apiClient.get<{ data: CropVariety[] }>(
      `/rest/v1/lookup_varieties?${params.toString()}`
    );
    return response.data.map(v => ({
      id: String(v.id),
      cropType: v.cropType,
      name: v.name,
      description: v.description,
      daysToMaturity: v.daysToMaturity,
    }));
  },

  async addCropVariety(variety: Omit<CropVariety, 'id'>): Promise<CropVariety> {
    const response = await apiClient.post<{ data: CropVariety }>('lookup_varieties', {
      crop_type: variety.cropType,
      name: variety.name,
      description: variety.description,
      days_to_maturity: variety.daysToMaturity,
    });
    const v = response.data;
    return {
      id: String(v.id),
      cropType: v.cropType,
      name: v.name,
      description: v.description,
      daysToMaturity: v.daysToMaturity,
    };
  },
};
