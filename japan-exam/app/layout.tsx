import type { Metadata } from "next";
import { Noto_Sans_JP, Sarabun } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-jp",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "日本語 กลางภาค | ท่องญี่ปุ่น บท 1-3",
  description: "เตรียมสอบกลางภาค วิชาภาษาญี่ปุ่น บทที่ 1-3 พร้อม Flashcard SRS และแบบทดสอบ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${notoSansJP.variable} ${sarabun.variable} font-sarabun bg-stone-50 text-gray-900 antialiased`}
      >
        <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
          <NavBar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
