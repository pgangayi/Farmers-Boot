import React from 'react';
import { InventoryAlert } from './types';

export function InventoryAlerts({
  alerts,
  ...rest
}: {
  alerts: InventoryAlert[];
  [key: string]: any;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="inventory-alerts space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-3 rounded ${
            alert.priority === 'high'
              ? 'bg-red-100 text-red-700'
              : alert.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
