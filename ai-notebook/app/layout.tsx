import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "../contexts/language-context"
import { AuthProvider } from "../contexts/auth-context"
import { Toaster } from "../components/ui/toaster"
import type React from "react"
import './globals.css'

export const metadata = {
  title: 'AI Notebook',
  description: 'AI-powered audio and PDF processing for education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <Toaster />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
