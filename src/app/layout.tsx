import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/components/Lang";

export const metadata: Metadata = {
  title: "மனு கண்காணிப்பு அமைப்பு | Petition Tracking System",
  description:
    "Digitised petition register (C.F. 301) — receive, forward, track and close public petitions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ta">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
