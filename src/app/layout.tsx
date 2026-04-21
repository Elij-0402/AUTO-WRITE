import type { Metadata } from "next";
import { Noto_Sans_SC, JetBrains_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "InkForge — AI 小说专业工作台",
  description: "面向中文网文作者的 AI 小说写作专业工作台",
};

// 默认深色：memorable-thing = 深夜注力、极极安静 (per DESIGN.md)
const themeInitScript = `(function(){try{var k='inkforge-theme';var s=localStorage.getItem(k);var t=s||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var c=document.documentElement.classList;if(r==='dark'){c.add('dark');c.remove('light-root');}else{c.remove('dark');c.add('light-root');}}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansSC.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        {/* Google Fonts — Inter for UI */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* LXGW 字体家族 — CDN。Google Fonts 不提供。per DESIGN.md */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-neoxihei@1.1.0/style.css" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full flex flex-col font-sans surface-0 text-foreground">
        {children}
      </body>
    </html>
  );
}
