import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA Resume Builder",
  description:
    "Build ATS-optimized resumes for QA Engineer, Automation Engineer, SDET, and Test Engineer roles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
