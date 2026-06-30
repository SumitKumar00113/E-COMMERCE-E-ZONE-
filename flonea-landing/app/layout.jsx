import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.scss";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "FLONEA — Sports Apparel & Accessories",
  description:
    "FLONEA — premium sports apparel and accessories built for winners.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
