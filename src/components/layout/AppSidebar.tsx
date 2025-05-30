
"use client";

import React from 'react';
import Link from 'next/link';
import { Crown } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';


interface AppSidebarProps {
  user: UserProfile | null;
  isPremium: boolean;
  navItems: NavItemType[];
  currentView: string;
  onNavigate: (view: string) => void;
  className?: string;
}

export function AppSidebar({ 
  user, 
  isPremium, 
  navItems, 
  currentView, 
  onNavigate, 
  className
}: AppSidebarProps) {
  const { t } = useLocalization();
  
  return (
    <div className={className}>
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary">
              <path d="M12 3C8.23 3 5.28 5.18 4.32 8.29C4.12 8.95 4 9.64 4 10.35C4 13.48 6.24 16.11 9.25 16.82C8.63 17.69 8 18.83 8 20C8 21.1 8.9 22 10 22C10.82 22 11.55 21.45 11.86 20.75C12.53 20.92 13.25 21 14 21C17.31 21 20 18.31 20 15C20 11.69 17.31 9 14 9C13.73 9 13.47 9.03 13.22 9.07C12.69 7.11 10.97 5.69 9 5.18C9 4.08 8.1 3.18 7 3.03C7.59 3.01 8.16 3 8.75 3C9.84 3 10.83 3.18 11.68 3.5C11.88 3.2 12.17 3 12.5 3H12M14 11C16.21 11 18 12.79 18 15C18 17.21 16.21 19 14 19C11.79 19 10 17.21 10 15C10 12.79 11.79 11 14 11Z" />
            </svg>
            <span className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('appName')}</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isLocked = item.premium && !isPremium && user && user.name !== t('anonymousUser'); 
              
              return (
                <li key={item.id}>
                  <Button
                    variant={item.view && currentView === item.view ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (item.onClickAction) {
                        item.onClickAction();
                        // Call onNavigate with currentView to ensure mobile menu closes without changing view.
                        // This relies on onNavigate in AfyaSyncApp to handle this gracefully.
                        onNavigate(currentView); 
                      } else if (item.view) {
                        if (isLocked) {
                          onNavigate('premium');
                        } else {
                          onNavigate(item.view);
                        }
                      }
                    }}
                    aria-current={item.view && currentView === item.view ? 'page' : undefined}
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
