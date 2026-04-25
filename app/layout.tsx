import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthShell } from "@/components/shared/AuthShell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenComment — Be heard on the rules that affect you",
  description:
    "Federal agencies write thousands of rules a year. OpenComment helps ordinary Americans find the ones that affect them and speak into the record.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`}>
      <body>
        <AuthShell>
          <ProfileProvider>{children}</ProfileProvider>
        </AuthShell>
      </body>
    </html>
  );
}
