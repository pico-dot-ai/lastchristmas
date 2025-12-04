import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last Christmas",
  description: "Seasonal knockout challenges companion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
