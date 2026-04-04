import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "../components/Toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://yonkoo11.github.io/mev-shield-initia";

export const metadata: Metadata = {
  title: "BatchFi | Fair Trading Protocol on Initia",
  description:
    "Batch auction DEX on its own Initia appchain. One uniform clearing price per batch. 0.1% protocol fee = chain revenue.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "BatchFi - Fair Trading, Chain Revenue",
    description:
      "The first DEX where the chain itself is the business. Batch auctions enforce one fair price. Every trade generates protocol revenue.",
    images: [
      {
        url: `${siteUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "BatchFi - Fair Trading Protocol on Initia",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BatchFi - Fair Trading, Chain Revenue",
    description:
      "Batch auction DEX on Initia. Uniform clearing price, 0.1% protocol fee, session signing. Your chain, your revenue.",
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
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-shield-bg antialiased font-sans`}>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
