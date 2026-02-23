/**
 * ============================================================================
 * PERFORMANCE MONITORING
 * ============================================================================
 * Performance monitoring and optimization utilities for Farmers-Boot
import React from 'react';
 * ============================================================================
 */

// Performance metrics interface
export interface PerformanceMetrics {
  // Page load metrics
  pageLoad: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };

  // Runtime metrics
  runtime: {
    memoryUsage: number;
    jsHeapSize: number;
    frameRate: number;
    longTasks: Array<{
      duration: number;
      startTime: number;
      name: string;
    }>;
  };

  // Network metrics
  network: {
    totalRequests: number;
    totalSize: number;
    averageLatency: number;
    failedRequests: number;
  };

  // User interaction metrics
  interactions: {
    clickToResponse: number[];
    scrollToResponse: number[];
    inputToResponse: number[];
  };
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[];
  private isMonitoring: boolean = false;

  // Performance thresholds
  private readonly thresholds = {
    firstContentfulPaint: 2000, // 2 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    longTaskDuration: 50, // 50ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    frameRate: 30, // 30 FPS
    networkLatency: 1000, // 1 second
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.observers = [];
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize metrics structure
  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoad: {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
      },
      runtime: {
        memoryUsage: 0,
        jsHeapSize: 0,
        frameRate: 60,
        longTasks: [],
      },
      network: {
        totalRequests: 0,
        totalSize: 0,
        averageLatency: 0,
        failedRequests: 0,
      },
      interactions: {
        clickToResponse: [],
        scrollToResponse: [],
        inputToResponse: [],
      },
    };
  }

  // Start performance monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupPageLoadMetrics();
    this.setupRuntimeMetrics();
    this.setupNetworkMetrics();
    this.setupInteractionMetrics();
    this.setupLongTaskObserver();
  }

  // Stop performance monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Setup page load metrics
  private setupPageLoadMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.pageLoad.domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.startTime;
        this.metrics.pageLoad.loadComplete = navigation.loadEventEnd - navigation.startTime;
      }
    });

    // Paint timing
    const paintObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') {
          this.metrics.pageLoad.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
        }
      }
    });

    paintObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(paintObserver);

    // Largest contentful paint
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime;
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);
  }

  // Setup runtime metrics
  private setupRuntimeMetrics(): void {
    if (typeof window === 'undefined') return;

    // Memory monitoring
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.runtime.memoryUsage = memory.usedJSHeapSize;
        this.metrics.runtime.jsHeapSize = memory.totalJSHeapSize;
      }
    };

    // Measure memory every 5 seconds
    const memoryInterval = setInterval(measureMemory, 5000);

    // Frame rate monitoring
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        this.metrics.runtime.frameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrameRate);
      }
    };

    requestAnimationFrame(measureFrameRate);
  }

  // Setup network metrics
  private setupNetworkMetrics(): void {
    if (typeof window === 'undefined') return;

    // Intercept fetch requests
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.metrics.network.totalRequests++;

        // Estimate response size
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            this.metrics.network.totalSize += parseInt(contentLength, 10);
          }
        }

        // Update average latency
        this.updateAverageLatency(duration);

        return response;
      } catch (error) {
        this.metrics.network.failedRequests++;
        throw error;
      }
    };
  }

  // Setup interaction metrics
  private setupInteractionMetrics(): void {
    if (typeof window === 'undefined') return;

    // Click response time
    let clickStartTime = 0;

    window.addEventListener('mousedown', () => {
      clickStartTime = performance.now();
    });

    window.addEventListener('click', () => {
      if (clickStartTime > 0) {
        const responseTime = performance.now() - clickStartTime;
        this.metrics.interactions.clickToResponse.push(responseTime);
        clickStartTime = 0;
      }
    });

    // Input response time
    let inputStartTime = 0;

    document.addEventListener('inputstart', (e: any) => {
      inputStartTime = performance.now();
    });

    document.addEventListener('inputend', (e: any) => {
      if (inputStartTime > 0) {
        const responseTime = performance.now() - inputStartTime;
        this.metrics.interactions.inputToResponse.push(responseTime);
        inputStartTime = 0;
      }
    });
  }

  // Setup long task observer
  private setupLongTaskObserver(): void {
    if (!window.PerformanceObserver) return;

    const longTaskObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.duration > this.thresholds.longTaskDuration) {
          this.metrics.runtime.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      // Long task API not supported
      console.warn('Long task monitoring not supported');
    }
  }

  // Update average network latency
  private updateAverageLatency(newLatency: number): void {
    const total = this.metrics.network.totalRequests;
    const current = this.metrics.network.averageLatency;

    this.metrics.network.averageLatency = (current * (total - 1) + newLatency) / total;
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const scores = [
      this.getPageLoadScore(),
      this.getRuntimeScore(),
      this.getNetworkScore(),
      this.getInteractionScore(),
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Page load performance score
  private getPageLoadScore(): number {
    const { pageLoad } = this.metrics;
    let score = 100;

    if (pageLoad.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
      score -= 20;
    }

    if (pageLoad.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  // Runtime performance score
  private getRuntimeScore(): number {
    const { runtime } = this.metrics;
    let score = 100;

    if (runtime.memoryUsage > this.thresholds.memoryUsage) {
      score -= 20;
    }

    if (runtime.frameRate < this.thresholds.frameRate) {
      score -= 30;
    }

    if (runtime.longTasks.length > 5) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  // Network performance score
  private getNetworkScore(): number {
    const { network } = this.metrics;
    let score = 100;

    if (network.averageLatency > this.thresholds.networkLatency) {
      score -= 25;
    }

    if (network.failedRequests > 0) {
      score -= 25 * (network.failedRequests / Math.max(1, network.totalRequests));
    }

    return Math.max(0, score);
  }

  // Interaction performance score
  private getInteractionScore(): number {
    const { interactions } = this.metrics;
    let score = 100;

    const avgClickTime = this.calculateAverage(interactions.clickToResponse);
    const avgInputTime = this.calculateAverage(interactions.inputToResponse);

    if (avgClickTime > 100) {
      score -= 20;
    }

    if (avgInputTime > 200) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  // Calculate average of array
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    // Page load recommendations
    if (metrics.pageLoad.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
      recommendations.push(
        'Optimize initial page load - consider lazy loading images and components'
      );
    }

    if (metrics.pageLoad.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
      recommendations.push(
        'Reduce largest contentful paint time by optimizing images and critical resources'
      );
    }

    // Runtime recommendations
    if (metrics.runtime.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push(
        'High memory usage detected - consider optimizing data structures and cleanup'
      );
    }

    if (metrics.runtime.frameRate < this.thresholds.frameRate) {
      recommendations.push('Low frame rate detected - optimize animations and heavy computations');
    }

    if (metrics.runtime.longTasks.length > 5) {
      recommendations.push(
        'Multiple long tasks detected - break up heavy computations into smaller chunks'
      );
    }

    // Network recommendations
    if (metrics.network.averageLatency > this.thresholds.networkLatency) {
      recommendations.push(
        'High network latency - consider implementing caching and request optimization'
      );
    }

    if (metrics.network.failedRequests > 0) {
      recommendations.push(
        'Failed requests detected - implement better error handling and retry logic'
      );
    }

    return recommendations;
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        score: this.getPerformanceScore(),
        metrics: this.metrics,
        recommendations: this.getRecommendations(),
      },
      null,
      2
    );
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  // Debounce function
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Lazy load images
  static lazyLoadImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Optimize images
  static optimizeImages(): void {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      const element = img as HTMLImageElement;

      // Add loading="lazy" to images without it
      if (!element.hasAttribute('loading')) {
        element.setAttribute('loading', 'lazy');
      }

      // Add error handling
      element.addEventListener('error', () => {
        element.src = '/images/placeholder.jpg';
      });
    });
  }

  // Preload critical resources
  static preloadResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }

  // Cache API responses
  static createApiCache(): Map<string, { data: any; timestamp: number }> {
    return new Map();
  }

  // Memoize function
  static memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
}

import { useEffect } from 'react';

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    monitor.startMonitoring();

    return () => {
      monitor.stopMonitoring();
    };
  }, []);

  return {
    metrics: monitor.getMetrics(),
    score: monitor.getPerformanceScore(),
    recommendations: monitor.getRecommendations(),
    export: () => monitor.exportMetrics(),
    reset: () => monitor.resetMetrics(),
  };
};

export default PerformanceMonitor;
