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
  DialogClose,
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault();
    // Simulate authentication
    const userName = mode === 'register' && name ? name : email.split('@')[0] || t('anonymousUser');
    const user: UserProfile = {
      name: userName,
      email: email,
      joinDate: new Date().toISOString().split('T')[0],
    };
    onAuthenticated(user);
    onOpenChange(false);
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleAnonymousContinue = () => {
    const user: UserProfile = {
      name: t('anonymousUser'),
      email: null,
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
                <Label htmlFor="login-email">{t('email')}</Label>
                <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
                <Label htmlFor="register-name">{t('fullName')}</Label>
                <Input id="register-name" placeholder={t('fullName')} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="register-email">{t('email')}</Label>
                <Input id="register-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
