import Link from "next/link";
import { 
  TrendingDown, 
  TrendingUp, 
  History, 
  Calculator, 
  ArrowRight, 
  PieChart 
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* 1. Hero Section (타이틀 영역) */}
      <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
        <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight text-white">
          Stock <span className="text-blue-500">Pilot</span> <span className="text-4xl sm:text-6xl">✈️</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">
          <span className="text-gray-200 font-bold block sm:inline">"20년 전 엔비디아, 매달 1만원씩만 모았다면?"</span> <br className="hidden sm:block"/>
          상상만 하던 수익률, 과거 데이터로 직접 확인해보세요.
        </p>
      </div>
      
      {/* 2. Tools Grid (카드 메뉴 영역) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        
        {/* Card 1: 물타기 계산기 */}
        <Link href="/blend" className="group relative bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} className="text-blue-500" />
          </div>
          <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingDown className="text-blue-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
            물타기 계산기
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            물린 주식, 추가 매수하면 평단가가 얼마가 될까? <br/>
            탈출 시나리오를 미리 계획해보세요.
          </p>
          <div className="flex items-center text-blue-400 text-sm font-bold group-hover:gap-2 transition-all">
            계산하러 가기 <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>

        {/* Card 2: 복리 계산기 */}
        <Link href="/compound" className="group relative bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} className="text-emerald-500" />
          </div>
          <div className="bg-emerald-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="text-emerald-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
            복리 계산기
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            시간이 만들어내는 마법 같은 수익. <br/>
            매달 적립식 투자 시 미래 자산을 예측합니다.
          </p>
          <div className="flex items-center text-emerald-400 text-sm font-bold group-hover:gap-2 transition-all">
            스노우볼 굴리기 <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>

        {/* Card 3: 그때 샀더라면 (백테스트) */}
        <Link href="/backtest" className="group relative bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <History size={80} className="text-purple-500" />
          </div>
          <div className="bg-purple-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <History className="text-purple-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
            그때 샀더라면
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            "무조건 오른다고 할 때 살걸..." <br/>
            껄무새 탈출! 과거 실제 데이터로 수익률을 검증하세요.
          </p>
          <div className="flex items-center text-purple-400 text-sm font-bold group-hover:gap-2 transition-all">
            과거 여행 떠나기 <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>

        {/* Card 4: 배당금 계산기 (활성화됨) */}
        <Link href="/dividend" className="group relative bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-yellow-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChart size={80} className="text-yellow-500" />
          </div>
          <div className="bg-yellow-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PieChart className="text-yellow-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
            배당금 계산기
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            "리얼티 인컴 100주 있으면 월 얼마?" <br/>
            세금 뗀 실수령액을 바로 확인하세요.
          </p>
          <div className="flex items-center text-yellow-400 text-sm font-bold group-hover:gap-2 transition-all">
            용돈 계산기 켜기 <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>

        {/* Card 5: 단타 순수익 계산기 (활성화됨) */}
        <Link href="/daytrade" className="group relative bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-pink-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calculator size={80} className="text-pink-500" />
          </div>
          <div className="bg-pink-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calculator className="text-pink-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors">
            단타 순수익 계산기
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            매수/매도 수수료와 증권거래세를 포함한 <br/>
            정확한 **실현 순수익**을 계산하세요.
          </p>
          <div className="flex items-center text-pink-400 text-sm font-bold group-hover:gap-2 transition-all">
            순이익 확인하기 <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>

      </div>

      {/* Footer */}
      <footer className="mt-20 text-gray-600 text-xs text-center">
        <p>&copy; 2024 Stock Pilot. All rights reserved.</p>
        <p className="mt-1 opacity-50">투자의 책임은 본인에게 있습니다.</p>
      </footer>

    </main>
  );
}