import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import {
  useFarmWithSelection,
  useCrops,
  useCreateCrop,
  useStrains,
  useAddCropVariety,
} from '../api';
import { Button } from '../components/ui/button';
import { LoadingErrorContent } from '../components/ui/LoadingStates';
import { UnifiedModal } from '../components/ui/UnifiedModal';
import {
  Leaf,
  Plus,
  Calculator,
  Target,
  Droplets,
  Bug,
  TestTube,
  BookOpen,
  Sprout,
  Home,
} from 'lucide-react';
import { Breadcrumbs, useScrollAnimation, useSwipe } from '@farmers-boot/shared/components';

import { CropRotationPlanner } from '../components/CropRotationPlanner';
import { IrrigationOptimizer } from '../components/IrrigationOptimizer';
import { PestDiseaseManager } from '../components/PestDiseaseManager';
import { SoilHealthMonitor } from '../components/SoilHealthMonitor';
import { CropPlanning } from '../components/CropPlanning';
import { CropsOverview } from '../components/crops/CropsOverview';
import { ReferenceLibrary } from '../components/crops/ReferenceLibrary';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabValues =
  | 'overview'
  | 'planning'
  | 'rotation'
  | 'irrigation'
  | 'pests'
  | 'soil'
  | 'reference';

export function CropsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentFarm } = useFarmWithSelection();
  const [activeTab, setActiveTab] = useState<TabValues>('overview');

  // Shared hooks for animations and mobile interactions
  const { ref: scrollRef, isInView } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  });
  const { ref: swipeRef, swipeDirection } = useSwipe({
    threshold: 50,
    timeout: 300,
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'planning', label: 'Planning', icon: Calculator },
    { id: 'rotation', label: 'Rotation', icon: Sprout },
    { id: 'irrigation', label: 'Irrigation', icon: Droplets },
    { id: 'pests', label: 'Pests & Diseases', icon: Bug },
    { id: 'soil', label: 'Soil Health', icon: TestTube },
    { id: 'reference', label: 'Knowledge Base', icon: BookOpen },
  ];

  // Handle swipe navigation between tabs on mobile
  useEffect(() => {
    if (!swipeDirection || swipeDirection === 'up' || swipeDirection === 'down') return;

    const tabIds = tabs.map(t => t.id);
    const currentIndex = tabIds.indexOf(activeTab);

    if (swipeDirection === 'left' && currentIndex < tabIds.length - 1) {
      const nextTab = tabIds[currentIndex + 1];
      if (nextTab) setActiveTab(nextTab as TabValues);
    } else if (swipeDirection === 'right' && currentIndex > 0) {
      const prevTab = tabIds[currentIndex - 1];
      if (prevTab) setActiveTab(prevTab as TabValues);
    }
  }, [swipeDirection, activeTab, tabs]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // API Hooks
  const { data: crops = [], isLoading, error, refetch } = useCrops(currentFarm?.id);
  const { data: strains = [] } = useStrains(); // Optional filter by crop type could be added
  const createCropMutation = useCreateCrop();
  const addVarietyMutation = useAddCropVariety();

  if (!isAuthenticated())
    return <div className="min-h-screen flex items-center justify-center">Please log in.</div>;
  if (!currentFarm)
    return (
      <div className="min-h-screen flex items-center justify-center">Please select a farm.</div>
    );

  const handleCreate = (data: any) => {
    createCropMutation
      .mutateAsync({
        ...data,
        farm_id: currentFarm.id,
      })
      .then(() => setShowCreateForm(false));
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: `url('/Crop Wallpaper.jpg')`, backgroundSize: 'cover' }}
      />

      {/* Header */}
      <div className="relative z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
              { label: 'Crops' },
            ]}
            onItemClick={item => item.href && navigate(item.href)}
            className="mb-4"
          />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                Crop Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">{currentFarm.name}</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Crop
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabValues)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with scroll animation and swipe */}
      <main
        ref={el => {
          (scrollRef as React.MutableRefObject<HTMLElement | null>).current = el;
          (swipeRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }}
        className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <LoadingErrorContent isLoading={isLoading} error={error} onRetry={refetch}>
          {activeTab === 'overview' && <CropsOverview farmId={currentFarm.id} />}

          {activeTab === 'planning' && <CropPlanning farmId={currentFarm.id} />}
          {activeTab === 'rotation' && <CropRotationPlanner farmId={currentFarm.id} />}
          {activeTab === 'irrigation' && <IrrigationOptimizer farmId={currentFarm.id} />}
          {activeTab === 'pests' && <PestDiseaseManager farmId={currentFarm.id} />}
          {activeTab === 'soil' && <SoilHealthMonitor farmId={currentFarm.id} />}
          {activeTab === 'reference' && <ReferenceLibrary />}
        </LoadingErrorContent>
      </main>

      {/* Create Modal */}
      <UnifiedModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Add New Crop"
        fields={[
          { name: 'name', label: 'Crop Name', type: 'text', required: true },
          { name: 'crop_type', label: 'Crop Type', type: 'text', required: true },
          {
            name: 'variety',
            label: 'Variety/Strain',
            type: 'select',
            options: strains.map(s => ({
              value: s.name,
              label: `${'crop_type' in s ? (s as { crop_type: string }).crop_type : 'Unknown'} - ${s.name}`,
            })),
            creatable: true,
            onAdd: () => setShowVarietyModal(true),
          },
          { name: 'planting_date', label: 'Planting Date', type: 'date', required: true },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'planned', label: 'Planned' },
            ],
          },
        ]}
        initialData={{
          farm_id: currentFarm.id,
          status: 'planned',
          planting_date: new Date().toISOString().split('T')[0],
        }}
        onSubmit={handleCreate}
        isLoading={createCropMutation.isPending}
      />

      {/* Add Variety Modal */}
      <UnifiedModal
        isOpen={showVarietyModal}
        onClose={() => setShowVarietyModal(false)}
        title="Add New Variety"
        fields={[
          {
            name: 'crop_type',
            label: 'Crop Type',
            type: 'text',
            required: true,
            placeholder: 'e.g. Corn',
          },
          {
            name: 'name',
            label: 'Variety Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Sweet Corn',
          },
          { name: 'days_to_maturity', label: 'Days to Maturity', type: 'number' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        onSubmit={data => {
          addVarietyMutation.mutate(data as any);
          setShowVarietyModal(false);
        }}
        size="sm"
      />
    </div>
  );
}
