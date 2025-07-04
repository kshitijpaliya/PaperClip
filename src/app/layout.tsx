import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PaperClip - Simple Notes & File Sharing",
  description:
    "Simple, fast, and collaborative note-taking with file sharing capabilities. Create notes instantly with unique URLs - no signup required.",
  keywords: [
    "notes",
    "file sharing",
    "collaboration",
    "pastebin",
    "text editor",
    "dontpad",
  ],
  authors: [{ name: "PaperClip" }],
  openGraph: {
    title: "PaperClip - Simple Notes & File Sharing",
    description:
      "Simple, fast, and collaborative note-taking with file sharing capabilities.",
    type: "website",
    images: [
      {
        url: "/image.png", // Add your PNG image path here
        alt: "PaperClip preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperClip - Simple Notes & File Sharing",
    description:
      "Simple, fast, and collaborative note-taking with file sharing capabilities.",
    images: ["/image.png"], // Add your PNG image path here
  },
  icons: {
    icon: "/logoitis.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
