"use client";

import { useState, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Handshake, AlertCircle } from 'lucide-react';

export default function DayTradeCalculator() {
  // --- States ---
  const [buyPrice, setBuyPrice] = useState<number | ''>('');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(100);
  
  // 수수료 설정 (기본값: 키움증권 국내주식 수수료 및 세금 기준)
  const [buyFeeRate, setBuyFeeRate] = useState<number>(0.015); // 매수 수수료율 (%) (0.015% = 0.00015)
  const [sellFeeRate, setSellFeeRate] = useState<number>(0.015); // 매도 수수료율 (%)
  const [taxRate, setTaxRate] = useState<number>(0.20); // 증권거래세 (%) (0.20% = 0.002)

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

    // 1. 매수/매도 금액
    const totalBuy = bp * qty;
    const totalSell = sp * qty;

    // 2. 수수료 및 세금 계산 (금액 기준)
    const buyFee = totalBuy * (buyFeeRate / 100);
    const sellFee = totalSell * (sellFeeRate / 100);
    const sellTax = totalSell * (taxRate / 100); // 매도 금액에 대해서만 부과

    const totalFeeTax = buyFee + sellFee + sellTax;
    
    // 3. 총 수익 (세전)
    const grossProfit = totalSell - totalBuy;

    // 4. 순수익 (세후)
    const netProfit = grossProfit - totalFeeTax;

    // 5. 순수익률 (투자 원금 대비)
    const netRoi = (netProfit / totalBuy) * 100;

    // 6. 손익분기점 (순수익이 0이 되는 매도가)
    // 순이익 = (총 매도 - 총 매수) - (총 매도 * 세금/수수료) = 0
    // totalSell * (1 - (sellFeeRate + taxRate)/100) = totalBuy * (1 + buyFeeRate/100)
    // requiredProfit = (totalBuy * (1 + buyFeeRate/100)) / (1 - (sellFeeRate + taxRate)/100) / qty
    
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
  
  const fmt = (num: number, decimal: number = 2) => num.toLocaleString(undefined, { minimumFractionDigits: decimal, maximumFractionDigits: decimal });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 flex flex-col items-center">
      <div className="max-w-md w-full p-4 space-y-6">

        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-black text-white flex justify-center items-center gap-2">
            <Handshake className="text-pink-500" /> 단타 순수익 계산기
          </h1>
          <p className="text-gray-500 text-xs">세금, 수수료까지 공제한 진짜 수익률</p>
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
                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center focus:border-blue-500"
                    />
                </div>

                {/* 매도가 */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">매도가 (₩)</label>
                    <input 
                        type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} 
                        placeholder="10050"
                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center focus:border-pink-500"
                    />
                </div>

                 {/* 수량 */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">수량 (주)</label>
                    <input 
                        type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} 
                        placeholder="100"
                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold outline-none text-center"
                    />
                </div>
            </div>

            {/* 수수료/세금 설정 토글 */}
            <div className="pt-2">
                <details className="text-sm">
                    <summary className="text-gray-500 hover:text-gray-300 cursor-pointer flex items-center gap-2">
                        <Calculator size={14}/> 수수료 및 세금 상세 설정
                    </summary>
                    <div className="mt-4 space-y-3 bg-gray-800 p-4 rounded-xl border border-gray-700">
                        
                        {/* 매수 수수료 */}
                        <div className="flex justify-between items-center">
                            <label className="text-gray-400 text-xs">매수 수수료율 (%)</label>
                            <input 
                                type="number" step="0.001" value={buyFeeRate} onChange={e => setBuyFeeRate(Number(e.target.value))} 
                                className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs"
                            />
                        </div>

                        {/* 매도 수수료 */}
                        <div className="flex justify-between items-center">
                            <label className="text-gray-400 text-xs">매도 수수료율 (%)</label>
                            <input 
                                type="number" step="0.001" value={sellFeeRate} onChange={e => setSellFeeRate(Number(e.target.value))} 
                                className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs"
                            />
                        </div>
                        
                        {/* 증권거래세 */}
                        <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-3">
                            <label className="text-gray-400 text-xs flex items-center gap-1">
                                <AlertCircle size={12} className="text-red-400"/> 증권거래세율 (%)
                            </label>
                            <input 
                                type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} 
                                className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-white text-right text-xs"
                            />
                        </div>
                        <p className="text-[10px] text-gray-600 text-right mt-1">* 2023년 기준 0.20% 적용됨.</p>
                    </div>
                </details>
            </div>
        </div>

        {/* 2. 결과 섹션 */}
        {qty > 0 && bp > 0 && sp > 0 && (
          <div className="animate-fade-in space-y-4">
            
            {/* 최종 순수익 카드 (하이라이트) */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-3xl relative shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-pink-500"></div>

                <p className="text-xs text-gray-400">총 투자 금액</p>
                <p className="text-lg font-bold text-gray-300">₩ {fmt(bp * qty)}</p>

                <div className="mt-4 flex justify-between items-center border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400">최종 순수익</p>
                    <h2 className={`text-3xl font-black ${results.netProfit >= 0 ? 'text-pink-400' : 'text-blue-400'}`}>
                        {results.netProfit >= 0 ? '+' : ''} ₩ {fmt(results.netProfit)}
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
                    <span className="text-gray-400">세전 총 수익</span>
                    <span className="text-white font-medium">₩ {fmt(results.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-800 pt-3">
                    <span className="text-gray-400">총 수수료 & 세금</span>
                    <span className="text-red-400 font-medium">- ₩ {fmt(results.totalFeeTax)}</span>
                </div>
            </div>

            {/* 손익 분기점 */}
            <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp size={14} className="text-gray-500"/> 손익분기 매도가 (수수료 포함)
                </p>
                <p className="text-xl font-black text-white">
                    ₩ {fmt(results.requiredProfit)}
                </p>
                <div className="text-[10px] text-gray-600">
                    순수익 ₩0을 달성하기 위해 필요한 최소 매도가입니다.
                </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}