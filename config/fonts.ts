import { Cormorant_Garamond, Inter, Mrs_Saint_Delafield, Share_Tech_Mono } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/** Unterschriften auf Dokumenten */
export const fontSignature = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
});

/** Urkunden */
export const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

/** Maschinenlesbare Zone (MRZ) */
export const fontMrz = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mrz",
});
