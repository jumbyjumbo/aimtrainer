import "./globals.css";

export const metadata = {
  title: "aimtrainer",
  description: "aimtrainer clicker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ cursor: "url('/reddot.png') 32 32, auto" }}>
      <body className='text-black font-helvetica uppercase font-bold'>{children}</body>
    </html>
  );
}
