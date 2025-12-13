"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot 
} from 'recharts';
import { Share2, Search, TrendingUp, RotateCcw, Wallet, Calculator, Github, ArrowRight } from 'lucide-react';

const POPULAR_STOCKS = ["TSLA", "NVDA", "AAPL", "MSFT", "SOXL", "TQQQ", "AMZN", "GOOGL", "PLTR", "IONQ"];
const BROKERS = [
  { id: 'toss', name: '토스', rate: 0.001 },
  { id: 'kiwoom', name: '키움', rate: 0.0007 },
  { id: 'namuh', name: '나무', rate: 0.0025 },
  { id: 'koreainv', name: '한투', rate: 0.002 },
  { id: 'custom', name: '직접', rate: 0.001 }
];
const RANGES = [
  { label: '1M', val: '1mo' },
  { label: '3M', val: '3mo' },
  { label: '1Y', val: '1y' },
  { label: '3Y', val: '3y' },
  { label: 'MAX', val: 'max' },
];

export default function Home() {
  return (
    <Suspense fallback={<div className="text-white text-center p-20">Loading...</div>}>
      <StockCalculator />
    </Suspense>
  );
}

function StockCalculator() {
  const searchParams = useSearchParams();

  // --- State ---
  const [ticker, setTicker] = useState('');
  const [avgPrice, setAvgPrice] = useState<number | ''>('');
  const [holdQty, setHoldQty] = useState<number | ''>('');
  
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [range, setRange] = useState('3mo');
  
  const [addQty, setAddQty] = useState<number>(0);
  const [inputCash, setInputCash] = useState<number | ''>('');
  const [calcMode, setCalcMode] = useState<'qty' | 'cash'>('qty');

  const [loading, setLoading] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(BROKERS[0]);
  const [customRate, setCustomRate] = useState(0.1);

  // 날짜 차이 계산
  const getDaysAgo = (dateStr: string) => {
    try {
        const parts = dateStr.split('.').map(s => s.trim()).filter(s => s !== "");
        const now = new Date();
        let target: Date;

        if (parts.length === 2) {
            target = new Date(now.getFullYear(), parseInt(parts[0]) - 1, parseInt(parts[1]));
            if (target > now) target.setFullYear(now.getFullYear() - 1);
        } else if (parts.length === 3) {
            target = new Date(2000 + parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            return "";
        }

        const diffTime = now.getTime() - target.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 0) return "(오늘)";
        if (diffDays === 1) return "(어제)";
        if (diffDays < 30) return `(${diffDays}일 전)`;
        if (diffDays < 365) return `(${Math.floor(diffDays/30)}달 전)`;
        return `(${Math.floor(diffDays/365)}년 전)`;
    } catch (e) {
        return "";
    }
  };

  useEffect(() => {
    const qTicker = searchParams.get('ticker');
    const qAvg = searchParams.get('avg');
    const qQty = searchParams.get('qty');
    const qPrice = searchParams.get('price'); 

    if (qTicker) {
      setTicker(qTicker);
      if (qPrice) setCurrentPrice(Number(qPrice));
      fetchStockData(qTicker, '3mo');
    }
    if (qAvg) setAvgPrice(Number(qAvg));
    if (qQty) setHoldQty(Number(qQty));
  }, [searchParams]);

  const fetchStockData = async (symbol: string, selectedRange: string) => {
    if (!symbol) return;
    setLoading(true);
    setRange(selectedRange);
    try {
      const res = await fetch(`/api/stock?ticker=${symbol}&range=${selectedRange}`);
      const data = await res.json();
      if (data.error) { alert("데이터 로딩 실패"); return; }
      setCurrentPrice(data.price);
      setChartData(data.chartData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const feeRateDecimal = selectedBroker.id === 'custom' ? customRate / 100 : selectedBroker.rate;
  const myAvg = Number(avgPrice) || 0;
  const myQty = Number(holdQty) || 0;
  
  let finalAddQty = addQty;
  if (calcMode === 'cash' && typeof inputCash === 'number') {
      finalAddQty = currentPrice > 0 ? Math.floor(inputCash / currentPrice) : 0;
  }

  const buyPrice = currentPrice;
  const totalOldCost = myAvg * myQty;
  const totalNewCost = buyPrice * finalAddQty;
  const totalQty = myQty + finalAddQty;
  
  const newAvg = totalQty > 0 ? (totalOldCost + totalNewCost) / totalQty : 0;
  const isProfitable = myAvg > 0 && currentPrice > myAvg;

  // --- 수익률 계산 ---
  const oldReturn = myAvg > 0 ? ((currentPrice - myAvg) / myAvg) * 100 : 0;
  const newReturn = newAvg > 0 ? ((currentPrice - newAvg) / newAvg) * 100 : 0;
  const returnDiff = newReturn - oldReturn;

  // --- Find Last Hit Point ---
  const findLastHitPoint = (targetPrice: number) => {
    if (chartData.length === 0 || targetPrice <= 0) return null;
    const isTargetAbove = currentPrice < targetPrice; 
    for (let i = chartData.length - 1; i >= 0; i--) {
        const p = chartData[i].price;
        if (isTargetAbove) {
            if (p >= targetPrice) return chartData[i];
        } else {
            if (p <= targetPrice) return chartData[i];
        }
    }
    return null;
  };

  const myAvgLastHit = useMemo(() => findLastHitPoint(myAvg), [chartData, myAvg, currentPrice]);
  const newAvgLastHit = useMemo(() => findLastHitPoint(newAvg), [chartData, newAvg, currentPrice]);

  const getChartDomain = () => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const prices = chartData.map(d => d.price);
    let min = Math.min(...prices);
    let max = Math.max(...prices);
    if (myAvg > 0) { min = Math.min(min, myAvg); max = Math.max(max, myAvg); }
    if (newAvg > 0) { min = Math.min(min, newAvg); max = Math.max(max, newAvg); }
    const padding = (max - min) * 0.15;
    return [min - padding, max + padding];
  };

  const handleShare = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      ticker,
      avg: avgPrice.toString(),
      qty: holdQty.toString(),
      price: currentPrice.toString(),
    });
    navigator.clipboard.writeText(`${baseUrl}?${params.toString()}`);
    const msg = isProfitable ? "📈 수익 인증 링크 복사 완료!" : "🚨 구조요청 링크 복사 완료!";
    alert(msg);
  };

  const fmt = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
      <div className="max-w-md w-full p-4 space-y-6">
        
        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
            <TrendingUp className="text-blue-500" /> Stock Reality
          </h1>
          <p className="text-gray-500 text-xs">희망회로 돌리기 전 팩트 체크</p>
        </div>

        {/* Quick Search */}
        <div className="grid grid-cols-5 gap-2">
          {POPULAR_STOCKS.map(s => (
            <button 
              key={s} onClick={() => { setTicker(s); fetchStockData(s, '3mo'); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${ticker === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 shadow-lg flex items-center px-4 py-2">
          <input 
            type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchStockData(ticker, '3mo')}
            placeholder="종목 입력 (예: TQQQ)"
            className="flex-1 bg-transparent border-none outline-none text-xl font-bold uppercase placeholder-gray-700"
          />
          <button onClick={() => fetchStockData(ticker, '3mo')} className="text-blue-500">
            {loading ? "..." : <Search size={24} />}
          </button>
        </div>

        {/* 📊 Chart Section */}
        {chartData.length > 0 && (
          <div className="relative w-full bg-gray-900 rounded-3xl border border-gray-800 overflow-visible shadow-2xl mt-8">
            {/* Range Controls */}
            <div className="absolute -top-10 right-0 flex gap-1 z-30">
                {RANGES.map((r) => (
                    <button 
                        key={r.val} onClick={() => fetchStockData(ticker, r.val)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${range === r.val ? 'bg-gray-700 text-white border-gray-500' : 'bg-gray-900 text-gray-500 border-gray-800'}`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Current Price Badge */}
            <div className="absolute -top-6 left-4 z-20">
                <div className={`flex items-center gap-2 text-2xl font-black drop-shadow-xl bg-gray-950/90 px-3 py-1 rounded-lg backdrop-blur border border-gray-800 ${isProfitable ? 'text-red-400' : 'text-blue-400'}`}>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">현재가:</span>
                  ${fmt(currentPrice)}
                </div>
            </div>

            <div className="h-80 pt-8 pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfitable ? "#f87171" : "#3b82f6"} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={isProfitable ? "#f87171" : "#3b82f6"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} minTickGap={40} />
                  <YAxis domain={getChartDomain()} hide />
                  <Tooltip contentStyle={{backgroundColor: '#111827', border: 'none', borderRadius: '8px', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
                  
                  <Area type="linear" dataKey="price" stroke={isProfitable ? "#f87171" : "#3b82f6"} strokeWidth={2} fill="url(#colorPrice)" />

                  {/* 1. 내 평단 (Right Side) */}
                  {myAvg > 0 && (
                    <ReferenceLine 
                        y={myAvg} stroke="#ef4444" strokeDasharray="3 3" 
                        label={({ viewBox }) => (
                            <text x={viewBox.width - 5} y={viewBox.y - 8} textAnchor="end" fill="#ef4444" fontSize={13} fontWeight="bold">
                                내 평단 ${fmt(myAvg)} ▶
                            </text>
                        )}
                    />
                  )}
                  {/* 내 평단 도달점 (Red) */}
                  {myAvgLastHit && (
                    <ReferenceDot x={myAvgLastHit.date} y={myAvg} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
                  )}

                  {/* 2. 물탄 평단 (Left Side) */}
                  {newAvg > 0 && newAvg !== myAvg && (
                    <ReferenceLine 
                        y={newAvg} stroke="#10b981" strokeDasharray="5 5"
                        label={({ viewBox }) => (
                            <text x={5} y={viewBox.y + 18} textAnchor="start" fill="#10b981" fontSize={13} fontWeight="bold">
                                ◀ {isProfitable ? '불탄 평단' : '물탄 평단'} ${fmt(newAvg)}
                            </text>
                        )}
                    />
                  )}
                  {/* 물탄 평단 도달점 (수정: Green, Size 5) */}
                  {newAvgLastHit && newAvg > 0 && newAvg !== myAvg && (
                    <ReferenceDot x={newAvgLastHit.date} y={newAvg} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
                  )}

                  <ReferenceLine y={currentPrice} stroke={isProfitable ? "#f87171" : "#3b82f6"} strokeDasharray="2 2" opacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Fact Box */}
            <div className="bg-gray-800 p-4 border-t border-gray-700 rounded-b-3xl space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 text-xs">현재 내 평단(${fmt(myAvg)}) 최근 도달:</span>
                  {myAvgLastHit ? (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        {myAvgLastHit.date} <span className="text-[11px] text-gray-500 font-normal">{getDaysAgo(myAvgLastHit.date)}</span>
                      </span>
                  ) : (
                      <span className="text-gray-600 text-xs">기간 내 없음</span>
                  )}
               </div>
               <div className="flex justify-between items-center text-sm border-t border-gray-700 pt-2">
                  <span className="text-gray-400 text-xs">
                     {isProfitable ? '불탄 평단' : '물탄 평단'}(${fmt(newAvg)}) 최근 도달:
                  </span>
                  {newAvgLastHit ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        {newAvgLastHit.date} <span className="text-[11px] text-gray-500 font-normal">{getDaysAgo(newAvgLastHit.date)}</span>
                      </span>
                  ) : (
                      <span className="text-gray-600 text-xs">기간 내 없음</span>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* 📉 ROI Analysis (New!) */}
        {myAvg > 0 && (
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">현재 수익률</p>
                <p className={`text-xl font-black ${oldReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                   {oldReturn.toFixed(2)}%
                </p>
             </div>
             <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${returnDiff > 0 ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                <p className="text-xs text-gray-500 mb-1">{isProfitable ? '불타기 후' : '물타기 후'} 수익률</p>
                <div className="flex flex-col items-center">
                    <p className={`text-xl font-black ${newReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {newReturn.toFixed(2)}%
                    </p>
                    {finalAddQty > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full mt-1">
                            {returnDiff > 0 ? '+' : ''}{returnDiff.toFixed(2)}%p 개선
                        </span>
                    )}
                </div>
             </div>
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
            <label className="text-xs text-gray-500 mb-1">내 평단가 ($)</label>
            <input 
                type="number" 
                value={avgPrice} 
                onChange={e => setAvgPrice(Number(e.target.value))} 
                className="w-full bg-transparent text-xl font-bold outline-none placeholder-gray-700" 
                placeholder="0.00" 
            />
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
            <label className="text-xs text-gray-500 mb-1">보유 수량</label>
            <input 
                type="number" 
                value={holdQty} 
                onChange={e => setHoldQty(Number(e.target.value))} 
                className="w-full bg-transparent text-xl font-bold outline-none text-right placeholder-gray-700" 
                placeholder="0" 
            />
          </div>
        </div>

        {/* Financial Summary */}
        {myAvg > 0 && myQty > 0 && (
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-800 rounded-lg"><Wallet size={16} className="text-gray-400"/></div>
                <div>
                   <p className="text-[10px] text-gray-500">현재 총 평가금액</p>
                   <p className="text-sm font-bold text-white">${fmt(currentPrice * myQty)} <span className="text-xs font-normal text-gray-600">(${fmt(totalOldCost)} 투자)</span></p>
                </div>
             </div>
             {finalAddQty > 0 && (
                 <div className="text-right">
                    <p className="text-[10px] text-blue-400">물타기 필요 현금</p>
                    <p className="text-sm font-bold text-blue-300">${fmt(totalNewCost)}</p>
                 </div>
             )}
          </div>
        )}

        {/* Simulation Controls */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
          <div className="flex gap-2 mb-4 p-1 bg-gray-800 rounded-lg w-fit">
              <button onClick={() => setCalcMode('qty')} className={`px-3 py-1 rounded text-xs font-bold ${calcMode === 'qty' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>수량으로 계산</button>
              <button onClick={() => setCalcMode('cash')} className={`px-3 py-1 rounded text-xs font-bold ${calcMode === 'cash' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>금액으로 계산</button>
          </div>

          <div className="flex justify-between items-center mb-4">
             <div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    {calcMode === 'qty' ? <RotateCcw size={12}/> : <Calculator size={12}/>} 
                    {isProfitable ? '추가 매수' : '물타기'} ({calcMode === 'qty' ? '주수' : '금액'})
                </span>
                <span className="ml-1 text-lg font-bold text-white">
                    {calcMode === 'qty' ? `+${finalAddQty}주` : `$${(inputCash || 0).toLocaleString()}`}
                </span>
             </div>
             {calcMode === 'cash' && (
                 <span className="text-xs font-bold text-emerald-400">
                    ≈ {finalAddQty}주 매수 가능
                 </span>
             )}
          </div>

          {calcMode === 'qty' ? (
              <>
                <input type="range" min="0" max="500" value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-6 accent-blue-500" />
                <div className="grid grid-cols-5 gap-2">
                    {[1, 5, 10, 50, 100].map(num => (
                    <button key={num} onClick={() => setAddQty(addQty + num)} className="bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-xs font-bold text-gray-300">+{num}</button>
                    ))}
                </div>
              </>
          ) : (
              <div className="space-y-3">
                  <input 
                    type="number" 
                    value={inputCash} 
                    onChange={(e) => setInputCash(Number(e.target.value))} 
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white font-bold outline-none focus:border-blue-500"
                    placeholder="보유 현금 입력 ($)" 
                  />
                  <div className="flex gap-2">
                     <button onClick={() => setInputCash(1000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+$1,000</button>
                     <button onClick={() => setInputCash(5000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+$5,000</button>
                     <button onClick={() => setInputCash(10000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+$10,000</button>
                  </div>
              </div>
          )}
        </div>

        {/* Share Button (Friendly Color) */}
        <button 
          onClick={handleShare}
          className={`w-full font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform ${isProfitable ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}
        >
          <Share2 size={20} />
          <span>
            {isProfitable ? "📈 내 주식 실력 공유하기" : "🚑 긴급 구조대 부르기"}
          </span>
        </button>
        
        <div className="text-center mt-4 pb-4">
             <a href="https://github.com/your-username" target="_blank" className="inline-flex items-center gap-1 text-gray-600 text-xs hover:text-gray-400">
                <Github size={12}/> Soldier Dev Project
             </a>
        </div>

      </div>
    </div>
  );
}