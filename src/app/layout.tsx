import type { Metadata } from "next";
// import Head from 'next/head'; // Remove this import
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "./components/providers/theme-provider";
// import { ColorThemeProvider } from "./components/providers/color-theme-provider"; // Temporarily commented out
// import ThemeSwitcher from "./components/common/theme-switcher"; // Temporarily commented out
// import ColorDemo from "./components/common/color-demo"; // Temporarily commented out

export const metadata: Metadata = {
  title: "TenantArmor", // Updated title
  description: "Empowering tenants with AI-driven lease analysis and eviction guidance.", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <Head> */}
        {/* Minimal head, Next.js adds necessary tags. Can add specific meta tags here if needed. */}
      {/* </Head> */}
      {/* Ensure no whitespace or comments between <Head> and <body> */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {/* <ColorThemeProvider> */}{/* Temporarily commented out */}
              {children}
              {/* {process.env.NODE_ENV === "development" && ( // Temporarily commented out
                <>
                  <ThemeSwitcher />
                  <ColorDemo />
                </>
              )} */}
            {/* </ColorThemeProvider> */}{/* Temporarily commented out */}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
