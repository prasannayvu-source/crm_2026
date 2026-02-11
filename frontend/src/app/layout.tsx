import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jeevana Vidya Online School CRM",
  description: "Integrative Education with Ethical Principles and Morals. Admissions Management System.",
};

import { Toaster } from 'sonner';

import { ThemeProvider } from './theme-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider defaultTheme="system" storageKey="jvos-crm-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
