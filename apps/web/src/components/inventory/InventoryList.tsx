import React from 'react';
import { InventoryItem } from './types';

export function InventoryList({
  items,
  onEdit,
  onDelete,
  ...rest
}: {
  items?: InventoryItem[];
  inventoryItems?: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  [key: string]: any;
}) {
  const allItems = items || rest.inventoryItems || [];
  return (
    <div className="inventory-list">
      {allItems.length === 0 ? (
        <p className="text-gray-500">No inventory items found.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-2">{item.category}</td>
                <td className="px-4 py-2">
                  {item.quantity <= item.minStock ? (
                    <span className="text-red-600">Low Stock</span>
                  ) : (
                    <span className="text-green-600">In Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
