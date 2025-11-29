import './globals.css';
import type { ReactNode } from 'react';
import { Space_Grotesk, Inter, Manrope } from 'next/font/google';

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'K1 Lightwave · Aura Edition',
  description: 'Organic diffusion system running the SNAPWAVE physics engine.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-black">
      <body
        className={`${space.variable} ${inter.variable} ${manrope.variable} min-h-screen bg-black font-body text-[#F2F2F2] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
