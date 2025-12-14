"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, PieChart, DollarSign, Calendar, Coins } from 'lucide-react';

export default function DividendCalculator() {
  // --- States ---
  const [ticker, setTicker] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [data, setData] = useState<any>(null); // 배당 정보
  const [qty, setQty] = useState<number>(100); // 보유 수량
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const blockSearchEffect = useRef(false);

  // 검색 로직
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (searchInput.length < 1 || blockSearchEffect.current) {
            blockSearchEffect.current = false;
            return;
        }
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`);
            const d = await res.json();
            setSearchResults(d.result || []);
            if (d.result?.length > 0) setShowDropdown(true);
        } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectStock = (item: any) => {
      blockSearchEffect.current = true;
      setTicker(item.symbol);
      setSearchInput(`${item.name} (${item.symbol})`);
      setSearchResults([]);
      setShowDropdown(false);
      fetchDividendData(item.symbol);
  };

  // 배당 데이터 가져오기
  const fetchDividendData = async (symbol: string) => {
      setLoading(true);
      try {
          const res = await fetch(`/api/dividend?ticker=${symbol}`);
          const d = await res.json();
          if (d.error) { alert("데이터를 가져올 수 없습니다."); return; }
          setData(d);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- Calculations ---
  const currencySymbol = data?.currency === 'KRW' ? '₩' : '$';
  const isKR = data?.currency === 'KRW';
  const TAX_RATE = 0.154;

  const annualIncomeRaw = data ? data.annualDividend * qty : 0;
  const annualIncomeTaxed = annualIncomeRaw * (1 - TAX_RATE);
  const monthlyIncomeTaxed = annualIncomeTaxed / 12;

  const fmt = (num: number) => num?.toLocaleString(undefined, { minimumFractionDigits: isKR?0:2, maximumFractionDigits: isKR?0:2 });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
      <div className="max-w-md w-full p-4 space-y-6">

        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
            <PieChart className="text-yellow-500" /> 배당금 계산기
          </h1>
          <p className="text-gray-500 text-xs">잠자는 동안 들어오는 불로소득</p>
        </div>

        {/* 1. 검색창 */}
        <div className="relative z-50">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 shadow-lg flex items-center px-4 py-2">
                <Search className="text-gray-500 mr-2" size={20}/>
                <input 
                    ref={inputRef}
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="종목 검색 (예: Realty Income, SCHD)"
                    className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder-gray-600 text-white"
                />
            </div>
             {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                        <button key={idx} 
                            onMouseDown={() => handleSelectStock(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-700 flex justify-between items-center border-b border-gray-700/50">
                            <span className="font-bold text-white text-sm">{item.name}</span>
                            <span className="text-xs text-blue-400 font-mono">{item.symbol}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* 로딩 표시 */}
        {loading && <div className="text-center text-gray-500 animate-pulse">배당 정보를 조회하고 있습니다... 💰</div>}

        {/* 2. 메인 컨텐츠 */}
        {data && !loading && (
            <div className="animate-fade-in space-y-6">
                
                {/* 배당 요약 정보 */}
                <div className="flex justify-between items-center px-2">
                    <div>
                        <p className="text-2xl font-black text-white">{data.symbol}</p>
                        <p className="text-xs text-gray-500">현재가 {currencySymbol}{fmt(data.price)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">연 배당률</p>
                        <p className="text-xl font-bold text-yellow-400">{data.dividendYield}%</p>
                    </div>
                </div>

                {/* 보유 수량 입력 */}
                <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800">
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Coins size={14} /> 보유 주식 수 (주)
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={qty} 
                            onChange={(e) => setQty(Number(e.target.value))}
                            className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-right text-xl focus:border-yellow-500 transition"
                        />
                        <span className="text-gray-500 font-bold">주</span>
                    </div>
                </div>

                {/* 🆕 배당 일정 정보 (락일 & 지급일) */}
                <div className="grid grid-cols-2 gap-3">
                    
                    {/* 카드 1: 배당락일 (Buy Date) */}
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${data.isOfficial ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                        
                        <div className="text-xs text-gray-500 mb-1 flex justify-center items-center gap-1">
                            <Calendar size={12} className="text-red-400"/> 배당락일 (매수 마감)
                        </div>
                        <p className={`text-lg font-bold ${data.isOfficial ? 'text-red-400' : 'text-gray-400 dashed underline decoration-gray-600 underline-offset-4'}`}>
                            {data.nextExDate}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">
                            {data.nextExDate !== '-' ? "이 전날까지 매수 필수!" : "-"}
                        </p>
                    </div>

                    {/* 카드 2: 지급일 (Pay Date) */}
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center relative overflow-hidden group">
                        {/* 상태 배지 */}
                        <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[10px] font-bold text-white shadow-sm
                            ${data.isOfficial ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            {data.statusMessage}
                        </div>

                        <div className="text-xs text-gray-500 mb-1 flex justify-center items-center gap-1 mt-1">
                            <DollarSign size={12} className="text-blue-400"/> 지급 예정일
                        </div>
                        <p className={`text-lg font-bold ${data.isOfficial ? 'text-blue-400' : 'text-gray-400 dashed underline decoration-gray-600 underline-offset-4'}`}>
                            {data.nextPayDate}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">
                            {data.payoutCycle}
                        </p>
                    </div>
                </div>
                {/* 3. 예상 수령액 카드 (하이라이트) */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-yellow-500"></div>
                    
                    <div className="relative z-10 text-center space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">세후 연간 수령액 (15.4% 공제)</p>
                            <h2 className="text-4xl font-black text-yellow-400">
                                {currencySymbol}{fmt(annualIncomeTaxed)}
                            </h2>
                            <p className="text-[10px] text-gray-600 mt-1">
                                세전: {currencySymbol}{fmt(annualIncomeRaw)}
                            </p>
                        </div>
                        
                        <div className="h-px bg-gray-700 w-full"></div>

                        <div className="flex justify-between items-center px-4">
                            <span className="text-sm text-gray-300">월 평균 용돈</span>
                            <span className="text-lg font-bold text-white">
                                + {currencySymbol}{fmt(monthlyIncomeTaxed)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. 과거 배당 내역 (수정됨) */}
                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <Calendar size={16}/> 과거 배당 내역
                    </h3>
                    
                    {data.history.length === 0 ? (
                        <p className="text-center text-gray-600 text-sm py-4">기록이 없습니다.</p>
                    ) : (
                        <div className="space-y-1">
                            {/* 헤더 Row */}
                            <div className="grid grid-cols-3 text-[10px] text-gray-500 font-bold px-2 pb-2 border-b border-gray-800">
                                <div>배당락일</div>
                                <div className="text-center">지급일(추정)</div>
                                <div className="text-right">1주당 배당금</div>
                            </div>

                            {/* 데이터 Rows */}
                            <div className="max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                                {data.history.slice(0, 10).map((h: any, i: number) => (
                                    <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors px-2">
                                        {/* 배당락일 */}
                                        <div className="text-xs text-gray-300 font-mono">
                                            {h.exDate}
                                        </div>
                                        
                                        {/* 지급일 */}
                                        <div className="text-xs text-blue-300/80 font-mono text-center">
                                            {h.payDate}
                                        </div>
                                        
                                        {/* 금액 */}
                                        <div className="text-sm text-yellow-500 font-bold text-right">
                                            {currencySymbol}{fmt(h.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 안내 문구 (수정) */}
                <div className="text-[10px] text-gray-600 text-center leading-relaxed">
                    * '배당락일' 전날까지 매수해야 배당금을 받을 수 있습니다.<br/>
                    * 과거 내역의 '지급일'은 배당락일을 기준으로 추정된 날짜입니다.
                </div>

            </div>
        )}
      </div>
    </div>
  );
}