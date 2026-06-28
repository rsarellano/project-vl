import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChalkMathDefs } from "@/components/ChalkMathDefs";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SiteNav } from "@/components/layout/SiteNav";
import "./globals.css";
import { Patrick_Hand } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project VL",
  description: "Visual learning workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${patrickHand.variable} antialiased`}
      >
        <ChalkMathDefs />
        <AuthProvider>
          <SiteNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
