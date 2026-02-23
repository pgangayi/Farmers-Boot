import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  Sprout,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Sun,
  Moon,
  Tractor,
} from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
// import { useDesignSystem } from '../lib/design-system';
// import { useIsMobile, useIsTablet, useIsDesktop } from '../lib/responsive-design';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useToast } from './ui/use-toast';
import { useNotifications } from '../hooks/useNotifications';
import { useFarms } from '../api';
import { ROUTES } from '../main';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { data: farms } = useFarms();
  const selectedFarm = farms?.[0] ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Design system hooks (disabled for now)
  // const { themeMode, setThemeMode, isDark } = useDesignSystem();
  // const isMobile = useIsMobile();
  // const isTablet = useIsTablet();
  // const isDesktop = useIsDesktop();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Navigation items
  const navigationItems = [
    { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
    { label: 'Farms', href: ROUTES.FARMS, icon: Tractor },
    { label: 'Fields', href: ROUTES.FIELDS, icon: MapPin },
    { label: 'Crops', href: ROUTES.CROPS, icon: Sprout },
    { label: 'Livestock', href: ROUTES.LIVESTOCK, icon: Package },
    { label: 'Tasks', href: ROUTES.TASKS, icon: Calendar },
    { label: 'Inventory', href: ROUTES.INVENTORY, icon: Package },
    { label: 'Finance', href: ROUTES.FINANCE, icon: DollarSign },
    { label: 'Analytics', href: ROUTES.ANALYTICS, icon: TrendingUp },
  ];

  // Handle search
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // Navigate to search results page with query
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out successfully', 'success');
    } catch (error) {
      toast('Error signing out. Please try again.', 'error');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActiveRoute = (href: string) => location.pathname === href;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container flex h-16 items-center">
        {/* Logo and Brand */}
        <div className="mr-4 flex">
          <Link to={ROUTES.DASHBOARD} className="mr-6 flex items-center space-x-2">
            <Tractor className="h-6 w-6 text-green-600" />
            <span className="hidden font-bold sm:inline-block">Farmers-Boot</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex mr-6 items-center space-x-1 text-sm font-medium">
          {navigationItems.slice(0, 6).map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 flex items-center justify-end space-x-2">
          {/* Desktop Search */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search farms, crops, livestock..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No new notifications</div>
              ) : (
                notifications
                  .slice(0, 5)
                  .map(
                    (notification: {
                      id: string;
                      title: string;
                      message: string;
                      read: boolean;
                      created_at: string;
                    }) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-4"
                      >
                        <div className="flex w-full justify-between">
                          <span className="font-medium">{notification.title}</span>
                          <Badge variant={notification.read ? 'secondary' : 'default'}>
                            {notification.read ? 'Read' : 'New'}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </span>
                        <span className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                    )
                  )
              )}
              {notifications.length > 5 && (
                <DropdownMenuItem className="text-center">
                  <Link to="/notifications" className="text-sm text-blue-600 hover:underline">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {selectedFarm ? selectedFarm.name : 'No farm selected'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-6">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Navigation</h2>
                  <div className="space-y-1">
                    {navigationItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActiveRoute(item.href)
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="fixed inset-x-0 top-0 z-50 bg-background p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search farms, crops, livestock..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  } else if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
