"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Define the props type based on the next-themes documentation
type ThemeProviderProps = {
  children: React.ReactNode;
  // Use a more generic type to avoid compatibility issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
} 