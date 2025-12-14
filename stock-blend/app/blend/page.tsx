import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlendClient from './BlendClient';

// 1. 서버 컴포넌트에서 SEO 메타데이터를 정의합니다. (가장 중요)
export const metadata: Metadata = {
    title: '주식 물타기 계산기 - 평단가, 수익률 시뮬레이션 | 스톡파일럿',
    description: '실시간 시세 기반의 주식 물타기(평단가 낮추기) 및 불타기 시뮬레이터. 추가 매수 수량 및 금액에 따른 최종 평단가와 예상 수익률 변화를 차트로 확인하세요.',
    keywords: [
        "물타기 계산기", 
        "평단가 계산", 
        "주식 평단가", 
        "불타기 계산", 
        "추가 매수", 
        "주식 수익률", 
        "손익분기점",
        "스톡파일럿"
    ],
}

// 2. 서버 컴포넌트는 클라이언트 컴포넌트(BlendClient)를 렌더링하고,
// searchParams에 접근하는 Hook 때문에 Suspense로 감쌉니다.
export default function BlendPage() {
    return (
        <Suspense fallback={<div className="text-white text-center p-20">계산기 로딩 중...</div>}>
            <BlendClient />
        </Suspense>
    );
}