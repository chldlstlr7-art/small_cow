import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  // range 파라미터 추가 (기본값 3달)
  const range = searchParams.get('range') || '3mo'; 
  // 기간에 따른 적절한 간격(interval) 설정
  let interval = '1d';
  if (['1d', '5d'].includes(range)) interval = '15m';
  if (['1mo', '3mo'].includes(range)) interval = '1d';
  if (['1y', '2y'].includes(range)) interval = '1wk';
  if (['5y', '10y', 'max'].includes(range)) interval = '1mo';

  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 });

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`
    );
    const data = await res.json();
    
    if (!data.chart || data.chart.error) {
       return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const result = data.chart.result[0];
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
      chartData: chartData 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}