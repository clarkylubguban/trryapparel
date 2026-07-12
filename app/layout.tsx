import type { Metadata } from "next";
import {
  Archivo_Black,
  Space_Grotesk,
  Space_Mono,
} from "next/font/google";

import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-human",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-machine",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRRY Apparel / Tariray | Custom Shirts and Merch",
  description:
    "A bright customer web app for TRRY Apparel: shop statement tees, customize shirts, send Canva links, request uniforms, and track orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.className} ${archivoBlack.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}