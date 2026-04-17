import type { Metadata } from "next";
import { Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "InkForge — AI 小说专业工作台",
  description: "面向中文网文作者的 AI 小说写作专业工作台",
};

const themeInitScript = `(function(){try{var k='inkforge-theme';var s=localStorage.getItem(k);var t=s||'light';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var c=document.documentElement.classList;if(r==='dark'){c.add('dark');c.remove('light-root');}else{c.remove('dark');c.add('light-root');}}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${notoSansSC.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full flex flex-col font-sans surface-0 text-foreground">
        {children}
      </body>
    </html>
  );
}
