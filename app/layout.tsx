import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Games Studio & B2B GGR Provider Platform",
  description: "Next-Generation iGaming Studio & B2B Game Aggregator Provider API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#080b11] text-gray-100 selection:bg-amber-500 selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
