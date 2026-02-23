import React from 'react';
import { Supplier } from './types';

export function SupplierList({
  suppliers,
  ...rest
}: {
  suppliers: Supplier[];
  [key: string]: any;
}) {
  return (
    <div className="supplier-list">
      {suppliers.map(supplier => (
        <div key={supplier.id} className="p-4 border rounded mb-2">
          <h3 className="font-semibold">{supplier.name}</h3>
          {supplier.contactEmail && <p>{supplier.contactEmail}</p>}
          {supplier.phone && <p>{supplier.phone}</p>}
        </div>
      ))}
    </div>
  );
}
