import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Cummins OS',
  description: 'AI-native industrial operating system for fleet intelligence and diagnostics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
