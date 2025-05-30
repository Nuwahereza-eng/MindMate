"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, AlertTriangle } from 'lucide-react';
import { useLocalization } from '@/context/LocalizationContext';
import { EMERGENCY_CONTACTS } from '@/lib/constants';

interface CrisisModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CrisisModal({ isOpen, onOpenChange }: CrisisModalProps) {
  const { t } = useLocalization();

  const handleCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-6 w-6" />
            {t('crisisSupportTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('crisisSupportMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 my-4">
          <Button 
            variant="destructive" 
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => handleCall(EMERGENCY_CONTACTS.uganda)}
          >
            <Phone className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{t('ugandaCrisisLine')}</p>
              <p className="text-sm">{EMERGENCY_CONTACTS.uganda}</p>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => handleCall(EMERGENCY_CONTACTS.international)}
          >
            <Phone className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{t('internationalCrisisLine')}</p>
              <p className="text-sm">{EMERGENCY_CONTACTS.international}</p>
            </div>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>{t('continueChat')}</AlertDialogCancel>
          {/* The call buttons are now primary actions above */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
