import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Merriweather({ weight: ["300", "400", "700", "900"], subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Link2MD - 网络文章转 Markdown",
  description: "一键将网络文章（微信公众号、CSDN、掘金、牛客网）转换为干净的 Markdown 格式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className={`${inter.variable} ${serif.variable} antialiased`} style={{ background: '#f0ede8', color: '#3e3e3e' }}>
        {children}
      </body>
    </html>
  );
}
