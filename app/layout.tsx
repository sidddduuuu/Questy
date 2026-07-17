import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuestLoop",
  description: "One goal. A different quest for every customer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
