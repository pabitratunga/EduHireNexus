import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthProvider';
import { logout } from '@/lib/auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  GraduationCap,
  Bell,
  User,
  Settings,
  LogOut,
  Briefcase,
  Home,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGate } from './RoleGate';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const { user, userProfile } = useAuth();
  const [location] = useLocation();

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      public: true,
    },
    {
      label: 'Browse Jobs',
      href: '/jobs',
      icon: Briefcase,
      public: true,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['seeker'],
    },
    {
      label: 'Employer',
      href: '/employer',
      icon: Briefcase,
      roles: ['employer'],
    },
    {
      label: 'Admin',
      href: '/admin',
      icon: Shield,
      roles: ['admin'],
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className={cn("bg-card border-b border-border sticky top-0 z-50", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduHire Faculty</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              // Show public items or items for specific roles
              if (item.public || (item.roles && userProfile && item.roles.includes(userProfile.role))) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:text-foreground hover:bg-secondary",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {item.label}
                  </Link>
                );
              }
              return null;
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    data-testid="button-notifications"
                  >
                    <Bell className="w-5 h-5" />
                  </Button>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {userProfile?.displayName ? getInitials(userProfile.displayName) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{userProfile?.displayName}</p>
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        {userProfile?.role && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {userProfile.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <RoleGate allowedRoles={['seeker']}>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" data-testid="menu-item-profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    </RoleGate>
                    
                    <RoleGate allowedRoles={['employer']}>
                      <DropdownMenuItem asChild>
                        <Link href="/employer" data-testid="menu-item-employer">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Employer Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </RoleGate>
                    
                    <RoleGate allowedRoles={['admin']}>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" data-testid="menu-item-admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </RoleGate>
                    
                    <DropdownMenuItem data-testid="menu-item-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleSignOut} data-testid="menu-item-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button data-testid="button-sign-in">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
