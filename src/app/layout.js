import "./globals.css";

export const metadata = {
  title: "aimtrainer",
  description: "aimtrainer clicker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ cursor: "url('/reddot.png') 32 32, auto" }}>
      <body className='bg-white select-none text-[5vh] font-helvetica uppercase font-bold overflow-hidden'>{children}</body>
    </html>
  );
}
