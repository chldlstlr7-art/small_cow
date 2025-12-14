import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "스톡파일럿 - 현명한 투자 계산기",
  description: "물타기 계산, 수익률 분석, 재무 데이터 확인까지. 당신의 주식 투자를 돕는 스마트한 도구 모음.",
  keywords: ["주식", "물타기계산기", "수익률", "삼성전자", "재무제표", "스톡파일럿"],
  verification: {
    other: {
      "naver-site-verification": "8a871781293d49951f2d79e651c2dbfc929878d8",
    },
  },
  openGraph: {
    title: "스톡파일럿 - 현명한 투자 계산기",
    description: "복잡한 계산은 맡기고 투자에만 집중하세요.",
    url: "https://stock-blend-calculate.vercel.app",
    siteName: "Stock Pilot",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Stock Pilot Preview",
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
    <html lang="ko" className="dark">
      {/* 배경색을 gray-950(아주 진한 회색)으로 변경하여 계산기와 통일 */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100 selection:bg-blue-500/30`}>
        
        {/* ✅ 다크 모드 네비게이션 바 */}
        <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
          <div className="max-w-screen-xl mx-auto px-4 h-16 flex justify-between items-center">
            
            {/* 로고: 흰색 텍스트 + 호버 시 블루 포인트 */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Stock Pilot ✈️
              </span>
            </Link>

            {/* 메뉴 영역 */}
            <div className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
              <Link 
                href="/blend" 
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
              >
                물타기 계산
              </Link>
              
              <div className="h-4 w-px bg-gray-800 mx-2 hidden sm:block"></div>
              
              <Link 
                href="/compound" 
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all hidden sm:inline-block"
              >
                복리 계산
              </Link>
              
              <Link 
                href="/backtest" 
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all hidden sm:inline-block"
              >
                그때 샀더라면
              </Link>

              <Link 
                href="/dividend" 
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all hidden sm:inline-block"
              >
                배당금
              </Link>
              
              <Link 
                href="/daytrade" 
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all hidden sm:inline-block"
              >
                순수익 계산
              </Link>



            </div>
          </div>
        </nav>
        
        {/* 메인 컨텐츠 영역 */}
        <main className="w-full min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  );
}