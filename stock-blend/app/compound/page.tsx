import type { Metadata } from 'next';
import { Suspense } from 'react';
import CompoundClient from './CompoundClient'; // 클라이언트 컴포넌트 import

// 1. 서버 컴포넌트에서 SEO 메타데이터를 정의합니다. (Head 태그 대체)
export const metadata: Metadata = {
    title: '복리 계산기 Pro | 주식, 적금, 비트코인 수익률 시뮬레이션',
    description: 'S&P500, 배당주, 적금 이자 계산을 위한 최고의 복리 계산기입니다. 월 적립액과 수익률을 입력하고 복리의 마법을 차트로 확인하세요.',
    keywords: [
        "복리계산기", 
        "적금이자계산기", 
        "미국주식수익률", 
        "72의법칙", 
        "스노우볼효과", 
        "은퇴자금계산",
        "스톡파일럿"
    ],
    openGraph: {
        title: "복리 계산기 Pro - 자산이 2배가 되는 시간은?",
        description: "시간과 이자가 만드는 자산의 마법. 지금 바로 내 미래 자산을 시뮬레이션 해보세요.",
    },
}

// 2. 서버 컴포넌트는 클라이언트 컴포넌트를 렌더링합니다.
export default function CompoundPage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-20">계산기 로딩 중...</div>}>
            <CompoundClient />
        </Suspense>
    );
}