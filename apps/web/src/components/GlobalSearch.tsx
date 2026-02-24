import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  FileText,
  Users,
  Package,
  DollarSign,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDesignSystem } from '@/lib/design-system';
import { useIsMobile, useResponsiveValue } from '@/lib/responsive-design';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useFarms } from '@/api/hooks/useFarms';
import { useLocations } from '@/api/hooks/useLocations';
import { useCrops } from '@/api/hooks/useCrops';
import { useLivestock } from '@/api/hooks/useLivestock';
import { useTasks } from '@/api/hooks/useTasks';
import { useInventory } from '@/api/hooks/useInventory';
import { useFinance } from '@/api/hooks/useFinance';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'farm' | 'field' | 'crop' | 'livestock' | 'task' | 'inventory' | 'financial' | 'document';
  url: string;
  metadata?: {
    status?: string;
    priority?: string;
    date?: string;
    category?: string;
  };
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  maxRecentSearches?: number;
  farmId?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  placeholder = 'Search farms, crops, livestock...',
  onSearch,
  maxRecentSearches = 5,
  farmId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Design system hooks
  const { colors, isHighContrast } = useDesignSystem();
  const isMobile = useIsMobile();
  const dialogSize = useResponsiveValue(
    {
      xs: 'w-[95vw]',
      sm: 'w-[90vw]',
      md: 'w-[80vw]',
      lg: 'w-[70vw]',
      xl: 'w-[60vw]',
    },
    'w-[80vw]'
  );

  // API hooks for search data
  const { data: farmsData } = useFarms();
  const { data: locationsData } = useLocations(farmId);
  const { data: cropsData } = useCrops(farmId);
  const { data: livestockData } = useLivestock(farmId);
  const { data: tasksData } = useTasks(farmId ? { farm_id: farmId } : undefined);
  const { data: inventoryData } = useInventory(farmId);
  const { data: financeData } = useFinance(farmId ? { farm_id: farmId } : undefined);

  const getIconForType = (type: SearchResult['type']) => {
    switch (type) {
      case 'farm':
        return <Users className="h-4 w-4" />;
      case 'field':
        return <MapPin className="h-4 w-4" />;
      case 'crop':
        return <Package className="h-4 w-4" />;
      case 'livestock':
        return <Package className="h-4 w-4" />;
      case 'task':
        return <Calendar className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'farm':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'field':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'crop':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'livestock':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'task':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'inventory':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'financial':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'document':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Build search results from API data
  const buildSearchResults = useCallback(
    (searchQuery: string): SearchResult[] => {
      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();

      // Search farms
      if (farmsData) {
        farmsData.forEach((farm: any) => {
          if (
            farm.name?.toLowerCase().includes(queryLower) ||
            farm.description?.toLowerCase().includes(queryLower) ||
            farm.location?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: farm.id,
              title: farm.name || 'Unnamed Farm',
              description: farm.description || farm.location,
              type: 'farm',
              url: `/farms/${farm.id}`,
              metadata: {
                status: farm.status,
                category: 'Farm Management',
              },
            });
          }
        });
      }

      // Search locations/fields
      if (locationsData) {
        locationsData.forEach((location: any) => {
          if (
            location.name?.toLowerCase().includes(queryLower) ||
            location.soil_type?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: location.id,
              title: location.name || 'Unnamed Field',
              description: `${location.area_hectares || 0} ha - ${location.soil_type || 'Unknown soil'}`,
              type: 'field',
              url: `/fields/${location.id}`,
              metadata: {
                status: location.status,
                category: 'Field Management',
              },
            });
          }
        });
      }

      // Search crops
      if (cropsData) {
        cropsData.forEach((crop: any) => {
          if (
            crop.name?.toLowerCase().includes(queryLower) ||
            crop.crop_type?.toLowerCase().includes(queryLower) ||
            crop.variety?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: crop.id,
              title: crop.name || crop.crop_type || 'Unnamed Crop',
              description: crop.variety ? `Variety: ${crop.variety}` : 'Crop',
              type: 'crop',
              url: `/crops/${crop.id}`,
              metadata: {
                status: crop.status,
                date: crop.planting_date,
                category: 'Crop Management',
              },
            });
          }
        });
      }

      // Search livestock
      if (livestockData) {
        livestockData.forEach((animal: any) => {
          if (
            animal.name?.toLowerCase().includes(queryLower) ||
            animal.species?.toLowerCase().includes(queryLower) ||
            animal.breed?.toLowerCase().includes(queryLower) ||
            animal.tag_number?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: animal.id,
              title: animal.name || animal.tag_number || 'Unnamed Animal',
              description: `${animal.species || 'Unknown'} - ${animal.breed || 'Mixed'}`,
              type: 'livestock',
              url: `/livestock/${animal.id}`,
              metadata: {
                status: animal.health_status || 'Healthy',
                category: 'Livestock',
              },
            });
          }
        });
      }

      // Search tasks
      if (tasksData) {
        tasksData.forEach((task: any) => {
          if (
            task.title?.toLowerCase().includes(queryLower) ||
            task.description?.toLowerCase().includes(queryLower) ||
            task.category?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: task.id,
              title: task.title || 'Untitled Task',
              description: task.description || task.category,
              type: 'task',
              url: `/tasks/${task.id}`,
              metadata: {
                priority: task.priority,
                status: task.status,
                date: task.due_date,
                category: task.category || 'Task',
              },
            });
          }
        });
      }

      // Search inventory
      if (inventoryData) {
        inventoryData.forEach((item: any) => {
          if (
            item.name?.toLowerCase().includes(queryLower) ||
            item.category?.toLowerCase().includes(queryLower) ||
            item.sku?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: item.id,
              title: item.name || 'Unnamed Item',
              description: `${item.category || 'General'} - Qty: ${item.quantity || 0}`,
              type: 'inventory',
              url: `/inventory/${item.id}`,
              metadata: {
                status: item.quantity > (item.reorder_level || 0) ? 'In Stock' : 'Low Stock',
                category: item.category || 'Inventory',
              },
            });
          }
        });
      }

      // Search financial entries
      if (financeData) {
        financeData.forEach((entry: any) => {
          if (
            entry.description?.toLowerCase().includes(queryLower) ||
            entry.category?.toLowerCase().includes(queryLower) ||
            entry.type?.toLowerCase().includes(queryLower)
          ) {
            results.push({
              id: entry.id,
              title: entry.description || 'Financial Entry',
              description: `${entry.type || 'Transaction'} - $${entry.amount || 0}`,
              type: 'financial',
              url: `/finance/${entry.id}`,
              metadata: {
                date: entry.date,
                category: entry.category || 'Financial',
              },
            });
          }
        });
      }

      return results.slice(0, 20); // Limit results
    },
    [farmsData, locationsData, cropsData, livestockData, tasksData, inventoryData, financeData]
  );

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        let searchResults: SearchResult[];

        if (onSearch) {
          // Use custom search function if provided
          searchResults = await onSearch(searchQuery);
        } else {
          // Build results from API data
          searchResults = buildSearchResults(searchQuery);
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch, buildSearchResults]
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches if query is not empty
    if (query.trim()) {
      const newRecentSearches = [
        query.trim(),
        ...recentSearches.filter(s => s !== query.trim()),
      ].slice(0, maxRecentSearches);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    }

    // Navigate to result
    if (result) {
      navigate(result.url);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) handleResultClick(selected);
    }
  };

  const removeRecentSearch = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecentSearches = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(newRecentSearches);
    if (newRecentSearches.length > 0) {
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } else {
      localStorage.removeItem('recentSearches');
    }
  };

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const savedRecentSearches = localStorage.getItem('recentSearches');
      if (savedRecentSearches) {
        const parsed = JSON.parse(savedRecentSearches);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, maxRecentSearches));
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, [maxRecentSearches]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Keyboard shortcut for opening search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'relative h-10 w-full justify-start text-sm text-muted-foreground bg-background',
            'sm:h-10 sm:w-auto sm:min-w-[300px]',
            isMobile && 'h-12',
            className
          )}
          aria-label="Open search"
        >
          <Search className="h-4 w-4 mr-2 sm:h-4 sm:w-4" />
          <span className="truncate">{placeholder}</span>
          <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('p-0', dialogSize, 'max-h-[80vh] overflow-hidden')}>
        <DialogHeader className="px-4 pb-0 pt-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">Global Search</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Search across all your farms, fields, crops, livestock, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex items-center border-b px-4 pb-4 sm:px-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10"
                autoComplete="off"
                aria-label="Search input"
                title="Search input"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {query && !isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="h-6 w-6 animate-spin text-primary"
                  role="status"
                  aria-label="Loading"
                />
              </div>
            ) : query ? (
              results.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Search Results ({results.length})
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-lg',
                        index === selectedIndex && 'bg-accent'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full',
                          getTypeColor(result.type)
                        )}
                      >
                        {getIconForType(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                          {result.metadata?.priority && (
                            <Badge
                              variant={
                                result.metadata.priority === 'High' ||
                                result.metadata.priority === 'high'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {result.metadata.priority}
                            </Badge>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.description}
                          </p>
                        )}
                        {result.metadata?.category && (
                          <p className="text-xs text-muted-foreground">
                            {result.metadata.category}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-xs text-muted-foreground">
                    Try different keywords or check spelling
                  </p>
                </div>
              )
            ) : recentSearches.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Recent Searches</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearRecentSearches}
                  >
                    Clear all
                  </Button>
                </div>
                {recentSearches.map((recentQuery, index) => (
                  <div
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-lg"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{recentQuery}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => removeRecentSearch(index, e)}
                      aria-label={`Remove ${recentQuery} from recent searches`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Start typing to search</p>
                <p className="text-xs text-muted-foreground">
                  Search farms, fields, crops, livestock, tasks, and more
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
