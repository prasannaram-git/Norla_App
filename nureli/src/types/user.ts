export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
}
