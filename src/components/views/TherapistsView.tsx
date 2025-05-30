"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { useLocalization } from '@/context/LocalizationContext';
import { MOCK_THERAPISTS } from '@/lib/constants';

export function TherapistsView() {
  const { t } = useLocalization();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('therapistsTitle')}</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_THERAPISTS.map((therapist) => (
          <Card key={therapist.id}>
            <CardHeader className="items-center text-center">
              <Avatar className="w-20 h-20 mb-2">
                <AvatarImage src={`https://placehold.co/80x80.png?text=${therapist.avatarFallback}`} alt={therapist.name} data-ai-hint="therapist avatar" />
                <AvatarFallback>{therapist.avatarFallback}</AvatarFallback>
              </Avatar>
              <CardTitle>{therapist.name}</CardTitle>
              <CardDescription>{therapist.specialty}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('therapistRating')}</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span>{therapist.rating}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('therapistSessionPrice')}</span>
                <span className="font-semibold">UGX {therapist.price.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">{t('bookSession')}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">{t('howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
            <li>{t('howItWorksPoint1')}</li>
            <li>{t('howItWorksPoint2')}</li>
            <li>{t('howItWorksPoint3')}</li>
            <li>{t('howItWorksPoint4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
