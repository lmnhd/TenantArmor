"use client";

import React from 'react';
import { useColorTheme } from '../providers/color-theme-provider'; // Updated import

const ThemeSwitcher: React.FC = () => {
  const { colorTheme, setColorTheme, availableColorThemes } = useColorTheme(); // Updated hook usage

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const cycleTheme = () => {
    const currentIndex = availableColorThemes.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % availableColorThemes.length;
    setColorTheme(availableColorThemes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-50 hover:bg-gray-700 transition-colors"
      title={`Current Theme: ${colorTheme}. Click to switch.`}
    >
      {/* Simple icon placeholder, replace with actual SVG or icon component later */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 2.25zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM12 17.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM5.106 6.166A.75.75 0 006.166 5.106L5.106 6.166zM18.894 17.834a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06zM21.75 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.25 12a.75.75 0 01-.75.75H2.25a.75.75 0 010-1.5h1.25a.75.75 0 01.75.75zM17.834 5.106a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06zM5.106 17.834a.75.75 0 001.06 1.06l1.06-1.06a.75.75 0 10-1.06-1.06l-1.06 1.06z" />
      </svg>
      <span className="sr-only">Switch Theme</span>
    </button>
  );
};

export default ThemeSwitcher; 