"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Search, History, Calendar, DollarSign, AlertCircle, Share2, ClipboardCheck } from 'lucide-react';

// CustomTooltip 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const valuation = payload.find((p: any) => p.dataKey === 'valuation');
        const principal = payload.find((p: any) => p.dataKey === 'principal');
        
        if (!valuation || !principal) return null;

        const profit = valuation.value - principal.value;
        const roi = ((profit / principal.value) * 100).toFixed(2);
        const isPlus = profit >= 0;

        return (
            <div className="bg-gray-900/95 border border-gray-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[200px]">
                <p className="text-gray-400 text-xs mb-3 font-bold">{label}</p>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-blue-400">● 투자 원금</span>
                        <span className="text-gray-300">{principal.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className={`${isPlus ? 'text-red-400' : 'text-blue-400'}`}>● 평가 금액</span>
                        <span className="text-white font-bold">{valuation.value.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-gray-400 text-xs">수익률</span>
                        <span className={`text-sm font-black ${isPlus ? 'text-red-500' : 'text-blue-500'}`}>
                            {isPlus ? '+' : ''}{roi}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function BacktestClient() {
    const [ticker, setTicker] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isKRStock, setIsKRStock] = useState(true); 
    
    const [years, setYears] = useState(3);
    const [monthlyAmount, setMonthlyAmount] = useState(50); 

    const [chartData, setChartData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [shareMessage, setShareMessage] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const blockSearchEffect = useRef(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchInput.length < 1) {
                setSearchResults([]);
                return;
            }
            if (blockSearchEffect.current) {
                blockSearchEffect.current = false;
                return;
            }

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`);
                const data = await res.json();
                setSearchResults(data.result || []);
                if (data.result?.length > 0) setShowDropdown(true);
            } catch (e) {
                console.error("Search failed", e);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSelectStock = (item: any) => {
        blockSearchEffect.current = true;
        setTicker(item.symbol);
        setSearchInput(`${item.name} (${item.symbol})`);
        setIsKRStock(item.isKR); 
        setSearchResults([]);
        setShowDropdown(false);
    };

    const runBacktest = async () => {
        if (!ticker) { alert("종목을 먼저 검색해주세요!"); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/backtest?ticker=${ticker}&years=${years}&amount=${monthlyAmount}`);
            const data = await res.json();
            
            if (data.error) { 
                alert("데이터를 불러오지 못했습니다. (상장 기간이 짧거나 데이터 오류)"); 
                setChartData([]);
                setSummary(null);
                return; 
            }
            
            setChartData(data.chartData);
            setSummary(data.summary);
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleShare = useCallback(() => {
        if (!summary) return;
        
        const stockName = encodeURIComponent(searchInput.split('(')[0].trim());
        const shareLink = `${window.location.origin}/backtest?ticker=${ticker}&years=${years}&amount=${monthlyAmount}&name=${stockName}&run=true`;
        
        navigator.clipboard.writeText(shareLink).then(() => {
            setShareMessage('링크가 복사되었습니다!');
            setTimeout(() => setShareMessage(''), 3000);
        }).catch(err => {
            setShareMessage('복사 실패');
        });

    }, [ticker, years, monthlyAmount, searchInput, summary]);

    const fmt = (n: number) => n?.toLocaleString();
    const currencyUnit = isKRStock ? '만원' : '$';

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
            <div className="max-w-md w-full p-4 space-y-6">

                {/* Header */}
                <div className="text-center mt-4">
                    <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
                        <History className="text-purple-500" /> 스톡 타임머신
                    </h1>
                    <p className="text-gray-500 text-xs">그때 샀더라면... 적립식 투자 시뮬레이션</p>
                </div>

                {/* 검색창 */}
                <div className="relative z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 shadow-lg flex items-center px-4 py-2">
                        <Search className="text-gray-500 mr-2" size={20}/>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="종목명 입력 (예: 삼성전자, Apple)"
                            className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder-gray-600 text-white"
                        />
                    </div>
                    {/* 검색 결과 드롭다운 */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map((item, idx) => (
                                <button key={idx} 
                                    onMouseDown={() => handleSelectStock(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-700 flex justify-between items-center border-b border-gray-700/50">
                                    <span className="font-bold text-white text-sm">{item.name}</span>
                                    <div className="text-right">
                                        <span className="text-xs text-blue-400 font-mono block">{item.symbol}</span>
                                        {item.isKR && <span className="text-[10px] bg-gray-600 px-1 rounded text-gray-300">KRX</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 설정 패널 */}
                <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                <Calendar size={14} /> 투자 기간
                            </label>
                            <select 
                                value={years} 
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none"
                            >
                                {[1, 3, 5, 10, 20].map(y => <option key={y} value={y}>{y}년 전부터</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                <DollarSign size={14} /> 월 투자액 ({currencyUnit})
                            </label>
                            <input 
                                type="number" 
                                value={monthlyAmount} 
                                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                                className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-right"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={runBacktest}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "데이터 분석 중... ⏳" : "🚀 과거로 출발"}
                    </button>
                </div>

                {/* 결과 화면 */}
                {summary && (
                    <div className="animate-fade-in space-y-6">
                        {/* 1. 결과 요약 카드 */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${Number(summary.roi) >= 0 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            
                            <div className="relative z-10 text-center">
                                <div className="inline-block bg-gray-950/50 px-3 py-1 rounded-full border border-gray-700 mb-4">
                                    <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                                        <Calendar size={12} className="text-gray-400"/>
                                        {summary.message}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-400">최종 수익률</p>
                                
                                <div className="flex justify-center items-baseline gap-2 my-1">
                                    <h2 className={`text-4xl font-black ${Number(summary.roi) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {Number(summary.roi) >= 0 ? '+' : ''}{summary.roi}%
                                    </h2>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded-lg">
                                        연평균 {summary.annualRoi}%
                                    </span>
                                </div>

                                <div className="mt-4 text-xs text-gray-500 flex justify-center gap-4 bg-black/20 py-3 rounded-xl">
                                     <div className="text-right">
                                        <span className="block text-gray-400 mb-1">총 투자 원금</span>
                                        <span className="font-bold text-gray-200 text-lg">{fmt(summary.totalPrincipal)}{currencyUnit}</span>
                                     </div>
                                     <div className="text-gray-600 flex items-center">→</div>
                                     <div className="text-left">
                                        <span className="block text-gray-400 mb-1">현재 평가금</span>
                                        <span className="font-bold text-white text-lg">{fmt(summary.totalValuation)}{currencyUnit}</span>
                                     </div>
                                </div>
                                
                                {/* 공유하기 버튼 */}
                                <div className="mt-4">
                                    <button
                                        onClick={handleShare}
                                        className="inline-flex items-center justify-center gap-2 bg-purple-700/50 hover:bg-purple-700 text-purple-200 text-sm font-medium px-4 py-2 rounded-lg transition-all active:scale-95"
                                    >
                                        {shareMessage ? <ClipboardCheck size={16}/> : <Share2 size={16}/>}
                                        {shareMessage || '결과 공유하기'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. 차트 영역 */}
                        <div className="h-72 w-full bg-gray-900 rounded-3xl border border-gray-800 p-4 shadow-xl">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={Number(summary.roi) >= 0 ? "#f87171" : "#60a5fa"} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={Number(summary.roi) >= 0 ? "#f87171" : "#60a5fa"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} minTickGap={30} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    
                                    <Area 
                                        type="monotone" 
                                        dataKey="principal" 
                                        stackId="2" 
                                        stroke="#3b82f6" 
                                        fill="transparent" 
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        name="원금"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="valuation" 
                                        stackId="1" 
                                        stroke={Number(summary.roi) >= 0 ? "#f87171" : "#60a5fa"} 
                                        fill="url(#colorVal)" 
                                        strokeWidth={3}
                                        name="평가금"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 3. 인사이트 메시지 */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 items-start">
                            <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-yellow-200/80 leading-relaxed">
                                <b>데이터 분석 기간:</b> 사용자가 {years}년을 요청했지만, 데이터 사정(상장 기간 등)에 따라 <b>실제로는 {summary.startDate}부터 약 {summary.durationYears}년간</b> 분석되었습니다. 결과에 참고해 주세요.
                            </p>
                        </div>
                    </div>
                )}

                {/* SEO 및 정보성 텍스트 섹션 */}
                <section className="mt-20 pt-10 border-t border-gray-900 text-gray-600 space-y-8 pb-10">
                    
                    <article>
                        <h2 className="text-sm font-bold text-gray-500 mb-3 border-b border-gray-800 pb-1">📈 스톡 타임머신: 적립식 투자 시뮬레이션 가이드</h2>
                        <div className="text-xs leading-5 space-y-3">
                            <strong className="text-gray-400 block">이 계산기는 과거 데이터를 기반으로 한 가장 현실적인 백테스팅을 제공합니다.</strong>
                            <p>
                                <strong>스톡 타임머신</strong>은 투자자들이 종종 하는 후회, "그때 그 종목을 꾸준히 샀더라면"을 실제 수익률로 확인해 볼 수 있도록 설계되었습니다. 삼성전자, 애플(AAPL), 테슬라(TSLA), S&P 500 ETF(VOO) 등 국내외 주요 종목을 선택하여, 매월 일정 금액을 자동 적립했을 때의 최종 자산 가치를 시뮬레이션합니다. 
                            </p>
                            <p>
                                이는 감정에 치우친 투자가 아닌, 데이터 기반의 **장기 분산 투자 전략(DCA, Dollar-Cost Averaging)**이 얼마나 강력한 복리 효과를 발휘하는지 눈으로 보여줍니다. 차트에서 원금 선(점선)과 평가금 선(실선)이 멀어질수록 자산이 빠르게 증가하고 있다는 의미입니다.
                            </p>
                        </div>
                    </article>

                    <article>
                        <h3 className="text-xs font-bold text-gray-500 mb-2">핵심 분석 지표 해설 (ROI vs CAGR)</h3>
                        <ul className="text-xs leading-5 list-disc list-inside space-y-2 pl-4">
                            <li>
                                <strong>총 수익률 (ROI):</strong> 총 투자 원금 대비 최종 평가금의 증가율을 %로 보여줍니다. 이는 투자 기간 전체의 성과를 나타냅니다.
                            </li>
                            <li>
                                <strong>연평균 수익률 (CAGR):</strong> 투자 기간을 고려하여 매년 복리로 몇 %의 수익을 올렸는지 나타내는 지표입니다.  이 수치가 높을수록 해당 종목의 장기 성장성이 우수하다고 평가할 수 있습니다.
                            </li>
                            <li>
                                <strong>최대 낙폭 (MDD, Max Drawdown):</strong> 이 계산기에는 직접 표시되지 않지만, 그래프의 가장 높은 지점에서 가장 낮은 지점까지의 하락률을 미리 체험하는 것이 백테스팅의 가장 중요한 목적입니다.
                            </li>
                        </ul>
                    </article>

                    <div className="text-[10px] text-gray-700 mt-8">
                        <p>※ 본 시뮬레이션 결과는 과거 데이터에 기반하며, 배당금이나 수수료는 포함되지 않은 순수한 주가 변동에 따른 결과입니다. 미래의 수익을 보장하지 않으며, 모든 투자의 책임은 본인에게 있습니다.</p>
                    </div>
                </section>

            </div>
        </div>
    );
}