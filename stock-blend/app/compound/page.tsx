"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Calculator, Calendar, DollarSign, TrendingUp, Percent, RefreshCcw } from 'lucide-react';

// 툴팁 디자인 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // payload[0]은 원금(blue), payload[1]은 이자(emerald)
    const principal = payload.find((p: any) => p.dataKey === 'principal');
    const interest = payload.find((p: any) => p.dataKey === 'interest');
    const total = (principal?.value || 0) + (interest?.value || 0);

    return (
      <div className="bg-gray-900/95 border border-gray-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[180px]">
        <p className="text-gray-400 text-xs mb-3 font-bold">{label}년 후 자산 현황</p>
        
        <div className="space-y-2">
            {/* 원금 표시 */}
            <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                  순수 원금
                </span>
                <span className="font-medium text-gray-300">{principal?.value?.toLocaleString()}만원</span>
            </div>

            {/* 이자 표시 */}
            <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 
                  복리 이자
                </span>
                <span className="font-medium text-gray-300">{interest?.value?.toLocaleString()}만원</span>
            </div>

            {/* 총 합계 표시 */}
            <div className="border-t border-gray-700 mt-2 pt-2 flex items-center justify-between gap-4">
                <span className="text-white font-bold text-sm">총 자산</span>
                <span className="font-black text-white text-sm">{total.toLocaleString()}만원</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function CompoundCalculator() {
  // --- State ---
  const [initialMoney, setInitialMoney] = useState<number>(1000); // 초기 투자금 (만원)
  const [monthlyMoney, setMonthlyMoney] = useState<number>(100);  // 월 적립액 (만원)
  const [rate, setRate] = useState<number>(10);                   // 연 이자율 (%)
  const [years, setYears] = useState<number>(10);                 // 투자 기간 (년)
  const [compoundFreq, setCompoundFreq] = useState<number>(12);   // 복리 횟수 (12=월복리)

  const [chartData, setChartData] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState({
    totalPrincipal: 0,
    totalInterest: 0,
    totalAmount: 0,
  });

  // --- Calculation Logic ---
  useEffect(() => {
    const data = [];
    let currentPrincipal = initialMoney;
    let currentInterest = 0;
    let totalInvested = initialMoney; // 순수 원금 누적

    // 0년차 (시작점)
    data.push({
      year: 0,
      principal: totalInvested,
      interest: 0,
      total: totalInvested,
    });

    const months = years * 12;
    const monthlyRate = rate / 100 / 12;

    for (let i = 1; i <= months; i++) {
      // 1. 이자 발생 (지난달 총액에 대한 이자)
      const interestEarned = (currentPrincipal + currentInterest) * monthlyRate;
      currentInterest += interestEarned;

      // 2. 월 적립금 추가
      currentPrincipal += monthlyMoney;
      totalInvested += monthlyMoney;

      // 3. 연 단위로 데이터 기록 (차트가 너무 빽빽하지 않게)
      if (i % 12 === 0) {
        data.push({
          year: i / 12,
          principal: totalInvested, // 내가 넣은 돈
          interest: Math.round(currentInterest), // 불어난 돈
          total: Math.round(totalInvested + currentInterest),
        });
      }
    }

    setChartData(data);
    setFinalResult({
      totalPrincipal: totalInvested,
      totalInterest: Math.round(currentInterest),
      totalAmount: Math.round(totalInvested + currentInterest),
    });
  }, [initialMoney, monthlyMoney, rate, years]);

  // 포맷팅 함수
  const fmt = (num: number) => num.toLocaleString();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
      <div className="max-w-md w-full p-4 space-y-6">
        
        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
            <TrendingUp className="text-emerald-500" /> 복리 계산기
          </h1>
          <p className="text-gray-500 text-xs">스노우볼 효과 시뮬레이션</p>
        </div>

        {/* 1. 📊 Result Cards (결과 요약) */}
        <div className="grid grid-cols-2 gap-3">
            {/* 최종 금액 */}
            <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <p className="text-sm text-gray-400 mb-1">In {years} years, you will have</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white tracking-tight">{fmt(finalResult.totalAmount)}</span>
                    <span className="text-sm text-gray-400 font-bold">만원</span>
                </div>
                <div className="mt-4 flex gap-4 text-xs">
                     <div>
                        <span className="block text-gray-500">순수 원금</span>
                        <span className="font-bold text-gray-300">{fmt(finalResult.totalPrincipal)}</span>
                     </div>
                     <div>
                        <span className="block text-gray-500">복리 수익</span>
                        <span className="font-bold text-emerald-400">+{fmt(finalResult.totalInterest)}</span>
                     </div>
                </div>
            </div>
        </div>

        {/* 2. 📈 Chart Section (Stacked Area) */}
        <div className="w-full bg-gray-900 rounded-3xl border border-gray-800 p-4 shadow-xl h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="year" tick={{fontSize: 10, fill: '#6b7280'}} />
                    <YAxis tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={(value) => `${value/10000}억`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="principal" stackId="1" stroke="#3b82f6" fill="url(#colorPrincipal)" name="원금" />
                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#10b981" fill="url(#colorInterest)" name="이자" />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* 3. 📝 Inputs Section */}
        <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-5 shadow-lg">
            
            {/* 초기 투자금 */}
            <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <DollarSign size={14} /> 초기 투자금 (만원)
                </label>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={initialMoney} 
                        onChange={(e) => setInitialMoney(Number(e.target.value))}
                        className="flex-1 bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500 transition"
                    />
                </div>
                <div className="flex gap-2 mt-2">
                    {[100, 500, 1000].map(v => (
                        <button key={v} onClick={() => setInitialMoney(initialMoney + v)} className="flex-1 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700 font-medium">
                            +{v}만
                        </button>
                    ))}
                </div>
            </div>

            {/* 월 적립액 */}
            <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <RefreshCcw size={14} /> 월 적립액 (만원)
                </label>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={monthlyMoney} 
                        onChange={(e) => setMonthlyMoney(Number(e.target.value))}
                        className="flex-1 bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500 transition"
                    />
                </div>
                <div className="flex gap-2 mt-2">
                    {[10, 50, 100].map(v => (
                        <button key={v} onClick={() => setMonthlyMoney(monthlyMoney + v)} className="flex-1 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700 font-medium">
                            +{v}만
                        </button>
                    ))}
                </div>
            </div>

            {/* 이자율 & 기간 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Percent size={14} /> 연 수익률 (%)
                    </label>
                    <input 
                        type="number" 
                        value={rate} 
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500 transition text-center"
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Calendar size={14} /> 투자 기간 (년)
                    </label>
                    <input 
                        type="number" 
                        value={years} 
                        onChange={(e) => setYears(Number(e.target.value))}
                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500 transition text-center"
                    />
                </div>
            </div>
            
            {/* 수익률 추천 버튼 */}
            <div className="pt-2">
                <p className="text-[10px] text-gray-500 mb-2">수익률 가이드</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button onClick={() => setRate(3.5)} className="px-3 py-1.5 bg-gray-800 rounded-full text-[11px] text-gray-400 whitespace-nowrap border border-gray-700">예금 (3.5%)</button>
                    <button onClick={() => setRate(10)} className="px-3 py-1.5 bg-gray-800 rounded-full text-[11px] text-blue-400 font-bold whitespace-nowrap border border-blue-900/50">S&P500 (10%)</button>
                    <button onClick={() => setRate(15)} className="px-3 py-1.5 bg-gray-800 rounded-full text-[11px] text-purple-400 font-bold whitespace-nowrap border border-purple-900/50">공격적 (15%)</button>
                    <button onClick={() => setRate(25)} className="px-3 py-1.5 bg-gray-800 rounded-full text-[11px] text-red-400 font-bold whitespace-nowrap border border-red-900/50">워렌버핏 (20%+)</button>
                </div>
            </div>

        </div>

        {/* Info */}
        <div className="text-center pb-8">
            <p className="text-[10px] text-gray-600">
                * 월복리 기준으로 계산되었으며, 세금 및 물가 상승률은 반영되지 않았습니다. <br/>
                주식 시장은 변동성이 있으므로 실제 수익과는 다를 수 있습니다.
            </p>
        </div>

      </div>
    </div>
  );
}