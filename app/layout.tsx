import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edytor z AI Asystentem",
  description: "Notion-like edytor tekstu z wbudowanym asystentem AI (BlockNote + CopilotKit)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
