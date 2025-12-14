import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const range = searchParams.get('range') || '3mo'; 
  
  // [핵심 수정] 기간이 길어져도 디테일을 위해 무조건 '1d' 사용
  // 단, 'max'나 '10y' 처럼 데이터가 너무 큰 경우만 '5d'나 '1wk'로 타협
  let interval = '1d';
  if (['5y', '10y', 'max'].includes(range)) interval = '1wk'; 

  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 });

  try {
    // 1. 주식 데이터 가져오기
    const stockRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`
    );
    const stockData = await stockRes.json();
    
    // 2. 실시간 환율 가져오기 (USDKRW=X)
    const rateRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?range=1d&interval=1d`
    );
    const rateData = await rateRes.json();
    const exchangeRate = rateData.chart?.result?.[0]?.meta?.regularMarketPrice || 1400; // 실패시 기본값 1400

    if (!stockData.chart || stockData.chart.error) {
       return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const result = stockData.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0].close;

    const chartData = timestamps.map((time: number, index: number) => ({
      date: new Date(time * 1000).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', year: '2-digit' }),
      price: quotes[index] ? Number(quotes[index].toFixed(2)) : null,
    })).filter((item: any) => item.price !== null);

    return NextResponse.json({ 
      price: meta.regularMarketPrice, 
      currency: meta.currency,
      exchangeRate: exchangeRate, // 환율 정보 함께 반환
      chartData: chartData 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}