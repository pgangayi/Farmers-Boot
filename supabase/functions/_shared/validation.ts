/**
 * ============================================================================
 * VALIDATION UTILITIES
 * ============================================================================
 * Common validation functions for Supabase Edge Functions
 * ============================================================================
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validate(data: any, rules: ValidationRule[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: rule.field, message: `${rule.field} is required` });
      continue;
    }

    // Skip validation if not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type) {
      const typeError = validateType(value, rule.type, rule.field);
      if (typeError) {
        errors.push(typeError);
        continue;
      }
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.minLength} characters`,
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at most ${rule.maxLength} characters`,
        });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} format is invalid`,
        });
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.min}`,
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at most ${rule.max}`,
        });
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
      });
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: rule.field,
          message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`,
        });
      }
    }
  }

  return errors;
}

function validateType(value: any, type: string, field: string): ValidationError | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field, message: `${field} must be a string` };
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { field, message: `${field} must be a number` };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field, message: `${field} must be a boolean` };
      }
      break;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return { field, message: `${field} must be a valid email` };
      }
      break;
    case 'uuid':
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (typeof value !== 'string' || !uuidRegex.test(value)) {
        return { field, message: `${field} must be a valid UUID` };
      }
      break;
    case 'date':
      if (!(value instanceof Date) && (typeof value !== 'string' || isNaN(Date.parse(value)))) {
        return { field, message: `${field} must be a valid date` };
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return { field, message: `${field} must be an array` };
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { field, message: `${field} must be an object` };
      }
      break;
  }
  return null;
}

// Common validation rules
export const commonRules = {
  email: {
    field: 'email',
    required: true,
    type: 'email' as const,
  },
  password: {
    field: 'password',
    required: true,
    type: 'string' as const,
    minLength: 6,
  },
  name: {
    field: 'name',
    required: true,
    type: 'string' as const,
    minLength: 2,
    maxLength: 100,
  },
  uuid: (field: string, required = true) => ({
    field,
    required,
    type: 'uuid' as const,
  }),
  enum: (field: string, values: string[], required = true) => ({
    field,
    required,
    type: 'string' as const,
    enum: values,
  }),
};

// Pagination validation
export function validatePagination(params: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get('pageSize') || '20', 10)));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

// Sanitize input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}
