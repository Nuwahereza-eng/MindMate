
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
  const [password, setPassword] = useState(''); // Keep password for mock email/pass

  const [authStep, setAuthStep] = useState<AuthStep>("initial");
  const [phoneNumberForVerification, setPhoneNumberForVerification] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'register'>('login');

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Effect for reCAPTCHA setup and cleanup
  useEffect(() => {
    const cleanupRecaptcha = () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear(); // Clear the reCAPTCHA widget
        recaptchaVerifierRef.current = null;
      }
      // It's generally not recommended to manipulate innerHTML directly like this
      // unless absolutely necessary, as it can interfere with React's rendering.
      // Firebase's clear() method should suffice.
      // if (recaptchaContainerRef.current) {
      //   recaptchaContainerRef.current.innerHTML = '';
      // }
    };

    if (isOpen && authStep === 'enterPhoneNumber') {
      if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
        // Ensure the container is clean before rendering a new reCAPTCHA.
        // recaptchaContainerRef.current.innerHTML = ''; 
        try {
          const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
              // This callback is usually for when the reCAPTCHA is explicitly solved by the user,
              // but for invisible, it means it's ready.
              // console.log("reCAPTCHA solved via callback:", response);
              // No need to call handleSendVerificationCode here, it's called on button click.
            },
            'expired-callback': () => {
              // Response expired. Ask user to solve reCAPTCHA again.
              toast({ title: t('recaptchaExpired'), variant: 'destructive' });
              cleanupRecaptcha(); // Cleanup and allow re-initialization
            },
            'error-callback': (error: any) => {
                console.error("reCAPTCHA error-callback:", error);
                toast({ title: t('recaptchaError'), description: t('tryAgainLater') || 'Please try again later.', variant: 'destructive' });
                cleanupRecaptcha();
              }
          });
          
          // Render the reCAPTCHA verifier.
          // This promise resolves when the reCAPTCHA is ready.
          verifier.render()
            .then((widgetId) => {
              // console.log("reCAPTCHA rendered, widgetId:", widgetId);
              recaptchaVerifierRef.current = verifier;
            })
            .catch(err => {
              console.error("RecaptchaVerifier render error:", err);
              toast({title: t('recaptchaError'), description: (err.message || t('tryAgainLater') || 'Please try again later.'), variant: "destructive"});
              cleanupRecaptcha();
              setAuthStep("initial"); // Fallback to initial step on critical reCAPTCHA error
            });

        } catch (error: any) {
            // This catch is for errors during new RecaptchaVerifier() itself
            console.error("Error initializing RecaptchaVerifier:", error);
            toast({title: t('recaptchaError'), description: (error.message || t('tryAgainLater') || 'Please try again later.'), variant: "destructive"});
            cleanupRecaptcha();
            setAuthStep("initial"); // Fallback
        }
      }
    } else {
      // If modal is closed or not in phone step, ensure reCAPTCHA is cleaned up
      cleanupRecaptcha();
    }

    // Cleanup function for when the component unmounts or dependencies change
    return () => {
      cleanupRecaptcha();
    };
  // Dependencies: isOpen, authStep, t (for toasts), auth (stable Firebase import)
  // Adding `auth` ensures that if the Firebase app instance were to change (highly unlikely in SPAs), it would re-run.
  }, [isOpen, authStep, t, auth]);


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
    // Ensure reCAPTCHA is cleared during form reset
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
    // if (recaptchaContainerRef.current) {
    //    recaptchaContainerRef.current.innerHTML = ''; // Clear container
    // }
  };
  
  const handleOpenChangeWithReset = (open: boolean) => {
    // Prevent closing if loading, unless explicitly intended by a successful auth.
    // This logic might need refinement based on how "success" signals open=false.
    if (!isLoadingGoogle && !isLoadingPhone) {
      if (!open) {
        resetFormStates(); // Reset all states when dialog is closed
      }
      onOpenChange(open);
    }
  };


  const isPhoneNumber = (input: string) => /^\+?[0-9\s\-()]{7,}$/.test(input);
  const formatPhoneNumber = (input: string) => {
    // Basic formatting: remove non-digits, ensure '+' prefix.
    // This is a simplified version. For robust international phone number validation/formatting,
    // consider libraries like 'libphonenumber-js'.
    let digits = input.replace(/\D/g, '');
    if (!input.startsWith('+')) {
        // Firebase requires E.164 format. If it's likely a local number,
        // this might need a country code. For now, just prepending '+' if missing.
        // Example: If user types "2567...", it becomes "+2567...".
        // This is a common heuristic but not foolproof.
        return `+${digits}`;
    }
    return input; // Assuming it's already somewhat E.164 or starts with +
  };

  // Submit for Email/Password (Mock) or initiate Phone Auth
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    if (isPhoneNumber(emailOrPhone)) {
      // Phone number path
      if (currentTab === 'register' && (!firstName.trim())) {
          toast({ title: t('firstNameRequired'), variant: "destructive"});
          return;
      }
      const formattedNum = formatPhoneNumber(emailOrPhone);
      setPhoneNumberForVerification(formattedNum);
      setAuthStep('enterPhoneNumber'); // Go to phone number entry step to trigger reCAPTCHA
      // reCAPTCHA will be initialized by the useEffect for 'enterPhoneNumber' step
    } else {
      // Email/Password (mock) path
      let userEmail: string | null = emailOrPhone;
      let userPhone: string | null = null;
      let profileToAuth: UserProfile;
      const newUid = `mock-${Date.now()}`;

      if (currentTab === 'login') {
        // Try to find a "registered" user in localStorage by email (mock behavior)
        let foundStoredUser = false;
        let storedFirstName = '';
        let storedLastName = '';
        let storedJoinDate = new Date().toISOString().split('T')[0];
        let storedUid = newUid; // Default to new mock UID

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('afyasync-userProfile-')) { // Using new UID-keyed storage
                try {
                    const storedUser: UserProfile = JSON.parse(localStorage.getItem(key)!);
                    if (userEmail && storedUser.email === userEmail) {
                        storedFirstName = storedUser.firstName;
                        storedLastName = storedUser.lastName;
                        storedJoinDate = storedUser.joinDate; 
                        storedUid = storedUser.uid; // Use the stored UID
                        foundStoredUser = true;
                    }
                } catch (parseError) { console.error("Error parsing stored user data:", parseError); }
            }
        });
        
        profileToAuth = foundStoredUser ? 
          { uid: storedUid, firstName: storedFirstName, lastName: storedLastName, email: userEmail, phone: userPhone, joinDate: storedJoinDate } :
          { uid: newUid, firstName: userEmail?.split('@')[0] || t('anonymousUser'), lastName: '', email: userEmail, phone: userPhone, joinDate: new Date().toISOString().split('T')[0] };

      } else { // Register tab for email/password (mock)
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
      handleOpenChangeWithReset(false); // Close modal
    }
  };
  
  const handleSendVerificationCode = async () => {
    if (!recaptchaVerifierRef.current) {
      // This might happen if reCAPTCHA failed to render or was cleared due to an error.
      toast({ title: t('recaptchaError'), description: t('recaptchaNotReadyOrFailed'), variant: "destructive" });
      // Attempt to re-trigger reCAPTCHA initialization by resetting step,
      // which will cause useEffect to run again.
      setAuthStep('initial'); // Go back to allow re-trigger
      setTimeout(() => setAuthStep('enterPhoneNumber'), 50); // Then quickly return
      return;
    }
    setIsLoadingPhone(true);
    try {
      // Phone number is already formatted and stored in phoneNumberForVerification
      const confirmation = await signInWithPhoneNumber(auth, phoneNumberForVerification, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setAuthStep('enterVerificationCode');
      toast({ title: t('verificationCodeSent') });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({ title: t('errorSendingCode'), description: error.message, variant: "destructive" });
      // Reset reCAPTCHA on error, this will be handled by the effect cleanup and re-init
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      // Potentially setAuthStep back to 'enterPhoneNumber' or 'initial' to allow re-attempt
      setAuthStep('enterPhoneNumber'); // Stay on phone input step to allow re-attempt
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
        // Construct profile. If it was a 'register' flow, use entered names.
        const profileFromPhoneAuth: UserProfile = {
            uid: firebaseUser.uid,
            // Use firstName/lastName from state if this was part of a "register" tab phone flow
            firstName: (currentTab === 'register' && firstName) ? firstName : (t('anonymousUser')), 
            lastName: (currentTab === 'register' && lastName) ? lastName : '',
            email: null, // Phone auth doesn't provide email
            phone: firebaseUser.phoneNumber,
            joinDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        onAuthenticated(profileFromPhoneAuth);
        handleOpenChangeWithReset(false); // Close modal on success
        toast({ title: t('signInSuccessPhone') });
      } else {
        // Should not happen if confirm() resolves, but good to be defensive
        throw new Error("User not found in credential after phone auth confirmation.");
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
      // No need to call onAuthenticated here for Google.
      // The onAuthStateChanged listener in AfyaSyncApp will handle it.
      await signInWithPopup(auth, provider);
      // If signInWithPopup is successful, onAuthStateChanged will fire.
      // The toast for success can be handled globally there or here.
      // toast({ title: t('signInSuccessGoogle')}); // Optional: local success message
      handleOpenChangeWithReset(false); // Close modal
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
      joinDate: new Date().toISOString(), // Use full ISO string
    };
    onAuthenticated(user);
    handleOpenChangeWithReset(false); // Close modal
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
      
      {/* Login Tab Content (Mock Email/Pass or Phone) */}
      <TabsContent value="login">
        <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
          <div>
            <Label htmlFor="login-email-phone">{t('emailOrPhone')}</Label>
            <Input id="login-email-phone" placeholder="you@example.com / +2567..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
          </div>
          {/* Conditionally show password if not a phone number */}
          {!isPhoneNumber(emailOrPhone) && (
            <div>
              <Label htmlFor="login-password">{t('password')}</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle}>
            {isLoadingPhone && isPhoneNumber(emailOrPhone) ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signInWithPhone') : t('signIn'))}
          </Button>
        </form>
      </TabsContent>

      {/* Register Tab Content (Mock Email/Pass or Phone) */}
      <TabsContent value="register">
        <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
          {/* Name fields are relevant for email/pass mock OR phone registration */}
          <div>
            <Label htmlFor="register-firstname">{t('firstName')}</Label>
            <Input id="register-firstname" placeholder={t('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required={isPhoneNumber(emailOrPhone)} />
          </div>
          <div>
            <Label htmlFor="register-lastname">{t('lastName')}</Label>
            <Input id="register-lastname" placeholder={t('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="register-email-phone">{t('emailOrPhone')}</Label>
            <Input id="register-email-phone" placeholder="you@example.com / +2567..." value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
          </div>
           {/* Conditionally show password if not a phone number */}
           {!isPhoneNumber(emailOrPhone) && ( 
            <div>
              <Label htmlFor="register-password">{t('password')}</Label>
              <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoadingPhone || isLoadingGoogle}>
             {isLoadingPhone && isPhoneNumber(emailOrPhone) ? <Loader2 className="animate-spin" /> : (isPhoneNumber(emailOrPhone) ? t('signUpWithPhone') : t('createAccount'))}
          </Button>
        </form>
      </TabsContent>
      
      <div className="mt-4 space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingGoogle || isLoadingPhone}>
          {isLoadingGoogle ? <Loader2 className="animate-spin" /> : t('continueGoogle')}
        </Button>
        {/* Facebook Sign-In (Placeholder/Not Implemented) */}
        {/* <Button variant="outline" className="w-full" onClick={() => alert('Facebook Sign-In not implemented')} disabled={isLoadingGoogle || isLoadingPhone}>{t('continueFacebook')}</Button> */}
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
        {/* Back button to return to initial step */}
        <Button variant="ghost" size="icon" onClick={() => { setAuthStep('initial'); /* reCAPTCHA cleanup handled by useEffect */ }} className="absolute left-4 top-4">
           {/* Assuming you have a "Back" icon or use text */}
           &larr; <span className="sr-only">{t('back')}</span>
        </Button>
        <DialogTitle className="text-center text-xl font-bold pt-8">{currentTab === 'register' ? t('signUpWithPhone') : t('signInWithPhone')}</DialogTitle>
        <DialogDescription className="text-center">{t('enterPhoneNumberToVerify', {phoneNumber: phoneNumberForVerification})}</DialogDescription>
      </DialogHeader>
      {/* Display names if it's a registration flow */}
      {currentTab === 'register' && (
        <div className="space-y-1 mb-3 text-sm text-center">
            <p><span className="font-medium">{t('firstName')}:</span> {firstName}</p>
            {lastName && <p><span className="font-medium">{t('lastName')}:</span> {lastName}</p>}
        </div>
      )}
      <p className="mb-3 text-sm text-center"><span className="font-medium">{t('phoneNumberLabel')}:</span> {phoneNumberForVerification}</p>
      {/* This div is where the invisible reCAPTCHA will anchor itself */}
      <div id="recaptcha-container-phone" ref={recaptchaContainerRef} className="my-4 h-1 flex justify-center items-center">
        {/* Content inside this div might be replaced by reCAPTCHA; keep it minimal or expect replacement */}
      </div>
      <Button onClick={handleSendVerificationCode} className="w-full" disabled={isLoadingPhone}>
        {isLoadingPhone ? <Loader2 className="animate-spin" /> : t('sendVerificationCode')}
      </Button>
    </>
  );

  const renderEnterVerificationCodeStep = () => (
    <>
       <DialogHeader className="mb-4">
        {/* Back button to return to phone number entry */}
        <Button variant="ghost" size="icon" onClick={() => {setAuthStep('enterPhoneNumber'); setVerificationCode(''); /* No need to clear main recaptcha here, it's tied to the step */ }} className="absolute left-4 top-4">
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
            type="tel" // Use "tel" for numeric keyboard on mobile
          />
        </div>
        <Button onClick={handleVerifyCode} className="w-full" disabled={isLoadingPhone}>
          {isLoadingPhone ? <Loader2 className="animate-spin" /> : (currentTab === 'register' ? t('verifyAndCreateAccount') : t('verifyAndSignIn'))}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Removed dummy div for initial reCAPTCHA, only one container used now */}
        {authStep === 'initial' && renderInitialStep()}
        {authStep === 'enterPhoneNumber' && renderEnterPhoneNumberStep()}
        {authStep === 'enterVerificationCode' && renderEnterVerificationCodeStep()}
      </DialogContent>
    </Dialog>
  );
}
