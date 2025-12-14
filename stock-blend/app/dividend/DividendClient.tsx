"use client";

import { useState, useRef, useEffect } from 'react';
// import Head from 'next/head'; // ❌ 제거됨: 메타데이터는 page.tsx에서 처리
import { Search, PieChart, DollarSign, Calendar, Coins, Share2, CheckCircle, Info, TrendingUp, BookOpen } from 'lucide-react';

export default function DividendClient() {
    // --- States ---
    const [ticker, setTicker] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [data, setData] = useState<any>(null); // 배당 정보
    const [qty, setQty] = useState<number>(100); // 보유 수량
    const [loading, setLoading] = useState(false);

    // 공유 기능 상태
    const [copied, setCopied] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const blockSearchEffect = useRef(false);

    // 1. 초기 로드 시 URL 파라미터 확인 (공유된 링크로 들어왔을 경우)
    useEffect(() => {
        // window.location.search는 useSearchParams로 대체 가능하나,
        // 클라이언트 코드 유지 위해 기존 방식 유지
        const params = new URLSearchParams(window.location.search);
        const paramTicker = params.get('ticker');
        const paramQty = params.get('qty');

        if (paramTicker) {
            setTicker(paramTicker);
            setSearchInput(paramTicker); // 초기에는 티커로 표시
            fetchDividendData(paramTicker);
        }
        if (paramQty) {
            setQty(Number(paramQty));
        }
    }, []);

    // 2. 검색 로직
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

    // 3. 배당 데이터 가져오기
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

    // 4. 링크 복사 핸들러
    const handleCopyLink = () => {
        if (!data) return;
        
        // 현재 상태를 URL 쿼리 스트링으로 생성
        const baseUrl = window.location.origin + window.location.pathname;
        const params = `?ticker=${encodeURIComponent(ticker)}&qty=${qty}`;
        const shareUrl = baseUrl + params;

        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // 2초 뒤 원복
        });
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
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center">
            
            {/* ----------------------------------------------------------------------
             // ❌ <Head> 태그 제거됨: page.tsx에서 메타데이터 처리 완료
             ---------------------------------------------------------------------- */}

            <div className="max-w-md w-full p-4 space-y-6 pb-20">

                {/* Header */}
                <div className="text-center mt-6">
                    <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
                        <PieChart className="text-yellow-500" /> 배당금 계산기
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">잠자는 동안 들어오는 불로소득</p>
                </div>

                {/* 1. 검색창 */}
                <div className="relative z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 shadow-lg flex items-center px-4 py-2 focus-within:border-yellow-500 transition-colors">
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
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-fade-in-down">
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
                {loading && <div className="text-center text-gray-500 animate-pulse py-10">배당 정보를 조회하고 있습니다... 💰</div>}

                {/* 2. 메인 컨텐츠 */}
                {data && !loading && (
                    <div className="animate-fade-in space-y-6">
                        
                        {/* 배당 요약 정보 */}
                        <div className="flex justify-between items-center px-2">
                            <div>
                                <p className="text-2xl font-black text-white tracking-tight">{data.symbol}</p>
                                <p className="text-xs text-gray-500">현재가 {currencySymbol}{fmt(data.price)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">연 배당률</p>
                                <p className="text-xl font-bold text-yellow-400">{data.dividendYield}%</p>
                            </div>
                        </div>

                        {/* 보유 수량 입력 */}
                        <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 shadow-md">
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
                                <span className="text-gray-500 font-bold w-6 text-center">주</span>
                            </div>
                        </div>

                        {/* 🆕 배당 일정 정보 (락일 & 지급일) */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* 카드 1: 배당락일 */}
                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${data.isOfficial ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                                <div className="text-xs text-gray-500 mb-1 flex justify-center items-center gap-1">
                                    <Calendar size={12} className="text-red-400"/> 배당락일 (Ex-Date)
                                </div>
                                <p className={`text-lg font-bold ${data.isOfficial ? 'text-red-400' : 'text-gray-400 dashed underline decoration-gray-600 underline-offset-4'}`}>
                                    {data.nextExDate}
                                </p>
                                <p className="text-[9px] text-gray-600 mt-1">
                                    {data.nextExDate !== '-' ? "이 전날까지 매수 필수!" : "-"}
                                </p>
                            </div>

                            {/* 카드 2: 지급일 */}
                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[10px] font-bold text-white shadow-sm ${data.isOfficial ? 'bg-blue-600' : 'bg-gray-700'}`}>
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

                        {/* 3. 예상 수령액 카드 (하이라이트 + 공유 버튼) */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-yellow-500 pointer-events-none"></div>
                            
                            {/* 공유 버튼 */}
                            <button 
                                onClick={handleCopyLink}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-sm z-20"
                                title="결과 링크 복사"
                            >
                                {copied ? <CheckCircle size={18} className="text-green-400"/> : <Share2 size={18}/>}
                            </button>

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
                            {/* 복사됨 토스트 메시지 (옵션) */}
                            {copied && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-xs py-1 px-3 rounded-full backdrop-blur-md animate-fade-in">
                                    링크 복사 완료!
                                </div>
                            )}
                        </div>

                        {/* 4. 과거 배당 내역 */}
                        <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5">
                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                                <Calendar size={16}/> 과거 배당 내역
                            </h3>
                            
                            {data.history.length === 0 ? (
                                <p className="text-center text-gray-600 text-sm py-4">기록이 없습니다.</p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="grid grid-cols-3 text-[10px] text-gray-500 font-bold px-2 pb-2 border-b border-gray-800">
                                        <div>배당락일</div>
                                        <div className="text-center">지급일(추정)</div>
                                        <div className="text-right">1주당 배당금</div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                                        {data.history.slice(0, 10).map((h: any, i: number) => (
                                            <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors px-2">
                                                <div className="text-xs text-gray-300 font-mono">{h.exDate}</div>
                                                <div className="text-xs text-blue-300/80 font-mono text-center">{h.payDate}</div>
                                                <div className="text-sm text-yellow-500 font-bold text-right">{currencySymbol}{fmt(h.amount)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-[10px] text-gray-600 text-center leading-relaxed">
                            * '배당락일' 전날까지 매수해야 배당금을 받을 수 있습니다.<br/>
                            * 위 계산은 현재 시점의 배당금 기준이며, 향후 변동될 수 있습니다.
                        </div>

                    </div>
                )}

                {/* ----------------------------------------------------------------------
                    Rich Content Section (Information & Education)
                ---------------------------------------------------------------------- */}
                <article className="mt-16 pt-8 border-t border-gray-800 space-y-12 text-gray-300 pb-10">
                    
                    {/* 섹션 1: 배당 주기와 배당락 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                            <Info size={20} />
                            <h2 className="text-xl font-bold text-white">언제 사야 배당을 받나요?</h2>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-gray-400">
                            주식 초보자가 가장 많이 실수하는 것이 바로 <strong>'배당락일(Ex-Dividend Date)'</strong>입니다. 

[Image of dividend payment timeline]

                            배당락일 당일에 주식을 사면 이번 배당을 받을 수 없습니다. 반드시 <span className="text-yellow-400 font-bold">배당락일 하루 전(영업일 기준)</span>까지 매수를 완료하고 주식을 보유하고 있어야 주주명부에 등재되어 배당금을 수령할 수 있습니다.
                        </p>
                    </section>

                    {/* 섹션 2: 배당 소득세 */}
                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <DollarSign size={20} />
                            <h2 className="text-xl font-bold text-white">세금은 얼마나 떼나요?</h2>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 mb-1">국내 거주자 기준 원천징수 세율</p>
                            <p className="text-3xl font-black text-white">15.4%</p>
                            <p className="text-[10px] text-gray-500 mt-2">
                                (배당소득세 14% + 지방소득세 1.4%)
                            </p>
                        </div>
                        <p className="text-sm text-gray-400">
                            미국 주식의 경우 현지에서 15%를 떼고 들어옵니다. (국내 세율인 14%보다 높으므로 국내에서 추가 징수하지 않습니다.)
                            결과적으로 <strong>계좌에 입금되는 금액은 세전 금액의 약 85% 수준</strong>이라고 생각하면 편합니다. 연간 배당소득이 2,000만 원을 초과하면 금융소득종합과세 대상이 되니 주의하세요.
                        </p>
                    </section>

                    {/* 섹션 3: 복리 효과 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-yellow-500 mb-2">
                            <TrendingUp size={20} />
                            <h2 className="text-xl font-bold text-white">배당 재투자의 마법</h2>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-gray-400">
                            받은 배당금을 쓰지 않고 다시 주식을 사는 데 사용하면 <strong>'복리 효과'</strong>가 발생합니다.
                            주가 상승과 배당금 재투자가 결합되면 자산은 눈덩이(Snowball)처럼 불어납니다. 
                            특히 <span className="text-white font-bold">SCHD, Realty Income</span> 같은 배당 성장주는 매년 배당금을 인상해주기 때문에, 장기 보유 시 '시가 배당률'이 아닌 '투자 원금 대비 배당률(Yield on Cost)'이 극적으로 높아집니다.
                        </p>
                    </section>

                    {/* 섹션 4: 용어 사전 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <BookOpen size={20} />
                            <h2 className="text-lg font-bold text-white">알아두면 좋은 용어</h2>
                        </div>
                        <dl className="space-y-3 text-sm">
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                                <dt className="text-white font-bold mb-1">Payment Date (지급일)</dt>
                                <dd className="text-gray-500">실제로 증권사 계좌에 현금이 입금되는 날짜입니다. (미국 현지 지급일보다 하루 이틀 늦을 수 있습니다.)</dd>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                                <dt className="text-white font-bold mb-1">Dividend Yield (배당 수익률)</dt>
                                <dd className="text-gray-500">현재 주가 대비 연간 받을 수 있는 배당금의 비율입니다. 주가가 떨어지면 배당률은 올라갑니다.</dd>
                            </div>
                        </dl>
                    </section>

                </article>

            </div>
        </div>
    );
}