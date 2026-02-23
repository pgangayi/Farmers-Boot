import React from 'react';
import { InventoryItem } from './types';

export function InventoryItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  ...rest
}: {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => void;
  item?: InventoryItem | null;
  [key: string]: any;
}) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{item ? 'Edit Item' : 'Add Item'}</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSave(Object.fromEntries(formData));
        }}
      >
        <div className="mb-4">
          <label className="block mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={item?.name}
            className="border p-2 w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1" htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            defaultValue={item?.quantity}
            className="border p-2 w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1" htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            defaultValue={item?.unit}
            className="border p-2 w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={item?.category}
            className="border p-2 w-full"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
