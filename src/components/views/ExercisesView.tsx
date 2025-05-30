
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Award, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useLocalization } from '@/context/LocalizationContext';
import { BREATHING_EXERCISES, type Message, type MoodEntry, type JournalEntry } from '@/lib/constants';
import { getAIPersonalizedAffirmations } from '@/app/actions';
import type { PersonalizedAffirmationInput } from '@/ai/flows/personalized-affirmation-flow';
import { toast } from '@/hooks/use-toast';

interface ExercisesViewProps {
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

const MOOD_HISTORY_KEY = 'afyasync-moodHistory';
const JOURNAL_ENTRIES_KEY = 'afyasync-journalEntries';
const CHAT_MESSAGES_KEY = 'afyasync-chatMessages';

export function ExercisesView({ isPremium, onNavigateToPremium }: ExercisesViewProps) {
  const { t, language } = useLocalization();
  const [personalizedAffirmations, setPersonalizedAffirmations] = useState<string[]>([]);
  const [isLoadingAffirmations, setIsLoadingAffirmations] = useState(false);

  const fetchAndSetPersonalizedAffirmations = async () => {
    setIsLoadingAffirmations(true);
    setPersonalizedAffirmations([]); // Clear previous affirmations

    try {
      const moodHistoryRaw = localStorage.getItem(MOOD_HISTORY_KEY);
      const journalEntriesRaw = localStorage.getItem(JOURNAL_ENTRIES_KEY);
      const chatMessagesRaw = localStorage.getItem(CHAT_MESSAGES_KEY);

      const moodHistory: MoodEntry[] = moodHistoryRaw ? JSON.parse(moodHistoryRaw) : [];
      const journalEntries: JournalEntry[] = journalEntriesRaw ? JSON.parse(journalEntriesRaw) : [];
      const chatMessages: Message[] = chatMessagesRaw ? JSON.parse(chatMessagesRaw) : [];
      
      // Prepare data for the AI, ensuring timestamps are strings if that's what the AI flow expects
      const inputData: PersonalizedAffirmationInput = {
        moodHistory: moodHistory.slice(0, 7).map(m => ({...m, date: m.date.toString()})), // last 7
        journalEntries: journalEntries.slice(0, 3).map(j => ({...j, timestamp: j.timestamp.toString(), date: j.date.toString()})), // last 3
        chatHistory: chatMessages.slice(-15).map(c => ({...c, timestamp: c.timestamp.toString()})), // last 15
        languageCode: language,
      };

      const result = await getAIPersonalizedAffirmations(inputData);
      if (result.affirmations && result.affirmations.length > 0) {
        setPersonalizedAffirmations(result.affirmations);
        toast({ title: t('affirmationsGeneratedSuccess') });
      } else {
        setPersonalizedAffirmations([t('noAffirmationsGenerated')]);
        toast({ title: t('affirmationsGenerationError'), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching personalized affirmations:", error);
      setPersonalizedAffirmations([t('errorFetchingAffirmations')]);
      toast({ title: t('affirmationsGenerationError'), description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingAffirmations(false);
    }
  };

  const handleStartExercise = (exerciseNameKey: string) => {
    toast({
      title: t(exerciseNameKey),
      description: t('exerciseFeatureComingSoon'),
    });
  };

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
                <Button 
                  variant="link" 
                  className="mt-2 px-0 text-primary"
                  onClick={() => handleStartExercise(exercise.nameKey)}
                >
                  {t('startExercise')}
                </Button>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
              {t('personalizedAffirmations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={fetchAndSetPersonalizedAffirmations} disabled={isLoadingAffirmations} className="w-full mb-4">
              {isLoadingAffirmations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('generatingAffirmations')}...
                </>
              ) : (
                t('generateMyAffirmations')
              )}
            </Button>
            {personalizedAffirmations.length > 0 ? (
              personalizedAffirmations.map((affirmation, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <p className="text-center font-medium italic text-sm">"{affirmation}"</p>
                </div>
              ))
            ) : (
              !isLoadingAffirmations && <p className="text-sm text-muted-foreground text-center">{t('clickToGenerateAffirmations')}</p>
            )}
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
