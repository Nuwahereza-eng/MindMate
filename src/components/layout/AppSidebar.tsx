"use client";

import React from 'react';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  user: UserProfile | null;
  isPremium: boolean;
  navItems: NavItemType[];
  currentView: string;
  onNavigate: (view: string) => void;
  onSignIn: () => void;
  className?: string;
}

export function AppSidebar({ 
  user, 
  isPremium, 
  navItems, 
  currentView, 
  onNavigate, 
  onSignIn,
  className
}: AppSidebarProps) {
  const { t } = useLocalization();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  return (
    <div className={className}>
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-primary">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg> {/* Placeholder Icon */}
            <span className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('appName')}</span>
          </Link>
        </div>

        <div className="p-4 border-b">
          {!user ? (
            <Button onClick={onSignIn} className="w-full">
              {t('signIn')}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                 <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  {isPremium && <Crown className="mr-1 h-3 w-3 text-yellow-500" />}
                  {isPremium ? t('premiumMember') : t('freeMember')}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isLocked = item.premium && !isPremium && user;
              return (
                <li key={item.id}>
                  <Button
                    variant={currentView === item.view ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (isLocked) {
                        onNavigate('premium'); // Redirect to premium page if locked
                      } else {
                        onNavigate(item.view);
                      }
                    }}
                    aria-current={currentView === item.view ? 'page' : undefined}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {t(item.labelKey)}
                    {isLocked && <Crown className="ml-auto h-4 w-4 text-yellow-400" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
