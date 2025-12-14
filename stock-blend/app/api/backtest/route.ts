import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const yearsParam = searchParams.get('years') || '3'; 
  const monthlyAmount = parseInt(searchParams.get('amount') || '50');

  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 });

  try {
    // 1. Yahoo Finance Chart API 호출
    const rangeParam = `${yearsParam}y`;
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rangeParam}&interval=1mo`;
    
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.chart || data.chart.error) {
       return NextResponse.json({ error: 'Yahoo API Error' }, { status: 404 });
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0].close;

    if (!timestamps || !quotes || timestamps.length === 0) {
        return NextResponse.json({ error: 'No historical data' }, { status: 404 });
    }

    // 2. [핵심] 실제 데이터 시작일과 기간 계산
    // 사용자가 20년을 요청했어도, 데이터가 5년치 뿐이면 5년으로 계산해야 함
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    
    const startDate = new Date(startTime * 1000);
    const endDate = new Date(endTime * 1000);
    
    // 기간 차이 (년 단위, 소수점 포함)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); 

    // 날짜 포맷팅 (YYYY.MM)
    const startDateStr = startDate.toISOString().slice(0, 7).replace('-', '.');
    const endDateStr = endDate.toISOString().slice(0, 7).replace('-', '.');

    // 3. 적립식 투자(DCA) 시뮬레이션
    let totalShares = 0;
    let totalInvested = 0;
    const chartData = [];

    for (let i = 0; i < timestamps.length; i++) {
        const price = quotes[i];
        if (!price) continue;

        const date = new Date(timestamps[i] * 1000);
        const dateStr = date.toISOString().slice(0, 7);

        totalInvested += monthlyAmount;
        const sharesBought = monthlyAmount / price; 
        totalShares += sharesBought;

        const currentValuation = totalShares * price;

        chartData.push({
            date: dateStr,
            principal: Math.round(totalInvested),
            valuation: Math.round(currentValuation),
            price: price
        });
    }

    if (chartData.length === 0) {
        return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
    }

    // 4. 결과 요약 계산
    const lastVal = chartData[chartData.length - 1];
    const totalReturnRate = (lastVal.valuation - lastVal.principal) / lastVal.principal; // 소수점 (0.5 = 50%)
    
    // [연평균 수익률 계산]
    // 적립식 투자의 경우, 돈이 투입된 평균 기간은 전체 기간의 절반 정도입니다.
    // 따라서 단순 (총수익률/년수)는 부정확하며, 대략적인 CAGR은 아래와 같이 근사치로 계산합니다.
    // 공식: (1 + 총수익률) ^ (1 / 기간) - 1  <-- 이건 거치식(Lump sum)용
    // 적립식 근사: 단순히 총 수익률을 기간으로 나누기보다, 내부수익률(IRR) 개념이 필요하나
    // 여기서는 사용자 이해를 돕기 위해 '단순 연환산(총수익/년수)'을 제공하거나,
    // 거치식 기준으로 환산한 CAGR을 보여줍니다. 
    // 가장 직관적인 '단순 연평균(Simple Annual Average)'으로 가겠습니다.
    const annualRoi = (totalReturnRate * 100 / durationYears).toFixed(2);

    return NextResponse.json({
      chartData,
      summary: {
        totalPrincipal: lastVal.principal,
        totalValuation: lastVal.valuation,
        roi: (totalReturnRate * 100).toFixed(2),
        annualRoi: annualRoi, // 연평균 수익률
        startDate: startDateStr,
        endDate: endDateStr,
        durationYears: durationYears.toFixed(1), // "5.2"년
        message: `${startDateStr}부터 (~${durationYears.toFixed(1)}년간)` // 표시 메시지
      }
    });

  } catch (error) {
    console.error("Backtest Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}