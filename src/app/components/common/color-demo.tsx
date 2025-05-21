"use client";

import React, { useEffect, useState } from 'react';
import { useColorTheme } from '../providers/color-theme-provider'; // Updated import

const ColorDemo: React.FC = () => {
  const { colorTheme } = useColorTheme(); // Updated hook usage
  const [style, setStyle] = useState<CSSStyleDeclaration | null>(null);

  useEffect(() => {
    setStyle(window.getComputedStyle(document.documentElement));
  }, [colorTheme]); // Re-fetch styles when colorTheme changes

  if (process.env.NODE_ENV !== 'development' || !style) {
    return null;
  }

  const colorVariables = [
    { name: "Primary", varName: "--primary" },
    { name: "Primary Foreground", varName: "--primary-foreground" },
    { name: "Secondary", varName: "--secondary" },
    { name: "Secondary Foreground", varName: "--secondary-foreground" },
    { name: "Accent", varName: "--accent" },
    { name: "Background", varName: "--background" },
    { name: "Foreground", varName: "--foreground" },
    { name: "Card", varName: "--card" },
    { name: "Card Foreground", varName: "--card-foreground" },
    { name: "Popover", varName: "--popover" },
    { name: "Popover Foreground", varName: "--popover-foreground" },
    { name: "Muted", varName: "--muted" },
    { name: "Muted Foreground", varName: "--muted-foreground" },
    { name: "Destructive", varName: "--destructive" },
    { name: "Destructive Foreground", varName: "--destructive-foreground" },
    { name: "Border", varName: "--border" },
    { name: "Input", varName: "--input" },
    { name: "Ring", varName: "--ring" },
  ];

  const getColorValue = (varName: string) => style.getPropertyValue(varName).trim();

  return (
    <div className="fixed bottom-16 right-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-2xl z-40 max-h-[calc(100vh-10rem)] overflow-y-auto w-72">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Current Theme Colors ({colorTheme})</h3>
      <div className="grid grid-cols-1 gap-2">
        {colorVariables.map(({ name, varName }) => {
          const colorValue = getColorValue(varName);
          // Attempt to guess if the color is light or dark for better text contrast
          // This is a very basic guess, primarily for HSL black/white.
          let textColor = "text-black";
          try {
            if (colorValue.startsWith("hsl")) {
              const lightness = parseFloat(colorValue.split('%')[2]);
              if (lightness < 50) textColor = "text-white";
            } else if (colorValue.startsWith("rgb")) {
                const parts = colorValue.match(/\d+/g);
                if (parts && parts.length >= 3) {
                    const r = parseInt(parts[0]);
                    const g = parseInt(parts[1]);
                    const b = parseInt(parts[2]);
                    if ((r * 0.299 + g * 0.587 + b * 0.114) < 186) textColor = "text-white";
                }
            }
          } catch { /* Ignore parsing errors */ }
          
          return (
            <div key={varName} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: `hsl(${colorValue})` }}>
              <span className={`text-xs font-medium ${textColor}`}>{name}</span>
              <span className={`text-xs ${textColor}`}>{colorValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorDemo; 