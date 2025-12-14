import FinanceDataReader as fdr
import pandas as pd

def generate_ts_file():
    print("데이터 다운로드 중...")
    # 코스피, 코스닥 종목 리스트 다운로드
    kospi = fdr.StockListing('KOSPI')
    kosdaq = fdr.StockListing('KOSDAQ')

    # 필요한 컬럼만 선택
    kospi = kospi[['Code', 'Name']]
    kosdaq = kosdaq[['Code', 'Name']]
    
    # 시장 구분 추가 (심볼 뒤에 .KS / .KQ 붙이기)
    kospi['Symbol'] = kospi['Code'] + '.KS'
    kosdaq['Symbol'] = kosdaq['Code'] + '.KQ'
    
    # 합치기
    df = pd.concat([kospi, kosdaq])
    
    # 우선순위 정렬 (옵션: 시가총액 정보가 있다면 시총순 정렬이 좋음)
    # 여기서는 이름순으로 정렬하지만, 실제론 FDR에서 MarketCap도 가져와서 정렬 가능
    
    print(f"총 {len(df)}개 종목 변환 시작...")

    ts_content = "const KOREAN_STOCKS = [\n"
    
    for _, row in df.iterrows():
        name = row['Name']
        symbol = row['Symbol']
        
        # 키워드 자동 생성 로직 (영문 변환은 복잡하므로, 간단한 회사명 전처리만 수행)
        # 예: "삼성전자" -> ["삼성", "전자"] 등을 키워드로 잡을 수도 있음
        # 여기서는 심플하게 빈 배열로 두고, 필요시 추가하는 방식
        keywords = [] 
        
        # 특정 인기 종목에 대해 하드코딩된 키워드가 필요하다면 별도 매핑 테이블 사용 권장
        
        ts_content += f"  {{ name: '{name}', symbol: '{symbol}', keywords: {keywords} }},\n"
    
    ts_content += "];\n\nexport default KOREAN_STOCKS;"

    with open('korean_stocks.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
        
    print("완료! korean_stocks.ts 파일이 생성되었습니다.")

if __name__ == "__main__":
    generate_ts_file()