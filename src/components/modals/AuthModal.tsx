
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalization } from '@/context/LocalizationContext';
import type { UserProfile } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: (user: UserProfile) => void; // Still used for non-Firebase auth methods
}

export function AuthModal({ isOpen, onOpenChange, onAuthenticated }: AuthModalProps) {
  const { t } = useLocalization();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // This handler is for the mock email/password auth
  const handleManualAuth = (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault();
    
    let userEmail: string | null = null;
    let userPhone: string | null = null;

    if (emailOrPhone.includes('@')) {
      userEmail = emailOrPhone;
    } else {
      userPhone = emailOrPhone;
    }

    let profileToAuth: UserProfile;
    const newUid = `mock-${Date.now()}`; // Create a mock UID

    if (mode === 'login') {
      let foundStoredUser = false;
      let storedFirstName = '';
      let storedLastName = '';
      let storedJoinDate = new Date().toISOString().split('T')[0];
      let storedUid = newUid;


      const storedUserRaw = localStorage.getItem('afyasync-user');
      if (storedUserRaw) {
        try {
          const storedUser: UserProfile = JSON.parse(storedUserRaw);
          const emailMatch = userEmail && storedUser.email === userEmail;
          const phoneMatch = userPhone && storedUser.phone === userPhone;

          if (emailMatch || phoneMatch) {
            storedFirstName = storedUser.firstName;
            storedLastName = storedUser.lastName;
            storedJoinDate = storedUser.joinDate; 
            storedUid = storedUser.uid;
            foundStoredUser = true;
          }
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
        }
      }

      if (foundStoredUser) {
        profileToAuth = {
          uid: storedUid,
          firstName: storedFirstName,
          lastName: storedLastName,
          email: userEmail,
          phone: userPhone,
          joinDate: storedJoinDate,
        };
      } else {
        profileToAuth = {
          uid: newUid,
          firstName: userEmail?.split('@')[0] || userPhone || t('anonymousUser'),
          lastName: '',
          email: userEmail,
          phone: userPhone,
          joinDate: new Date().toISOString().split('T')[0],
        };
      }
    } else { // mode === 'register'
      profileToAuth = {
        uid: newUid,
        firstName: firstName || (userEmail?.split('@')[0] || userPhone || t('anonymousUser')),
        lastName: lastName || '',
        email: userEmail,
        phone: userPhone,
        joinDate: new Date().toISOString().split('T')[0],
      };
    }
    
    onAuthenticated(profileToAuth); // This sets the user state in AfyaSyncApp for mock auth
    onOpenChange(false);
    setFirstName('');
    setLastName('');
    setEmailOrPhone('');
    setPassword('');
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in AfyaSyncApp will handle setting the user profile
      onOpenChange(false); // Close modal on success
      toast({ title: t('signInSuccessGoogle') || "Signed in with Google successfully!"});
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({ title: t('signInErrorGoogle') || "Google Sign-In Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleAnonymousContinue = () => {
    const user: UserProfile = {
      uid: `anon-${Date.now()}`,
      firstName: t('anonymousUser'),
      lastName: '',
      email: null,
      phone: null,
      joinDate: new Date().toISOString().split('T')[0],
    };
    onAuthenticated(user); // This sets the user state in AfyaSyncApp for anonymous
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoadingGoogle) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="login" className="w-full">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-2xl font-bold">
                {t('appName')}
            </DialogTitle>
             <DialogDescription className="text-center">
                {t('tagline')}
            </DialogDescription>
          </DialogHeader>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('signIn')}</TabsTrigger>
            <TabsTrigger value="register">{t('signUp')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={(e) => handleManualAuth(e, 'login')} className="space-y-4 py-4">
              <div>
                <Label htmlFor="login-email-phone">{t('emailOrPhone')}</Label>
                <Input id="login-email-phone" placeholder="you@example.com / 07..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="login-password">{t('password')}</Label>
                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">{t('signIn')}</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={(e) => handleManualAuth(e, 'register')} className="space-y-4 py-4">
              <div>
                <Label htmlFor="register-firstname">{t('firstName')}</Label>
                <Input id="register-firstname" placeholder={t('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="register-lastname">{t('lastName')}</Label>
                <Input id="register-lastname" placeholder={t('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="register-email-phone">{t('emailOrPhone')}</Label>
                <Input id="register-email-phone" placeholder="you@example.com / 07..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="register-password">{t('password')}</Label>
                <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">{t('createAccount')}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingGoogle}>
              {isLoadingGoogle ? (t('loading') || 'Loading...') : t('continueGoogle')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => alert(t('continueFacebook') + ' - Not implemented')}>{t('continueFacebook')}</Button>
        </div>
        <DialogFooter className="mt-4 sm:justify-center">
            <Button variant="link" onClick={handleAnonymousContinue} className="text-sm">
                {t('continueAnonymously')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
