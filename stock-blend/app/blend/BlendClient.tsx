"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot 
} from 'recharts';
import { Share2, Search, TrendingUp, RotateCcw, Wallet, Calculator, Globe, AlertCircle } from 'lucide-react';

const POPULAR_US = ["TSLA", "NVDA", "AAPL", "MSFT", "SOXL", "TQQQ"];
const POPULAR_KR = [
    { name: "삼성전자", code: "005930.KS" },
    { name: "SK하이닉스", code: "000660.KS" },
    { name: "에코프로비엠", code: "247540.KQ" },
    { name: "카카오", code: "035720.KS" },
    { name: "한화시스템", code: "272210.KS" },
];

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


export default function BlendClient() {
    const searchParams = useSearchParams();

    // --- State ---
    const [ticker, setTicker] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // [핵심] 검색 로직 제어용 Ref
    const blockSearchEffect = useRef(false); 
    const inputRef = useRef<HTMLInputElement>(null);

    const [avgPrice, setAvgPrice] = useState<number | ''>('');
    const [holdQty, setHoldQty] = useState<number | ''>('');
    
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState<number>(1400);
    const [range, setRange] = useState('3mo');
    
    const [addQty, setAddQty] = useState<number>(0);
    const [inputCash, setInputCash] = useState<number | ''>('');
    const [calcMode, setCalcMode] = useState<'qty' | 'cash'>('qty');

    const [loading, setLoading] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState(BROKERS[0]);
    const [customRate, setCustomRate] = useState(0.1);

    // 날짜 계산
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
            } else { return ""; }
            const diffTime = now.getTime() - target.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays <= 0) return "(오늘)";
            if (diffDays === 1) return "(어제)";
            if (diffDays < 30) return `(${diffDays}일 전)`;
            if (diffDays < 365) return `(${Math.floor(diffDays/30)}달 전)`;
            return `(${Math.floor(diffDays/365)}년 전)`;
        } catch (e) { return ""; }
    };

    useEffect(() => {
        const qTicker = searchParams.get('ticker');
        const qAvg = searchParams.get('avg');
        const qQty = searchParams.get('qty');
        const qPrice = searchParams.get('price'); 

        if (qTicker) {
            setTicker(qTicker);
            setSearchInput(qTicker);
            blockSearchEffect.current = true;
            if (qPrice) setCurrentPrice(Number(qPrice));
            fetchStockData(qTicker, '3mo');
        }
        if (qAvg) setAvgPrice(Number(qAvg));
        if (qQty) setHoldQty(Number(qQty));
    }, [searchParams]);

    // 검색 자동완성
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchInput.length < 1) {
                setSearchResults([]);
                setShowDropdown(false);
                return;
            }
            
            if (blockSearchEffect.current) {
                blockSearchEffect.current = false; 
                return; 
            }

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`);
                const data = await res.json();
                const results = data.result || [];
                setSearchResults(results);
                if (results.length > 0) setShowDropdown(true);
            } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSelectStock = (symbol: string, name: string) => {
        blockSearchEffect.current = true; 
        setTicker(symbol);
        setSearchInput(`${name} (${symbol})`);
        setSearchResults([]);
        setShowDropdown(false);
        fetchStockData(symbol, '3mo');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchResults.length > 0) {
                handleSelectStock(searchResults[0].symbol, searchResults[0].name);
            } else {
                blockSearchEffect.current = true;
                fetchStockData(searchInput.toUpperCase(), '3mo');
                setShowDropdown(false);
            }
            inputRef.current?.blur();
        }
    };

    const handleAddCash = (amount: number) => {
        setInputCash((prev) => (Number(prev) || 0) + amount);
    };

    const fetchStockData = async (symbol: string, selectedRange: string) => {
        if (!symbol) return;
        setLoading(true);
        setRange(selectedRange);
        try {
            const res = await fetch(`/api/stock?ticker=${symbol}&range=${selectedRange}`);
            const data = await res.json();
            if (data.error) { 
                alert("종목을 찾을 수 없습니다.");
                setLoading(false); 
                return; 
            }
            
            setCurrentPrice(data.price);
            setCurrency(data.currency);
            setChartData(data.chartData || []);
            if (data.exchangeRate) setExchangeRate(data.exchangeRate);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

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
    const oldReturn = myAvg > 0 ? ((currentPrice - myAvg) / myAvg) * 100 : 0;
    const newReturn = newAvg > 0 ? ((currentPrice - newAvg) / newAvg) * 100 : 0;
    const returnDiff = newReturn - oldReturn;

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
        navigator.clipboard.writeText(`${baseUrl}/blend?${params.toString()}`);
        const msg = isProfitable ? "📈 수익 인증 링크 복사 완료!" : "🚨 구조요청 링크 복사 완료!";
        alert(msg);
    };

    const fmt = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const fmtKRW = (num: number) => Math.round(num * exchangeRate).toLocaleString();
    const currencySymbol = currency === 'KRW' ? '₩' : '$';

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
            <div className="max-w-md w-full p-4 space-y-4">
                
                {/* Header */}
                <div className="text-center mt-2">
                    <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
                        <TrendingUp className="text-blue-500" /> 물타기 계산기
                    </h1>
                    <p className="text-gray-500 text-xs">익절 희망회로 돌리기</p>
                </div>

                {/* 🔍 Smart Search Bar */}
                <div className="relative z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 shadow-lg flex items-center px-4 py-2">
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={searchInput} 
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            onKeyDown={handleKeyDown}
                            placeholder="종목명 또는 티커 (예: 삼전, NVDA)"
                            className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder-gray-600"
                        />
                        <button onClick={() => fetchStockData(ticker || searchInput, '3mo')} className="text-blue-500">
                            {loading ? "..." : <Search size={24} />}
                        </button>
                    </div>
                    
                    {/* 드롭다운 결과 */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map((item, idx) => (
                                <button 
                                    key={idx} 
                                    onMouseDown={() => handleSelectStock(item.symbol, item.name)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-700 flex justify-between items-center border-b border-gray-700/50"
                                >
                                    <span className="font-bold text-white text-sm">{item.name}</span>
                                    <div className="text-right">
                                        <span className="text-xs text-blue-400 font-mono block">{item.symbol}</span>
                                        {item.isKR && <span className="text-[10px] text-gray-500 bg-gray-800 px-1 rounded">KRX</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🔥 Popular Stocks */}
                <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold ml-1">
                            <Globe size={12}/> 🇺🇸 미국 인기
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                            {POPULAR_US.map(s => (
                                <button key={s} onClick={() => handleSelectStock(s, s)} className="bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold text-gray-300 border border-gray-700/50">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold ml-1">
                            <Globe size={12}/> 🇰🇷 한국 인기
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {POPULAR_KR.map(s => (
                                <button key={s.code} onClick={() => handleSelectStock(s.code, s.name)} className="bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold text-gray-300 border border-gray-700/50">
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 📊 Chart Section */}
                {chartData.length > 0 && (
                    <div className="relative w-full bg-gray-900 rounded-3xl border border-gray-800 overflow-visible shadow-2xl mt-8">
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

                        <div className="absolute -top-6 left-4 z-20">
                            <div className={`flex items-center gap-2 text-2xl font-black drop-shadow-xl bg-gray-950/90 px-3 py-1 rounded-lg backdrop-blur border border-gray-800 ${isProfitable ? 'text-red-400' : 'text-blue-400'}`}>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">현재가:</span>
                                {currencySymbol}{fmt(currentPrice)}
                            </div>
                        </div>

                        <div className="h-72 pt-8 pr-2">
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
                                    
                                    {myAvg > 0 && (
                                        <ReferenceLine y={myAvg} stroke="#ef4444" strokeDasharray="3 3" label={({ viewBox }) => (
                                            <text x={viewBox.width - 5} y={viewBox.y - 8} textAnchor="end" fill="#ef4444" fontSize={13} fontWeight="bold">▼ 내 평단 {currencySymbol}{fmt(myAvg)}</text>
                                        )} />
                                    )}
                                    {myAvgLastHit && <ReferenceDot x={myAvgLastHit.date} y={myAvg} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />}
                                    
                                    {newAvg > 0 && newAvg !== myAvg && (
                                        <ReferenceLine y={newAvg} stroke="#10b981" strokeDasharray="5 5" label={({ viewBox }) => (
                                            <text x={5} y={viewBox.y + 18} textAnchor="start" fill="#10b981" fontSize={13} fontWeight="bold">▲ {isProfitable ? '불탄 평단' : '물탄 평단'} {currencySymbol}{fmt(newAvg)}</text>
                                        )} />
                                    )}
                                    {newAvgLastHit && newAvg > 0 && newAvg !== myAvg && <ReferenceDot x={newAvgLastHit.date} y={newAvg} r={5} fill="#10b981" stroke="white" strokeWidth={2} />}
                                    <ReferenceLine y={currentPrice} stroke={isProfitable ? "#f87171" : "#3b82f6"} strokeDasharray="2 2" opacity={0.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="bg-gray-800 p-4 border-t border-gray-700 rounded-b-3xl space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 text-xs">내 평단({currencySymbol}{fmt(myAvg)}) 최근 도달 시점:</span>
                                {myAvgLastHit ? (
                                    <span className="text-red-400 font-bold flex items-center gap-1">
                                        {myAvgLastHit.date} <span className="text-[11px] text-gray-500 font-normal">{getDaysAgo(myAvgLastHit.date)}</span>
                                    </span>
                                ) : <span className="text-gray-600 text-xs">기간 내 없음</span>}
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-gray-700 pt-2">
                                <span className="text-gray-400 text-xs">{isProfitable ? '불탄 평단' : '물탄 평단'}({currencySymbol}{fmt(newAvg)}) 최근 도달 시점:</span>
                                {newAvgLastHit ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        {newAvgLastHit.date} <span className="text-[11px] text-gray-500 font-normal">{getDaysAgo(newAvgLastHit.date)}</span>
                                    </span>
                                ) : <span className="text-gray-600 text-xs">기간 내 없음</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* 1. 📝 Input Section */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                        <label className="text-xs text-gray-500 mb-1">내 평단가 ({currencySymbol})</label>
                        <input 
                            type="number" value={avgPrice} onChange={e => setAvgPrice(Number(e.target.value))} 
                            className="w-full bg-transparent text-xl font-bold outline-none placeholder-gray-700" placeholder="0.00" 
                        />
                    </div>
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                        <label className="text-xs text-gray-500 mb-1">보유 수량</label>
                        <input 
                            type="number" value={holdQty} onChange={e => setHoldQty(Number(e.target.value))} 
                            className="w-full bg-transparent text-xl font-bold outline-none text-right placeholder-gray-700" placeholder="0" 
                        />
                    </div>
                </div>

                {/* 2. 🎛️ Simulation Slider */}
                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-xl">
                    <div className="flex gap-2 mb-4 p-1 bg-gray-800 rounded-lg w-fit">
                        <button onClick={() => setCalcMode('qty')} className={`px-3 py-1 rounded text-xs font-bold ${calcMode === 'qty' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>수량</button>
                        <button onClick={() => setCalcMode('cash')} className={`px-3 py-1 rounded text-xs font-bold ${calcMode === 'cash' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>금액</button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                {calcMode === 'qty' ? <RotateCcw size={12}/> : <Calculator size={12}/>} 
                                {isProfitable ? '추가 매수' : '물타기'} ({calcMode === 'qty' ? '주수' : '금액'})
                            </span>
                            <span className="ml-1 text-lg font-bold text-white">
                                {calcMode === 'qty' ? `+${finalAddQty}주` : `${currencySymbol}${(inputCash || 0).toLocaleString()}`}
                            </span>
                        </div>
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
                                type="number" value={inputCash} onChange={(e) => setInputCash(Number(e.target.value))} 
                                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white font-bold outline-none focus:border-blue-500"
                                placeholder={`보유 현금 입력 (${currencySymbol})`} 
                            />
                            <div className="flex gap-2">
                                <button onClick={() => handleAddCash(1000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+{currencySymbol}1,000</button>
                                <button onClick={() => handleAddCash(5000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+{currencySymbol}5,000</button>
                                <button onClick={() => handleAddCash(10000)} className="flex-1 bg-gray-800 py-2 rounded text-xs text-gray-400">+{currencySymbol}10,000</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. 📉 ROI Analysis */}
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

                {/* Financial Summary */}
                {myAvg > 0 && myQty > 0 && (
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-800 rounded-lg"><Wallet size={16} className="text-gray-400"/></div>
                                <div>
                                    <p className="text-[10px] text-gray-500">현재 총 평가금액</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">{currencySymbol}{fmt(currentPrice * myQty)}</span>
                                        {currency !== 'KRW' && <span className="text-xs text-gray-500">≈ ₩{fmtKRW(currentPrice * myQty)}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {finalAddQty > 0 && (
                            <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gray-800 rounded-lg"><Calculator size={16} className="text-blue-400"/></div>
                                    <div>
                                        <p className="text-[10px] text-gray-500">추가 매수 필요 현금</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-bold text-blue-300">{currencySymbol}{fmt(totalNewCost)}</span>
                                            {currency !== 'KRW' && <span className="text-xs text-gray-500">≈ ₩{fmtKRW(totalNewCost)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Share */}
                <button onClick={handleShare} className={`w-full font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform ${isProfitable ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}>
                    <Share2 size={20} />
                    <span>{isProfitable ? "📈 내 주식 실력 공유하기" : "🚑 긴급 구조대 부르기"}</span>
                </button>
                
                {/* 👇 SEO용 텍스트 섹션 (콘텐츠 강화) */}
                <section className="mt-20 pt-10 border-t border-gray-900 text-gray-600 space-y-8 pb-10">
                    
                    <article>
                        <h2 className="text-sm font-bold text-gray-500 mb-3 border-b border-gray-800 pb-1">📈 주식 물타기 계산기: 평단가 시뮬레이션의 중요성</h2>
                        
                        <div className="text-xs leading-5 space-y-3">
                            <strong className="text-gray-400 block">스톡파일럿의 물타기 계산기는 실시간 시세와 차트를 연동하여 가장 현실적인 전략을 수립할 수 있도록 돕습니다.</strong>
                            <p>
                                주식 투자에서 <strong>물타기(DCA, Dollar-Cost Averaging)</strong>는 평균 매수 단가를 낮춰서 주가 하락에 대응하는 가장 일반적인 전략 중 하나입니다. 이 계산기는 보유 수량과 평단가, 그리고 현재 시세를 기반으로 추가 매수 수량 또는 금액을 입력했을 때 <strong>최종적인 평단가 변화</strong>와 <strong>수익률 개선 효과</strong>를 즉시 계산합니다.
                            </p>
                            <p>
                                반대로, 이미 수익 중인 종목에 추가 투자하는 행위는 <strong>불타기(Pyramiding)</strong>라고 합니다. 불타기는 성공적인 전략이지만, 평단가가 높아져 조정 시 손실 폭이 커질 수 있습니다. 이 계산기를 통해 물타기와 불타기 모두에 대한 신중한 의사결정을 지원합니다.
                            </p>
                        </div>
                    </article>

                    <article>
                        <h3 className="text-xs font-bold text-gray-500 mb-2">물타기/불타기 전략의 핵심 원리</h3>
                        <ul className="text-xs leading-5 list-disc list-inside space-y-2 pl-4">
                            <li>
                                <strong>평균 단가 (Average Price):</strong> 최종 평균 단가는 (이전 평단가 * 이전 수량 + 매수 가격 * 매수 수량)을 총 수량으로 나눈 값입니다. 이 공식으로 최종 평단가를 계산하며, 이 평단가가 낮아질수록 손익분기점(BEP)이 낮아져 탈출이 쉬워집니다.
                            </li>
                            <li>
                                <strong>수익률 개선 (Return Difference):</strong> 물타기 후 수익률이 얼마나 개선되었는지를 %p 단위로 정확하게 보여줍니다. 이 개선 폭은 투자금 대비 추가 매수 금액의 비율에 의해 결정됩니다.
                            </li>
                            <li>
                                <strong>차트 분석 및 리스크 확인:</strong> 차트 상에 <strong>기존 평단가</strong>와 <strong>새로운 평단가</strong>를 동시에 표시하여, 과거에 해당 단가에 도달했던 시점(도달 시점)을 시각적으로 확인하고 리스크를 점검할 수 있습니다.
                            </li>
                        </ul>
                    </article>

                    <div className="text-[10px] text-gray-700 mt-8">
                        <p>※ 주식 투자는 원금 손실 위험을 수반하며, 본 계산기는 투자 전략 수립을 위한 참고 자료일 뿐입니다. 모든 투자의 최종 결정과 책임은 사용자 본인에게 있습니다.</p>
                    </div>
                </section>

            </div>
        </div>
    );
}