import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NachosPoker.App',
  description: 'Free poker tools, calculators, and strategy resources',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
