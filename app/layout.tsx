import { Geist, Geist_Mono, Lora } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { cn } from "@/lib/utils";
import { getOptionalUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "fab.zone",
}

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getOptionalUser()

  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
        <ThemeProvider>
          <SiteHeaderWrapper user={user} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
