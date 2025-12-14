"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Search, History, Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

// 툴팁 컴포넌트 (디자인 유지)
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

export default function BacktestCalculator() {
  // 상태 관리
  const [ticker, setTicker] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isKRStock, setIsKRStock] = useState(true); // 한국 주식 여부 확인용
  
  const [years, setYears] = useState(3);
  const [monthlyAmount, setMonthlyAmount] = useState(50); 

  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const blockSearchEffect = useRef(false);

  // ✅ 1. 님이 만든 /api/search 연동
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
            // 기존 API 호출
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`);
            const data = await res.json();
            // API가 { result: [...] } 형태이므로 data.result 사용
            setSearchResults(data.result || []);
            if (data.result?.length > 0) setShowDropdown(true);
        } catch (e) {
            console.error("Search failed", e);
        }
    }, 300); // 0.3초 딜레이 (타자 칠 때마다 요청 방지)
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ 2. 종목 선택 핸들러
  const handleSelectStock = (item: any) => {
      blockSearchEffect.current = true;
      setTicker(item.symbol);
      setSearchInput(`${item.name} (${item.symbol})`);
      setIsKRStock(item.isKR); // 한국 주식인지 저장 (화폐 단위 표시용)
      setSearchResults([]);
      setShowDropdown(false);
  };

  // ✅ 3. 백테스트 실행 핸들러
  const runBacktest = async () => {
      if (!ticker) { alert("종목을 먼저 검색해주세요!"); return; }
      setLoading(true);
      try {
          const res = await fetch(`/api/backtest?ticker=${ticker}&years=${years}&amount=${monthlyAmount}`);
          const data = await res.json();
          
          if (data.error) { 
              alert("데이터를 불러오지 못했습니다. (상장 기간이 짧을 수 있습니다)"); 
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

  const fmt = (n: number) => n?.toLocaleString();
  const currencyUnit = isKRStock ? '만원' : '$'; // 단위 표시

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
                            // item 전체를 넘겨줍니다
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
                        {/* 📅 실제 기간 표시 메시지 (NEW) */}
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
                            {/* 📈 연평균 수익률 표시 (NEW) */}
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
                    </div>
                </div>

                {/* 2. 차트 영역 (변경 없음) */}
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
                        <b>분석 기간:</b> 사용자가 {years}년을 요청했지만, 데이터 사정에 따라 <b>실제로는 {summary.startDate}부터 약 {summary.durationYears}년간</b> 분석되었습니다.
                    </p>
                </div>
            </div>
        )}
        </div>
    </div>
  );
}