import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin"],
  variable: "--font-heebo",
  fallback: ["Georgia", "sans-serif", "serif"]
});

export const metadata: Metadata = {
  title: "Mealicious",
  description: "An application where you can save recipes, meals, and recipes",
  openGraph: {
    type: "website",
    images: "https://shawntapp.com/mealicious-logo.jpg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heebo.className} antialiased`}>
        <Toaster richColors/>
        <NuqsAdapter>
          <ThemeProvider attribute="class" defaultTheme="system">
            {children}
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
