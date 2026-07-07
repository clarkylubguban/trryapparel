import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
