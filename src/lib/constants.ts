
export const CRISIS_KEYWORDS = ['suicidal', 'suicide', 'kill myself', 'end it all', 'want to die', 'hurt myself'];

export const EMERGENCY_CONTACTS = {
  uganda: '+256 800 100 200', // Replace with actual verified Ugandan crisis line
  international: '+1 988 988 988' // US National Suicide Prevention Lifeline (example)
};

export const MOCK_THERAPISTS = [
  { id: 1, name: 'Dr. Sarah Nakato', specialty: 'Anxiety & Depression', rating: 4.9, price: 80000, avatarFallback: 'SN' },
  { id: 2, name: 'Dr. John Mukasa', specialty: 'Trauma Therapy', rating: 4.8, price: 95000, avatarFallback: 'JM' },
  { id: 3, name: 'Dr. Grace Akello', specialty: 'Relationship Counseling', rating: 4.7, price: 75000, avatarFallback: 'GA' }
];

export const BREATHING_EXERCISES = [
  { id: '478', nameKey: 'breathingExercise478Name', durationKey: 'breathingExercise478Duration', descriptionKey: 'breathingExercise478Desc' },
  { id: 'box', nameKey: 'breathingExerciseBoxName', durationKey: 'breathingExerciseBoxDuration', descriptionKey: 'breathingExerciseBoxDesc' },
  { id: 'belly', nameKey: 'breathingExerciseBellyName', durationKey: 'breathingExerciseBellyDuration', descriptionKey: 'breathingExerciseBellyDesc' }
];

export const AFFIRMATIONS_KEYS = [
  'affirmation1',
  'affirmation2',
  'affirmation3',
  'affirmation4',
  'affirmation5'
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'lg', name: 'Luganda' },
  { code: 'sw', name: 'Swahili' },
  { code: 'run', name: 'Runyakitara' },
];

export type NavItemType = {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  premium?: boolean;
  view?: string; 
  onClickAction?: () => void; 
};

export type UserProfile = {
  name: string;
  email: string | null;
  joinDate: string;
};

export type Message = {
  id: number;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
};

export type MoodEntry = {
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  note?: string;
};

export type JournalEntry = {
  id: number;
  content: string;
  date: string; // YYYY-MM-DD
  timestamp: Date;
};
