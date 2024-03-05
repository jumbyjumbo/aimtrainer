import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "aimtrainer",
  description: "2D roguelike aimtrainer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-blue-500 text-black font-helvetica`}>{children}</body>
    </html>
  );
}
