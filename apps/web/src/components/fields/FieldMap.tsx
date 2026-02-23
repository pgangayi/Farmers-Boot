import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Square,
  Circle,
  Triangle,
  TreePine,
  Droplets,
  Sun,
  Wind,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../../api/hooks/useLocations';
import { useCrops } from '../../api/hooks/useCrops';
import { useIrrigationSystems } from '../../api/hooks/useIrrigation';

interface Field {
  id: string;
  name: string;
  area: number;
  crop: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  boundaries: Array<{ lat: number; lng: number }>;
  soilType: string;
  irrigationStatus: 'optimal' | 'needs-water' | 'overwatered';
  lastActivity: string;
  status: 'active' | 'fallow' | 'preparing';
}

interface MapLayer {
  id: string;
  name: string;
  type: 'crops' | 'soil' | 'irrigation' | 'boundaries';
  visible: boolean;
  color?: string;
}

export interface FieldMapProps {
  fields?: any[];
  onFieldSelect?: (field: any) => void;
  selectedFieldId?: string | null;
  onSelectField?: (field: any) => void;
  farmId?: string;
  [key: string]: any;
}

export function FieldMap({ fields: propFields, onFieldSelect, farmId }: FieldMapProps) {
  const [mapFields, setMapFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>([
    { id: '1', name: 'Field Boundaries', type: 'boundaries', visible: true, color: '#3b82f6' },
    { id: '2', name: 'Crop Types', type: 'crops', visible: true },
    { id: '3', name: 'Soil Analysis', type: 'soil', visible: false },
    { id: '4', name: 'Irrigation Status', type: 'irrigation', visible: true },
  ]);
  const [mapView, setMapView] = useState<'satellite' | 'terrain' | 'hybrid'>('satellite');
  const [zoom, setZoom] = useState(14);
  const [activeTab, setActiveTab] = useState('map');
  const mapRef = useRef<HTMLDivElement>(null);

  // API hooks
  const {
    data: locationsData,
    isLoading: locationsLoading,
    error: locationsError,
    refetch,
  } = useLocations(farmId);
  const { data: cropsData } = useCrops(farmId);
  const { data: irrigationData } = useIrrigationSystems(farmId);

  // Transform API data to Field format
  useEffect(() => {
    if (propFields && propFields.length > 0) {
      // Use provided fields from props
      const transformedFields: Field[] = propFields.map((field: any) => ({
        id: field.id,
        name: field.name || 'Unnamed Field',
        area: field.area_hectares || field.area || 0,
        crop: field.current_crop?.name || field.crop || 'No crop',
        coordinates: {
          lat: field.latitude || field.coordinates?.lat || 0,
          lng: field.longitude || field.coordinates?.lng || 0,
        },
        boundaries: field.boundaries || [],
        soilType: field.soil_type || 'Unknown',
        irrigationStatus: field.irrigation_status || 'optimal',
        lastActivity: field.last_activity || new Date().toISOString().split('T')[0],
        status: field.status || 'active',
      }));
      setMapFields(transformedFields);
    } else if (locationsData) {
      // Use locations from API
      const transformedFields: Field[] = locationsData.map((location: any) => {
        // Find crop for this field
        const fieldCrop = cropsData?.find(
          (crop: any) => crop.field_id === location.id || crop.location_id === location.id
        );

        // Find irrigation system for this field
        const fieldIrrigation = irrigationData?.find(
          (irr: any) => irr.field_id === location.id || irr.location_id === location.id
        );

        // Determine irrigation status based on moisture or last watered
        let irrigationStatus: 'optimal' | 'needs-water' | 'overwatered' = 'optimal';
        if (fieldIrrigation) {
          const irrData: any = fieldIrrigation;
          const lastWatered = irrData.last_watered ? new Date(irrData.last_watered) : null;
          const daysSinceWater = lastWatered
            ? Math.floor((Date.now() - lastWatered.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysSinceWater > 3) {
            irrigationStatus = 'needs-water';
          } else if (irrData.moisture_level && irrData.moisture_level > 80) {
            irrigationStatus = 'overwatered';
          }
        }

        return {
          id: location.id,
          name: location.name || 'Unnamed Field',
          area: location.area_hectares || 0,
          crop: fieldCrop?.name || fieldCrop?.crop_type || 'No crop',
          coordinates: {
            lat: location.latitude || 0,
            lng: location.longitude || 0,
          },
          boundaries: location.boundaries || [],
          soilType: location.soil_type || 'Unknown',
          irrigationStatus,
          lastActivity:
            location.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: location.status || 'active',
        };
      });
      setMapFields(transformedFields);
    }
  }, [propFields, locationsData, cropsData, irrigationData]);

  const getStatusColor = (status: Field['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'fallow':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIrrigationColor = (status: Field['irrigationStatus']) => {
    switch (status) {
      case 'optimal':
        return '#10b981';
      case 'needs-water':
        return '#f59e0b';
      case 'overwatered':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getCropIcon = (crop: string) => {
    const cropLower = crop.toLowerCase();
    if (cropLower.includes('corn') || cropLower.includes('maize')) {
      return <Triangle className="h-4 w-4" />;
    }
    if (cropLower.includes('wheat')) {
      return <TreePine className="h-4 w-4" />;
    }
    if (cropLower.includes('soy') || cropLower.includes('bean')) {
      return <Circle className="h-4 w-4" />;
    }
    return <Square className="h-4 w-4" />;
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    if (onFieldSelect) {
      onFieldSelect(field);
    }
  };

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer))
    );
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 1));

  const handleRefresh = () => {
    refetch();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalArea = mapFields.reduce((sum, f) => sum + f.area, 0);
    const activeFields = mapFields.filter(f => f.status === 'active').length;
    const needsWater = mapFields.filter(f => f.irrigationStatus === 'needs-water').length;
    const crops = [...new Set(mapFields.map(f => f.crop))].filter(c => c !== 'No crop');

    return { totalArea, activeFields, needsWater, crops };
  }, [mapFields]);

  if (locationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Loading field data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locationsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Error loading field data</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mapFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No fields found</p>
            <p className="text-xs text-muted-foreground">Add fields to see them on the map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Field Map</h3>
        <div className="flex gap-2">
          <Select value={mapView} onValueChange={(value: any) => setMapView(value)}>
            <SelectTrigger className="w-32" title="Select map view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Area</div>
            <div className="text-2xl font-bold">{stats.totalArea.toFixed(1)} ha</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active Fields</div>
            <div className="text-2xl font-bold">{stats.activeFields}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Need Water</div>
            <div className="text-2xl font-bold text-amber-600">{stats.needsWater}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Crops</div>
            <div className="text-2xl font-bold">{stats.crops.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="details">Field Details</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Interactive Field Map</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">{zoom}</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={mapRef} className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
                {/* Map background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50"></div>

                {/* Field boundaries */}
                {activeLayers.find(l => l.type === 'boundaries')?.visible &&
                  mapFields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 cursor-pointer hover:bg-opacity-50 transition-colors ${
                        selectedField?.id === field.id
                          ? 'border-green-600 bg-green-200 bg-opacity-40'
                          : 'border-blue-500 bg-blue-200 bg-opacity-30'
                      }`}
                      style={{
                        left: `${10 + (index % 3) * 28}%`,
                        top: `${10 + Math.floor(index / 3) * 35}%`,
                        width: `${Math.min(25, 10 + field.area / 2)}%`,
                        height: `${Math.min(30, 15 + field.area / 3)}%`,
                      }}
                      onClick={() => handleFieldClick(field)}
                    >
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            {getCropIcon(field.crop)}
                            <span className="text-xs font-medium">{field.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{field.crop}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Irrigation status overlay */}
                {activeLayers.find(l => l.type === 'irrigation')?.visible &&
                  mapFields.map((field, index) => (
                    <div
                      key={`irrigation-${field.id}`}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        left: `${15 + (index % 3) * 28}%`,
                        top: `${15 + Math.floor(index / 3) * 35}%`,
                        backgroundColor: getIrrigationColor(field.irrigationStatus),
                      }}
                      title={`Irrigation: ${field.irrigationStatus}`}
                    />
                  ))}

                {/* Map controls overlay */}
                <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2">
                  <div className="text-xs font-medium mb-1">Legend</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Optimal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">Needs Water</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">Overwatered</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Map Layers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeLayers.map(layer => (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{layer.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {layer.type} layer
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={layer.visible ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLayer(layer.id)}
                    >
                      {layer.visible ? 'Visible' : 'Hidden'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedField ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedField.name}</CardTitle>
                  <Badge className={getStatusColor(selectedField.status)}>
                    {selectedField.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="font-medium">{selectedField.area} ha</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crop</p>
                    <p className="font-medium">{selectedField.crop}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Soil Type</p>
                    <p className="font-medium">{selectedField.soilType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="font-medium">{selectedField.lastActivity}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Irrigation Status</p>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      <span className="font-medium capitalize">
                        {selectedField.irrigationStatus.replace('-', ' ')}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getIrrigationColor(selectedField.irrigationStatus),
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">
                        {selectedField.coordinates.lat.toFixed(4)},{' '}
                        {selectedField.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center gap-2">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a field on the map to view details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Fields List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mapFields.map(field => (
                  <div
                    key={field.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                      selectedField?.id === field.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleFieldClick(field)}
                  >
                    <div className="flex items-center gap-3">
                      {getCropIcon(field.crop)}
                      <div>
                        <h4 className="font-medium">{field.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {field.crop} - {field.area} ha
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getIrrigationColor(field.irrigationStatus) }}
                      ></div>
                      <Badge className={getStatusColor(field.status)} variant="secondary">
                        {field.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FieldMap;
