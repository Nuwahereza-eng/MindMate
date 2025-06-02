
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { auth } from '@/lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User as FirebaseUser 
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: (user: UserProfile) => void;
}

type AuthStep = "initial" | "enterPhoneNumber" | "enterVerificationCode";

export function AuthModal({ isOpen, onOpenChange, onAuthenticated }: AuthModalProps) {
  const { t } = useLocalization();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState(''); // Still present for mock email auth
  
  const [authStep, setAuthStep] = useState<AuthStep>("initial");
  const [phoneNumberForVerification, setPhoneNumberForVerification] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (isOpen && authStep === 'enterPhoneNumber' && recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          'size': 'invisible',
          'callback': () => {
            // reCAPTCHA solved, allow phone number submission
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            toast({ title: t('recaptchaExpired'), variant: 'destructive' });
            recaptchaVerifierRef.current?.clear(); // Clear the existing verifier
            recaptchaVerifierRef.current = null; // Reset ref to allow re-initialization
             // Potentially reset UI to re-trigger setupRecaptcha or show a message
          }
        });
        recaptchaVerifierRef.current = verifier;
        verifier.render().catch(err => {
          console.error("RecaptchaVerifier render error:", err);
          toast({title: t('recaptchaError'), description: err.message, variant: "destructive"});
        });
      } catch (error: any) {
          console.error("Error initializing RecaptchaVerifier:", error);
          toast({title: t('recaptchaError'), description: error.message, variant: "destructive"});
          // If initialization fails, we might need to reset the authStep
          setAuthStep("initial"); 
      }
    }
    // Cleanup on modal close or step change
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [isOpen, authStep, t]);

  const resetFormStates = () => {
    setFirstName('');
    setLastName('');
    setEmailOrPhone('');
    setPassword('');
    setAuthStep('initial');
    setPhoneNumberForVerification('');
    setVerificationCode('');
    setConfirmationResult(null);
    setIsLoadingGoogle(false);
    setIsLoadingPhone(false);
     if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
  };
  
  const handleOpenChangeWithReset = (open: boolean) => {
    if (!isLoadingGoogle && !isLoadingPhone) {
      if (!open) {
        resetFormStates();
      }
      onOpenChange(open);
    }
  };

  const isPhoneNumber = (input: string) => /^\+?[0-9\s\-()]{7,}$/.test(input);
  const formatPhoneNumber = (input: string) => {
    let digits = input.replace(/\D/g, '');
    if (!digits.startsWith('+') && digits.length > 5) { // Basic check, might need better country code logic
        if (digits.length === 10 && (digits.startsWith('7') || digits.startsWith('1'))) { // Common UG/US/CA like numbers
             // This is a heuristic. Proper E.164 formatting is complex.
             // Assuming Ugandan numbers if they start with 7 and are 9 digits after '256'
             // Or just adding '+' if it seems like an international number without it.
             // Firebase requires E.164 format like +2567...
        }
         // For simplicity, if it doesn't start with +, add it. 
         // THIS IS A VERY BASIC FORMATTING. Robust E.164 requires a library.
        if (!input.startsWith('+')) return `+${digits}`; // Needs to be more robust for country codes
    }
    return input; // Return as is if already starts with + or too short
  };


  // Handles both email/password (mock) and phone (Firebase)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    if (isPhoneNumber(emailOrPhone)) {
      // Phone Number Flow
      if (currentTab === 'register' && (!firstName.trim())) {
          toast({ title: t('firstNameRequired'), variant: "destructive"});
          return;
      }
      setPhoneNumberForVerification(formatPhoneNumber(emailOrPhone));
      setAuthStep('enterPhoneNumber'); 
      // reCAPTCHA will be set up by useEffect based on authStep change
    } else {
      // Email Flow (Mock)
      let userEmail: string | null = emailOrPhone;
      let userPhone: string | null = null; // Not used for email flow
      let profileToAuth: UserProfile;
      const newUid = `mock-${Date.now()}`;

      if (currentTab === 'login') {
        // ... (existing mock login logic remains largely the same)
        let foundStoredUser = false;
        let storedFirstName = '';
        let storedLastName = '';
        let storedJoinDate = new Date().toISOString().split('T')[0];
        let storedUid = newUid;
        const storedUserRaw = localStorage.getItem('afyasync-user');
        if (storedUserRaw) {
          try {
            const storedUser: UserProfile = JSON.parse(storedUserRaw);
            if (userEmail && storedUser.email === userEmail) {
              storedFirstName = storedUser.firstName;
              storedLastName = storedUser.lastName;
              storedJoinDate = storedUser.joinDate; 
              storedUid = storedUser.uid;
              foundStoredUser = true;
            }
          } catch (parseError) { console.error("Error parsing stored user data:", parseError); }
        }
        profileToAuth = foundStoredUser ? 
          { uid: storedUid, firstName: storedFirstName, lastName: storedLastName, email: userEmail, phone: userPhone, joinDate: storedJoinDate } :
          { uid: newUid, firstName: userEmail?.split('@')[0] || t('anonymousUser'), lastName: '', email: userEmail, phone: userPhone, joinDate: new Date().toISOString().split('T')[0] };
      } else { // register with email
        profileToAuth = {
          uid: newUid,
          firstName: firstName || (userEmail?.split('@')[0] || t('anonymousUser')),
          lastName: lastName || '',
          email: userEmail,
          phone: userPhone,
          joinDate: new Date().toISOString().split('T')[0],
        };
      }
      onAuthenticated(profileToAuth);
      handleOpenChangeWithReset(false);
    }
  };
  
  const handleSendVerificationCode = async () => {
    if (!recaptchaVerifierRef.current || !phoneNumberForVerification) {
      toast({ title: t('error'), description: t('recaptchaNotReady'), variant: "destructive" });
      return;
    }
    setIsLoadingPhone(true);
    try {
      const formattedNumber = formatPhoneNumber(phoneNumberForVerification); // Ensure E.164
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setAuthStep('enterVerificationCode');
      toast({ title: t('verificationCodeSent') });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({ title: t('errorSendingCode'), description: error.message, variant: "destructive" });
      // Reset reCAPTCHA on error if needed
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null; // Allow re-init
      setAuthStep('enterPhoneNumber'); // Go back to phone input step
    } finally {
      setIsLoadingPhone(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult || !verificationCode.trim()) return;
    setIsLoadingPhone(true);
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      if (userCredential.user) {
        const firebaseUser = userCredential.user;
        const profileFromPhoneAuth: UserProfile = {
            uid: firebaseUser.uid,
            firstName: currentTab === 'register' ? firstName : (t('anonymousUser')), // Use names if registering
            lastName: currentTab === 'register' ? lastName : '',
            email: null, // Phone auth doesn't provide email
            phone: firebaseUser.phoneNumber,
            joinDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        onAuthenticated(profileFromPhoneAuth);
        handleOpenChangeWithReset(false);
        toast({ title: t('signInSuccessPhone') });
      } else {
        throw new Error("User not found in credential.");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({ title: t('errorVerifyingCode'), description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingPhone(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in AfyaSyncApp will handle profile creation.
      handleOpenChangeWithReset(false);
      toast({ title: t('signInSuccessGoogle')});
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({ title: t('signInErrorGoogle'), description: error.message, variant: "destructive" });
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
    onAuthenticated(user);
    handleOpenChangeWithReset(false);
  };

  const renderInitialStep = () => (
    <Tabs defaultValue={currentTab} onValueChange={(value) => setCurrentTab(value as 'login' | 'register')} className="w-full">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-center text-2xl font-bold">{t('appName')}</DialogTitle>
        <DialogDescription className="text-center">{t('tagline')}</DialogDescription>
      </DialogHeader>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t('signIn')}</TabsTrigger>
        <TabsTrigger value="register">{t('signUp')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
          <div>
            <Label htmlFor="login-email-phone">{t('emailOrPhone')}</Label>
            <Input id="login-email-phone" placeholder="you@example.com / +2567..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
          </div>
          {!isPhoneNumber(emailOrPhone) && ( // Only show password for email
            <div>
              <Label htmlFor="login-password">{t('password')}</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle}>
            {isLoadingPhone ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signInWithPhone') : t('signIn'))}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
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
            <Input id="register-email-phone" placeholder="you@example.com / +2567..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
          </div>
           {!isPhoneNumber(emailOrPhone) && ( // Only show password for email
            <div>
              <Label htmlFor="register-password">{t('password')}</Label>
              <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle}>
             {isLoadingPhone ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signUpWithPhone') : t('createAccount'))}
          </Button>
        </form>
      </TabsContent>
      <div id="recaptcha-container-dummy-initial" ref={authStep !== 'enterPhoneNumber' ? recaptchaContainerRef : null} />


      <div className="mt-4 space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingGoogle || isLoadingPhone}>
          {isLoadingGoogle ? <Loader2 className="animate-spin" /> : t('continueGoogle')}
        </Button>
        {/* <Button variant="outline" className="w-full" onClick={() => alert(t('continueFacebook') + ' - Not implemented')}>{t('continueFacebook')}</Button> */}
      </div>
      <DialogFooter className="mt-4 sm:justify-center">
        <Button variant="link" onClick={handleAnonymousContinue} className="text-sm" disabled={isLoadingPhone || isLoadingGoogle}>
          {t('continueAnonymously')}
        </Button>
      </DialogFooter>
    </Tabs>
  );

  const renderEnterPhoneNumberStep = () => (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-center text-xl font-bold">{currentTab === 'register' ? t('signUpWithPhone') : t('signInWithPhone')}</DialogTitle>
        <DialogDescription className="text-center">{t('enterPhoneNumberToVerify', {phoneNumber: phoneNumberForVerification})}</DialogDescription>
      </DialogHeader>
      {currentTab === 'register' && (
        <div className="space-y-2 mb-4">
            <p><span className="font-medium">{t('firstName')}:</span> {firstName}</p>
            {lastName && <p><span className="font-medium">{t('lastName')}:</span> {lastName}</p>}
        </div>
      )}
      <p className="mb-2 text-sm"><span className="font-medium">{t('phoneNumberLabel')}:</span> {phoneNumberForVerification}</p>
      <div id="recaptcha-container" ref={recaptchaContainerRef} className="my-4"></div>
      <Button onClick={handleSendVerificationCode} className="w-full" disabled={isLoadingPhone}>
        {isLoadingPhone ? <Loader2 className="animate-spin" /> : t('sendVerificationCode')}
      </Button>
      <Button variant="link" onClick={() => { setAuthStep('initial'); if (recaptchaVerifierRef.current) { recaptchaVerifierRef.current.clear(); recaptchaVerifierRef.current = null;}} } className="mt-2 w-full">
        {t('back')}
      </Button>
    </>
  );

  const renderEnterVerificationCodeStep = () => (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle className="text-center text-xl font-bold">{t('enterVerificationCodeTitle')}</DialogTitle>
        <DialogDescription className="text-center">{t('enterVerificationCodeMessage', {phoneNumber: phoneNumberForVerification})}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="verification-code">{t('verificationCode')}</Label>
          <Input 
            id="verification-code" 
            placeholder="123456" 
            value={verificationCode} 
            onChange={(e) => setVerificationCode(e.target.value)} 
            maxLength={6}
            required 
          />
        </div>
        <Button onClick={handleVerifyCode} className="w-full" disabled={isLoadingPhone}>
          {isLoadingPhone ? <Loader2 className="animate-spin" /> : (currentTab === 'register' ? t('verifyAndCreateAccount') : t('verifyAndSignIn'))}
        </Button>
      </div>
      <Button variant="link" onClick={() => {setAuthStep('enterPhoneNumber'); setVerificationCode('');}} className="mt-2 w-full">
        {t('back')}
      </Button>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        {authStep === 'initial' && renderInitialStep()}
        {authStep === 'enterPhoneNumber' && renderEnterPhoneNumberStep()}
        {authStep === 'enterVerificationCode' && renderEnterVerificationCodeStep()}
      </DialogContent>
    </Dialog>
  );
}
