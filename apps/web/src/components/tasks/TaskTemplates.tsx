import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Clock } from 'lucide-react';
import type { TaskTemplate } from './types';

export interface TaskTemplatesProps {
  templates: TaskTemplate[];
  onSelectTemplate?: (template: TaskTemplate) => void;
  onCreateTemplate?: () => void;
  [key: string]: any;
}

export function TaskTemplates({ templates, onSelectTemplate, ...rest }: TaskTemplatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Task Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectTemplate?.(template)}
            >
              <h4 className="font-medium">{template.name}</h4>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {template.category}
                </span>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
