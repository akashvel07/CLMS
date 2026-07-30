import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, Role } from '../types/database';

export interface PresetProfile extends UserProfile {
  label: string;
  icon: string;
  description: string;
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'president-alexander',
    name: 'President Alexander',
    email: 'president@clms.gov',
    role: 'president',
    ministry_id: null,
    created_at: '2024-01-01T00:00:00Z',
    label: 'President',
    icon: '👑',
    description: 'Executive oversight & approval authority',
  },
  {
    id: 'health-min',
    name: 'Dr. Sarah Chen',
    email: 'health@clms.gov',
    role: 'ministry',
    ministry_id: 'health',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Health Ministry',
    icon: '🏥',
    description: 'Healthcare, medical data & wellness',
  },
  {
    id: 'finance-min',
    name: 'Min. Robert Fox',
    email: 'finance@clms.gov',
    role: 'ministry',
    ministry_id: 'finance',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Finance Ministry',
    icon: '💰',
    description: 'Treasury, national budget & spending',
  },
  {
    id: 'education-min',
    name: 'Prof. James Liu',
    email: 'education@clms.gov',
    role: 'ministry',
    ministry_id: 'education',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Education Ministry',
    icon: '🎓',
    description: 'Learning metrics, courses & certs',
  },
  {
    id: 'it-min',
    name: 'Dir. Maya Singh',
    email: 'it@clms.gov',
    role: 'ministry',
    ministry_id: 'it',
    created_at: '2024-01-01T00:00:00Z',
    label: 'IT Ministry',
    icon: '💻',
    description: 'Digital services & tech governance',
  },
  {
    id: 'career-min',
    name: 'Min. Alex Park',
    email: 'career@clms.gov',
    role: 'ministry',
    ministry_id: 'career',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Career Development',
    icon: '💼',
    description: 'Jobs, placements & skills growth',
  },
  {
    id: 'entertainment-min',
    name: 'Dir. Kim Reeves',
    email: 'entertainment@clms.gov',
    role: 'ministry',
    ministry_id: 'entertainment',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Entertainment',
    icon: '🎮',
    description: 'Recreation & cultural events',
  },
  {
    id: 'personal-dev-min',
    name: 'Dir. Tom Reed',
    email: 'personaldev@clms.gov',
    role: 'ministry',
    ministry_id: 'personal_dev',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Personal Development',
    icon: '⭐',
    description: 'Habit tracking & growth programs',
  },
  {
    id: 'external-min',
    name: 'Amb. Lisa Torres',
    email: 'external@clms.gov',
    role: 'ministry',
    ministry_id: 'external_affairs',
    created_at: '2024-01-01T00:00:00Z',
    label: 'External Affairs',
    icon: '🌐',
    description: 'Inter-ministry & diplomatic ties',
  },
  {
    id: 'road-transport-min',
    name: 'Min. Sarah Jenkins',
    email: 'road_transport@clms.gov',
    role: 'ministry',
    ministry_id: 'road_transport',
    created_at: '2024-01-01T00:00:00Z',
    label: 'Road & Transport',
    icon: '🚗',
    description: 'Infrastructure, public transit & highways',
  },
  {
    id: 'public-citizen',
    name: 'Public Citizen',
    email: 'public@clms.gov',
    role: 'public',
    ministry_id: null,
    created_at: '2024-01-01T00:00:00Z',
    label: 'Public Citizen',
    icon: '👥',
    description: 'Open transparency & public records',
  },
  {
    id: 'justice-high-court',
    name: 'Hon. Justice Riya Sharma',
    email: 'justice@clms.gov',
    role: 'justice' as any,
    ministry_id: null,
    created_at: '2024-01-01T00:00:00Z',
    label: 'High Court Justice',
    icon: '⚖️',
    description: 'Presides over High Court — approves cases, issues orders',
  },
  {
    id: 'chief-justice-supreme',
    name: 'Chief Justice Marcus Webb',
    email: 'chief_justice@clms.gov',
    role: 'chief_justice' as any,
    ministry_id: null,
    created_at: '2024-01-01T00:00:00Z',
    label: 'Supreme Court Chief Justice',
    icon: '🏗️',
    description: 'Supreme Court head — final rulings & bill suspension power',
  },
];

const ACTIVE_PROFILE_KEY = 'clms_active_profile_id';

interface AuthContextValue {
  user: UserProfile;
  role: Role;
  loading: boolean;
  presetProfiles: PresetProfile[];
  switchProfile: (profileId: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, role: Role, ministryCode?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const DEFAULT_PROFILE = PRESET_PROFILES[0];

const AuthContext = createContext<AuthContextValue>({
  user: DEFAULT_PROFILE,
  role: DEFAULT_PROFILE.role,
  loading: false,
  presetProfiles: PRESET_PROFILES,
  switchProfile: () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const found = PRESET_PROFILES.find(p => p.id === savedId);
    return found ?? DEFAULT_PROFILE;
  });

  const [loading, setLoading] = useState(false);

  const switchProfile = (profileId: string) => {
    const found = PRESET_PROFILES.find(p => p.id === profileId);
    if (found) {
      setUser(found);
      localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    }
  };

  const signIn = async (email: string): Promise<{ error: string | null }> => {
    const normalized = email.trim().toLowerCase();
    const found = PRESET_PROFILES.find(p => p.email.toLowerCase() === normalized);
    if (found) {
      switchProfile(found.id);
      return { error: null };
    }
    return { error: null };
  };

  const signUp = async (): Promise<{ error: string | null }> => {
    return { error: null };
  };

  const signOut = async () => {
    switchProfile('public-citizen');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        loading,
        presetProfiles: PRESET_PROFILES,
        switchProfile,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
