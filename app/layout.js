import Script from 'next/script';
import { Archivo, Cormorant_Garamond, Space_Mono } from 'next/font/google';
import './globals.css';

// The KLODS fake ad's three faces. next/font self-hosts them, so they don't
// cost a round trip to Google on every view.
const archivo = Archivo({ subsets: ['latin'], display: 'swap', variable: '--font-archivo' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300'], style: ['italic'], display: 'swap', variable: '--font-cormorant',
});
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400'], display: 'swap', variable: '--font-space-mono' });

export const metadata = {
  title: 'Doomscroller — Ad Prototype',
  other: {
    clckd: '43e44410229c171edc44eeecddef3016',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${cormorant.variable} ${spaceMono.variable}`}>
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
        {/* 2D physics for the coin sack. The engine reads it off window, so it
            loads the same way aclib does and CoinSack waits for it. */}
        <Script
          id="matter"
          src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
