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
  title: "주식 물타기 계산기 Stock Blend",
  description: "한국 코스피, 코스닥부터 미국 주식까지. 나의 물타기 예상 정보, 실시간 주식 정보와 재무 데이터를 가장 빠르게 검색하세요.",
  keywords: ["주식", "삼성전자", "테슬라", "주가", "재무제표", "스톡블렌드"],
  
  // 네이버 인증
  verification: {
    other: {
      "naver-site-verification": "8a871781293d49951f2d79e651c2dbfc929878d8",
    },
  },

  // ✅ 썸네일 설정 (Open Graph)
  openGraph: {
    title: "스톡블렌드 - 주식 물타기 계산기",
    description: "복잡한 HTS 대신 쉽고 빠른 웹 주식 검색",
    url: "https://stock-blend-calculate.vercel.app", // 사이트 주소 명시 추천
    siteName: "Stock Blend",
    images: [
      {
        url: "/thumbnail.png", // public 폴더 안에 있는 파일명
        width: 1200,           // 일반적인 권장 사이즈
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
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




