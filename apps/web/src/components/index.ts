// Barrel export for all components
// This file provides a single import point for all components

// ============================================================================
// UI COMPONENTS
// ============================================================================
export * from './ui/alert';
export * from './ui/badge';
export * from './ui/button';
export * from './ui/card';
export * from './ui/checkbox';
export * from './ui/dialog';
export * from './ui/dropdown-menu';
export * from './ui/input';
export * from './ui/label';
export * from './ui/progress';
export * from './ui/scroll-area';
export * from './ui/select';
export * from './ui/separator';
export * from './ui/sheet';
export * from './ui/Skeleton';
export * from './ui/table';
export * from './ui/tabs';
export * from './ui/textarea';
export * from './ui/tooltip';

// ============================================================================
// ENTITY CARDS (New)
// ============================================================================
export { TaskCard, TaskList as TaskCardList } from './cards/TaskCard';
export { AnimalCard, AnimalList as AnimalCardList } from './cards/AnimalCard';

// ============================================================================
// NAVIGATION (New)
// ============================================================================
export {
  TabNavigation,
  MobileBottomNav,
  SectionTabs,
  type TabItem,
} from './navigation/TabNavigation';

// ============================================================================
// LAYOUT (New)
// ============================================================================
export { PageHeader, SectionHeader } from './layout/PageHeader';

// ============================================================================
// ACTIONS (New)
// ============================================================================
export { QuickActions, AddButton, type QuickAction } from './actions/QuickActions';

// ============================================================================
// ENHANCED UI COMPONENTS (New)
// ============================================================================
export {
  Button as EnhancedButton,
  IconButton,
  ActionButton,
  ButtonGroup,
  FloatingActionButton,
} from './ui/button-enhanced';

export {
  Card as EnhancedCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  FeatureCard,
  InfoCard,
  MetricCard,
} from './ui/card-enhanced';

export {
  ToastProvider as EnhancedToastProvider,
  useToast,
  useToastHelpers,
} from './ui/toast-enhanced';

export {
  EmptyState,
  EmptySearchState,
  NoDataState,
  ErrorState,
  OfflineState,
  SuccessState,
} from './ui/empty-state';

export {
  PageTransition,
  StaggerContainer,
  LoadingTransition,
  RouteTransition,
  AnimatedList,
} from './ui/page-transition';

export {
  AnimatedSection,
  StaggerContainer as StaggerAnimationContainer,
  RevealOnScroll,
  AnimatedList as ScrollAnimatedList,
} from './ui/scroll-animations';

// ============================================================================
// DASHBOARD COMPONENTS
// ============================================================================
export { DashboardRouter } from './dashboard/DashboardRouter';
export { CropCard } from './dashboard/CropCard';
// Note: StatCard is exported from enhanced card components above

// ============================================================================
// CROP COMPONENTS
// ============================================================================
export { CropForm } from './CropForm';
export { CropPlanning } from './CropPlanning';
export { CropRotationPlanner } from './CropRotationPlanner';
export { CropsOverview } from './crops/CropsOverview';
export { ReferenceLibrary } from './crops/ReferenceLibrary';

// ============================================================================
// LIVESTOCK COMPONENTS
// ============================================================================
export { LivestockForm } from './LivestockForm';
export { LivestockList } from './livestock/LivestockList';
export { OverviewTab } from './livestock/OverviewTab';
export { ReferenceTabs } from './livestock/ReferenceTabs';

// ============================================================================
// FIELD COMPONENTS
// ============================================================================
export { FieldMap } from './fields/FieldMap';

// ============================================================================
// FINANCE COMPONENTS
// ============================================================================
export { BudgetProgress } from './finance/BudgetProgress';
export { FinanceAnalytics } from './finance/FinanceAnalytics';
export { FinanceEntryList } from './finance/FinanceEntryList';
export { FinanceEntryModal } from './finance/FinanceEntryModal';
export { FinanceOverview } from './finance/FinanceOverview';
export { FinanceReports } from './finance/FinanceReports';

// ============================================================================
// INVENTORY COMPONENTS
// ============================================================================
export { InventoryAlerts } from './inventory/InventoryAlerts';
export { InventoryAnalytics } from './inventory/InventoryAnalytics';
export { InventoryItemModal } from './inventory/InventoryItemModal';
export { InventoryList } from './inventory/InventoryList';
export { InventoryOverview } from './inventory/InventoryOverview';
export { SupplierList } from './inventory/SupplierList';

// ============================================================================
// TASK COMPONENTS
// ============================================================================
export { TaskAnalytics } from './tasks/TaskAnalytics';
export { TaskList } from './tasks/TaskList';
export { TaskModal } from './tasks/TaskModal';
export { TaskOverview } from './tasks/TaskOverview';
export { TaskTemplates } from './tasks/TaskTemplates';
export { TaskTimeTracker } from './tasks/TaskTimeTracker';

// ============================================================================
// SPECIALIZED COMPONENTS
// ============================================================================
export { default as AdvancedManagementDashboard } from './AdvancedManagementDashboard';
export { default as AIAnalyticsDashboard } from './AIAnalyticsDashboard';
export { default as EnhancedFarmCalendar } from './EnhancedFarmCalendar';
export { default as FarmingActivityRecommender } from './FarmingActivityRecommender';
export { IrrigationOptimizer } from './IrrigationOptimizer';
export { default as PestDiseaseManager } from './PestDiseaseManager';
export { default as SoilHealthMonitor } from './SoilHealthMonitor';
export { WeatherAnalytics } from './WeatherAnalytics';
export { default as WeatherCalendar } from './WeatherCalendar';

// ============================================================================
// INFORMATION COMPONENTS
// ============================================================================
export { InfoIcon } from './information/InfoIcon';
export { InfoModal } from './information/InfoModal';
export { InformationProvider } from './information/InformationProvider';

// ============================================================================
// ERROR HANDLING
// ============================================================================
export { default as ErrorBoundary } from './ErrorBoundary';

// ============================================================================
// OTHER COMPONENTS
// ============================================================================
// Note: Breadcrumbs, GlobalSearch, Header, and OfflineIndicator use named exports
// Import them directly from their files if needed
