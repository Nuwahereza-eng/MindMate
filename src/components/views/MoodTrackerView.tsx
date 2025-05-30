"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useLocalization } from '@/context/LocalizationContext';
import type { MoodEntry } from '@/lib/constants';

interface MoodTrackerViewProps {
  isPremium: boolean;
}

const moodEmojis = ["😔", "🙁", "😕", "😐", "🙂", "😊", "😄", "😆", "🤩", "🥳"]; // 1-10

export function MoodTrackerView({ isPremium }: MoodTrackerViewProps) {
  const { t } = useLocalization();
  const [currentMood, setCurrentMood] = useState(5); // Default mood 1-10
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  useEffect(() => {
    // Load mood history from localStorage
    const storedHistory = localStorage.getItem('afyasync-moodHistory');
    if (storedHistory) {
      setMoodHistory(JSON.parse(storedHistory));
    }
  }, []);

  const saveMoodEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: MoodEntry = { date: today, mood: currentMood, note: moodNote };
    
    // Update if entry for today exists, else add new
    const existingEntryIndex = moodHistory.findIndex(entry => entry.date === today);
    let updatedHistory;
    if (existingEntryIndex > -1) {
      updatedHistory = [...moodHistory];
      updatedHistory[existingEntryIndex] = newEntry;
    } else {
      updatedHistory = [newEntry, ...moodHistory];
    }
    // Keep history to a reasonable length, e.g., last 30 entries
    updatedHistory = updatedHistory.slice(0, 30); 
    
    setMoodHistory(updatedHistory);
    localStorage.setItem('afyasync-moodHistory', JSON.stringify(updatedHistory));
    setMoodNote(''); // Clear note after saving
  };

  const getAverageMood = () => {
    if (moodHistory.length === 0) return 0;
    return moodHistory.reduce((acc, entry) => acc + entry.mood, 0) / moodHistory.length;
  };

  const getBestMood = () => {
    if (moodHistory.length === 0) return 0;
    return Math.max(...moodHistory.map(entry => entry.mood));
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('moodTrackerTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('howAreYouFeelingToday')}</CardTitle>
          <CardDescription>
            {moodEmojis[currentMood - 1]} {currentMood}/10
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            min={1}
            max={10}
            step={1}
            value={[currentMood]}
            onValueChange={(value) => setCurrentMood(value[0])}
            className="my-4"
          />
          {/* Optional: Note for mood entry */}
          {/* <Textarea placeholder={t('addANoteOptional')} value={moodNote} onChange={(e) => setMoodNote(e.target.value)} /> */}
          <Button onClick={saveMoodEntry} className="w-full sm:w-auto">{t('saveMood')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('moodHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {moodHistory.length === 0 ? (
            <p className="text-muted-foreground">{t('noMoodEntriesYet')}</p>
          ) : (
            <div className="space-y-3">
              {moodHistory.slice(0, 7).map((entry, index) => ( // Show last 7 entries
                <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2 w-1/2">
                    <Progress value={entry.mood * 10} className="h-2 w-full" />
                    <span className="text-sm font-medium w-12 text-right">{moodEmojis[entry.mood - 1]} {entry.mood}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isPremium && moodHistory.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">{t('premiumMoodInsights')}</CardTitle>
            <CardDescription>{t('moodImprovedMessage')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">{t('averageMood')}</p>
              <p className="text-3xl font-bold">{getAverageMood().toFixed(1)}/10</p>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">{t('bestDay')}</p>
              <p className="text-3xl font-bold">{getBestMood()}/10</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
