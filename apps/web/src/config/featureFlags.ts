/**
 * ============================================================================
 * FEATURE FLAGS SYSTEM
 * ============================================================================
 * Dynamic feature flag management for Farmers-Boot application
 * ============================================================================
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  userConditions?: {
    role?: string[];
    farmId?: string[];
    userId?: string[];
  };
}

export interface FeatureFlags {
  [key: string]: FeatureFlag;
}

// Default feature flags configuration
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core Features
  enableAnalytics: {
    key: 'enableAnalytics',
    enabled: true,
    description: 'Enable analytics and reporting features',
  },
  enableOfflineMode: {
    key: 'enableOfflineMode',
    enabled: false,
    description: 'Enable offline mode functionality',
    rolloutPercentage: 10, // 10% of users
  },
  enablePushNotifications: {
    key: 'enablePushNotifications',
    enabled: false,
    description: 'Enable push notifications',
  },
  enableRealtimeUpdates: {
    key: 'enableRealtimeUpdates',
    enabled: true,
    description: 'Enable real-time updates',
  },

  // AI Features
  enableAIRecommendations: {
    key: 'enableAIRecommendations',
    enabled: true,
    description: 'Enable AI-powered recommendations',
  },
  enableAIPestDetection: {
    key: 'enableAIPestDetection',
    enabled: false,
    description: 'Enable AI pest detection',
    rolloutPercentage: 20, // 20% of users
  },
  enableAIYieldPrediction: {
    key: 'enableAIYieldPrediction',
    enabled: true,
    description: 'Enable AI yield prediction',
  },

  // Advanced Features
  enableAdvancedAnalytics: {
    key: 'enableAdvancedAnalytics',
    enabled: false,
    description: 'Enable advanced analytics dashboard',
    userConditions: {
      role: ['admin', 'premium'],
    },
  },
  enableBulkOperations: {
    key: 'enableBulkOperations',
    enabled: true,
    description: 'Enable bulk operations',
  },
  enableAPIAccess: {
    key: 'enableAPIAccess',
    enabled: false,
    description: 'Enable API access for developers',
    userConditions: {
      role: ['admin'],
    },
  },

  // UI/UX Features
  enableDarkMode: {
    key: 'enableDarkMode',
    enabled: true,
    description: 'Enable dark mode theme',
  },
  enableMobileApp: {
    key: 'enableMobileApp',
    enabled: false,
    description: 'Enable mobile app features',
    rolloutPercentage: 5, // 5% of users
  },
  enableCustomDashboard: {
    key: 'enableCustomDashboard',
    enabled: false,
    description: 'Enable customizable dashboard',
    userConditions: {
      role: ['admin', 'premium'],
    },
  },

  // Integration Features
  enableWeatherIntegration: {
    key: 'enableWeatherIntegration',
    enabled: true,
    description: 'Enable weather API integration',
  },
  enableFileUploads: {
    key: 'enableFileUploads',
    enabled: true,
    description: 'Enable file upload functionality',
  },
  enableEmailNotifications: {
    key: 'enableEmailNotifications',
    enabled: true,
    description: 'Enable email notifications',
  },

  // Beta Features
  enableBetaFeatures: {
    key: 'enableBetaFeatures',
    enabled: false,
    description: 'Enable beta features for testing',
    userConditions: {
      role: ['admin', 'beta_tester'],
    },
  },
  enableExperimentalAI: {
    key: 'enableExperimentalAI',
    enabled: false,
    description: 'Enable experimental AI features',
    userConditions: {
      role: ['admin'],
    },
  },
};

// Feature flag manager class
export class FeatureFlagManager {
  private flags: FeatureFlags;
  private readonly userId?: string;
  private readonly userRole?: string;
  private readonly farmId?: string;

  constructor(
    flags: FeatureFlags = DEFAULT_FEATURE_FLAGS,
    userId?: string,
    userRole?: string,
    farmId?: string
  ) {
    this.flags = { ...flags };
    this.userId = userId;
    this.userRole = userRole;
    this.farmId = farmId;
  }

  // Check if a feature is enabled for the current user
  isEnabled(featureKey: string): boolean {
    const flag = this.flags[featureKey];
    if (!flag) {
      console.warn(`Feature flag '${featureKey}' not found`);
      return false;
    }

    // If the feature is disabled globally, return false
    if (!flag.enabled) {
      return false;
    }

    // Check user conditions if they exist
    if (flag.userConditions) {
      const { role, farmId, userId } = flag.userConditions;

      // Check role-based access
      if (role && this.userRole && !role.includes(this.userRole)) {
        return false;
      }

      // Check farm-based access
      if (farmId && this.farmId && !farmId.includes(this.farmId)) {
        return false;
      }

      // Check user-based access
      if (userId && this.userId && !userId.includes(this.userId)) {
        return false;
      }
    }

    // Check rollout percentage if specified
    if (flag.rolloutPercentage && this.userId) {
      const hash = this.hashUserId(this.userId);
      const userPercentage = (hash % 100) + 1; // 1-100
      return userPercentage <= flag.rolloutPercentage;
    }

    return true;
  }

  // Get all enabled features for the current user
  getEnabledFeatures(): string[] {
    return Object.keys(this.flags).filter(key => this.isEnabled(key));
  }

  // Get feature flag details
  getFeature(featureKey: string): FeatureFlag | undefined {
    return this.flags[featureKey];
  }

  // Update feature flags (for admin use)
  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags } as FeatureFlags;
  }

  // Add a new feature flag
  addFlag(flag: FeatureFlag): void {
    this.flags[flag.key] = flag;
  }

  // Remove a feature flag
  removeFlag(featureKey: string): void {
    delete this.flags[featureKey];
  }

  // Simple hash function for rollout percentage
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.codePointAt(i) || 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Export current configuration
  export(): FeatureFlags {
    return { ...this.flags };
  }

  // Import configuration
  import(flags: FeatureFlags): void {
    this.flags = { ...flags };
  }
}

// Hook for using feature flags in React components
export const useFeatureFlags = (
  userId?: string,
  userRole?: string,
  farmId?: string
): FeatureFlagManager => {
  // In a real implementation, this would fetch flags from an API
  // For now, we use the default flags
  return new FeatureFlagManager(DEFAULT_FEATURE_FLAGS, userId, userRole, farmId);
};

// Utility function to check if any of the given features are enabled
export const isAnyFeatureEnabled = (
  features: string[],
  flagManager: FeatureFlagManager
): boolean => {
  return features.some(feature => flagManager.isEnabled(feature));
};

// Utility function to check if all of the given features are enabled
export const areAllFeaturesEnabled = (
  features: string[],
  flagManager: FeatureFlagManager
): boolean => {
  return features.every(feature => flagManager.isEnabled(feature));
};

// Feature flag categories for organization
export const FEATURE_CATEGORIES = {
  CORE: [
    'enableAnalytics',
    'enableOfflineMode',
    'enablePushNotifications',
    'enableRealtimeUpdates',
  ],
  AI: ['enableAIRecommendations', 'enableAIPestDetection', 'enableAIYieldPrediction'],
  ADVANCED: ['enableAdvancedAnalytics', 'enableBulkOperations', 'enableAPIAccess'],
  UI_UX: ['enableDarkMode', 'enableMobileApp', 'enableCustomDashboard'],
  INTEGRATION: ['enableWeatherIntegration', 'enableFileUploads', 'enableEmailNotifications'],
  BETA: ['enableBetaFeatures', 'enableExperimentalAI'],
} as const;

// Environment-based feature overrides
export const getEnvironmentOverrides = (): Partial<FeatureFlags> => {
  const env = import.meta.env.MODE;

  switch (env) {
    case 'development':
      return {
        enableBetaFeatures: {
          ...DEFAULT_FEATURE_FLAGS.enableBetaFeatures,
          enabled: true,
          key: 'enableBetaFeatures',
          description:
            DEFAULT_FEATURE_FLAGS.enableBetaFeatures?.description ||
            'Enable beta features for testing',
        },
        enableExperimentalAI: {
          ...DEFAULT_FEATURE_FLAGS.enableExperimentalAI,
          enabled: true,
          key: 'enableExperimentalAI',
          description:
            DEFAULT_FEATURE_FLAGS.enableExperimentalAI?.description ||
            'Enable experimental AI features',
        },
        enableOfflineMode: {
          ...DEFAULT_FEATURE_FLAGS.enableOfflineMode,
          enabled: true,
          key: 'enableOfflineMode',
          description:
            DEFAULT_FEATURE_FLAGS.enableOfflineMode?.description ||
            'Enable offline mode functionality',
        },
      };
    case 'staging':
      return {
        enableBetaFeatures: {
          ...DEFAULT_FEATURE_FLAGS.enableBetaFeatures,
          enabled: true,
          key: 'enableBetaFeatures',
          description:
            DEFAULT_FEATURE_FLAGS.enableBetaFeatures?.description ||
            'Enable beta features for testing',
        },
        enablePushNotifications: {
          ...DEFAULT_FEATURE_FLAGS.enablePushNotifications,
          enabled: true,
          key: 'enablePushNotifications',
          description:
            DEFAULT_FEATURE_FLAGS.enablePushNotifications?.description ||
            'Enable push notifications',
        },
      };
    case 'production':
      return {
        // Production overrides would go here
      };
    default:
      return {};
  }
};

// Initialize feature flags with environment overrides
export const initializeFeatureFlags = (
  userId?: string,
  userRole?: string,
  farmId?: string
): FeatureFlagManager => {
  const overrides = getEnvironmentOverrides();
  const flags = { ...DEFAULT_FEATURE_FLAGS, ...overrides } as FeatureFlags;

  return new FeatureFlagManager(flags, userId, userRole, farmId);
};

export default FeatureFlagManager;
