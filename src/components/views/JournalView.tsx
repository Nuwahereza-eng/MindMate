"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalization } from '@/context/LocalizationContext';
import type { JournalEntry } from '@/lib/constants';

export function JournalView() {
  const { t } = useLocalization();
  const [currentJournalEntry, setCurrentJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const storedEntries = localStorage.getItem('afyasync-journalEntries');
    if (storedEntries) {
      setJournalEntries(JSON.parse(storedEntries).map((entry: JournalEntry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp) // Ensure date is parsed correctly
      })));
    }
  }, []);

  const saveJournalEntry = () => {
    if (!currentJournalEntry.trim()) return;

    const newEntry: JournalEntry = {
      id: Date.now(),
      content: currentJournalEntry,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date(),
    };

    const updatedEntries = [newEntry, ...journalEntries].slice(0, 50); // Keep last 50
    setJournalEntries(updatedEntries);
    localStorage.setItem('afyasync-journalEntries', JSON.stringify(updatedEntries));
    setCurrentJournalEntry('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('journalTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('writeTodaysEntry')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentJournalEntry}
            onChange={(e) => setCurrentJournalEntry(e.target.value)}
            placeholder={t('journalPlaceholder')}
            className="min-h-[150px] mb-4"
          />
          <Button onClick={saveJournalEntry}>{t('saveEntry')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('previousEntries')}</CardTitle>
        </CardHeader>
        <CardContent>
          {journalEntries.length === 0 ? (
            <p className="text-muted-foreground">{t('noJournalEntries')}</p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <Card key={entry.id} className="bg-background/50">
                    <CardHeader className="pb-2">
                      <CardDescription>
                        {new Date(entry.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(entry.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
