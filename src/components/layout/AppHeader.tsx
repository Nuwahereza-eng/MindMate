
"use client";

import React from 'react';
import { Menu, Crown, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  user: UserProfile | null;
  isPremium: boolean;
  currentViewNavItem: NavItemType | undefined;
  onToggleMobileMenu: () => void;
  onSignIn: () => void;
  onLogout: () => void;
  isMobileLayout: boolean;
}

export function AppHeader({
  user,
  isPremium,
  currentViewNavItem,
  onToggleMobileMenu,
  onSignIn,
  onLogout,
  isMobileLayout
}: AppHeaderProps) {
  const { t } = useLocalization();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return 'U';
    let initials = firstName[0];
    if (lastName && lastName[0]) {
      initials += lastName[0];
    }
    return initials.toUpperCase();
  }

  const userAvatarDropdown = user && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className={`cursor-pointer ${isMobileLayout ? 'h-8 w-8' : 'h-9 w-9'}`}>
          <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.firstName, user.lastName)}`} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="profile avatar" />
          <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
          {(user.email || user.phone) && (
            <p className="text-xs text-muted-foreground">
              {user.email || user.phone}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isMobileLayout) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onToggleMobileMenu} className="mr-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('appName')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle isMobile />
          {!user ? (
            <Button onClick={onSignIn} size="sm">{t('signIn')}</Button>
          ) : (
            userAvatarDropdown
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <h1 className="text-2xl font-semibold">
        {currentViewNavItem ? t(currentViewNavItem.labelKey) : t('appName')}
      </h1>
      <div className="flex items-center gap-4">
        {user && user.firstName !== t('anonymousUser') && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{t('joined')} {new Date(user.joinDate).toLocaleDateString()}</span>
          </div>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
        {!user ? (
          <Button onClick={onSignIn}>{t('signIn')}</Button>
        ) : (
          <div className="flex items-center gap-2">
            {userAvatarDropdown}
            {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
          </div>
        )}
      </div>
    </header>
  );
}
