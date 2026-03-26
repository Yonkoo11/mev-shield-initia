import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "../components/Toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mev-shield-initia.netlify.app";

export const metadata: Metadata = {
  title: "MEV Shield | Private Batch Auction DEX on Initia",
  description:
    "Zero-MEV trading on Initia. Encrypted orders via batch auctions with uniform clearing prices.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MEV Shield - Trade without MEV on Initia",
    description:
      "Private batch auction DEX on Initia MiniEVM. Orders encrypted until settlement. No sandwich attacks. No frontrunning.",
    images: [
      {
        url: `${siteUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "MEV Shield - Private Batch Auction DEX on Initia",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEV Shield - Trade without MEV on Initia",
    description:
      "Private batch auction DEX on Initia MiniEVM. Encrypted orders, uniform clearing price, atomic settlement.",
    images: [`${siteUrl}/og-image.svg`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} min-h-screen bg-shield-bg antialiased font-sans`}>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
