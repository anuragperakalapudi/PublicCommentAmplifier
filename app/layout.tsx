import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/context/ProfileContext";

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
  title: "Public Comment Amplifier — Be heard on the rules that affect you",
  description:
    "Federal agencies write thousands of rules a year. Public Comment Amplifier helps ordinary Americans find the ones that affect them and speak into the record.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`}>
      <body>
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
