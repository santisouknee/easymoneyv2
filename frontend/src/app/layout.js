import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import LayoutWrapper from '../components/LayoutWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Easy Money - Customer Down Payment & Installment Tracking Dashboard',
  description: 'Easy Money is a modern, responsive financial monitoring application designed for SMEs to manage down payments, contracts, monthly installment schedules, and collection tracking.',
  openGraph: {
    title: 'Easy Money - Down Payment Tracking System',
    description: 'Monitor contracts, record collections, print receipt logs, and manage payment schedules easily on desktop or mobile devices.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Easy Money App',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
