import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 });

  // 1. 국가 판별
  const isKR = ticker.endsWith('.KS') || ticker.endsWith('.KQ');

  try {
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=2y&interval=1d&events=div`;
    const chartRes = await fetch(chartUrl);
    const chartData = await chartRes.json();
    const chartResult = chartData.chart?.result?.[0];

    if (!chartResult) return NextResponse.json({ error: 'Data not found' }, { status: 404 });

    const meta = chartResult.meta;
    const events = chartResult.events?.dividends;
    
    if (!events) {
        return NextResponse.json({ 
            symbol: meta.symbol, price: meta.regularMarketPrice, currency: meta.currency, 
            history: [], dividendYield: 0, annualDividend: 0, payoutCycle: "배당 없음", 
            nextExDate: "-", nextPayDate: "-", isOfficial: false, statusMessage: "정보 없음"
        });
    }

    // 공시 데이터 확인 (선택)
    let summaryDetail = null;
    let calendarEvents = null;
    try {
        const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,calendarEvents`;
        const summaryRes = await fetch(summaryUrl);
        const summaryData = await summaryRes.json();
        const quoteResult = summaryData.quoteSummary?.result?.[0];
        if (quoteResult) {
            summaryDetail = quoteResult.summaryDetail;
            calendarEvents = quoteResult.calendarEvents;
        }
    } catch (e) {}

    // -------------------------------------------------------
    // 💡 스마트 지급 지연일 계산 함수 (재사용)
    // -------------------------------------------------------
    const getPayGap = (exDate: Date) => {
        const month = exDate.getMonth() + 1; 
        if (isKR) {
            if (month === 12) return 115; // 12월 결산 -> 4월 지급
            return 55; // 분기 -> 약 2달 뒤
        } else {
            return 30; // 미국 -> 약 1달 뒤
        }
    };

    // -------------------------------------------------------
    // ✅ 2. 과거 내역 생성 (배당락일 + 예상 지급일 추가)
    // -------------------------------------------------------
    const history = Object.values(events)
        .map((d: any) => {
            const exDateObj = new Date(d.date * 1000);
            const payDateObj = new Date(exDateObj);
            
            // 지급일 계산 (Gap 더하기)
            const gap = getPayGap(exDateObj);
            payDateObj.setDate(exDateObj.getDate() + gap);

            return {
                exDate: exDateObj.toISOString().slice(0, 10),   // 배당락일 (실제 데이터)
                payDate: payDateObj.toISOString().slice(0, 10), // 지급일 (계산된 추정치)
                amount: d.amount,
                timestamp: d.date
            };
        })
        .sort((a: any, b: any) => b.timestamp - a.timestamp);


    // 주기 분석
    const oneYearAgo = Date.now() / 1000 - (365 * 24 * 60 * 60);
    const countLastYear = history.filter((h: any) => h.timestamp > oneYearAgo).length;
    let payoutCycle = "비정기";
    let cycleDays = 0;

    if (countLastYear >= 11) { payoutCycle = "월 배당"; cycleDays = 30; }
    else if (countLastYear >= 3) { payoutCycle = "분기 배당"; cycleDays = 91; }
    else if (countLastYear >= 1) { payoutCycle = "연/반기 배당"; cycleDays = 182; }

    // 다음 일정 계산
    const officialExDate = summaryDetail?.exDividendDate?.fmt;
    const officialPayDate = calendarEvents?.dividends?.dividendDate?.fmt;

    let nextExDate = "-";
    let nextPayDate = "-";
    let isOfficial = false;
    let statusMessage = "예상";

    if (officialExDate) {
        nextExDate = officialExDate;
        isOfficial = true;
        statusMessage = "확정";

        if (officialPayDate) {
            nextPayDate = officialPayDate;
        } else {
            const exDateObj = new Date(officialExDate);
            const gap = getPayGap(exDateObj);
            exDateObj.setDate(exDateObj.getDate() + gap);
            nextPayDate = exDateObj.toISOString().slice(0, 10);
            statusMessage = "락일 확정";
        }
    } else {
        if (cycleDays > 0) {
            const lastExDate = new Date(history[0].exDate); // history 객체 구조 변경됨
            const predictedExDate = new Date(lastExDate);
            predictedExDate.setDate(lastExDate.getDate() + cycleDays);
            
            if (predictedExDate < new Date()) {
                 predictedExDate.setDate(predictedExDate.getDate() + cycleDays);
            }

            nextExDate = predictedExDate.toISOString().slice(0, 10);

            const predictedPayDate = new Date(predictedExDate);
            const gap = getPayGap(predictedExDate);
            predictedPayDate.setDate(predictedPayDate.getDate() + gap);
            
            nextPayDate = predictedPayDate.toISOString().slice(0, 10);
            
            isOfficial = false;
            statusMessage = isKR ? "국내 패턴 예상" : "패턴 예상";
        }
    }

    const lastDividend = history[0].amount;
    const projectedAnnualDividend = lastDividend * (countLastYear || 1);
    const price = meta.regularMarketPrice;
    const dividendYield = price > 0 ? ((projectedAnnualDividend / price) * 100).toFixed(2) : "0.00";

    return NextResponse.json({
        symbol: meta.symbol,
        price: price,
        currency: meta.currency,
        history: history, // 여기에 exDate, payDate가 다 들어있음
        payoutCycle: payoutCycle,
        nextExDate: nextExDate,
        nextPayDate: nextPayDate,
        isOfficial: isOfficial,
        statusMessage: statusMessage,
        annualDividend: projectedAnnualDividend,
        dividendYield: dividendYield
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}