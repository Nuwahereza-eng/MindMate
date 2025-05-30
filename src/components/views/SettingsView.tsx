"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Using ShadCN Switch
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from 'next-themes';
import { useLocalization } from '@/context/LocalizationContext';
import { LANGUAGES } from '@/lib/constants';
import { ThemeToggle } from '@/components/shared/ThemeToggle'; // Using the dedicated toggle

export function SettingsView() {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLocalization();
  const [dailyCheckIns, setDailyCheckIns] = React.useState(true);
  const [moodReminders, setMoodReminders] = React.useState(true);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('settingsTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('appearance')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-toggle">{t('darkMode')}</Label>
            {/* ThemeToggle handles its own logic for switching themes */}
            <ThemeToggle /> 
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="language-select">{t('language')}</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
              <SelectTrigger id="language-select" className="w-[180px]">
                <SelectValue placeholder={t('language')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-checkins-switch">{t('dailyCheckIns')}</Label>
            <Switch 
              id="daily-checkins-switch" 
              checked={dailyCheckIns} 
              onCheckedChange={setDailyCheckIns} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="mood-reminders-switch">{t('moodReminders')}</Label>
            <Switch 
              id="mood-reminders-switch" 
              checked={moodReminders} 
              onCheckedChange={setMoodReminders} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('privacySecurity')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => alert(t('exportMyData') + ' - Not implemented')}>
            {t('exportMyData')}
          </Button>
          <Button variant="destructive" className="w-full justify-start" onClick={() => alert(t('deleteAllData') + ' - Not implemented')}>
            {t('deleteAllData')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
