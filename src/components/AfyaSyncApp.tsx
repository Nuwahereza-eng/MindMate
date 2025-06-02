
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Settings, Heart, Zap, BookOpen, ShieldAlert, Users, Award, LogOut } from 'lucide-react'; // Added LogOut
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatView } from '@/components/views/ChatView';
import { MoodTrackerView } from '@/components/views/MoodTrackerView';
import { JournalView } from '@/components/views/JournalView';
import { ExercisesView } from '@/components/views/ExercisesView';
import { TherapistsView } from '@/components/views/TherapistsView';
import { PremiumView } from '@/components/modals/PremiumView';
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
const USER_PROFILE_STORAGE_KEY_PREFIX = 'afyasync-userProfile-'; // For storing full profile with names

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
        // Check if a full profile was already created by AuthModal (e.g., after phone/mock auth)
        const userProfileStorageKey = `${USER_PROFILE_STORAGE_KEY_PREFIX}${firebaseUser.uid}`;
        const storedFullProfileRaw = localStorage.getItem(userProfileStorageKey);

        if (storedFullProfileRaw) {
          try {
            const storedProfile: UserProfile = JSON.parse(storedFullProfileRaw);
            setUser(storedProfile);
            // Premium status check after setting user
            const storedPremium = localStorage.getItem(`afyasync-isPremium-${firebaseUser.uid}`);
            setIsPremium(storedPremium ? JSON.parse(storedPremium) : false);

          } catch (e) { console.error("Error parsing stored full user profile", e); }
        } else {
          // Create profile from Firebase user (likely Google sign-in or session persistence)
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
          } else if (firebaseUser.phoneNumber) {
            firstName = t('user'); // Generic for phone-only if names weren't captured earlier
          } else {
            firstName = t('anonymousUser');
          }
          
          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            firstName: firstName,
            lastName: lastName,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber,
            joinDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
          setUser(userProfile);
          localStorage.setItem(userProfileStorageKey, JSON.stringify(userProfile)); // Save this new profile
          // Premium status check
          const storedPremium = localStorage.getItem(`afyasync-isPremium-${firebaseUser.uid}`);
          setIsPremium(storedPremium ? JSON.parse(storedPremium) : false);
        }
      } else { // User is signed out
        const uidOfLoggedOutUser = user?.uid; 
        
        setUser(null);
        setIsPremium(false);
        if (uidOfLoggedOutUser) {
            localStorage.removeItem(`${CHAT_MESSAGES_STORAGE_KEY_PREFIX}${uidOfLoggedOutUser}`);
            localStorage.removeItem(`${USER_PROFILE_STORAGE_KEY_PREFIX}${uidOfLoggedOutUser}`);
            localStorage.removeItem(`afyasync-isPremium-${uidOfLoggedOutUser}`);
        }
        // Also clear generic keys if they exist from older versions
        localStorage.removeItem('afyasync-user');
        localStorage.removeItem('afyasync-isPremium');
        
        if (!authLoading && currentView !== 'settings') { // Don't show auth modal if already on settings or loading
             setShowAuthModal(true); 
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [t, authLoading, currentView]);


  const handleAuthentication = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    // Store the full profile with names, keyed by UID
    localStorage.setItem(`${USER_PROFILE_STORAGE_KEY_PREFIX}${authenticatedUser.uid}`, JSON.stringify(authenticatedUser));
    
    // If it's an anonymous user from the modal, their UID is `anon-<timestamp>`
    // If it's mock email/pass, their UID is `mock-<timestamp>`
    // If it's phone auth, their UID is the Firebase UID
    // This ensures onAuthStateChanged can pick up the detailed profile.

    if (authenticatedUser.firstName !== t('anonymousUser')) {
        toast({ title: t('welcomeBack') + `, ${authenticatedUser.firstName}!` });
    }
    setShowAuthModal(false); // Close modal after onAuthenticated is called
  };

  const handleLogout = async () => {
    const uidOfCurrentUser = user?.uid; // Capture UID before signing out
    try {
      await signOut(auth); 
      // onAuthStateChanged will handle resetting user state and clearing UID-specific localStorage
      setCurrentView('chat');
      toast({ title: t('loggedOutSuccessfully') });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: t('logoutFailed'), description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleSetPremium = (premiumStatus: boolean) => {
    setIsPremium(premiumStatus);
    if (user?.uid) {
      localStorage.setItem(`afyasync-isPremium-${user.uid}`, JSON.stringify(premiumStatus));
    }
  };

  const handleNavigate = (viewId: string) => {
    const navItem = NAV_ITEMS.find(item => item.id === viewId);
    if (!navItem) return;

    if (navItem.onClickAction) {
        navItem.onClickAction();
        // Keep current view if it's just an action like opening crisis modal
    } else if (navItem.view) {
        if (navItem.premium && !isPremium && user && user.firstName !== t('anonymousUser')) {
            setCurrentView('premium');
            toast({ title: t('accessPremiumFeature'), description: t('upgradeToAccess', {feature: t(navItem.labelKey) }) });
        } else {
            setCurrentView(navItem.view);
        }
    }
    if (isMobileLayout) setIsMobileMenuOpen(false);
  };
  
  const currentViewNavItem = useMemo(() => NAV_ITEMS.find(item => item.view === currentView || item.id === currentView), [currentView, NAV_ITEMS, t]); 

  const renderView = () => {
    if (authLoading && !user) { // Show loading only if no user yet and auth is processing
      return <div className="flex justify-center items-center h-full"><p>{t('loading') || 'Loading...'}</p></div>;
    }
    // If not loading and no user, and not settings, show AuthModal (or ChatView with prompt)
    if (!user && !authLoading && currentView !== 'settings' && !showAuthModal) {
        // setShowAuthModal(true); // This can cause loops if AuthModal closes itself.
        // Better to let ChatView handle its display when no user.
    }


    switch (currentView) {
      case 'chat': return <ChatView user={user} onTriggerCrisisModal={() => setShowCrisisModal(true)} />;
      case 'mood': return <MoodTrackerView isPremium={isPremium} />;
      case 'journal': return <JournalView />;
      case 'exercises': return <ExercisesView isPremium={isPremium} onNavigateToPremium={() => handleNavigate('premium')} />;
      case 'therapists': return <TherapistsView />;
      case 'premium': return <PremiumView isPremium={isPremium} onSetPremium={handleSetPremium} onNavigateBack={() => setCurrentView('chat')} />;
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
              {/* Dummy trigger, actual trigger is in AppHeader */}
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
            onSignIn={() => { setShowAuthModal(true); }}
            onLogout={handleLogout}
            isMobileLayout={isMobileLayout}
            authLoading={authLoading}
        />
        <main className={`flex-1 overflow-auto ${isMobileLayout ? 'p-0 pb-6' : 'p-4 sm:px-6 sm:py-0 md:gap-8 pb-6'}`}>
          {renderView()}
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal && (!user || (user.firstName === t('anonymousUser') && user.uid.startsWith('anon-'))) && !authLoading} 
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
