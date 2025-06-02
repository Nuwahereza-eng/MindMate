
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Settings, Heart, Zap, BookOpen, ShieldAlert, Users, Award } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatView } from '@/components/views/ChatView';
import { MoodTrackerView } from '@/components/views/MoodTrackerView';
import { JournalView } from '@/components/views/JournalView';
import { ExercisesView } from '@/components/views/ExercisesView';
import { TherapistsView } from '@/components/views/TherapistsView';
import { PremiumView } from '@/components/modals/PremiumView'; // Corrected path
import { SettingsView } from '@/components/views/SettingsView';
import { AuthModal } from '@/components/modals/AuthModal';
import { CrisisModal } from '@/components/modals/CrisisModal';
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile, NavItemType } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';

const CHAT_MESSAGES_STORAGE_KEY_PREFIX = 'afyasync-chatMessages-';

export default function AfyaSyncApp() {
  const { t } = useLocalization();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState('chat');
  const [isPremium, setIsPremium] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); 

  const isMobileLayout = useIsMobile();

  const NAV_ITEMS: NavItemType[] = [
    { id: 'chat', labelKey: 'navChat', icon: MessageCircle, view: 'chat' },
    { id: 'mood', labelKey: 'navMood', icon: Heart, view: 'mood' },
    { id: 'journal', labelKey: 'navJournal', icon: BookOpen, view: 'journal' },
    { id: 'exercises', labelKey: 'navWellness', icon: Zap, view: 'exercises' },
    { id: 'therapists', labelKey: 'navTherapists', icon: Users, premium: true, view: 'therapists' },
    { id: 'premium', labelKey: 'navPremium', icon: Award, view: 'premium' },
    {
      id: 'emergency',
      labelKey: 'navEmergencySupport',
      icon: ShieldAlert,
      onClickAction: () => setShowCrisisModal(true),
    },
    { id: 'settings', labelKey: 'navSettings', icon: Settings, view: 'settings' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let firstName = '';
        let lastName = '';
        if (firebaseUser.displayName) {
          const nameParts = firebaseUser.displayName.split(' ');
          firstName = nameParts[0];
          if (nameParts.length > 1) {
            lastName = nameParts.slice(1).join(' ');
          }
        } else if (firebaseUser.email) {
          firstName = firebaseUser.email.split('@')[0];
        } else {
          firstName = t('anonymousUser');
        }
        
        const storedUserRaw = localStorage.getItem('afyasync-user');
        let joinDate = firebaseUser.metadata.creationTime || new Date().toISOString();
        if (storedUserRaw) {
          try {
            const storedUser: UserProfile = JSON.parse(storedUserRaw);
            if (storedUser.uid === firebaseUser.uid && storedUser.joinDate) {
              joinDate = storedUser.joinDate; 
            }
          } catch (e) { console.error("Error parsing stored user for joinDate", e); }
        }

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          firstName: firstName,
          lastName: lastName,
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber,
          joinDate: joinDate,
        };
        setUser(userProfile);
        localStorage.setItem('afyasync-user', JSON.stringify(userProfile));

        const storedPremium = localStorage.getItem('afyasync-isPremium');
         if (storedPremium) {
           setIsPremium(JSON.parse(storedPremium));
         } else {
           setIsPremium(false); 
         }
      } else {
        // User is signed out
        const loggedOutUserUid = user?.uid; // Get UID before clearing user
        if (loggedOutUserUid) {
            localStorage.removeItem(`${CHAT_MESSAGES_STORAGE_KEY_PREFIX}${loggedOutUserUid}`);
        }
        setUser(null);
        setIsPremium(false);
        localStorage.removeItem('afyasync-user');
        localStorage.removeItem('afyasync-isPremium');
        if (!authLoading) { // Only show auth modal if it's not the initial load check
             setShowAuthModal(true); 
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [t, authLoading, user?.uid]); // Added user?.uid to dependencies for logout chat clearing


  const handleAuthentication = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    localStorage.setItem('afyasync-user', JSON.stringify(authenticatedUser));
    if (authenticatedUser.firstName !== t('anonymousUser')) {
        toast({ title: t('welcomeBack') + `, ${authenticatedUser.firstName}!` });
    }
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    const loggedOutUserUid = user?.uid; // Capture UID before signOut
    try {
      await signOut(auth); 
      // onAuthStateChanged will handle resetting user state and most localStorage.
      // We specifically clear the chat history for the logged-out user here.
      if (loggedOutUserUid) {
        localStorage.removeItem(`${CHAT_MESSAGES_STORAGE_KEY_PREFIX}${loggedOutUserUid}`);
      }
      setCurrentView('chat'); // Navigate to chat view after logout
      toast({ title: t('loggedOutSuccessfully') });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleSetPremium = (premiumStatus: boolean) => {
    setIsPremium(premiumStatus);
    localStorage.setItem('afyasync-isPremium', JSON.stringify(premiumStatus));
  };

  const handleNavigate = (view: string) => {
    const navItem = NAV_ITEMS.find(item => item.view === view || (item.onClickAction && item.id === view) );
    if (navItem && navItem.view) {
      if (navItem.premium && !isPremium && user && user.firstName !== t('anonymousUser')) {
        setCurrentView('premium');
        toast({ title: t('accessPremiumFeature'), description: t('upgradeToAccess', {feature: t(navItem.labelKey) }) });
      } else {
        setCurrentView(navItem.view);
      }
    }
    if (isMobileLayout) setIsMobileMenuOpen(false);
  };
  
  const currentViewNavItem = useMemo(() => NAV_ITEMS.find(item => item.view === currentView), [currentView, NAV_ITEMS, t]); 

  const renderView = () => {
    if (authLoading) {
      return <div className="flex justify-center items-center h-full"><p>{t('loading') || 'Loading...'}</p></div>;
    }
    if (!user && currentView !== 'settings') { 
      return <ChatView user={null} onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
    }

    switch (currentView) {
      case 'chat': return <ChatView user={user} onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
      case 'mood': return <MoodTrackerView isPremium={isPremium} />;
      case 'journal': return <JournalView />;
      case 'exercises': return <ExercisesView isPremium={isPremium} onNavigateToPremium={() => handleNavigate('premium')} />;
      case 'therapists': return <TherapistsView />;
      case 'premium': return <PremiumView isPremium={isPremium} onSetPremium={handleSetPremium} />;
      case 'settings': return <SettingsView />;
      default: return <ChatView user={user} onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
    }
  };

  const sidebarComponent = (
     <AppSidebar
        user={user}
        isPremium={isPremium}
        navItems={NAV_ITEMS}
        currentView={currentView}
        onNavigate={handleNavigate}
        className="h-full border-r bg-sidebar" 
      />
  );

  return (
    <div className="flex flex-row min-h-screen w-full bg-muted/40">
      {!isMobileLayout && (
        <div className="w-64 flex-shrink-0 hidden md:block">
          {sidebarComponent}
        </div>
      )}

      <div className={`flex-1 flex flex-col sm:gap-4 ${isMobileLayout ? '' : 'sm:py-4'}`}>
        {isMobileLayout && (
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <div />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 sm:w-72 bg-sidebar text-sidebar-foreground" title={t('appName')}>
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
            onLogout={handleLogout}
            isMobileLayout={isMobileLayout}
            authLoading={authLoading}
        />
        <main className={`flex-1 overflow-auto ${isMobileLayout ? 'p-0 pb-6' : 'p-4 sm:px-6 sm:py-0 md:gap-8 pb-6'}`}>
          {renderView()}
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal && !user && !authLoading} 
        onOpenChange={setShowAuthModal}
        onAuthenticated={handleAuthentication}
      />
      <CrisisModal
        isOpen={showCrisisModal}
        onOpenChange={setShowCrisisModal}
      />
    </div>
  );
}
