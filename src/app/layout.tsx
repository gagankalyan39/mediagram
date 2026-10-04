import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediaGram — Scroll Into Something Amazing.',
  description: 'MediaGram — Scroll Into Something Amazing. Media-first social platform powered by Cloudinary and machine learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-[#06070c] text-[#f3f4f6] selection:bg-amber-400 selection:text-black">
        {/* Ambient background glows */}
        <div className="ambient-glow" />
        
        {/* Main Application Container */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
