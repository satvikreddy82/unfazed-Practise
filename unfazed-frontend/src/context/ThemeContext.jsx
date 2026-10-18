import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const THEMES = [
  {
    id: 'emerald_gold',
    name: 'Emerald & Gold',
    primary: '#047857',
    accent: '#D4AF37',
    mood: 'Luxurious, trustworthy, premium',
    category: 'Therapy & Wellness',
  },
  {
    id: 'navy_cyan',
    name: 'Navy & Cyan',
    primary: '#0B1F3A',
    accent: '#00D4FF',
    mood: 'Technology, clarity, professionalism',
    category: 'Modern Practice',
  },
  {
    id: 'charcoal_electric_blue',
    name: 'Charcoal & Electric Blue',
    primary: '#18181B',
    accent: '#3B82F6',
    mood: 'Modern, sophisticated, technical',
    category: 'Minimalist',
  },
  {
    id: 'black_lime',
    name: 'Black & Lime',
    primary: '#111111',
    accent: '#B6FF00',
    mood: 'Bold, high-contrast, energetic',
    category: 'High Contrast',
  },
  {
    id: 'orange_navy',
    name: 'Orange & Navy',
    primary: '#102A43',
    accent: '#FF6B00',
    mood: 'Distinctive, confident, professional',
    category: 'Contemporary',
  },
  {
    id: 'purple_pink',
    name: 'Purple & Pink',
    primary: '#6C2BD9',
    accent: '#FF4FA3',
    mood: 'Creative and modern',
    category: 'Creative Care',
  },
  {
    id: 'red_cream',
    name: 'Red & Cream',
    primary: '#D72638',
    accent: '#FFF3E0',
    mood: 'Bold, warm, editorial',
    category: 'Warm & Warmth',
  },
  {
    id: 'golden_violet',
    name: 'Golden Yellow & Electric Violet',
    primary: '#7357D8',
    accent: '#FFD84D',
    mood: 'Playful, premium, vibrant',
    category: 'Vibrant Spirit',
  },
  {
    id: 'forest_blush',
    name: 'Forest Green & Blush Pink',
    primary: '#315C4C',
    accent: '#F2A7B5',
    mood: 'Natural, calm, wellness-oriented',
    category: 'Nature & Healing',
  },
  {
    id: 'royal_plum_mint',
    name: 'Royal Plum & Mint Mist',
    primary: '#593C8F',
    accent: '#A8D5BA',
    mood: 'Elegant, calm, distinctive',
    category: 'Serene Sanctuary',
  },
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('unfazed_theme') || 'emerald_gold';
  });

  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('unfazed_mode') || 'system';
  });

  const [resolvedMode, setResolvedMode] = useState(() => {
    const savedMode = localStorage.getItem('unfazed_mode') || 'system';
    if (savedMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return savedMode;
  });

  // Apply to DOM attributes whenever theme or mode changes
  useEffect(() => {
    let activeMode = mode;
    if (mode === 'system') {
      activeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setResolvedMode(activeMode);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', activeMode);

    if (activeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('unfazed_theme', theme);
    localStorage.setItem('unfazed_mode', mode);
  }, [theme, mode]);

  // Listen to system OS preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        const newMode = mediaQuery.matches ? 'dark' : 'light';
        setResolvedMode(newMode);
        document.documentElement.setAttribute('data-mode', newMode);
        if (newMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    // Sync with backend if user has token
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      axios
        .put('/api/profile/theme', { theme: newTheme, mode }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  };

  const setMode = (newMode) => {
    setModeState(newMode);
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      axios
        .put('/api/profile/theme', { theme, mode: newMode }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  };

  const toggleMode = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('light');
    else {
      // System toggles to opposite of currently resolved
      setMode(resolvedMode === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        mode,
        setMode,
        activeMode: resolvedMode,
        toggleMode,
        themesList: THEMES,
        currentThemeMeta: THEMES.find((t) => t.id === theme) || THEMES[0],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
