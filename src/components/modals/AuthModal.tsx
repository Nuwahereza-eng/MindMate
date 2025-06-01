
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

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: (user: UserProfile) => void;
}

export function AuthModal({ isOpen, onOpenChange, onAuthenticated }: AuthModalProps) {
  const { t } = useLocalization();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault();
    
    let userEmail: string | null = null;
    let userPhone: string | null = null;

    if (emailOrPhone.includes('@')) {
      userEmail = emailOrPhone;
    } else {
      userPhone = emailOrPhone;
    }

    let profileToAuth: UserProfile;

    if (mode === 'login') {
      let foundStoredUser = false;
      let storedFirstName = '';
      let storedLastName = '';
      let storedJoinDate = new Date().toISOString().split('T')[0];

      const storedUserRaw = localStorage.getItem('afyasync-user');
      if (storedUserRaw) {
        try {
          const storedUser: UserProfile = JSON.parse(storedUserRaw);
          const emailMatch = userEmail && storedUser.email === userEmail;
          const phoneMatch = userPhone && storedUser.phone === userPhone;

          if (emailMatch || phoneMatch) {
            storedFirstName = storedUser.firstName;
            storedLastName = storedUser.lastName;
            storedJoinDate = storedUser.joinDate; // Use original join date
            foundStoredUser = true;
          }
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
        }
      }

      if (foundStoredUser) {
        profileToAuth = {
          firstName: storedFirstName,
          lastName: storedLastName,
          email: userEmail,
          phone: userPhone,
          joinDate: storedJoinDate,
        };
      } else {
        // Fallback if no stored user matches or exists
        profileToAuth = {
          firstName: userEmail?.split('@')[0] || userPhone || t('anonymousUser'),
          lastName: '',
          email: userEmail,
          phone: userPhone,
          joinDate: new Date().toISOString().split('T')[0],
        };
      }
    } else { // mode === 'register'
      profileToAuth = {
        firstName: firstName || (userEmail?.split('@')[0] || userPhone || t('anonymousUser')),
        lastName: lastName || '',
        email: userEmail,
        phone: userPhone,
        joinDate: new Date().toISOString().split('T')[0],
      };
    }
    
    onAuthenticated(profileToAuth);
    onOpenChange(false);
    // Reset form fields
    setFirstName('');
    setLastName('');
    setEmailOrPhone('');
    setPassword('');
  };

  const handleAnonymousContinue = () => {
    const user: UserProfile = {
      firstName: t('anonymousUser'),
      lastName: '',
      email: null,
      phone: null,
      joinDate: new Date().toISOString().split('T')[0],
    };
    onAuthenticated(user);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-4 py-4">
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
            <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4 py-4">
              <div>
                <Label htmlFor="register-firstname">{t('firstName')}</Label>
                <Input id="register-firstname" placeholder={t('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="register-lastname">{t('lastName')}</Label>
                <Input id="register-lastname" placeholder={t('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
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
            <Button variant="outline" className="w-full" onClick={() => alert(t('continueGoogle') + ' - Not implemented')}>{t('continueGoogle')}</Button>
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
