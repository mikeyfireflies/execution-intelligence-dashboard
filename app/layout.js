import "./globals.css";

export const metadata = {
  title: "Execution Intelligence — Fireflies.ai",
  description: "Live execution intelligence dashboard — Individual → Squad → Company visibility",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
