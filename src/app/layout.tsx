import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "ShelfCast — Your books, as private audio",
  description: "Upload owned EPUB/PDF books and convert them to private downloadable audiobooks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            ShelfCast MVP — private audio for books you own. No DRM circumvention.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
