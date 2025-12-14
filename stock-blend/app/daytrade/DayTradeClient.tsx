"use client";

import { useState, useMemo } from 'react';
// import Head from 'next/head'; // ❌ 제거됨: 메타데이터는 page.tsx에서 처리
import { Calculator, DollarSign, TrendingUp, Handshake, AlertCircle, BookOpen, Scale, Info } from 'lucide-react';

export default function DayTradeClient() {
    // ----------------------------------------------------------------------
    // 1. 기존 로직 유지 (상태 관리 및 계산)
    // ----------------------------------------------------------------------
    const [buyPrice, setBuyPrice] = useState<number | ''>('');
    const [sellPrice, setSellPrice] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number | ''>(100);
    
    // 수수료 설정 (기본값: 키움증권 등 일반적인 HTS 기준)
    const [buyFeeRate, setBuyFeeRate] = useState<number>(0.015);
    const [sellFeeRate, setSellFeeRate] = useState<number>(0.015);
    const [taxRate, setTaxRate] = useState<number>(0.20); // 2023~2024년 기준 증권거래세 0.20%

    // --- Calculations ---
    const qty = Number(quantity) || 0;
    const bp = Number(buyPrice) || 0;
    const sp = Number(sellPrice) || 0;

    const results = useMemo(() => {
        if (qty === 0 || bp === 0 || sp === 0) {
            return {
                grossProfit: 0,
                totalFeeTax: 0,
                netProfit: 0,
                netRoi: 0,
                requiredProfit: 0,
            };
        }

        // 1. 매수/매도 총액
        const totalBuy = bp * qty;
        const totalSell = sp * qty;

        // 2. 수수료 및 세금 계산
        const buyFee = totalBuy * (buyFeeRate / 100);
        const sellFee = totalSell * (sellFeeRate / 100);
        const sellTax = totalSell * (taxRate / 100); 

        const totalFeeTax = buyFee + sellFee + sellTax;
        
        // 3. 총 수익 (세전)
        const grossProfit = totalSell - totalBuy;

        // 4. 순수익 (세후)
        const netProfit = grossProfit - totalFeeTax;

        // 5. 순수익률 (투자 원금 대비)
        const netRoi = (netProfit / totalBuy) * 100;

        // 6. 손익분기점 (순수익 >= 0 이 되는 매도 단가)
        // 수식: 매수총액(1+매수수수료율) / (1-(매도수수료율+세금율)) / 수량
        const requiredProfit = (
            totalBuy * (1 + (buyFeeRate / 100)) / 
            (1 - ((sellFeeRate + taxRate) / 100)) / 
            qty
        );

        return {
            grossProfit,
            totalFeeTax,
            netProfit,
            netRoi,
            requiredProfit,
        };
    }, [buyPrice, sellPrice, quantity, buyFeeRate, sellFeeRate, taxRate]);
    
    const fmt = (num: number, decimal: number = 0) => num.toLocaleString(undefined, { minimumFractionDigits: decimal, maximumFractionDigits: decimal });

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center">
            
            {/* ----------------------------------------------------------------------
             // ❌ <Head> 태그 제거됨: page.tsx에서 메타데이터 처리 완료
             ---------------------------------------------------------------------- */}

            <div className="max-w-md w-full p-4 space-y-6 pb-20">

                {/* Header */}
                <div className="text-center mt-6">
                    <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
                        <Handshake className="text-pink-500" /> 단타 순수익 계산기
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">세금, 수수료까지 공제한 진짜 수익률</p>
                </div>

                {/* 1. 입력 섹션 */}
                <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-4 shadow-lg">
                    
                    {/* 매수/매도/수량 */}
                    <div className="grid grid-cols-3 gap-3">
                        
                        {/* 매수가 */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">매수가 (₩)</label>
                            <input 
                                type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} 
                                placeholder="10000"
                                className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* 매도가 */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">매도가 (₩)</label>
                            <input 
                                type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} 
                                placeholder="10050"
                                className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center focus:border-pink-500 transition-colors"
                            />
                        </div>

                        {/* 수량 */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">수량 (주)</label>
                            <input 
                                type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} 
                                placeholder="100"
                                className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center transition-colors"
                            />
                        </div>
                    </div>

                    {/* 수수료/세금 설정 토글 */}
                    <div className="pt-2">
                        <details className="text-sm group">
                            <summary className="text-gray-500 hover:text-gray-300 cursor-pointer flex items-center gap-2 select-none">
                                <Calculator size={14}/> 수수료 및 세금 상세 설정
                            </summary>
                            <div className="mt-4 space-y-3 bg-gray-800 p-4 rounded-xl border border-gray-700 animate-fade-in-down">
                                
                                {/* 매수 수수료 */}
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-400 text-xs">매수 수수료율 (%)</label>
                                    <input 
                                        type="number" step="0.001" value={buyFeeRate} onChange={e => setBuyFeeRate(Number(e.target.value))} 
                                        className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs focus:border-pink-500 outline-none"
                                    />
                                </div>

                                {/* 매도 수수료 */}
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-400 text-xs">매도 수수료율 (%)</label>
                                    <input 
                                        type="number" step="0.001" value={sellFeeRate} onChange={e => setSellFeeRate(Number(e.target.value))} 
                                        className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs focus:border-pink-500 outline-none"
                                    />
                                </div>
                                
                                {/* 증권거래세 */}
                                <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-3">
                                    <label className="text-gray-400 text-xs flex items-center gap-1">
                                        <AlertCircle size={12} className="text-red-400"/> 증권거래세율 (%)
                                    </label>
                                    <input 
                                        type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} 
                                        className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs focus:border-pink-500 outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 text-right mt-1">* 2023년 이후 국내주식 거래세 0.20% 적용</p>
                            </div>
                        </details>
                    </div>
                </div>

                {/* 2. 결과 섹션 */}
                {qty > 0 && bp > 0 && sp > 0 && (
                    <div className="animate-fade-in space-y-4">
                        
                        {/* 최종 순수익 카드 (하이라이트) */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-3xl relative shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-pink-500 pointer-events-none"></div>

                            <p className="text-xs text-gray-400 mb-1">총 매도 금액</p>
                            <p className="text-lg font-bold text-gray-300">₩ {fmt(sp * qty)}</p>

                            <div className="mt-4 flex justify-between items-center border-t border-gray-700 pt-4">
                                <p className="text-sm text-gray-400 font-bold">최종 순수익</p>
                                <h2 className={`text-3xl font-black ${results.netProfit >= 0 ? 'text-pink-400' : 'text-blue-400'}`}>
                                    {results.netProfit >= 0 ? '+' : ''} {fmt(results.netProfit)}원
                                </h2>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">순수익률 (ROI)</p>
                                <p className={`text-lg font-bold ${results.netProfit >= 0 ? 'text-pink-400' : 'text-blue-400'}`}>
                                    {results.netProfit >= 0 ? '+' : ''}{results.netRoi.toFixed(2)}%
                                </p>
                            </div>
                        </div>

                        {/* 상세 분석 */}
                        <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">세전 차익</span>
                                <span className="text-white font-medium">₩ {fmt(results.grossProfit)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-gray-800 pt-3">
                                <span className="text-gray-400 flex items-center gap-2">
                                    총 수수료 & 세금
                                </span>
                                <span className="text-red-400 font-medium">- ₩ {fmt(results.totalFeeTax)}</span>
                            </div>
                        </div>

                        {/* 손익 분기점 */}
                        <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-3 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                    <TrendingUp size={14} className="text-emerald-500"/> 손익분기 매도가 (BEP)
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-white">
                                        ₩ {fmt(Math.ceil(results.requiredProfit))}
                                    </p>
                                    <span className="text-xs text-gray-500">이상 팔아야 본전</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ----------------------------------------------------------------------
                    3. Rich Content Section (SEO & Information)
                ---------------------------------------------------------------------- */}
                <article className="mt-16 pt-8 border-t border-gray-800 space-y-12 text-gray-300 pb-10">
                    
                    {/* 섹션 1: 단타와 수수료 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-pink-500 mb-2">
                            <Scale size={20} />
                            <h2 className="text-xl font-bold text-white">단타, 왜 수익이 안 날까요?</h2>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-gray-400">
                            주식 단타(Day Trading)나 스캘핑을 할 때 가장 간과하기 쉬운 것이 바로 <strong>거래 비용</strong>입니다.
                            단순히 10,000원에 사서 10,050원에 팔면 50원 이득일 것 같지만, 실제로는 <span className="text-red-400 font-bold">마이너스</span>일 수 있습니다.
                            매수 수수료, 매도 수수료, 그리고 가장 큰 비중을 차지하는 <strong>증권거래세(0.20%)</strong>가 수익을 갉아먹기 때문입니다.
                            이 계산기는 이러한 '보이지 않는 비용'을 정확히 계산하여, 내가 헛수고를 하고 있는 건 아닌지 판단하게 도와줍니다.
                        </p>
                    </section>

                    {/* 섹션 2: 손익분기점 설명 */}
                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2">
                            <Info size={20} />
                            <h2 className="text-xl font-bold text-white">손익분기점(BEP)이란?</h2>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                            수수료와 세금을 모두 내고도 <strong className="text-white">순수익이 0원</strong>이 되는 지점입니다.
                            이 가격보다 <span className="text-emerald-400 font-bold">단 1원이라도 비싸게 팔아야</span> 실제 내 주머니에 돈이 들어옵니다.
                        </p>
                        <div className="bg-gray-800 p-4 rounded-xl text-center space-y-2">
                            <p className="text-xs text-gray-500">손익분기 계산 공식 (간략)</p>
                            <div className="text-sm font-mono text-gray-300 break-all">
                                매수가 × (1 + 매수수수료율) ÷ (1 - 매도제비용율)
                            </div>
                        </div>
                        
                    </section>

                    {/* 섹션 3: 스캘핑 팁 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <BookOpen size={20} />
                            <h2 className="text-xl font-bold text-white">성공적인 단타를 위한 3가지 팁</h2>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-pink-500 font-bold shrink-0">1</span>
                                <span>
                                    <strong className="text-gray-200 block mb-1">손익분기 틱 계산하기</strong>
                                    내가 진입한 가격에서 최소 몇 '틱(Tick)' 위에서 팔아야 본전인지 미리 계산해두세요. 보통 주식은 2~3틱 이상 올라야 수수료를 커버합니다.
                                </span>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-pink-500 font-bold shrink-0">2</span>
                                <span>
                                    <strong className="text-gray-200 block mb-1">거래세 인하 확인하기</strong>
                                    증권거래세는 매년 조금씩 변동될 수 있습니다. 2023년 기준 코스피/코스닥 합산 약 0.20% 수준입니다. 최신 세율을 항상 확인하세요.
                                </span>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-400">
                                <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-pink-500 font-bold shrink-0">3</span>
                                <span>
                                    <strong className="text-gray-200 block mb-1">비대면 계좌 활용</strong>
                                    많은 증권사들이 비대면 계좌 개설 시 '수수료 평생 무료' 이벤트를 합니다. (단, 유관기관 제비용은 제외). 이를 활용하면 비용을 획기적으로 줄일 수 있습니다.
                                </span>
                            </li>
                        </ul>
                    </section>

                </article>

            </div>
        </div>
    );
}