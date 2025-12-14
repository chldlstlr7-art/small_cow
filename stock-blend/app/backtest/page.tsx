import type { Metadata } from 'next';
import BacktestClient from './BacktestClient'; // 위에서 분리한 컴포넌트 import

export const metadata: Metadata = {
  title: '스톡 타임머신 | 적립식 투자 백테스팅 계산기',
  description: '과거에 삼성전자, 애플을 샀더라면? 적립식 투자(DCA) 시뮬레이션으로 수익률과 자산 변화를 백테스트 해보세요.',
  keywords: ['주식', '백테스트', '적립식 투자', 'DCA', '삼성전자', '미국주식', '수익률 계산기', '스톡 타임머신'],
  openGraph: {
    title: '스톡 타임머신 - 그때 샀더라면 얼마일까?',
    description: '적립식 투자 백테스팅 시뮬레이션. 월 50만원씩 10년 투자 시 내 자산은?',
    type: 'website',
  },
};

export default function BacktestPage() {
  return <BacktestClient />;
}