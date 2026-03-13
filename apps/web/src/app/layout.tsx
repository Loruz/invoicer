import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoicer - Time Tracking & Invoicing",
  description: "Track time and generate invoices",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
