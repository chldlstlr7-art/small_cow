import type { Metadata } from 'next';
import { Suspense } from 'react';
import DividendClient from './DividendClient'; // 클라이언트 컴포넌트 import

// 1. 서버 컴포넌트에서 SEO 메타데이터를 정의합니다. (Head 태그 대체)
export const metadata: Metadata = {
    title: '미국주식 배당금 계산기 | 월배당, 세후 수령액, 배당락일 조회',
    description: '내가 가진 주식, 배당금은 얼마일까? Realty Income(O), SCHD, JEPI 등 미국/한국 주식의 세후 월 배당금을 계산하고 배당락일을 확인하세요.',
    keywords: [
        "배당금계산기", 
        "월배당", 
        "미국주식", 
        "배당락일", 
        "배당세금", 
        "SCHD배당금", 
        "리얼티인컴", 
        "주식계산기",
        "스톡파일럿"
    ],
    openGraph: {
        title: "배당금 계산기 - 잠자는 동안 들어오는 불로소득 계산",
        description: "세금 15.4%를 뗀 실제 통장에 꽂히는 금액을 확인해보세요.",
    },
}

// 2. 서버 컴포넌트는 클라이언트 컴포넌트를 렌더링합니다.
export default function DividendPage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-20">배당금 계산기 로딩 중... 💰</div>}>
            <DividendClient />
        </Suspense>
    );
}