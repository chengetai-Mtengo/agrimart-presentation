import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CategoriesProvider } from '@/context/CategoriesContext';

export const metadata = {
  title: 'AgriMart',
  description: "Zambia's Agricultural Marketplace",
};

export const viewport = {
  themeColor: '#0B6E4F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <CategoriesProvider>
          <AuthProvider>{children}</AuthProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}
