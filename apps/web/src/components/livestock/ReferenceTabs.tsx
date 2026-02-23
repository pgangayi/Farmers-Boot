import React from 'react';

export function HealthReference() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Health Reference Guide</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-green-700 mb-2">Common Diseases</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Foot and Mouth Disease</li>
            <li>• Bovine Respiratory Disease</li>
            <li>• Mastitis</li>
            <li>• Bloat</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-blue-700 mb-2">Vaccination Schedule</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Clostridial diseases - Annual</li>
            <li>• Brucellosis - Calves 4-12 months</li>
            <li>• Anthrax - Annual in endemic areas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function BreedsRepository() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Breeds Repository</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium mb-2">Cattle Breeds</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Brahman</li>
            <li>• Hereford</li>
            <li>• Angus</li>
            <li>• Holstein</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium mb-2">Goat Breeds</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Boer</li>
            <li>• Saanen</li>
            <li>• Kalahari Red</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium mb-2">Sheep Breeds</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Dorper</li>
            <li>• Merino</li>
            <li>• Suffolk</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function FeedManagement() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Feed & Nutrition Management</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-amber-700 mb-2">Feed Types</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Hay & Silage</li>
            <li>• Grain & Concentrates</li>
            <li>• Pasture Grazing</li>
            <li>• Mineral Supplements</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-green-700 mb-2">Feeding Guidelines</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Cattle: 2-3% body weight daily</li>
            <li>• Goats: 3-4% body weight daily</li>
            <li>• Sheep: 2-4% body weight daily</li>
            <li>• Always provide clean water</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ReferenceTabs() {
  return (
    <div>
      <HealthReference />
      <BreedsRepository />
      <FeedManagement />
    </div>
  );
}
