import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MairIA - Assistant IA pour votre mairie",
  description:
    "Chatbot intelligent pour les mairies francaises. Repondez automatiquement aux questions de vos citoyens.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
