// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import '../styles/App.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://ducati.kushagragolash.tech';

export const metadata: Metadata = {
  title: 'Ducati',
  description: 'Get rational advice on your purchasing decisions',
  icons: {
    icon: [
      {
        url: '/icons8-money-96.png',
        type: 'image/png',
        sizes: '96x96',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      }
    ],
    shortcut: '/icons8-money-96.png',
    apple: '/icons8-money-96.png',
  },
  openGraph: {
    title: 'Ducati',
    description: 'Get rational advice on your purchasing decisions',
    url: siteUrl,
    siteName: 'Ducati',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        secureUrl: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Ducati — Rational Purchasing Advisor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ducati',
    description: 'Get rational advice on your purchasing decisions',
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for better social media compatibility */}
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />
        <meta property="og:image:secure_url" content={`${siteUrl}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content={`${siteUrl}/og-image.png`} />
        {/* Canonical URL */}
        <link rel="canonical" href={siteUrl} />
        {/* Referrer policy for better external image loading */}
        <meta name="referrer" content="no-referrer-when-downgrade" />
      </head>
      {/* The body tag includes the font class from Next/Font and Tailwind's antialiased class for smoother text. */}
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}