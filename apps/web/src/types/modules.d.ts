declare module 'react-hook-form' {
  export function useForm<T = any>(
    options?: any
  ): {
    register: (name: string, options?: any) => any;
    handleSubmit: (onSubmit: (data: T) => void) => (e?: React.BaseSyntheticEvent) => void;
    formState: { errors: Record<string, any>; isSubmitting: boolean };
    watch: (name?: string) => any;
    setValue: (name: string, value: any) => void;
    reset: (values?: Partial<T>) => void;
    control: any;
  };
  export function useFieldArray(options: any): any;
  export function Controller(props: any): any;
  export type FieldValues = Record<string, any>;
  export type UseFormReturn<T = any> = ReturnType<typeof useForm>;
  export type SubmitHandler<T> = (data: T) => void;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

declare module 'recharts' {
  import { ComponentType } from 'react';
  export const LineChart: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const Pie: ComponentType<any>;
  export const Cell: ComponentType<any>;
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Legend: ComponentType<any>;
  export const ResponsiveContainer: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const ComposedChart: ComponentType<any>;
  export const Scatter: ComponentType<any>;
  export const ScatterChart: ComponentType<any>;
  export const RadarChart: ComponentType<any>;
  export const Radar: ComponentType<any>;
  export const PolarGrid: ComponentType<any>;
  export const PolarAngleAxis: ComponentType<any>;
  export const PolarRadiusAxis: ComponentType<any>;
}
