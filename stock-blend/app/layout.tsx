import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "스톡블렌드 - 빠르고 강력한 주식 검색 (Stock Blend)",
  description: "한국 코스피, 코스닥부터 미국 주식까지. 실시간 주식 정보와 재무 데이터를 가장 빠르게 검색하세요.",
  keywords: ["주식", "삼성전자", "테슬라", "주가", "재무제표", "스톡블렌드"],
  openGraph: {
    title: "스톡블렌드 - 주식의 모든 것",
    description: "복잡한 HTS 대신 쉽고 빠른 웹 주식 검색",
    // 나중에 썸네일 이미지도 넣으면 카톡 공유할 때 예쁘게 나옵니다.
    // images: '/thumbnail.png', 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}




