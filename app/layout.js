import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Doomscroller — Ad Prototype',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9316425515738331"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          id="aclib"
          src="https://acscdn.com/script/aclib.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
