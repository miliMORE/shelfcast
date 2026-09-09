import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "ShelfCast — Your books, as private audio",
  description: "Upload owned EPUB/PDF books and convert them to private downloadable audiobooks.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-10 sm:px-6">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500">
            <p>ShelfCast — private audio for books you own. No DRM circumvention.</p>
            <p className="mt-2 space-x-3">
              <Link href="/terms" className="text-slate-600 underline-offset-2 hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="text-slate-600 underline-offset-2 hover:underline">
                Privacy
              </Link>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
