"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Award, Shield } from 'lucide-react'; // Replacing Heart, Star, Crown with alternatives
import { useLocalization } from '@/context/LocalizationContext';
import { BREATHING_EXERCISES, AFFIRMATIONS_KEYS } from '@/lib/constants';

interface ExercisesViewProps {
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

export function ExercisesView({ isPremium, onNavigateToPremium }: ExercisesViewProps) {
  const { t } = useLocalization();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('wellnessExercisesTitle')}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-500" />
              {t('breathingExercises')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {BREATHING_EXERCISES.map((exercise) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{t(exercise.nameKey)}</h3>
                  <span className="text-sm text-muted-foreground">{t(exercise.durationKey)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t(exercise.descriptionKey)}</p>
                <Button variant="link" className="mt-2 px-0 text-primary">{t('startExercise')}</Button>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-yellow-500" />
              {t('dailyAffirmations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {AFFIRMATIONS_KEYS.map((key) => (
              <div key={key} className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <p className="text-center font-medium italic text-sm">"{t(key)}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {!isPremium && (
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-6 w-6" />
              {t('premiumWellnessContent')}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {t('premiumWellnessDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onNavigateToPremium}
              variant="secondary"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              {t('upgradeToPremium')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
