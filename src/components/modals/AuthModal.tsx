
"use client";

import React,
{
  useState,
  useEffect,
  useRef
} from 'react';
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
import { auth } from '@/lib/firebase'; // Ensure this path is correct
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: (user: UserProfile) => void;
}

type AuthStep = "initial" | "enterPhoneNumber" | "enterVerificationCode";
const USER_PROFILE_STORAGE_KEY_PREFIX = 'afyasync-userProfile-';

export function AuthModal({ isOpen, onOpenChange, onAuthenticated }: AuthModalProps) {
  const { t } = useLocalization();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const [authStep, setAuthStep] = useState<AuthStep>("initial");
  const [phoneNumberForVerification, setPhoneNumberForVerification] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const goToStep = (newStep: AuthStep) => {
    if (authStep === 'enterPhoneNumber' && newStep !== 'enterPhoneNumber') {
        // Clear verifier if navigating away from phone step, so it re-initializes if we come back
        if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
        }
        setIsRecaptchaReady(false);
    }
    setAuthStep(newStep);
  };


  useEffect(() => {
    const cleanupRecaptcha = () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = ''; 
      }
      setIsRecaptchaReady(false);
    };

    if (isOpen && authStep === 'enterPhoneNumber') {
      if (!recaptchaVerifierRef.current) { // Only initialize if it's not already there or has been cleared
        console.log("AuthModal: Attempting to initialize reCAPTCHA.");
        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = ''; 
          try {
            const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
              'size': 'invisible',
              'callback': (response: any) => {
                console.log("AuthModal: reCAPTCHA solved (invisible callback):", response);
                setIsRecaptchaReady(true);
              },
              'expired-callback': () => {
                toast({ title: t('recaptchaExpired'), description: t('tryAgainLater'), variant: 'destructive' });
                cleanupRecaptcha();
                // Consider forcing a UI reset or a specific error message for UX
              },
              'error-callback': (error: any) => {
                  console.error("AuthModal: reCAPTCHA error-callback:", error);
                  toast({ title: t('recaptchaError'), description: (error.message || t('tryAgainLater')), variant: 'destructive' });
                  cleanupRecaptcha();
                }
            });
            
            verifier.render()
              .then((widgetId) => {
                console.log("AuthModal: reCAPTCHA rendered, widgetId:", widgetId);
                recaptchaVerifierRef.current = verifier;
                setIsRecaptchaReady(true); // For invisible, render success often means it's ready.
              })
              .catch(renderError => {
                console.error("AuthModal: RecaptchaVerifier.render() error:", renderError);
                toast({title: t('recaptchaError'), description: (renderError.message || t('tryAgainLater')), variant: "destructive"});
                cleanupRecaptcha();
              });

          } catch (initError: any) {
              console.error("AuthModal: Error initializing RecaptchaVerifier instance:", initError);
              toast({title: t('recaptchaError'), description: (initError.message || t('tryAgainLater')), variant: "destructive"});
              cleanupRecaptcha();
          }
        } else {
           console.warn("AuthModal: reCAPTCHA container ref not available when trying to initialize.");
           // This case should ideally not happen if the DOM is structured correctly.
        }
      } else if (recaptchaVerifierRef.current && !isRecaptchaReady) {
        // If verifier exists but not marked ready, it might be an old instance or an error occurred. Try to re-render or mark ready.
        // This path needs careful consideration; for now, we assume if ref.current exists, it should become ready via callback or render().
        // Forcing setIsRecaptchaReady(true) here if ref.current exists could be an option if callback isn't firing.
      }
    } else if (!isOpen || authStep !== 'enterPhoneNumber') {
      cleanupRecaptcha();
    }

    return () => {
      // This cleanup runs when the component unmounts or dependencies change.
      // It's crucial for preventing memory leaks or reCAPTCHA conflicts.
      cleanupRecaptcha();
    };
  }, [isOpen, authStep, t, auth]);


  const resetFormStates = () => {
    setFirstName('');
    setLastName('');
    setEmailOrPhone('');
    setPassword('');
    goToStep('initial');
    setPhoneNumberForVerification('');
    setVerificationCode('');
    setConfirmationResult(null);
    setIsLoadingGoogle(false);
    setIsLoadingPhone(false);
    // isRecaptchaReady will be reset by goToStep or useEffect cleanup
  };
  
  const handleOpenChangeWithReset = (open: boolean) => {
    if (!isLoadingGoogle && !isLoadingPhone) { // Prevent closing if an auth operation is in progress
      if (!open) {
        resetFormStates(); 
      }
      onOpenChange(open);
    }
  };


  const isPhoneNumber = (input: string) => /^\+?[0-9\s\-()]{7,}$/.test(input);
  const formatPhoneNumber = (input: string) => {
    let digits = input.replace(/\D/g, '');
    if (!input.startsWith('+') && digits.length > 0) {
        return `+${digits}`;
    }
    return input.startsWith('+') ? `+${digits}` : input; 
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    if (isPhoneNumber(emailOrPhone)) {
      if (currentTab === 'register' && (!firstName.trim())) {
          toast({ title: t('firstNameRequired'), variant: "destructive"});
          return;
      }
      const formattedNum = formatPhoneNumber(emailOrPhone);
      if (!formattedNum || !/^\+[1-9]\d{1,14}$/.test(formattedNum)) { 
          toast({ title: t('invalidPhoneNumberFormatE164'), description: t('ensureE164Format'), variant: "destructive"});
          return;
      }
      setPhoneNumberForVerification(formattedNum);
      goToStep('enterPhoneNumber'); 
    } else { 
      let userEmail: string | null = emailOrPhone;
      let userPhone: string | null = null;
      let profileToAuth: UserProfile;
      const newUid = `mock-${Date.now()}`;

      if (currentTab === 'login') {
        let foundStoredUser = false;
        let storedFirstName = '';
        let storedLastName = '';
        let storedJoinDate = new Date().toISOString();
        let storedUid = newUid; 

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(USER_PROFILE_STORAGE_KEY_PREFIX)) {
                try {
                    const storedUser: UserProfile = JSON.parse(localStorage.getItem(key)!);
                    if (userEmail && storedUser.email === userEmail) {
                        storedFirstName = storedUser.firstName;
                        storedLastName = storedUser.lastName;
                        storedJoinDate = storedUser.joinDate; 
                        storedUid = storedUser.uid; 
                        foundStoredUser = true;
                    }
                } catch (parseError) { console.error("Error parsing stored user data:", parseError); }
            }
        });
        
        profileToAuth = foundStoredUser ? 
          { uid: storedUid, firstName: storedFirstName, lastName: storedLastName, email: userEmail, phone: userPhone, joinDate: storedJoinDate } :
          { uid: newUid, firstName: userEmail?.split('@')[0] || t('user'), lastName: '', email: userEmail, phone: userPhone, joinDate: new Date().toISOString() };

      } else { 
        profileToAuth = {
          uid: newUid,
          firstName: firstName || (userEmail?.split('@')[0] || t('user')),
          lastName: lastName || '',
          email: userEmail,
          phone: userPhone,
          joinDate: new Date().toISOString(),
        };
      }
      onAuthenticated(profileToAuth);
      handleOpenChangeWithReset(false);
    }
  };
  
  const handleSendVerificationCode = async () => {
    if (!recaptchaVerifierRef.current || !isRecaptchaReady) {
      toast({ title: t('recaptchaError'), description: t('recaptchaNotReadyOrFailedShort'), variant: "destructive" });
      // Attempt to re-init reCAPTCHA by resetting state
      if(recaptchaVerifierRef.current) recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
      setIsRecaptchaReady(false);
      // setAuthStep('enterPhoneNumber'); // This will re-trigger the useEffect
      return;
    }
    setIsLoadingPhone(true);
    console.log("AuthModal: Attempting to send verification code to", phoneNumberForVerification);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumberForVerification, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      goToStep('enterVerificationCode');
      toast({ title: t('verificationCodeSent') });
    } catch (error: any) {
      console.error("AuthModal: Error sending verification code:", error);
      let errorMessage = error.message || t('tryAgainLater');
      let errorTitle = t('errorSendingCode');

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = t('invalidPhoneNumberFirebase');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('tooManyRequestsFirebase');
      } else if (error.code === 'auth/network-request-failed') {
        errorTitle = t('networkError');
        errorMessage = t('checkYourConnection');
      }
      
      toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
      
      // Critical: Reset reCAPTCHA on failure to allow retry
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear(); 
        recaptchaVerifierRef.current = null;
      }
      setIsRecaptchaReady(false);
      goToStep('enterPhoneNumber'); // Go back to phone input step, this will re-trigger reCAPTCHA setup in useEffect
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
            firstName: (currentTab === 'register' && firstName) ? firstName : (firebaseUser.displayName || t('user')), 
            lastName: (currentTab === 'register' && lastName) ? lastName : '',
            email: firebaseUser.email, 
            phone: firebaseUser.phoneNumber,
            joinDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        onAuthenticated(profileFromPhoneAuth);
        handleOpenChangeWithReset(false); 
        toast({ title: t('signInSuccessPhone') });
      } else {
        throw new Error("User not found in credential after phone auth confirmation.");
      }
    } catch (error: any) {
      console.error("AuthModal: Error verifying code:", error);
      let errorMessage = error.message || t('tryAgainLater');
      if (error.code === 'auth/invalid-verification-code') {
         errorMessage = t('invalidVerificationCodeFirebase');
      } else if (error.code === 'auth/code-expired') {
         errorMessage = t('codeExpiredFirebase');
      }
      toast({ title: t('errorVerifyingCode'), description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingPhone(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      handleOpenChangeWithReset(false);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({ title: t('signInErrorGoogle'), description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingGoogle(false);
    }
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
          {!isPhoneNumber(emailOrPhone) && (
            <div>
              <Label htmlFor="login-password">{t('password')}</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle || !emailOrPhone.trim()}>
            {(isLoadingPhone && isPhoneNumber(emailOrPhone)) ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signInWithPhone') : t('signIn'))}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
          <div>
            <Label htmlFor="register-firstname">{t('firstName')}</Label>
            <Input id="register-firstname" placeholder={t('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required={isPhoneNumber(emailOrPhone) || !emailOrPhone.includes('@')} />
          </div>
          <div>
            <Label htmlFor="register-lastname">{t('lastName')}</Label>
            <Input id="register-lastname" placeholder={t('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="register-email-phone">{t('emailOrPhone')}</Label>
            <Input id="register-email-phone" placeholder="you@example.com / +2567..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
          </div>
           {!isPhoneNumber(emailOrPhone) && ( 
            <div>
              <Label htmlFor="register-password">{t('password')}</Label>
              <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle || !emailOrPhone.trim() || (isPhoneNumber(emailOrPhone) && !firstName.trim())}>
             {(isLoadingPhone && isPhoneNumber(emailOrPhone)) ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signUpWithPhone') : t('createAccount'))}
          </Button>
        </form>
      </TabsContent>
      
      <div className="mt-4 space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingGoogle || isLoadingPhone}>
          {isLoadingGoogle ? <Loader2 className="animate-spin" /> : t('continueGoogle')}
        </Button>
      </div>
      <DialogFooter className="mt-4 sm:justify-center" />
    </Tabs>
  );

  const renderEnterPhoneNumberStep = () => (
    <>
      <DialogHeader className="mb-4">
        <Button variant="ghost" size="icon" onClick={() => { goToStep('initial'); setEmailOrPhone(phoneNumberForVerification); }} className="absolute left-4 top-4">
           &larr; <span className="sr-only">{t('back')}</span>
        </Button>
        <DialogTitle className="text-center text-xl font-bold pt-8">{currentTab === 'register' ? t('signUpWithPhone') : t('signInWithPhone')}</DialogTitle>
        <DialogDescription className="text-center">{t('enterPhoneNumberToVerifyE164', {phoneNumber: phoneNumberForVerification})}</DialogDescription>
      </DialogHeader>
      {currentTab === 'register' && (
        <div className="space-y-1 mb-3 text-sm text-center">
            <p><span className="font-medium">{t('firstName')}:</span> {firstName}</p>
            {lastName && <p><span className="font-medium">{t('lastName')}:</span> {lastName}</p>}
        </div>
      )}
      <p className="mb-3 text-sm text-center"><span className="font-medium">{t('phoneNumberLabel')}:</span> {phoneNumberForVerification}</p>
      <div id="recaptcha-container-phone" ref={recaptchaContainerRef} className="my-4">
      </div>
      <Button onClick={handleSendVerificationCode} className="w-full" disabled={isLoadingPhone || !isRecaptchaReady}>
        {isLoadingPhone ? <Loader2 className="animate-spin" /> : t('sendVerificationCode')}
      </Button>
    </>
  );

  const renderEnterVerificationCodeStep = () => (
    <>
       <DialogHeader className="mb-4">
        <Button variant="ghost" size="icon" onClick={() => {goToStep('enterPhoneNumber'); setVerificationCode(''); }} className="absolute left-4 top-4">
            &larr; <span className="sr-only">{t('back')}</span>
        </Button>
        <DialogTitle className="text-center text-xl font-bold pt-8">{t('enterVerificationCodeTitle')}</DialogTitle>
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
            type="tel" 
          />
        </div>
        <Button onClick={handleVerifyCode} className="w-full" disabled={isLoadingPhone || verificationCode.length !== 6}>
          {isLoadingPhone ? <Loader2 className="animate-spin" /> : (currentTab === 'register' ? t('verifyAndCreateAccount') : t('verifyAndSignIn'))}
        </Button>
      </div>
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

