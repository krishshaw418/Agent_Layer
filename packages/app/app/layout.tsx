import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AppToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Layer",
  description: "Modern documentation and playground for decentralized AI infrastructure."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased"
      >
        <Providers>
          <>
            {children}
            <AppToaster />
          </>
        </Providers>
      </body>
    </html>
  );
}
