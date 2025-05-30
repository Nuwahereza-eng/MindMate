"use client";

import React from 'react';
import { Menu, Crown, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppHeaderProps {
  user: UserProfile | null;
  isPremium: boolean;
  currentViewNavItem: NavItemType | undefined;
  onToggleMobileMenu: () => void;
  onSignIn: () => void;
  isMobileLayout: boolean;
}

export function AppHeader({ 
  user, 
  isPremium, 
  currentViewNavItem, 
  onToggleMobileMenu, 
  onSignIn,
  isMobileLayout
}: AppHeaderProps) {
  const { t } = useLocalization();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

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
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
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
        {user && (
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
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
          </div>
        )}
      </div>
    </header>
  );
}
