
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle, Settings, Heart, Zap, BookOpen, Shield, Phone, Calendar as CalendarIcon, Menu as MenuIcon, X as XIcon, Award, Users
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatView } from '@/components/views/ChatView';
import { MoodTrackerView } from '@/components/views/MoodTrackerView';
import { JournalView } from '@/components/views/JournalView';
import { ExercisesView } from '@/components/views/ExercisesView';
import { TherapistsView } from '@/components/views/TherapistsView';
import { PremiumView } from '@/components/views/PremiumView';
import { SettingsView } from '@/components/views/SettingsView';
import { AuthModal } from '@/components/modals/AuthModal';
import { CrisisModal } from '@/components/modals/CrisisModal';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile'; // Using existing hook
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";


const NAV_ITEMS: NavItemType[] = [
  { id: 'chat', labelKey: 'navChat', icon: MessageCircle, view: 'chat' },
  { id: 'mood', labelKey: 'navMood', icon: Heart, view: 'mood' },
  { id: 'journal', labelKey: 'navJournal', icon: BookOpen, view: 'journal' },
  { id: 'exercises', labelKey: 'navWellness', icon: Zap, view: 'exercises' },
  { id: 'therapists', labelKey: 'navTherapists', icon: Users, premium: true, view: 'therapists' },
  { id: 'premium', labelKey: 'navPremium', icon: Award, view: 'premium' },
  { id: 'settings', labelKey: 'navSettings', icon: Settings, view: 'settings' },
];

export default function AfyaSyncApp() {
  const { t } = useLocalization();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState('chat');
  const [isPremium, setIsPremium] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMobileLayout = useIsMobile(); 

  useEffect(() => {
    const storedUser = localStorage.getItem('afyasync-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedPremium = localStorage.getItem('afyasync-isPremium');
    if (storedPremium) {
      setIsPremium(JSON.parse(storedPremium));
    }
  }, []);

  const handleAuthentication = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem('afyasync-user', JSON.stringify(authenticatedUser));
    if(authenticatedUser.name !== t('anonymousUser')) { 
        toast({ title: t('welcomeBack') + `, ${authenticatedUser.name}!` });
    }
  };

  const handleSetPremium = (premiumStatus: boolean) => {
    setIsPremium(premiumStatus);
    localStorage.setItem('afyasync-isPremium', JSON.stringify(premiumStatus));
  };

  const handleNavigate = (view: string) => {
    const navItem = NAV_ITEMS.find(item => item.view === view);
    if (navItem) {
      if (navItem.premium && !isPremium && user && user.name !== t('anonymousUser')) {
        setCurrentView('premium');
        toast({ title: t('accessPremiumFeature'), description: t('upgradeToAccess', {feature: t(navItem.labelKey) }) });
      } else {
        setCurrentView(view);
      }
    }
    if (isMobileLayout) setIsMobileMenuOpen(false);
  };
  
  const currentViewNavItem = useMemo(() => NAV_ITEMS.find(item => item.view === currentView), [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'chat': return <ChatView onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
      case 'mood': return <MoodTrackerView isPremium={isPremium} />;
      case 'journal': return <JournalView />;
      case 'exercises': return <ExercisesView isPremium={isPremium} onNavigateToPremium={() => handleNavigate('premium')} />;
      case 'therapists': return <TherapistsView />;
      case 'premium': return <PremiumView isPremium={isPremium} onSetPremium={handleSetPremium} />;
      case 'settings': return <SettingsView />;
      default: return <ChatView onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
    }
  };

  // Sidebar component instance
  const sidebarComponent = (
     <AppSidebar
        user={user}
        isPremium={isPremium}
        navItems={NAV_ITEMS}
        currentView={currentView}
        onNavigate={handleNavigate}
        className="h-full border-r bg-background" 
      />
  );

  return (
    <div className="flex flex-row min-h-screen w-full bg-muted/40">
      {/* Desktop Sidebar */}
      {!isMobileLayout && (
        <div className="w-64 flex-shrink-0 hidden md:block">
          {sidebarComponent}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col sm:gap-4 ${isMobileLayout ? '' : 'sm:py-4'}`}>
        {/* Mobile Sidebar (Sheet) */}
        {isMobileLayout && (
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              {/* Trigger is now part of AppHeader, this div is a placeholder for Sheet logic */}
              <div />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 sm:w-72" title={t('appName')}>
               {sidebarComponent}
            </SheetContent>
          </Sheet>
        )}

        <AppHeader
            user={user}
            isPremium={isPremium}
            currentViewNavItem={currentViewNavItem}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onSignIn={() => setShowAuthModal(true)}
            isMobileLayout={isMobileLayout}
        />
        <main className={`flex-1 overflow-auto ${isMobileLayout ? 'p-0' : 'p-4 sm:px-6 sm:py-0 md:gap-8'}`}>
          {renderView()}
        </main>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onOpenChange={setShowAuthModal} 
        onAuthenticated={handleAuthentication} 
      />
      <CrisisModal 
        isOpen={showCrisisModal} 
        onOpenChange={setShowCrisisModal} 
      />

      {/* Emergency FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          variant="destructive"
          className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform"
          onClick={() => setShowCrisisModal(true)}
          title={t('emergencySupport')}
          aria-label={t('emergencySupport')}
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
