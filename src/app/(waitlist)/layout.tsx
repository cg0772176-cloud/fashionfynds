import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FashionFynds — Exclusive Fashion, By Invitation Only",
  description:
    "Discover curated independent brands and limited-run pieces. FashionFynds is the invite-only fashion marketplace. Join the waitlist for early access.",
  keywords: [
    "fashion",
    "exclusive",
    "curated",
    "independent brands",
    "waitlist",
    "invite only",
    "marketplace",
    "streetwear",
    "luxury fashion",
  ],
  openGraph: {
    title: "FashionFynds — The Future of Fashion is Exclusive",
    description:
      "An invite-only marketplace for curated independent brands and limited-run pieces. Request your early-access invitation today.",
    siteName: "FashionFynds",
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://fashionfynds.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "FashionFynds — The Future of Fashion is Exclusive",
    description:
      "An invite-only marketplace for curated independent brands and limited-run pieces. Request your early-access invitation today.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
