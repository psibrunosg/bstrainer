import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BS Trainer",
  description:
    "Registre cada série. Veja cada progresso. Prescrição e execução de treino de força para personal trainers e atletas.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#f8f4ed",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
