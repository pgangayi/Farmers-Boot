/**
 * INFORMATION ENHANCED LIVESTOCK COMPONENTS
 * ==========================================
 * Enhanced livestock components with integrated information system
 */

import React from 'react';
import { InfoIcon } from '../information/InfoIcon';
import type { InfoIconProps } from '../../types/information';

// ============================================================================
// BREEDS REPOSITORY WITH INFO
// ============================================================================

interface BreedsRepositoryProps {
  className?: string;
}

export function BreedsRepositoryWithInfo({ className = '' }: BreedsRepositoryProps) {
  const infoIcons: InfoIconProps[] = [
    {
      contextKey: 'goat_breeds_info',
      pagePath: '/livestock',
      componentName: 'BreedsRepository',
      tooltip: 'Learn about goat breeds',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'cattle_breeds_info',
      pagePath: '/livestock',
      componentName: 'BreedsRepository',
      tooltip: 'Learn about cattle breeds',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'sheep_breeds_info',
      pagePath: '/livestock',
      componentName: 'BreedsRepository',
      tooltip: 'Learn about sheep breeds',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'poultry_breeds_info',
      pagePath: '/livestock',
      componentName: 'BreedsRepository',
      tooltip: 'Learn about poultry breeds',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Breeds Information</h3>
        <div className="flex gap-2">
          {infoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Goat Breeds Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Goat Breeds</h4>
            <InfoIcon
              contextKey="goat_breeds_info"
              pagePath="/livestock"
              componentName="BreedsRepository"
              tooltip="Goat breeds guide"
            />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Dairy:</strong> Saanen, Alpine, Nubian
            </p>
            <p>
              <strong>Meat:</strong> Boer, Kiko, Spanish
            </p>
            <p>
              <strong>Dual-purpose:</strong> Toggenburg, Oberhasli
            </p>
          </div>
        </div>

        {/* Cattle Breeds Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Cattle Breeds</h4>
            <InfoIcon
              contextKey="cattle_breeds_info"
              pagePath="/livestock"
              componentName="BreedsRepository"
              tooltip="Cattle breeds guide"
            />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Beef:</strong> Angus, Hereford, Brahman
            </p>
            <p>
              <strong>Dairy:</strong> Holstein, Jersey, Guernsey
            </p>
            <p>
              <strong>Dual-purpose:</strong> Simmental, Brown Swiss
            </p>
          </div>
        </div>

        {/* Sheep Breeds Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Sheep Breeds</h4>
            <InfoIcon
              contextKey="sheep_breeds_info"
              pagePath="/livestock"
              componentName="BreedsRepository"
              tooltip="Sheep breeds guide"
            />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Wool:</strong> Merino, Rambouillet, Lincoln
            </p>
            <p>
              <strong>Meat:</strong> Suffolk, Dorset, Hampshire
            </p>
            <p>
              <strong>Dual-purpose:</strong> Dorper, Katahdin
            </p>
          </div>
        </div>

        {/* Poultry Breeds Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Poultry Breeds</h4>
            <InfoIcon
              contextKey="poultry_breeds_info"
              pagePath="/livestock"
              componentName="BreedsRepository"
              tooltip="Poultry breeds guide"
            />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Layers:</strong> Rhode Island Red, Leghorn, Australorp
            </p>
            <p>
              <strong>Broilers:</strong> Cobb, Ross, Arbor Acres
            </p>
            <p>
              <strong>Dual-purpose:</strong> Plymouth Rock, Wyandotte, Orpington
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEALTH REFERENCE WITH INFO
// ============================================================================

interface HealthReferenceProps {
  className?: string;
}

export function HealthReferenceWithInfo({ className = '' }: HealthReferenceProps) {
  const healthInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'vaccination_info',
      pagePath: '/livestock',
      componentName: 'HealthReference',
      tooltip: 'Vaccination schedules',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'disease_recognition_info',
      pagePath: '/livestock',
      componentName: 'HealthReference',
      tooltip: 'Disease identification',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'parasite_control_info',
      pagePath: '/livestock',
      componentName: 'HealthReference',
      tooltip: 'Parasite control',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'biosecurity_info',
      pagePath: '/livestock',
      componentName: 'HealthReference',
      tooltip: 'Biosecurity measures',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Health Information</h3>
        <div className="flex gap-2">
          {healthInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Vaccination Schedule */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Vaccination Schedule</h4>
          <InfoIcon
            contextKey="vaccination_info"
            pagePath="/livestock"
            componentName="HealthReference"
            tooltip="Complete vaccination guide"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Core Vaccines</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• CD&T (Annual)</li>
              <li>• Rabies (Annual)</li>
              <li>• Brucellosis (Annual)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Species-Specific</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Goats: PPR, CCPP</li>
              <li>• Cattle: BVD, IBR</li>
              <li>• Sheep: Scrapie, Chlamydia</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disease Recognition */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Common Diseases</h4>
          <InfoIcon
            contextKey="disease_recognition_info"
            pagePath="/livestock"
            componentName="HealthReference"
            tooltip="Disease identification guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-red-500 pl-3">
            <h5 className="font-medium text-red-700">Foot-and-Mouth</h5>
            <p className="text-gray-600 mt-1">High fever, blisters in mouth and feet</p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-3">
            <h5 className="font-medium text-yellow-700">Mastitis</h5>
            <p className="text-gray-600 mt-1">Udder swelling, abnormal milk</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-3">
            <h5 className="font-medium text-blue-700">Pneumonia</h5>
            <p className="text-gray-600 mt-1">Coughing, difficulty breathing, fever</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FEED MANAGEMENT WITH INFO
// ============================================================================

interface FeedManagementProps {
  className?: string;
}

export function FeedManagementWithInfo({ className = '' }: FeedManagementProps) {
  const feedInfoIcons: InfoIconProps[] = [
    {
      contextKey: 'nutrition_info',
      pagePath: '/livestock',
      componentName: 'FeedManagement',
      tooltip: 'Nutrition requirements',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'pasture_management_info',
      pagePath: '/livestock',
      componentName: 'FeedManagement',
      tooltip: 'Pasture management',
      position: { x: 'right', y: 'top' },
    },
    {
      contextKey: 'supplement_info',
      pagePath: '/livestock',
      componentName: 'FeedManagement',
      tooltip: 'Feed supplements',
      position: { x: 'right', y: 'top' },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Feed & Nutrition</h3>
        <div className="flex gap-2">
          {feedInfoIcons.map((props, index) => (
            <InfoIcon key={index} {...props} />
          ))}
        </div>
      </div>

      {/* Pasture Management */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Pasture Management</h4>
          <InfoIcon
            contextKey="pasture_management_info"
            pagePath="/livestock"
            componentName="FeedManagement"
            tooltip="Pasture improvement guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Excellent Forage Grasses</h5>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>• Bermuda Grass (High protein)</div>
              <div>• Alfalfa (Excellent for dairy)</div>
              <div>• Clover (Nitrogen-fixing)</div>
              <div>• Ryegrass (Fast-growing)</div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Rotational Grazing</h5>
            <p className="text-gray-600">
              Rotate pastures every 2-3 weeks to allow recovery and prevent parasite buildup. Ideal
              pasture height: 15-25 cm for most grasses.
            </p>
          </div>
        </div>
      </div>

      {/* Feed Requirements */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Nutrition Requirements</h4>
          <InfoIcon
            contextKey="nutrition_info"
            pagePath="/livestock"
            componentName="FeedManagement"
            tooltip="Species nutrition guide"
          />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">By Age Group</h5>
            <div className="space-y-2 text-gray-600">
              <div>
                <strong>Kids (0-3 months):</strong> 18-20% protein, milk replacer
              </div>
              <div>
                <strong>Growers (3-12 months):</strong> 16-18% protein, balanced ration
              </div>
              <div>
                <strong>Adults:</strong> 12-14% protein, maintenance ration
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Essential Minerals</h5>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>• Salt (Free choice)</div>
              <div>• Calcium (2:1 Ca:P ratio)</div>
              <div>• Phosphorus (Bone development)</div>
              <div>• Selenium (Reproductive health)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LIVESTOCK LIST WITH INFO
// ============================================================================

interface LivestockListWithInfoProps {
  className?: string;
}

export function LivestockListWithInfo({ className = '' }: LivestockListWithInfoProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Livestock Management</h3>
        <div className="flex gap-2">
          <InfoIcon
            contextKey="livestock_care_info"
            pagePath="/livestock"
            componentName="LivestockList"
            tooltip="General livestock care"
            position={{ x: 'right', y: 'top' }}
          />
          <InfoIcon
            contextKey="handling_safety_info"
            pagePath="/livestock"
            componentName="LivestockList"
            tooltip="Safe handling practices"
            position={{ x: 'right', y: 'top' }}
          />
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Quick Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <InfoIcon
              contextKey="handling_safety_info"
              pagePath="/livestock"
              componentName="LivestockList"
              tooltip="Safety guidelines"
              size="sm"
            />
            <span className="text-blue-800">Always approach animals calmly and from the side</span>
          </div>
          <div className="flex items-start gap-2">
            <InfoIcon
              contextKey="livestock_care_info"
              pagePath="/livestock"
              componentName="LivestockList"
              tooltip="Care best practices"
              size="sm"
            />
            <span className="text-blue-800">Check water and feed twice daily</span>
          </div>
          <div className="flex items-start gap-2">
            <InfoIcon
              contextKey="biosecurity_info"
              pagePath="/livestock"
              componentName="LivestockList"
              tooltip="Biosecurity basics"
              size="sm"
            />
            <span className="text-blue-800">Isolate new animals for 2 weeks</span>
          </div>
          <div className="flex items-start gap-2">
            <InfoIcon
              contextKey="record_keeping_info"
              pagePath="/livestock"
              componentName="LivestockList"
              tooltip="Record keeping"
              size="sm"
            />
            <span className="text-blue-800">Maintain detailed health records</span>
          </div>
        </div>
      </div>
    </div>
  );
}
