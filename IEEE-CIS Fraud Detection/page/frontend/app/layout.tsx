import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ButterflyLayer } from "@/components/Butterflies";
import { AuthProvider } from "@/lib/auth";
import { LangProvider } from "@/lib/i18n";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fraud Radar · Fraud detection platform",
  description: "Explainable fraud risk scoring for e-commerce payments (IEEE-CIS / Vesta dataset).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <LangProvider>
          <AuthProvider>
            <ButterflyLayer />
            <Nav />
            <main className="container">{children}</main>
            <Footer />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
