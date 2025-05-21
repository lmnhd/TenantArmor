"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// Define the shape of your color schemes
interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primaryForeground: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
}

const themes: Record<string, ColorScheme> = {
  blue: { primary: "217.2 91.2% 59.8%", secondary: "210 40% 96.1%", accent: "25.9 92.3% 52.7%", background: "0 0% 100%", foreground: "222.2 84% 4.9%", card: "0 0% 100%", cardForeground: "222.2 84% 4.9%", popover: "0 0% 100%", popoverForeground: "222.2 84% 4.9%", primaryForeground: "210 40% 98%", secondaryForeground: "215.4 16.3% 46.9%", muted: "210 40% 96.1%", mutedForeground: "215.4 16.3% 46.9%", destructive: "0 84.2% 60.2%", destructiveForeground: "210 40% 98%", border: "214.3 31.8% 91.4%", input: "214.3 31.8% 91.4%", ring: "217.2 91.2% 59.8%", radius: "0.5rem" },
  green: { primary: "142.1 76.2% 36.3%", secondary: "142.1 60% 92%", accent: "45 93.4% 47.5%", background: "0 0% 100%", foreground: "142.1 80% 10%", card: "0 0% 100%", cardForeground: "142.1 80% 10%", popover: "0 0% 100%", popoverForeground: "142.1 80% 10%", primaryForeground: "0 0% 100%", secondaryForeground: "142.1 70% 25%", muted: "142.1 60% 92%", mutedForeground: "142.1 70% 45%", destructive: "0 84.2% 60.2%", destructiveForeground: "0 0% 100%", border: "142.1 50% 88%", input: "142.1 50% 88%", ring: "142.1 76.2% 36.3%", radius: "0.5rem" },
  purple: { primary: "262.1 83.3% 57.8%", secondary: "270 60% 92%", accent: "291.7 91.2% 59.8%", background: "0 0% 100%", foreground: "265 80% 10%", card: "0 0% 100%", cardForeground: "265 80% 10%", popover: "0 0% 100%", popoverForeground: "265 80% 10%", primaryForeground: "0 0% 100%", secondaryForeground: "270 70% 25%", muted: "270 60% 92%", mutedForeground: "270 70% 45%", destructive: "0 84.2% 60.2%", destructiveForeground: "0 0% 100%", border: "270 50% 88%", input: "270 50% 88%", ring: "262.1 83.3% 57.8%", radius: "0.5rem" },
};

const darkThemes: Record<string, Partial<ColorScheme>> = {
    blue: { background: "222.2 84% 4.9%", foreground: "210 40% 98%", card: "222.2 84% 4.9%", cardForeground: "210 40% 98%", popover: "222.2 84% 4.9%", popoverForeground: "210 40% 98%", primary: "217.2 91.2% 69.8%", secondary: "210 40% 15%", accent: "25.9 92.3% 62.7%", primaryForeground: "222.2 84% 4.9%", secondaryForeground: "210 40% 90%", muted: "210 40% 15%", mutedForeground: "210 40% 60%", border: "217.2 32.6% 17.5%", input: "217.2 32.6% 17.5%", ring: "217.2 91.2% 69.8%" },
    green: { background: "142.1 80% 8%", foreground: "142.1 60% 92%", card: "142.1 80% 8%", cardForeground: "142.1 60% 92%", popover: "142.1 80% 8%", popoverForeground: "142.1 60% 92%", primary: "142.1 76.2% 46.3%", secondary: "142.1 70% 15%", accent: "45 93.4% 57.5%", primaryForeground: "142.1 80% 8%", secondaryForeground: "142.1 60% 80%", muted: "142.1 70% 15%", mutedForeground: "142.1 60% 60%", border: "142.1 60% 25%", input: "142.1 60% 25%", ring: "142.1 76.2% 46.3%" },
    purple: { background: "265 80% 8%", foreground: "270 60% 92%", card: "265 80% 8%", cardForeground: "270 60% 92%", popover: "265 80% 8%", popoverForeground: "270 60% 92%", primary: "262.1 83.3% 67.8%", secondary: "270 70% 15%", accent: "291.7 91.2% 69.8%", primaryForeground: "265 80% 8%", secondaryForeground: "270 60% 80%", muted: "270 70% 15%", mutedForeground: "270 60% 60%", border: "270 60% 25%", input: "270 60% 25%", ring: "262.1 83.3% 67.8%" },
};

interface ColorThemeContextType {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  availableColorThemes: string[];
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const ColorThemeProvider = ({ children, defaultColorTheme = "blue", storageKey = "tenantarmor-color-theme" }: {
  children: ReactNode;
  defaultColorTheme?: string;
  storageKey?: string;
}) => {
  const { resolvedTheme } = useNextTheme(); // from next-themes: 'light' or 'dark'
  const [colorTheme, setColorThemeState] = useState<string>(
    defaultColorTheme // Initialize directly with defaultColorTheme
  );

  useEffect(() => {
    // This effect runs only on the client, after hydration, to check localStorage
    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme && themes[storedTheme] && storedTheme !== colorTheme) { // also check if it's different to avoid unnecessary re-render
      setColorThemeState(storedTheme);
    } else if (!storedTheme) {
      // If nothing in localStorage, ensure we are using the default (might be redundant if useState already set it, but safe)
      setColorThemeState(defaultColorTheme);
    }
  }, [storageKey, defaultColorTheme, colorTheme]); // Added colorTheme to dependencies

  useEffect(() => {
    if (colorTheme === undefined) return; // No longer needed as colorTheme is initialized

    const root = window.document.documentElement;
    const isDarkMode = resolvedTheme === 'dark';
    
    const currentColorSchemeBase = themes[colorTheme] || themes.blue;
    const currentDarkSchemeOverrides = darkThemes[colorTheme] || {};

    let finalScheme = { ...currentColorSchemeBase };

    if (isDarkMode) {
      finalScheme = { ...finalScheme, ...currentDarkSchemeOverrides };
    }
    
    root.classList.remove(...Object.keys(themes).map(t => `theme-${t}`));
    root.classList.add(`theme-${colorTheme}`);

    for (const [key, value] of Object.entries(finalScheme)) {
      root.style.setProperty(`--${key}`, value as string);
    }
  }, [colorTheme, resolvedTheme]);

  const setColorTheme = (newTheme: string) => {
    if (themes[newTheme]) {
      localStorage.setItem(storageKey, newTheme);
      setColorThemeState(newTheme);
    } else {
      // Optionally handle the case where an invalid theme name is passed
      console.warn(`Attempted to set invalid color theme: ${newTheme}`);
    }
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, availableColorThemes: Object.keys(themes) }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}; 