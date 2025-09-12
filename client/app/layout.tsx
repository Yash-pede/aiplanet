import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { TanstackProvider } from "@/providers/tanstack-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ai Planet",
  description: "Create the workflow with drag and drop components",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <TanstackProvider>
        <body className={font.className + " bg-background text-foreground"}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>{children}</SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </TanstackProvider>
    </html>
  );
}
