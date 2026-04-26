import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncHeartist",
  description: "一鍵生成你的專屬祝福網站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7934375375930586" 
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
