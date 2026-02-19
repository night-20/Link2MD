import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Merriweather({ weight: ["300", "400", "700", "900"], subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Link2MD - Web Article to Markdown",
  description: "Convert WeChat, CSDN, Juejin, Nowcoder articles to Markdown with one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className={`${inter.variable} ${serif.variable} bg-[#fcfaf7] text-[#3e3e3e] antialiased`}>
        {children}
      </body>
    </html>
  );
}
