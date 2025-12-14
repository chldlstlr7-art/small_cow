"use client";

import { useState, useEffect } from 'react';
// import Head from 'next/head'; // ❌ 제거됨: 메타데이터는 page.tsx에서 처리
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
    Calculator, Calendar, DollarSign, TrendingUp, Percent, RefreshCcw, Table as TableIcon, PieChart, Info, BookOpen 
} from 'lucide-react';

// ----------------------------------------------------------------------
// 1. 기존 UI 컴포넌트 유지 (툴팁, 슬라이더 등)
// ----------------------------------------------------------------------

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const principal = payload.find((p: any) => p.dataKey === 'principal');
        const interest = payload.find((p: any) => p.dataKey === 'interest');
        const total = (principal?.value || 0) + (interest?.value || 0);

        return (
            <div className="bg-gray-900/95 border border-gray-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[180px] z-50">
                <p className="text-gray-400 text-xs mb-3 font-bold">{label}년 후 자산</p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-blue-400 flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> 순수 원금
                        </span>
                        <span className="font-medium text-gray-300">{principal?.value?.toLocaleString()}만원</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-emerald-400 flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 복리 이자
                        </span>
                        <span className="font-medium text-gray-300">{interest?.value?.toLocaleString()}만원</span>
                    </div>
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

// --- 클라이언트 메인 컴포넌트 ---
export default function CompoundClient() {
    // --- State ---
    const [initialMoney, setInitialMoney] = useState<number>(1000);
    const [monthlyMoney, setMonthlyMoney] = useState<number>(100);
    const [rate, setRate] = useState<number>(10);
    const [years, setYears] = useState<number>(10);
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

    const [chartData, setChartData] = useState<any[]>([]);
    const [finalResult, setFinalResult] = useState({
        totalPrincipal: 0,
        totalInterest: 0,
        totalAmount: 0,
        roi: 0
    });

    // --- Calculation Logic ---
    useEffect(() => {
        const data = [];
        let currentPrincipal = initialMoney;
        let currentInterest = 0;
        let totalInvested = initialMoney;

        // 0년차
        data.push({
            year: 0,
            principal: totalInvested,
            interest: 0,
            total: totalInvested,
        });

        const months = years * 12;
        const monthlyRate = rate / 100 / 12;

        for (let i = 1; i <= months; i++) {
            const interestEarned = (currentPrincipal + currentInterest) * monthlyRate;
            currentInterest += interestEarned;
            currentPrincipal += monthlyMoney;
            totalInvested += monthlyMoney;

            if (i % 12 === 0) {
                data.push({
                    year: i / 12,
                    principal: totalInvested,
                    interest: Math.round(currentInterest),
                    total: Math.round(totalInvested + currentInterest),
                });
            }
        }

        setChartData(data);
        const totalAmt = Math.round(totalInvested + currentInterest);
        setFinalResult({
            totalPrincipal: totalInvested,
            totalInterest: Math.round(currentInterest),
            totalAmount: totalAmt,
            roi: totalInvested > 0 ? ((totalAmt - totalInvested) / totalInvested) * 100 : 0
        });
    }, [initialMoney, monthlyMoney, rate, years]);

    const fmt = (num: number) => num.toLocaleString();

    // 슬라이더 컴포넌트
    const InputGroup = ({ label, icon: Icon, value, setValue, min, max, step, unit, presets }: any) => (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                    <Icon size={14} className="text-emerald-500" /> {label}
                </label>
                <span className="text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded">
                    {value.toLocaleString()}{unit}
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <input 
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="relative w-24">
                    <input 
                        type="number" value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full bg-black/30 border border-gray-700 rounded-lg p-2 text-right text-sm text-white font-bold outline-none focus:border-emerald-500 transition"
                    />
                </div>
            </div>

            {presets && (
                <div className="flex gap-2">
                    {presets.map((v: number) => (
                        <button key={v} onClick={() => setValue(value + v)} 
                            className="flex-1 py-1.5 bg-gray-800/50 border border-gray-700 rounded text-[10px] text-gray-400 hover:bg-gray-700 hover:text-white transition">
                            +{v}{unit}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center">
            
            {/* ----------------------------------------------------------------------
             // ❌ <Head> 태그는 제거됨: page.tsx에서 메타데이터 처리 완료
             ---------------------------------------------------------------------- */}

            <div className="max-w-md w-full p-4 space-y-6 pb-20">
                
                {/* Header */}
                <div className="text-center mt-6 mb-2">
                    <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
                        <TrendingUp className="text-emerald-500" /> 복리 계산기 Pro
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">시간이 만들어내는 자산의 마법</p>
                </div>

                {/* 📊 Result Dashboard */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <p className="text-xs text-gray-400 font-medium tracking-wide">TOTAL ASSETS IN {years} YEARS</p>
                        <div className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            수익률 {finalResult.roi.toFixed(1)}%
                        </div>
                    </div>

                    <div className="flex items-baseline gap-1 relative z-10">
                        <span className="text-4xl font-black text-white tracking-tight">{fmt(finalResult.totalAmount)}</span>
                        <span className="text-lg text-gray-400 font-bold">만원</span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                            <span className="block text-[10px] text-gray-500 mb-1">순수 원금</span>
                            <span className="font-bold text-gray-200">{fmt(finalResult.totalPrincipal)}만원</span>
                        </div>
                        <div className="bg-emerald-900/10 p-3 rounded-2xl border border-emerald-500/20">
                            <span className="block text-[10px] text-emerald-500/70 mb-1">복리 이자 수익</span>
                            <span className="font-bold text-emerald-400">+{fmt(finalResult.totalInterest)}만원</span>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                    <button 
                        onClick={() => setViewMode('chart')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${viewMode === 'chart' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <PieChart size={14} /> 차트 보기
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${viewMode === 'table' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <TableIcon size={14} /> 상세 표
                    </button>
                </div>

                {/* 📈 Chart or 📝 Table Section */}
                <div className="w-full bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl min-h-[280px]">
                    {viewMode === 'chart' ? (
                        <div className="h-72 w-full p-4 pt-6">
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
                                    <XAxis dataKey="year" tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={(v)=> `${v}년`} />
                                    <YAxis tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={(value) => `${(value/10000).toFixed(0)}억`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="principal" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPrincipal)" animationDuration={1000} />
                                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#colorInterest)" animationDuration={1000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 overflow-y-auto scrollbar-hide">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-gray-800 text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 text-center">연도</th>
                                        <th className="p-3">원금</th>
                                        <th className="p-3">이자</th>
                                        <th className="p-3 text-white">총액</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {chartData.map((row) => (
                                        <tr key={row.year} className="hover:bg-gray-800/50 transition">
                                            <td className="p-3 text-center text-gray-500">{row.year}년차</td>
                                            <td className="p-3 text-gray-400">{row.principal.toLocaleString()}</td>
                                            <td className="p-3 text-emerald-400">+{row.interest.toLocaleString()}</td>
                                            <td className="p-3 font-bold text-white">{row.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 🎛️ Control Panel */}
                <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-8 shadow-lg">
                    
                    <InputGroup 
                        label="초기 투자금" icon={DollarSign} unit="만원"
                        value={initialMoney} setValue={setInitialMoney}
                        min={0} max={10000} step={100} presets={[100, 500, 1000]}
                    />

                    <InputGroup 
                        label="월 적립액" icon={RefreshCcw} unit="만원"
                        value={monthlyMoney} setValue={setMonthlyMoney}
                        min={0} max={1000} step={10} presets={[10, 50, 100]}
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Percent size={14} className="text-emerald-500" /> 연 수익률
                            </label>
                            <input 
                                type="range" min={1} max={30} step={0.5} value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="text-center font-bold text-white text-lg">{rate}%</div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar size={14} className="text-emerald-500" /> 투자 기간
                            </label>
                            <input 
                                type="range" min={1} max={50} step={1} value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="text-center font-bold text-white text-lg">{years}년</div>
                        </div>
                    </div>

                    {/* 수익률 프리셋 */}
                    <div className="flex gap-2 justify-center pt-2">
                        {[
                            { l: '예금', v: 3.5, c: 'text-gray-400 border-gray-700' },
                            { l: 'S&P500', v: 10, c: 'text-blue-400 border-blue-900/50 bg-blue-900/10' },
                            { l: '공격적', v: 20, c: 'text-red-400 border-red-900/50 bg-red-900/10' },
                        ].map((item) => (
                            <button key={item.v} onClick={() => setRate(item.v)} 
                                className={`px-3 py-1.5 rounded-full text-[10px] border ${item.c} hover:opacity-80 transition`}>
                                {item.l} ({item.v}%)
                            </button>
                        ))}
                    </div>
                </div>

                {/* ----------------------------------------------------------------------
                    3. Rich Content Section (SEO & Information)
                ---------------------------------------------------------------------- */}
                <article className="mt-12 space-y-10 text-gray-300">
                    
                    {/* 섹션 1: 복리의 마법 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <BookOpen size={20} />
                            <h2 className="text-xl font-bold text-white">왜 '복리'가 중요할까요?</h2>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-gray-400">
                            아인슈타인은 복리를 <strong className="text-white">"세계 8대 불가사의"</strong>라고 불렀습니다.
                            단리(Simple Interest)가 원금에 대해서만 이자가 붙는다면, 
                            복리(Compound Interest)는 <span className="text-emerald-400 font-bold">이자에 이자가 붙는 구조</span>입니다.
                            초기에는 차이가 미미해보이지만, 시간이 지날수록 그래프는 기하급수적으로 상승하는 'J커브'를 그리게 됩니다.
                            이것이 바로 자산 증식의 핵심인 <strong>스노우볼 효과(Snowball Effect)</strong>입니다.
                        </p>
                    </section>

                    {/* 섹션 2: 72의 법칙 */}
                    <section className="space-y-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Info size={20} />
                            <h2 className="text-xl font-bold text-white">72의 법칙 (Rule of 72)</h2>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            복잡한 계산기 없이 내 돈이 언제 2배가 될지 알 수 있는 마법의 공식입니다. 
                        </p>
                        
                        <div className="bg-gray-800 p-4 rounded-xl text-center">
                            <span className="font-mono text-lg font-bold text-white">72 ÷ 연 수익률(%) = 2배가 되는 기간(년)</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            예: 수익률이 10%라면? (72 ÷ 10 = 약 7.2년 후 원금 2배)
                        </p>
                    </section>

                    {/* 섹션 3: 핵심 팁 */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white">투자의 3가지 핵심 요소</h2>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-emerald-500 font-bold shrink-0">1</span>
                                <span>
                                    <strong className="text-gray-200 block">시간 (Time)</strong>
                                    복리의 마법을 부리는 가장 강력한 재료는 시간입니다. 하루라도 일찍 시작하는 것이 수익률을 1% 올리는 것보다 중요할 수 있습니다.
                                </span>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-emerald-500 font-bold shrink-0">2</span>
                                <span>
                                    <strong className="text-gray-200 block">수익률 (Rate)</strong>
                                    S&P500의 역사적 평균 수익률은 약 10%입니다. 너무 낮은 금리의 예금보다는 적절한 투자가 필요합니다.
                                </span>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-emerald-500 font-bold shrink-0">3</span>
                                <span>
                                    <strong className="text-gray-200 block">지속성 (Consistency)</strong>
                                    거치식 투자보다 매월 일정 금액을 적립하는 적립식 투자가 리스크를 줄이고 자산을 안정적으로 불려줍니다.
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* 수식 정보 섹션 */}
                    <section className="pt-6 border-t border-gray-800 text-center">
                        <h3 className="text-sm font-bold text-gray-500 mb-2">복리 계산 공식</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            복리 공식은 초기 투자금, 연 이자율, 복리 횟수, 투자 기간을 종합하여 미래 자산 가치(A)를 산출합니다.
                        </p>
                        
                        <div className="bg-gray-800 p-4 rounded-xl text-center">
                            <span className="font-mono text-lg font-bold text-white block">
                                A = P * (1 + r/n)^(n*t)
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            A: 최종 금액, P: 초기 원금, r: 연 이자율, n: 복리 적용 횟수, t: 기간(년)
                        </p>
                        
                    </section>

                </article>

            </div>
        </div>
    );
}