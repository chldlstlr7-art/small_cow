import type { Metadata } from 'next';
import { Suspense } from 'react';
import DayTradeClient from './DayTradeClient'; // 클라이언트 컴포넌트 import

// 1. 서버 컴포넌트에서 SEO 메타데이터를 정의합니다.
export const metadata: Metadata = {
    title: '주식 단타 순수익 계산기 | 스캘핑 수수료, 세금, 손익분기점',
    description: '단타(스캘핑) 매매 시 필수! 매수/매도 수수료와 증권거래세를 포함한 실제 순수익을 계산해드립니다. 손익분기 매도가를 확인하고 안전하게 투자하세요.',
    keywords: [
        "주식단타계산기", 
        "스캘핑계산기", 
        "주식수수료계산", 
        "증권거래세", 
        "손익분기점", 
        "순수익계산",
        "스톡파일럿"
    ],
    openGraph: {
        title: "실전 단타 수익률 계산기 - 수수료 떼고 얼마 벌었을까?",
        description: "매매할 때마다 나가는 세금과 수수료, 정확히 알고 계신가요? 지금 바로 순수익을 확인해보세요.",
    },
}

// 2. 서버 컴포넌트는 클라이언트 컴포넌트를 렌더링합니다.
export default function DayTradePage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-20">계산기 로딩 중...</div>}>
            <DayTradeClient />
        </Suspense>
    );
}