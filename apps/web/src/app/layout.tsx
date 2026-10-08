import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import { Navbar } from "@/components/nav/Navbar";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

export const metadata: Metadata = {
  title: "Ailearnia | AI Engineering Academy",
  description: "Interactive AI engineering courses. Read a short step, then write and submit Python.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${plex.variable} antialiased`}>
        <Navbar user={session} />
        {children}
      </body>
    </html>
  );
}
