
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield } from 'lucide-react'; // Using Shield for premium icon
import { useLocalization } from '@/context/LocalizationContext';
import { toast } from "@/hooks/use-toast"

interface PremiumViewProps {
  isPremium: boolean;
  onSetPremium: (isPremium: boolean) => void;
}

export function PremiumView({ isPremium, onSetPremium }: PremiumViewProps) {
  const { t } = useLocalization();

  const handleUpgrade = () => {
    onSetPremium(true);
    toast({
      title: t('premiumUpgradeSuccess'),
      description: t('appName') + " " + t('premiumMember'), // appName will be MindMate
      variant: "default", 
    });
  };

  const freePlanFeatures = (t('freePlanFeatures') as unknown as string[]).map(feat => ({ text: feat, included: true }));
  const freePlanMissingFeatures = (t('freePlanMissingFeatures') as unknown as string[]).map(feat => ({ text: feat, included: false }));
  const allFreeFeatures = [...freePlanFeatures, ...freePlanMissingFeatures];
  const premiumPlanFeaturesList = (t('premiumPlanFeatures') as unknown as string[]);


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('premiumMembershipTitle')}</h1>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('freePlan')}</CardTitle>
            <CardDescription className="text-3xl font-bold">
              UGX 0 <span className="text-sm font-normal text-muted-foreground">{t('perMonth')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-grow">
            {allFreeFeatures.map((feature, index) => (
              <div key={index} className={`flex items-center ${feature.included ? '' : 'text-muted-foreground line-through'}`}>
                <CheckCircle className={`mr-2 h-4 w-4 ${feature.included ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span>{feature.text}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={!isPremium}>
              {t('currentPlan')}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-primary bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Shield className="mr-2 h-6 w-6" />
              {t('premiumPlan')}
            </CardTitle>
            <CardDescription className="text-3xl font-bold text-primary">
              UGX 25,000 <span className="text-sm font-normal text-muted-foreground">{t('perMonth')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-grow">
            {premiumPlanFeaturesList.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {isPremium ? (
              <Button variant="default" className="w-full" disabled>
                {t('currentPlan')}
              </Button>
            ) : (
              <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleUpgrade}>
                {t('upgradeNow')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <Card className="bg-green-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400">{t('moneyBackGuarantee')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-300">{t('moneyBackGuaranteeDesc')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
