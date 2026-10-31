import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "妥妥 TUOTUO · 照护工作搭子",
  description: "仅虚构资料的护理工作原型；语音需要人工核对。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
