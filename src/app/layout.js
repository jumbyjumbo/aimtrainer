import { Inter } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "aimtrainer",
  description: "2D roguelike aimtrainer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='text-black font-helvetica'>{children}</body>
    </html>
  );
}
