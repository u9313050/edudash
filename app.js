const STORE = "edudash:v3";
const BANK_LIMIT = 100;
const BANK_DB_NAME = "EduDashQuestionBank";
const BANK_DB_VERSION = 1;
const BANK_STORE = "chapterBanks";
const APP_BUILD = "2026-05-21-003";
const BANK_ADMIN_USER = "u9313050";
const SUBJECT_FILES = ["db_korean.json", "db_math.json", "db_science.json"];
const AUTO_BANK_FOLDER = "문제은행/";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let db = { subjects: [] };
let state = {
  user: null,
  view: "dashboard",
  quiz: null
};
let remoteUserCache = {};

const koreanPassages = [
  "푸른 하늘 아래 운동장에는 아이들의 웃음소리가 퍼졌다.",
  "낡은 시계는 멈추었지만 할머니의 이야기는 계속 흘렀다.",
  "작은 씨앗은 어둠 속에서도 조용히 봄을 준비하고 있었다.",
  "편지는 짧았지만 그 안에는 오래 참아 온 마음이 담겨 있었다."
];

const koreanQuestionSets = [
  {
    passage: "푸른 하늘 아래 운동장에는 아이들의 웃음소리가 퍼졌다.",
    core: "맑은 날 운동장에서 아이들이 즐겁게 지내는 장면을 보여 준다.",
    mood: "밝고 활기찬 분위기",
    symbol: "푸른 하늘",
    theme: "함께 뛰노는 즐거움과 생동감",
    title: "푸른 하늘 아래 웃음",
    exact: "아이들의 웃음소리가 운동장에 퍼졌다.",
    inference: "아이들이 즐겁게 어울리고 있음을 알 수 있다.",
    contrast: "푸른 하늘과 아이들의 웃음",
    meaning: "밝고 자유로운 분위기"
  },
  {
    passage: "낡은 시계는 멈추었지만 할머니의 이야기는 계속 흘렀다.",
    core: "멈춘 시계와 이어지는 이야기를 통해 추억의 지속을 드러낸다.",
    mood: "잔잔하고 회상적인 분위기",
    symbol: "낡은 시계",
    theme: "시간이 멈춘 듯해도 기억과 이야기는 이어진다.",
    title: "멈춘 시계와 이어지는 이야기",
    exact: "시계는 멈추었지만 할머니의 이야기는 계속되었다.",
    inference: "할머니의 이야기가 가족의 기억을 이어 주고 있음을 알 수 있다.",
    contrast: "멈춘 시계와 계속 흐르는 이야기",
    meaning: "물리적 시간과 다른 기억의 흐름"
  },
  {
    passage: "작은 씨앗은 어둠 속에서도 조용히 봄을 준비하고 있었다.",
    core: "씨앗이 보이지 않는 곳에서 성장과 변화를 준비하는 모습을 보여 준다.",
    mood: "차분하고 희망적인 분위기",
    symbol: "작은 씨앗",
    theme: "기다림 속에서도 성장의 가능성은 이어진다.",
    title: "어둠 속에서 준비하는 봄",
    exact: "씨앗은 어둠 속에서 봄을 준비하고 있다.",
    inference: "겉으로 보이지 않아도 변화는 천천히 준비될 수 있다.",
    contrast: "어둠과 봄",
    meaning: "새로운 시작과 성장의 가능성"
  },
  {
    passage: "편지는 짧았지만 그 안에는 오래 참아 온 마음이 담겨 있었다.",
    core: "짧은 편지에 오래 간직한 마음이 담겨 있음을 보여 준다.",
    mood: "애틋하고 진솔한 분위기",
    symbol: "짧은 편지",
    theme: "간결한 말에도 깊은 마음이 담길 수 있다.",
    title: "짧은 편지에 담긴 마음",
    exact: "편지는 짧았지만 오래 참아 온 마음이 담겨 있었다.",
    inference: "글쓴이는 쉽게 말하지 못한 마음을 편지로 전했음을 알 수 있다.",
    contrast: "짧은 편지와 오래 참아 온 마음",
    meaning: "겉으로 짧아 보여도 깊게 담긴 진심"
  }
];

const CHAPTER_TYPE_PATTERNS = {
  "m1-prime": ["소수와 합성수 구별", "소인수분해 완성", "거듭제곱 꼴 표현", "지수의 의미 해석", "약수의 개수 구하기", "공약수 찾기", "최대공약수 계산", "공배수 찾기", "최소공배수 계산", "서로소 판별", "두 수의 관계 분석", "분해식에서 원래 수 찾기", "최대공약수 활용", "최소공배수 활용", "약수 조건 추론", "배수 조건 추론", "문장제 식 세우기", "생활 속 주기 문제", "오류가 있는 풀이 고치기", "계산 과정 설명"],
  "m1-rational": ["양수와 음수 구별", "정수의 대소 비교", "유리수의 대소 비교", "절댓값 구하기", "수직선 위치 판단", "수직선 거리 구하기", "정수 덧셈", "정수 뺄셈", "정수 곱셈", "정수 나눗셈", "유리수 덧셈", "유리수 뺄셈", "유리수 곱셈", "유리수 나눗셈", "부호 결정", "혼합 계산 순서", "괄호가 있는 계산", "계산 결과 검산", "실생활 온도 문제", "수의 성질 설명"],
  "m1-expression": ["문자로 수량 표현", "식의 값 구하기", "일차식 판별", "동류항 찾기", "동류항 정리", "일차식 덧셈", "일차식 뺄셈", "분배법칙 적용", "괄호 풀기", "계수와 상수항 찾기", "수량 관계 식 세우기", "도형의 둘레 식", "도형의 넓이 식", "규칙성 식 표현", "표를 보고 식 만들기", "문자식 해석", "잘못된 식 고치기", "식의 간단화", "조건에 맞는 식 선택", "풀이 과정 설명"],
  "m1-equation": ["방정식과 항등식 구별", "해의 의미 확인", "등식의 성질 적용", "일차방정식 기본 풀이", "괄호가 있는 방정식", "분수가 있는 방정식", "소수가 있는 방정식", "이항 과정 판단", "해 검산", "계수가 음수인 방정식", "해가 주어진 식 완성", "연속수 문제", "나이 문제", "거리·속력·시간 문제", "비례식 문제", "도형 둘레 문제", "수량 관계 세우기", "생활 문장제 풀이", "잘못된 풀이 찾기", "풀이 순서 배열"],
  "m1-graph": ["순서쌍 읽기", "좌표평면 위 점 찾기", "사분면 판별", "축 위의 점 판단", "표를 그래프로 나타내기", "그래프에서 값 읽기", "정비례 관계 판별", "정비례식 구하기", "정비례 그래프 특징", "반비례 관계 판별", "반비례식 구하기", "반비례 그래프 특징", "그래프와 식 연결", "변화 관계 설명", "실생활 그래프 해석", "좌표 변화 추론", "조건에 맞는 점 찾기", "그래프 오류 수정", "자료표 완성", "상황에 맞는 그래프 선택"],
  "m1-geometry-basic": ["점·선·면 개념 구별", "직선·반직선·선분 판별", "각의 크기 구하기", "맞꼭지각 성질", "수직 관계 판단", "평행 관계 판단", "동위각 찾기", "엇각 찾기", "평행선에서 각 구하기", "기본 작도 순서", "수직이등분선 작도", "각의 이등분선 작도", "삼각형 작도 조건", "합동인 도형 찾기", "대응점·대응변 찾기", "대응각 찾기", "합동 조건 설명", "도형 용어 적용", "그림 조건 분석", "잘못된 작도 찾기"],
  "m1-plane-solid": ["다각형 이름 판별", "삼각형 내각 계산", "다각형 내각의 합", "다각형 외각의 합", "정다각형 한 내각", "원과 부채꼴 용어", "호의 길이 구하기", "부채꼴 넓이 구하기", "다면체 구성 요소", "각기둥과 각뿔 구별", "회전체 단면 판단", "기둥의 겉넓이", "기둥의 부피", "뿔의 부피", "원기둥 계산", "원뿔 계산", "입체도형 전개도", "도형 조건 추론", "복합도형 계산", "실생활 도형 문제"],
  "m1-statistics": ["자료 분류", "줄기와 잎 그림 읽기", "줄기와 잎 그림 완성", "도수분포표 만들기", "계급과 도수 찾기", "히스토그램 읽기", "히스토그램 완성", "도수분포다각형 해석", "상대도수 구하기", "상대도수 그래프", "누적도수 구하기", "평균 구하기", "자료 비교", "그래프 선택", "통계 자료 해석", "자료의 특징 설명", "잘못된 그래프 찾기", "표에서 정보 추론", "실생활 통계 판단", "결론의 타당성 판단"],
  "m2-decimal": ["유한소수 판별", "무한소수 판별", "순환소수 찾기", "순환마디 표시", "분수를 소수로 변환", "소수를 분수로 변환", "기약분수 조건 분석", "분모의 소인수 판단", "순환소수 계산", "순환소수 대소 비교", "유리수 분류", "소수 표현 오류 찾기", "순환소수의 규칙 추론", "계산 결과 표현", "보기 중 같은 수 찾기", "소수 전개 해석", "분수 조건 완성", "유한소수가 되는 수", "순환소수 문장제", "풀이 과정 설명"],
  "m2-polynomial": ["지수법칙 곱셈", "지수법칙 나눗셈", "거듭제곱의 거듭제곱", "단항식 곱셈", "단항식 나눗셈", "계수와 차수 찾기", "다항식 덧셈", "다항식 뺄셈", "동류항 정리", "단항식과 다항식 곱셈", "다항식 나눗셈", "전개하기", "식의 값", "식 간단히 하기", "문자식 활용", "빈칸 계수 찾기", "오류 풀이 수정", "조건식 계산", "넓이 식 전개", "계산 순서 설명"],
  "m2-inequality-system": ["부등식의 뜻", "부등식의 해", "부등식의 성질", "일차부등식 풀이", "수직선에 해 나타내기", "부등식 문장제", "범위 조건 해석", "해가 주어진 부등식", "연립방정식의 해", "대입법 풀이", "가감법 풀이", "해 검산", "계수 맞추기", "해가 없는 경우", "해가 무수히 많은 경우", "연립방정식 문장제", "두 수 문제", "가격 문제", "거리 문제", "풀이 전략 선택"],
  "m2-linear-function": ["함수의 뜻", "함수값 구하기", "일차함수 판별", "기울기 구하기", "y절편 구하기", "그래프 그리기", "두 점으로 식 구하기", "점과 기울기로 식 구하기", "평행한 직선 판단", "두 직선의 교점", "x절편 구하기", "표에서 일차함수 찾기", "그래프와 식 연결", "변화율 해석", "실생활 함수", "거리·시간 그래프", "조건에 맞는 직선", "그래프 이동", "오류 그래프 수정", "상황 설명 선택"],
  "m2-triangle-quadrilateral": ["이등변삼각형 성질", "이등변삼각형 각 계산", "직각삼각형 합동 조건", "삼각형의 외심", "삼각형의 내심", "외심과 내심 비교", "평행사변형 성질", "평행사변형 조건", "직사각형 성질", "마름모 성질", "정사각형 성질", "사다리꼴 성질", "여러 사각형 관계", "대각선 성질", "각의 크기 구하기", "변의 길이 구하기", "도형 증명 빈칸", "조건에 맞는 도형", "성질의 역 판단", "복합 도형 문제"],
  "m2-similarity": ["닮음의 뜻", "닮음비 구하기", "대응변 찾기", "대응각 찾기", "삼각형 닮음 조건 SSS", "삼각형 닮음 조건 SAS", "삼각형 닮음 조건 AA", "평행선과 선분의 길이", "중점 연결 정리", "닮음비와 둘레", "닮음비와 넓이", "닮음비와 부피", "축척 계산", "지도 거리", "높이 구하기", "그림자 활용", "입체도형 닮음", "조건에 맞는 닮음", "증명 순서 배열", "실생활 닮음 문제"],
  "m2-pythagoras": ["피타고라스 정리 적용", "빗변 구하기", "한 변의 길이 구하기", "피타고라스 정리의 역", "직각삼각형 판별", "특수 직각삼각형", "좌표평면 위 거리", "직사각형 대각선", "정사각형 대각선", "입체도형 대각선", "최단 거리", "도형 속 직각삼각형", "넓이 관계", "실생활 거리", "사다리 문제", "원 안의 직각삼각형", "조건에서 길이 추론", "계산 오류 찾기", "풀이 과정 완성", "복합 도형 활용"],
  "m2-probability": ["경우의 수 세기", "합의 법칙", "곱의 법칙", "순서쌍 개수", "나열표 만들기", "나무그림 활용", "확률의 뜻", "확률 구하기", "확률이 0인 사건", "확률이 1인 사건", "여사건", "동전 던지기", "주사위 던지기", "카드 뽑기", "공 뽑기", "동시에 일어나는 사건", "확률 비교", "실생활 확률", "조건에 맞는 경우", "잘못된 확률 판단"],
  "m3-real-number": ["제곱근의 뜻", "제곱근 구하기", "근호 표현", "무리수 판별", "실수 분류", "실수의 대소 비교", "근호의 곱셈", "근호의 나눗셈", "근호 간단히 하기", "근호의 덧셈", "근호의 뺄셈", "분모의 유리화", "제곱근의 성질", "수직선 위 실수", "근삿값 판단", "같은 값 찾기", "계산 결과 비교", "조건에 맞는 수", "오류 풀이 수정", "실수 개념 설명"],
  "m3-factorization": ["다항식 곱셈", "곱셈 공식 적용", "완전제곱식 전개", "합과 차의 곱", "공통인수 묶기", "인수분해 공식", "완전제곱식 인수분해", "합차 공식 인수분해", "복잡한 인수분해", "치환을 이용한 인수분해", "식의 값 빠르게 구하기", "도형 넓이 식", "계수 조건 찾기", "전개와 인수분해 연결", "빈칸 완성", "잘못된 공식 찾기", "공식 선택", "계산 과정 설명", "활용 문제", "검산하기"],
  "m3-quadratic-equation": ["이차방정식 판별", "해의 의미", "인수분해 풀이", "제곱근 이용 풀이", "완전제곱식 풀이", "근의 공식 적용", "판별식 계산", "근의 개수 판단", "중근 조건", "계수 조건 찾기", "두 근의 합", "두 근의 곱", "해 검산", "이차방정식 세우기", "수 문제", "넓이 문제", "운동 문제", "실생활 활용", "오류 풀이 수정", "풀이 방법 선택"],
  "m3-quadratic-function": ["이차함수 판별", "포물선 방향", "폭의 변화", "꼭짓점 찾기", "축의 방정식", "평행이동", "최댓값 구하기", "최솟값 구하기", "x절편 찾기", "y절편 찾기", "그래프 그리기", "표 완성", "식 구하기", "계수와 그래프 관계", "두 그래프 비교", "교점 해석", "실생활 최댓값", "실생활 최솟값", "그래프 오류 수정", "상황에 맞는 식"],
  "m3-trigonometry": ["삼각비의 뜻", "사인 구하기", "코사인 구하기", "탄젠트 구하기", "특수각 30도", "특수각 45도", "특수각 60도", "삼각비 표 활용", "변의 길이 구하기", "각의 크기 추론", "높이 구하기", "거리 구하기", "기울기와 탄젠트", "측량 문제", "그림자 문제", "사다리 문제", "삼각비 비교", "조건에 맞는 삼각형", "계산 오류 찾기", "실생활 적용"],
  "m3-circle": ["현과 중심의 관계", "현의 수직이등분선", "접선의 성질", "접선의 길이", "원주각 구하기", "중심각 구하기", "원주각과 중심각", "같은 호의 원주각", "반원 위의 원주각", "네 점이 한 원 위", "접선과 현의 각", "각의 크기 추론", "선분 길이 구하기", "원 안의 사각형", "도형 성질 적용", "증명 빈칸", "조건에 맞는 원", "그림 오류 찾기", "복합 도형 문제", "풀이 과정 설명"],
  "m3-statistics": ["평균 구하기", "중앙값 구하기", "최빈값 구하기", "대푯값 비교", "편차 구하기", "분산 구하기", "표준편차 구하기", "산포도 해석", "자료의 흩어짐 비교", "도수분포표와 평균", "상자그림 읽기", "사분위수", "범위 구하기", "이상값 판단", "자료 추가 영향", "두 집단 비교", "그래프 해석", "통계 결론 판단", "적절한 대푯값 선택", "자료 해석 오류 찾기"],
  "k1-literature-poem": ["시적 화자 찾기", "화자의 정서 파악", "시어의 의미 추론", "운율 형성 요소", "비유 표현 찾기", "비유 효과 판단", "상징의 의미", "감각적 심상 구별", "분위기 파악", "주제 찾기", "반복 표현 효과", "말하는 이의 태도", "시구의 함축 의미", "시상 전개", "제목의 의미", "정서 변화", "표현상 특징", "독자 반응", "시 낭송 효과", "작품 감상 근거"],
  "k1-literature-story": ["인물 성격 파악", "인물 관계 파악", "사건의 원인", "사건 전개 순서", "배경의 역할", "시점 구별", "서술자의 특징", "갈등의 원인", "갈등의 양상", "갈등 해결", "인물의 심리", "대화의 기능", "복선 찾기", "소재의 역할", "장면의 분위기", "주제 파악", "제목의 의미", "결말 추론", "작품 감상 근거", "서사 구조 파악"],
  "k1-reading-info": ["중심 내용 찾기", "세부 내용 확인", "문단 중심 문장", "글의 구조 파악", "정의 방식", "예시의 기능", "비교와 대조", "분류 기준", "원인과 결과", "요약하기", "제목 붙이기", "핵심어 찾기", "자료와 글 연결", "문단의 역할", "생략된 내용 추론", "접속어의 기능", "정보의 순서", "설명 대상 파악", "내용 일치 판단", "읽기 전략 선택"],
  "k1-writing-info": ["쓰기 목적 정하기", "예상 독자 분석", "자료 수집 방법", "자료의 적절성", "내용 조직하기", "개요 작성", "문단 구성", "제목 정하기", "설명 방법 선택", "표현 다듬기", "고쳐쓰기", "출처 표시", "시각 자료 활용", "문장 연결", "중복 내용 삭제", "부족한 내용 보완", "객관적 표현", "정보 배열", "완성 글 점검", "윤리적 자료 활용"],
  "k1-grammar-word": ["언어의 자의성", "언어의 사회성", "언어의 역사성", "명사 판별", "대명사 판별", "수사 판별", "동사 판별", "형용사 판별", "조사 기능", "품사의 기능", "관형사와 부사", "감탄사 쓰임", "품사 통용", "어간과 어미", "활용의 뜻", "단어의 짜임", "문장 속 품사", "품사 분류 근거", "잘못된 분류 수정", "국어 생활 적용"],
  "k1-speaking-basic": ["대화 목적 파악", "공감적 듣기", "말차례 지키기", "질문하기", "대답하기", "비언어 표현", "준언어 표현", "발표 주제 선정", "발표 내용 조직", "자료 활용", "청중 고려", "발표 태도", "대화 예절", "상황에 맞는 말", "의견 조정", "듣기 태도", "핵심 내용 메모", "질문 의도 파악", "피드백 반영", "발표 점검"],
  "k2-literature-view": ["화자의 관점", "서술자의 태도", "반어 표현", "역설 표현", "풍자 효과", "해학 효과", "갈래 특성", "표현 효과", "작품 해석", "독자 반응", "인물의 관점", "작가의 의도", "상징 해석", "문체의 특징", "분위기 변화", "주제 심화", "비교 감상", "감상 근거", "표현 방식 선택", "해석의 타당성"],
  "k2-reading-argument": ["주장 파악", "근거 찾기", "주장과 근거 연결", "논증 구조", "근거의 타당성", "자료의 신뢰성", "반론 파악", "반박 내용", "주제문 찾기", "필자의 의도", "비판적 읽기", "숨은 전제", "논리적 오류", "근거 보완", "관점 비교", "결론 추론", "자료 해석", "내용 일치 판단", "설득 전략", "독자 반응"],
  "k2-writing-argument": ["논제 정하기", "주장 세우기", "근거 마련", "자료 선별", "반론 고려", "반박 구성", "문단 배열", "서론 쓰기", "본론 쓰기", "결론 쓰기", "설득 전략", "표현의 적절성", "고쳐쓰기", "윤리적 글쓰기", "출처 표시", "제목 정하기", "근거 보완", "문장 다듬기", "독자 고려", "완성 글 점검"],
  "k2-grammar-sentence": ["문장 성분 찾기", "주어 판별", "서술어 판별", "목적어 판별", "보어 판별", "관형어 판별", "부사어 판별", "독립어 판별", "홑문장 구별", "겹문장 구별", "이어진문장", "안은문장", "문장 호응", "높임 표현", "시간 표현", "피동 표현", "사동 표현", "부정 표현", "잘못된 문장 고치기", "문법 요소의 효과"],
  "k2-media": ["매체 특성 파악", "광고 의도", "영상 자료 해석", "이미지 의미", "자막의 기능", "통계 자료 해석", "정보 신뢰성", "표현 의도", "대상 독자", "매체 윤리", "시각 자료 효과", "소리 자료 효과", "편집 방식", "정보 배열", "과장 표현", "숨은 설득 전략", "출처 확인", "매체 비교", "수용 태도", "비판적 판단"],
  "k2-speaking-discussion": ["토의 절차", "문제 상황 파악", "의견 제시", "근거 말하기", "질문하기", "답변하기", "쟁점 파악", "토론 입론", "반론하기", "재반론하기", "사회자의 역할", "토론 예절", "의견 조정", "합의안 도출", "근거의 타당성", "상대 의견 요약", "자료 활용 말하기", "듣기 태도", "발언 평가", "협력적 의사소통"],
  "k3-literature-modern": ["시대 배경 파악", "인물의 변화", "복선 찾기", "상징 체계", "갈등 해결", "문체의 효과", "서사 구조", "시적 정서", "작품 비교", "주제 심화", "공간의 의미", "시간 구성", "서술 방식", "인물 심리", "사회 현실 반영", "표현상 특징", "감상 관점", "해석의 근거", "작품의 가치", "현대적 의미"],
  "k3-literature-classic": ["고전 어휘 이해", "화자 파악", "운문 갈래", "산문 갈래", "풍자 표현", "해학 표현", "관습적 표현", "시대적 가치", "현대적 의미", "작품의 교훈", "인물 유형", "사건 구조", "표현 방식", "주제 의식", "배경 이해", "갈등 양상", "작품 비교", "독자 반응", "가치 판단", "감상 근거"],
  "k3-reading-critical": ["관점 비교", "정보 통합", "숨은 전제 찾기", "논리적 오류", "자료의 편향", "출처 평가", "핵심 쟁점", "추론하기", "대안 제시", "비판적 수용", "상반된 주장 비교", "근거의 충분성", "통계 자료 판단", "표현 의도", "필자의 관점", "생략 정보 추론", "독자 영향", "자료 재구성", "결론 평가", "읽기 전략 선택"],
  "k3-writing-research": ["탐구 주제 정하기", "연구 문제 세우기", "자료 조사", "자료 분류", "인용하기", "표와 그래프 활용", "개요 작성", "객관적 표현", "결론 도출", "참고 자료 정리", "조사 결과 해석", "보고서 구조", "문단 연결", "자료의 신뢰성", "출처 표시", "요약과 분석", "표현 다듬기", "윤리적 글쓰기", "발표 자료 전환", "완성 보고서 점검"],
  "k3-grammar-discourse": ["담화 맥락", "지시 표현", "대용 표현", "생략 표현", "높임 표현", "시간 표현", "피동 표현", "사동 표현", "부정 표현", "정확한 문장", "담화 표지", "문장 연결", "말하는 이의 의도", "듣는 이 고려", "상황 맥락", "문법 요소 효과", "중의성 해소", "호응 관계", "국어 생활 점검", "잘못된 표현 고치기"],
  "k3-media-critical": ["온라인 글 특성", "댓글 문화", "알고리즘 이해", "가짜 뉴스 판별", "저작권 판단", "개인 정보 보호", "매체 생산", "디지털 시민성", "정보 재구성", "복합 양식 텍스트", "출처 검증", "제목 낚시 판단", "이미지 조작 가능성", "댓글의 영향", "공유 윤리", "자료 편집", "매체 언어", "비판적 수용", "콘텐츠 제작 계획", "디지털 소통 태도"]
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  registerServiceWorker();
  await ensureLatestVersion();
  await loadSubjects();
  bindEvents();
  const lastUser = localStorage.getItem(`${STORE}:session`);
  if (lastUser) await restoreSession(lastUser);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

async function ensureLatestVersion() {
  try {
    const response = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const remote = await response.json();
    const seenBuild = localStorage.getItem(`${STORE}:build`);
    if (remote.build && seenBuild && remote.build !== seenBuild) {
      localStorage.setItem(`${STORE}:build`, remote.build);
      location.reload();
      return;
    }
    localStorage.setItem(`${STORE}:build`, remote.build || APP_BUILD);
  } catch {
    localStorage.setItem(`${STORE}:build`, APP_BUILD);
  }
}

async function loadSubjects() {
  const loaded = Array.isArray(window.EDUDASH_SUBJECTS) && window.EDUDASH_SUBJECTS.length
    ? window.EDUDASH_SUBJECTS
    : await Promise.all(SUBJECT_FILES.map((file) => fetch(file).then((r) => r.json())));
  const custom = JSON.parse(localStorage.getItem(`${STORE}:customSubjects`) || "[]");
  db.subjects = [...loaded, ...custom].map(normalizeSubject);
}

async function autoImportQuestionBankFolder() {
  if (typeof importQuestionBankPayload !== "function") return;
  try {
    const files = await discoverQuestionBankFiles();
    if (!files.length) return;
    const imported = JSON.parse(localStorage.getItem(`${STORE}:autoBankImports`) || "{}");
    let changed = false;
    let questionCount = 0;

    for (const fileUrl of files) {
      try {
        const response = await fetch(withCacheBuster(fileUrl), { cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const signature = `${text.length}:${hashText(text)}`;
        if (imported[fileUrl] === signature) continue;
        const result = await importQuestionBankPayload(JSON.parse(text));
        imported[fileUrl] = signature;
        if (result.questionCount > 0) {
          changed = true;
          questionCount += result.questionCount;
        }
      } catch {}
    }

    localStorage.setItem(`${STORE}:autoBankImports`, JSON.stringify(imported));
    if (changed) {
      localStorage.setItem(`${STORE}:lastAutoBankImport`, JSON.stringify({ at: new Date().toISOString(), questionCount }));
      updateBankStatus();
      if (state.view === "bank") renderQuestionBankView();
    }
  } catch {}
}

async function discoverQuestionBankFiles() {
  const files = new Set();
  const manifestUrls = [`${AUTO_BANK_FOLDER}index.json`, `${AUTO_BANK_FOLDER}manifest.json`];
  const knownUrls = [`${AUTO_BANK_FOLDER}question-bank.json`, `${AUTO_BANK_FOLDER}edudash-question-bank.json`];

  for (const manifestUrl of manifestUrls) {
    try {
      const response = await fetch(withCacheBuster(manifestUrl), { cache: "no-store" });
      if (!response.ok) continue;
      const payload = await response.json();
      if (Array.isArray(payload?.banks)) files.add(manifestUrl);
      const entries = Array.isArray(payload) ? payload : payload.files;
      if (Array.isArray(entries)) {
        entries.forEach((entry) => {
          const path = typeof entry === "string" ? entry : entry?.path || entry?.url || entry?.name;
          if (path && path.toLowerCase().endsWith(".json")) files.add(resolveBankFileUrl(path));
        });
      }
    } catch {}
  }

  for (const url of knownUrls) files.add(url);

  try {
    const response = await fetch(AUTO_BANK_FOLDER, { cache: "no-store" });
    if (response.ok) {
      const html = await response.text();
      const matches = html.matchAll(/href=["']([^"']+\.json(?:\?[^"']*)?)["']/gi);
      for (const match of matches) files.add(resolveBankFileUrl(decodeURIComponent(match[1])));
    }
  } catch {}

  return [...files].filter((file) => {
    const name = file.split("/").pop().split("?")[0].toLowerCase();
    return name.endsWith(".json") && name !== "manifest.json";
  });
}

function resolveBankFileUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith(AUTO_BANK_FOLDER)) return path;
  return `${AUTO_BANK_FOLDER}${path.replace(/^\.?\//, "")}`;
}

function withCacheBuster(url) {
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function hashText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return String(hash);
}

function normalizeSubject(subject) {
  Object.values(subject.grades).forEach((chapters) => {
    chapters.forEach((chapter) => {
      chapter.types = expandChapterTypes(subject.typeMode || subject.id, chapter);
    });
  });
  return subject;
}

function expandChapterTypes(mode, chapter) {
  if (CHAPTER_TYPE_PATTERNS[chapter.id]) return [...CHAPTER_TYPE_PATTERNS[chapter.id]];
  const topics = Array.isArray(chapter.topics) && chapter.topics.length ? chapter.topics : [chapter.title];
  const mathPatterns = ["개념 판별", "계산", "식 세우기", "활용"];
  const koreanPatterns = ["개념 확인", "근거 찾기", "효과 판단", "적용하기"];
  const sciencePatterns = ["개념 판별", "탐구 과정 해석", "자료와 그래프 분석", "생활 속 적용"];
  const patterns = mode === "math" ? mathPatterns : mode === "science" ? sciencePatterns : koreanPatterns;
  return Array.from({ length: 20 }, (_, index) => {
    const topic = topics[index % topics.length];
    const pattern = patterns[Math.floor(index / topics.length) % patterns.length];
    return `${topic} ${pattern}`;
  });
}

function bindEvents() {
  $("#auth-form").addEventListener("submit", (event) => {
    event.preventDefault();
    authenticate("login");
  });
  $("#signup-btn").addEventListener("click", () => authenticate("signup"));
  $("#logout-btn").addEventListener("click", logout);
  $("#top-logout-btn").addEventListener("click", logout);
  $("#reset-user-btn").addEventListener("click", resetCurrentUser);
  $("#brand-home-btn").addEventListener("click", () => {
    switchView("home");
    collapseMobileMenu();
  });
  $("#mobile-menu-btn").addEventListener("click", toggleMobileMenu);
  $$("#home-view [data-home-target]").forEach((button) => button.addEventListener("click", () => {
    switchView(button.dataset.homeTarget);
    collapseMobileMenu();
  }));
  $$(".nav").forEach((button) => button.addEventListener("click", () => {
    switchView(button.dataset.view);
    collapseMobileMenu();
  }));
  $("#subject-select").addEventListener("change", fillGradeOptions);
  $("#grade-select").addEventListener("change", fillChapterOptions);
  $("#difficulty-select").addEventListener("change", updateBankStatus);
  $("#start-quiz-btn").addEventListener("click", startQuiz);
  $("#wrong-type-quiz-btn").addEventListener("click", startWrongTypeQuiz);
  $("#add-subject-btn").addEventListener("click", addSubject);
  window.addEventListener("visibilitychange", () => {
    if (document.hidden && state.quiz && !state.quiz.finished) finishPartialQuiz();
  });
}

async function restoreSession(username) {
  if (isServerStorageEnabled()) {
    try {
      const record = await serverGetUser(username);
      if (!record) {
        localStorage.removeItem(`${STORE}:session`);
        localStorage.removeItem(`${STORE}:serverSession`);
        return;
      }
      remoteUserCache[username] = normalizeUserData(record.data);
      loginAs(username);
      return;
    } catch {
      showAuth("서버 사용자 정보를 불러오지 못했습니다. 다시 로그인하세요.");
      localStorage.removeItem(`${STORE}:session`);
      localStorage.removeItem(`${STORE}:serverSession`);
      return;
    }
  }
  if (getUsers()[username]) loginAs(username);
}

async function authenticate(mode) {
  const username = $("#username").value.trim();
  const password = $("#password").value;
  if (!username || password.length < 4) return showAuth("사용자 이름과 4자 이상 비밀번호를 입력하세요.");

  if (isServerStorageEnabled()) {
    showAuth("서버 확인 중입니다.");
    try {
      const user = mode === "signup"
        ? await serverCreateUser(username, password)
        : await serverValidateUser(username, password);
      remoteUserCache[username] = normalizeUserData(user);
      loginAs(username);
    } catch (error) {
      showAuth(readableAuthError(error));
    }
    return;
  }

  const users = getUsers();
  if (mode === "signup") {
    if (users[username]) return showAuth("이미 가입된 사용자입니다.");
    users[username] = { password, ...defaultUserData() };
    localStorage.setItem(`${STORE}:users`, JSON.stringify(users));
    loginAs(username);
    return;
  }

  if (!users[username] || users[username].password !== password) return showAuth("로그인 정보가 맞지 않습니다.");
  loginAs(username);
}

function getUsers() {
  if (isServerStorageEnabled()) return remoteUserCache;
  return JSON.parse(localStorage.getItem(`${STORE}:users`) || "{}");
}

function saveUser(userData) {
  if (!state.user) return;
  if (isServerStorageEnabled()) {
    remoteUserCache[state.user] = normalizeUserData(userData);
    saveUserToServer(state.user, remoteUserCache[state.user]);
    return;
  }
  const users = getUsers();
  users[state.user] = userData;
  localStorage.setItem(`${STORE}:users`, JSON.stringify(users));
}

function userData() {
  if (isServerStorageEnabled()) {
    remoteUserCache[state.user] ||= defaultUserData();
    return remoteUserCache[state.user];
  }
  return getUsers()[state.user];
}

function defaultUserData() {
  return {
    progress: {},
    wrong: [],
    seen: {},
    solvedIds: [],
    servedBank: {},
    studyLog: [],
    wrongTypes: {}
  };
}

function normalizeUserData(data) {
  return { ...defaultUserData(), ...(data || {}) };
}

function serverConfig() {
  return window.EDUDASH_SERVER || {};
}

function isServerStorageEnabled() {
  const config = serverConfig();
  return config.provider === "supabase" && Boolean(config.url) && Boolean(config.anonKey);
}

function serverTable() {
  return serverConfig().table || "edudash_user_data";
}

function serverQuestionBankTable() {
  return serverConfig().questionBankTable || "edudash_question_banks";
}

function serverUrl(path) {
  const rawUrl = serverConfig().url || "";
  let baseUrl = rawUrl
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1.*$/i, "")
    .replace(/\/auth\/v1.*$/i, "")
    .replace(/\/functions\/v1.*$/i, "");
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname.endsWith(".supabase.co")) {
      baseUrl = parsed.origin;
    }
  } catch {}
  return `${baseUrl}${path}`;
}

function serverQuestionFunctionUrl() {
  return serverConfig().questionFunctionUrl || serverUrl("/functions/v1/generate-questions");
}

function serverSignupFunctionUrl() {
  return serverConfig().signupFunctionUrl || serverUrl("/functions/v1/create-user");
}

function serverSignupFunctionUrls() {
  return [
    serverConfig().signupFunctionUrl,
    serverUrl("/functions/v1/super-api"),
    serverUrl("/functions/v1/create-user")
  ].filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index);
}

function serverAuthHeaders(extra = {}) {
  const key = serverConfig().anonKey;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function serverDataHeaders(accessToken, extra = {}) {
  return {
    ...serverAuthHeaders(),
    Authorization: `Bearer ${accessToken}`,
    ...extra
  };
}

function readableAuthError(error) {
  const message = String(error?.message || "");
  if (/email.*rate.*limit|rate.*limit/i.test(message)) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "로그인 정보가 맞지 않습니다. 비밀번호를 확인하거나, 처음 사용하는 아이디라면 회원가입을 먼저 눌러 주세요.";
  }
  if (/email not confirmed/i.test(message)) {
    return "이메일 확인이 필요한 계정입니다. Supabase에서 해당 사용자를 Confirm 처리하거나 이메일 확인 옵션을 꺼주세요.";
  }
  return message || "서버 로그인 처리에 실패했습니다.";
}

async function serverGetUser(username) {
  return serverRestoreUser(username);
}

function serverEmail(username, domainOverride = "") {
  const hex = [...new TextEncoder().encode(username)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  const domain = domainOverride || serverConfig().emailDomain || "edudash.app";
  return `u_${hex}@${domain}`;
}

function serverEmailCandidates(username) {
  const configured = serverConfig().emailDomain || "edudash.app";
  const domains = [configured, "edudash.app", "edudash.local"];
  return [...new Set(domains)].map((domain) => serverEmail(username, domain));
}

function readServerSession() {
  try {
    return JSON.parse(localStorage.getItem(`${STORE}:serverSession`) || "null");
  } catch {
    return null;
  }
}

async function writeServerSession(username, authData, password = "") {
  let sessionData = authData;
  if ((!sessionData?.access_token || !sessionData?.user?.id) && password) {
    sessionData = await supabaseSignIn(username, password);
  }
  const session = {
    username,
    access_token: sessionData.access_token,
    refresh_token: sessionData.refresh_token,
    user_id: sessionData.user?.id
  };
  if (!session.access_token || !session.user_id) {
    throw new Error("서버 로그인 세션을 만들지 못했습니다. Supabase 이메일 확인 옵션을 꺼주세요.");
  }
  localStorage.setItem(`${STORE}:serverSession`, JSON.stringify(session));
  return session;
}

async function supabaseSignUp(username, password) {
  let lastError = "";
  for (const url of serverSignupFunctionUrls()) {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: serverAuthHeaders(),
        body: JSON.stringify({
          action: "createUser",
          username,
          email: serverEmail(username),
          password
        })
      });
    } catch {
      lastError = `${url}에 연결할 수 없습니다.`;
      continue;
    }
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data;
    const message = data.msg || data.message || `서버 회원가입에 실패했습니다. HTTP ${response.status}`;
    if (/already|registered|exists/i.test(message)) throw new Error("이미 가입된 사용자입니다.");
    if (/email.*rate.*limit|rate.*limit/i.test(message)) throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    lastError = message;
  }
  throw new Error(lastError || "회원가입 서버 함수에 연결할 수 없습니다. Supabase Edge Function super-api 배포 상태를 확인해 주세요.");
}

async function supabaseSignIn(username, password) {
  let lastMessage = "로그인 정보가 맞지 않습니다.";
  for (const email of serverEmailCandidates(username)) {
    const response = await fetch(serverUrl("/auth/v1/token?grant_type=password"), {
      method: "POST",
      headers: serverAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data;
    lastMessage = data.msg || data.message || lastMessage;
    if (!/invalid login credentials/i.test(lastMessage)) {
      throw new Error(readableAuthError({ message: lastMessage }));
    }
  }
  throw new Error(readableAuthError({ message: lastMessage }));
}

async function serverRestoreUser(username) {
  const session = readServerSession();
  if (!session || session.username !== username) return null;
  return { data: await serverLoadUserData(session) };
}

async function serverLoadUserData(session) {
  const url = serverUrl(`/rest/v1/${serverTable()}?user_id=eq.${encodeURIComponent(session.user_id)}&select=username,data`);
  const response = await fetch(url, {
    headers: serverDataHeaders(session.access_token),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("서버 학습 정보를 불러오지 못했습니다.");
  const rows = await response.json();
  return normalizeUserData(rows[0]?.data);
}

async function serverCreateUser(username, password) {
  await supabaseSignUp(username, password);
  const authData = await supabaseSignIn(username, password);
  const session = await writeServerSession(username, authData, password);
  const data = defaultUserData();
  await serverUpsertUserData(session, data);
  return data;
}

async function serverValidateUser(username, password) {
  const authData = await supabaseSignIn(username, password);
  const session = await writeServerSession(username, authData, password);
  const data = await serverLoadUserData(session);
  await serverUpsertUserData(session, data);
  return data;
}

async function serverAccountAction(action, payload = {}) {
  const session = readServerSession();
  if (!session) throw new Error("서버 로그인이 필요합니다.");
  const response = await fetch(serverSignupFunctionUrl(), {
    method: "POST",
    headers: serverDataHeaders(session.access_token),
    body: JSON.stringify({
      action,
      username: session.username,
      ...payload
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.msg || "서버 계정 작업에 실패했습니다.");
  }
  return data;
}

async function serverResetCurrentPassword(newPassword) {
  return serverAccountAction("resetPassword", { password: newPassword });
}

async function serverDeleteCurrentAccount() {
  return serverAccountAction("deleteUser");
}

async function serverListUsers() {
  return serverAccountAction("listUsers");
}

async function serverResetUserPassword(username, newPassword) {
  return serverAccountAction("resetPassword", {
    targetUsername: username,
    password: newPassword
  });
}

async function serverDeleteUser(username) {
  return serverAccountAction("deleteUser", { targetUsername: username });
}

async function saveUserToServer(username, userData) {
  const session = readServerSession();
  if (!session || session.username !== username) return;
  await serverUpsertUserData(session, userData).catch(() => {});
}

async function serverUpsertUserData(session, userData) {
  const payload = {
    user_id: session.user_id,
    username: session.username,
    data: normalizeUserData(userData),
    updated_at: new Date().toISOString()
  };
  const response = await fetch(serverUrl(`/rest/v1/${serverTable()}?on_conflict=user_id`), {
    method: "POST",
    headers: serverDataHeaders(session.access_token, {
      Prefer: "resolution=merge-duplicates,return=minimal"
    }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("서버 학습 정보 저장에 실패했습니다.");
}

function loginAs(username) {
  state.user = username;
  localStorage.setItem(`${STORE}:session`, username);
  $("#auth-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  $("#app-shell").classList.remove("mobile-menu-collapsed");
  $("#active-user").textContent = `${username} 학습 중`;
  updateRoleVisibility();
  showAuth("");
  loadGptSettings();
  fillSubjectOptions();
  autoImportQuestionBankFolder();
  switchView("home");
}

function logout() {
  if (state.quiz && !state.quiz.finished && state.quiz.answered.length > 0) finishPartialQuiz();
  state = { user: null, view: "dashboard", quiz: null };
  localStorage.removeItem(`${STORE}:session`);
  localStorage.removeItem(`${STORE}:serverSession`);
  $("#username").value = "";
  $("#password").value = "";
  $("#quiz-runner").classList.add("hidden");
  $("#quiz-setup").classList.remove("hidden");
  $("#app-shell").classList.add("hidden");
  $("#auth-screen").classList.remove("hidden");
  showAuth("로그아웃되었습니다.");
}

function isBankAdmin() {
  return state.user === BANK_ADMIN_USER;
}

function updateRoleVisibility() {
  const bankNav = document.querySelector('[data-view="bank"]');
  if (bankNav) bankNav.classList.toggle("hidden", !isBankAdmin());
  const usersNav = document.querySelector('[data-view="users"]');
  if (usersNav) usersNav.classList.toggle("hidden", !isBankAdmin());
}

function showAuth(message) {
  $("#auth-message").textContent = message;
}

function switchView(view) {
  if (view === "bank" && !isBankAdmin()) view = "home";
  if (view === "users" && !isBankAdmin()) view = "home";
  if (state.quiz && !state.quiz.finished && view !== "quiz") finishPartialQuiz();
  state.view = view;
  $$(".nav").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((section) => section.classList.add("hidden"));
  $(`#${view}-view`).classList.remove("hidden");
  $(".workspace").classList.toggle("home-mode", view === "home");
  $("#view-title").textContent = { home: "EduDash", quiz: "퀴즈", wrong: "오답노트", bank: "문제은행", users: "회원관리", stats: "학습현황" }[view];
  updateTopChapterLabel();
  render();
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function collapseMobileMenu() {
  if (isMobileLayout()) $("#app-shell").classList.add("mobile-menu-collapsed");
}

function toggleMobileMenu() {
  $("#app-shell").classList.toggle("mobile-menu-collapsed");
}

function render() {
  if (state.view === "wrong") renderWrongNote();
  if (state.view === "bank") renderQuestionBankView();
  if (state.view === "users") renderUserAdminView();
  if (state.view === "stats") renderStats();
  if (state.view === "quiz") fillSubjectOptions();
  updateTopChapterLabel();
}

function fillSubjectOptions() {
  const select = $("#subject-select");
  const current = select.value;
  select.innerHTML = db.subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  if (current) select.value = current;
  fillGradeOptions();
  updateBankStatus();
}

function fillGradeOptions() {
  const subject = getSubject($("#subject-select").value);
  $("#grade-select").innerHTML = Object.keys(subject.grades).map((g) => `<option value="${g}">${g}학년</option>`).join("");
  fillChapterOptions();
  updateBankStatus();
}

function fillChapterOptions() {
  const subject = getSubject($("#subject-select").value);
  const grade = $("#grade-select").value;
  $("#chapter-select").innerHTML = subject.grades[grade].map((c) => `<option value="${c.id}">${c.title}</option>`).join("");
  updateBankStatus();
  updateTopChapterLabel();
}

function getSubject(id) {
  return db.subjects.find((s) => s.id === id) || db.subjects[0];
}

function getChapter(subjectId, grade, chapterId) {
  return getSubject(subjectId).grades[grade].find((c) => c.id === chapterId);
}

async function startQuiz() {
  await startQuizWithMode("normal");
}

async function startWrongTypeQuiz() {
  await startQuizWithMode("wrongTypes");
}

async function startQuizWithMode(mode) {
  const subjectId = $("#subject-select").value;
  const grade = $("#grade-select").value;
  const chapterId = $("#chapter-select").value;
  const difficulty = $("#difficulty-select").value;
  const count = Math.max(1, Math.min(20, Number($("#count-input").value) || 5));
  const chapter = getChapter(subjectId, grade, chapterId);
  $("#quiz-message").textContent = "";
  $("#start-quiz-btn").disabled = true;
  $("#wrong-type-quiz-btn").disabled = true;
  const activeButton = mode === "wrongTypes" ? $("#wrong-type-quiz-btn") : $("#start-quiz-btn");
  const originalText = activeButton.textContent;
  activeButton.textContent = "문제 준비 중...";
  let questions;
  try {
    questions = await buildQuizFromBankOnly(subjectId, grade, chapter, count, difficulty, mode);
  } catch (error) {
    $("#quiz-message").textContent = error.message;
    $("#start-quiz-btn").disabled = false;
    $("#wrong-type-quiz-btn").disabled = false;
    activeButton.textContent = originalText;
    return;
  } finally {
    $("#start-quiz-btn").disabled = false;
    $("#wrong-type-quiz-btn").disabled = false;
    activeButton.textContent = originalText;
  }
  state.quiz = { subjectId, grade, chapterId, difficulty, mode, questions, index: 0, correct: 0, answered: [], finished: false };
  updateTopChapterLabel();
  $("#quiz-setup").classList.add("hidden");
  $("#quiz-runner").classList.remove("hidden");
  renderQuizQuestion();
}

function updateTopChapterLabel() {
  const label = $("#top-chapter-label");
  if (!label) return;
  if (state.view !== "quiz") {
    label.textContent = "";
    return;
  }
  let subjectId = state.quiz?.subjectId || $("#subject-select")?.value;
  let grade = state.quiz?.grade || $("#grade-select")?.value;
  let chapterId = state.quiz?.chapterId || $("#chapter-select")?.value;
  if (!subjectId || !grade || !chapterId) {
    label.textContent = "";
    return;
  }
  const subject = getSubject(subjectId);
  const chapter = getChapter(subjectId, grade, chapterId);
  label.textContent = chapter ? `${grade}학년 · ${subject.name} · ${chapter.title}` : "";
}

async function buildQuizFromBankOnly(subjectId, grade, chapter, count, difficulty, mode = "normal") {
  const subject = getSubject(subjectId);
  const wrongTypes = mode === "wrongTypes" ? getWrongTypeSet(subjectId, grade, chapter.id) : null;
  if (mode === "wrongTypes" && !wrongTypes.size) throw new Error("이 챕터에서 틀렸던 유형이 없습니다.");
  if (difficulty === "all") {
    const banks = [];
    const user = userData();
    user.servedBank ||= {};
    for (const level of ["easy", "normal", "hard"]) {
      const levelBankKey = getBankKey(subjectId, grade, chapter.id, level);
      const rawBank = await getQuestionBank(levelBankKey);
      const latestBank = dedupeQuestions(rawBank.filter((question) => isQuestionForBank(question, subjectId, grade, chapter.id)));
      if (latestBank.length !== rawBank.length) await saveQuestionBank(levelBankKey, latestBank);
      const served = new Set(user.servedBank[levelBankKey] || []);
      latestBank.forEach((question) => banks.push({ ...question, difficulty: level, bankKey: levelBankKey, served }));
    }
    if (!banks.length) throw new Error("문제은행에 저장된 문제가 없습니다. 관리자에게 문제 생성을 요청하세요.");
    const unserved = banks.filter((question) => !question.served.has(bankTemplateId(question)) && (!wrongTypes || wrongTypes.has(String(question.typeIndex))));
    if (!unserved.length) throw new Error("이 챕터의 저장 문제를 모두 풀었습니다. 학습 초기화 후 다시 풀 수 있습니다.");
    const quizCount = Math.min(count, countUniqueTypes(unserved));
    if (!quizCount) throw new Error("중복되지 않는 문제 유형이 없습니다. 문제은행에서 다른 유형을 추가로 생성하세요.");
    return pickFromBank(unserved, quizCount, subjectId, subject.name, grade, chapter, new Set());
  }
  const bankKey = getBankKey(subjectId, grade, chapter.id, difficulty);
  const latestBank = dedupeQuestions((await getQuestionBank(bankKey)).filter((question) => isQuestionForBank(question, subjectId, grade, chapter.id)));
  if (latestBank.length !== (await getQuestionBank(bankKey)).length) await saveQuestionBank(bankKey, latestBank);
  if (!latestBank.length) throw new Error("문제은행에 저장된 문제가 없습니다. 관리자에게 문제 생성을 요청하세요.");
  const user = userData();
  user.servedBank ||= {};
  const served = new Set(user.servedBank[bankKey] || []);
  const unserved = latestBank.filter((question) => !served.has(bankTemplateId(question)) && (!wrongTypes || wrongTypes.has(String(question.typeIndex))));
  if (unserved.length === 0) throw new Error("이 챕터의 저장 문제를 모두 풀었습니다. 학습 초기화 후 다시 풀 수 있습니다.");
  const quizCount = Math.min(count, countUniqueTypes(unserved));
  if (!quizCount) throw new Error("중복되지 않는 문제 유형이 없습니다. 문제은행에서 다른 유형을 추가로 생성하세요.");
  return pickFromBank(wrongTypes ? latestBank.filter((question) => wrongTypes.has(String(question.typeIndex))) : latestBank, quizCount, subjectId, subject.name, grade, chapter, served);
}

async function buildBankedQuestionSet(subjectId, grade, chapter, count, difficulty) {
  const subject = getSubject(subjectId);
  const bankKey = getBankKey(subjectId, grade, chapter.id, difficulty);
  let bank = await getQuestionBank(bankKey);

  if (bank.length < BANK_LIMIT) {
    const need = Math.min(BANK_LIMIT - bank.length, count);
    const generated = await buildGptQuestionSet(subjectId, grade, chapter, need, bank, difficulty);
    bank = await getQuestionBank(bankKey);
    generated.forEach((question) => {
      if (bank.length < BANK_LIMIT && !hasSimilarQuestion(bank, question)) {
        bank.push(toBankTemplate(question, subjectId, grade, chapter.id));
      }
    });
    await saveQuestionBank(bankKey, bank);
    updateBankStatus();
  } else {
    $("#quiz-message").textContent = "";
  }

  const latestBank = dedupeQuestions((await getQuestionBank(bankKey)).filter((question) => isQuestionForBank(question, subjectId, grade, chapter.id)));
  if (latestBank.length !== (await getQuestionBank(bankKey)).length) await saveQuestionBank(bankKey, latestBank);
  if (!latestBank.length) throw new Error("문제은행을 만들지 못했습니다");
  const user = userData();
  user.servedBank ||= {};
  const served = new Set(user.servedBank[bankKey] || []);
  const picked = pickFromBank(latestBank, count, subjectId, subject.name, grade, chapter, served);
  saveUser(user);
  return picked;
}

async function generateBankQuestions(subjectId, grade, chapterId, difficulty, count, onProgress) {
  const chapter = getChapter(subjectId, grade, chapterId);
  const bankKey = getBankKey(subjectId, grade, chapter.id, difficulty);
  let bank = await getQuestionBank(bankKey);
  if (bank.length >= BANK_LIMIT) throw new Error("이미 문제은행이 100개로 채워져 있습니다.");
  const need = Math.min(BANK_LIMIT - bank.length, count);
  onProgress?.({ current: bank.length, total: BANK_LIMIT, requested: need, status: "requesting" });
  const generated = await buildGptQuestionSet(subjectId, grade, chapter, need, bank, difficulty);
  bank = await getQuestionBank(bankKey);
  for (const question of generated) {
    if (bank.length < BANK_LIMIT && !hasSimilarQuestion(bank, question)) {
      bank.push(toBankTemplate(question, subjectId, grade, chapter.id));
      await saveQuestionBank(bankKey, bank);
      onProgress?.({ current: bank.length, total: BANK_LIMIT, requested: need, status: "saved" });
    }
  }
  await saveQuestionBank(bankKey, bank);
  return bank.length;
}

async function updateBankStatus() {
  const box = $("#bank-status");
  if (!box || !$("#subject-select").value || !$("#grade-select").value || !$("#chapter-select").value) return;
  try {
    const subject = getSubject($("#subject-select").value);
    const grade = $("#grade-select").value;
    const chapter = getChapter(subject.id, grade, $("#chapter-select").value);
    const difficulty = $("#difficulty-select").value || "normal";
    const difficultyName = { all: "전체", easy: "하", normal: "중", hard: "상" }[difficulty];
    if (difficulty === "all") {
      const banks = await Promise.all(["easy", "normal", "hard"].map((level) => getQuestionBank(getBankKey(subject.id, grade, chapter.id, level))));
      const total = banks.reduce((sum, bank) => sum + bank.length, 0);
      box.textContent = `${subject.name} ${grade}학년 · ${chapter.title} · 난이도 ${difficultyName} 문제은행: ${total}/${BANK_LIMIT * 3}개`;
      return;
    }
    const bank = await getQuestionBank(getBankKey(subject.id, grade, chapter.id, difficulty));
    box.textContent = `${subject.name} ${grade}학년 · ${chapter.title} · 난이도 ${difficultyName} 문제은행: ${bank.length}/${BANK_LIMIT}개`;
  } catch {
    box.textContent = "문제은행 개수를 확인할 수 없습니다.";
  }
}

function getBankKey(subjectId, grade, chapterId, difficulty = "normal") {
  return JSON.stringify({ subjectId, grade, chapterId, difficulty });
}

function parseBankKey(bankKey) {
  try {
    const parsed = JSON.parse(bankKey);
    if (parsed && parsed.subjectId && parsed.grade && parsed.chapterId && parsed.difficulty) return parsed;
  } catch {}
  const [subjectId, grade, ...rest] = String(bankKey).split(":");
  const difficulty = rest.pop() || "normal";
  return { subjectId, grade, chapterId: rest.join(":"), difficulty };
}

function openBankDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BANK_DB_NAME, BANK_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BANK_STORE)) db.createObjectStore(BANK_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getQuestionBank(bankKey) {
  if (isServerStorageEnabled()) return getServerQuestionBank(bankKey);
  const db = await openBankDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BANK_STORE, "readonly");
    const request = tx.objectStore(BANK_STORE).get(bankKey);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function saveQuestionBank(bankKey, bank) {
  if (isServerStorageEnabled()) {
    if (!isBankAdmin()) return;
    return saveServerQuestionBank(bankKey, bank);
  }
  const db = await openBankDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BANK_STORE, "readwrite");
    tx.objectStore(BANK_STORE).put(bank.slice(0, BANK_LIMIT), bankKey);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getServerQuestionBank(bankKey) {
  const session = readServerSession();
  if (!session) return [];
  const url = serverUrl(`/rest/v1/${serverQuestionBankTable()}?bank_key=eq.${encodeURIComponent(bankKey)}&select=questions`);
  const response = await fetch(url, {
    headers: serverDataHeaders(session.access_token),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("서버 문제은행을 불러오지 못했습니다.");
  const rows = await response.json();
  return Array.isArray(rows[0]?.questions) ? rows[0].questions : [];
}

async function saveServerQuestionBank(bankKey, bank) {
  const session = readServerSession();
  if (!session) throw new Error("서버 로그인이 필요합니다.");
  const payload = {
    bank_key: bankKey,
    questions: bank.slice(0, BANK_LIMIT),
    updated_by: session.user_id,
    updated_at: new Date().toISOString()
  };
  const response = await fetch(serverUrl(`/rest/v1/${serverQuestionBankTable()}?on_conflict=bank_key`), {
    method: "POST",
    headers: serverDataHeaders(session.access_token, {
      Prefer: "resolution=merge-duplicates,return=minimal"
    }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("서버 문제은행 저장에 실패했습니다.");
}

async function deleteQuestionFromBank(bankKey, createdAt, prompt) {
  const bank = await getQuestionBank(bankKey);
  const next = bank.filter((question) => !(question.createdAt === createdAt && question.prompt === prompt));
  await saveQuestionBank(bankKey, next);
  return next.length;
}

function toBankTemplate(question, subjectId, grade, chapterId) {
  return {
    subjectId,
    grade,
    chapterId,
    typeIndex: question.typeIndex,
    prompt: question.prompt,
    choices: question.choices,
    answer: question.answer,
    solution: question.solution,
    createdAt: new Date().toISOString()
  };
}

function isQuestionForBank(question, subjectId, grade, chapterId) {
  return question.subjectId === subjectId
    && question.grade === grade
    && question.chapterId === chapterId;
}

function pickFromBank(bank, count, subjectId, subjectName, grade, chapter, served = new Set()) {
  const selected = [];
  const selectedTypes = new Set();
  let pool = shuffle(bank).filter((template) => !served.has(bankTemplateId(template)));
  for (const template of pool) {
    const typeKey = String(template.typeIndex);
    if (!selectedTypes.has(typeKey)) {
      selected.push(template);
      selectedTypes.add(typeKey);
    }
    if (selected.length >= count) break;
  }
  const questions = [];
  for (const [index, template] of selected.entries()) {
    const variant = makeStoredVariant(template, index, subjectId, grade, chapter);
    const question = {
      id: `${template.chapterId}:bank:${template.typeIndex}:${Date.now()}:${Math.random()}`,
      typeIndex: template.typeIndex,
      subjectId,
      grade,
      chapterId: chapter.id,
      subjectName,
      chapterTitle: chapter.title,
      difficulty: template.difficulty || "normal",
      bankKey: template.bankKey || getBankKey(subjectId, grade, chapter.id, template.difficulty || "normal"),
      bankTemplateId: bankTemplateId(template),
      prompt: variant.prompt,
      choices: shuffle(variant.choices),
      answer: variant.answer,
      solution: variant.solution
    };
    if (isQuestionAlignedWithChapter(question, subjectId, chapter)) questions.push(question);
    if (questions.length >= count) break;
  }
  if (questions.length < Math.min(count, selected.length)) {
    throw new Error("선택한 챕터와 맞지 않는 저장 문제가 있어 출제하지 않았습니다. 문제은행에서 해당 챕터 문제를 다시 생성하세요.");
  }
  return questions;
}

function countUniqueTypes(questions) {
  return new Set(questions.map((question) => String(question.typeIndex))).size;
}

function wrongTypeKey(subjectId, grade, chapterId) {
  return `${subjectId}:${grade}:${chapterId}`;
}

function getWrongTypeSet(subjectId, grade, chapterId) {
  const user = userData();
  user.wrongTypes ||= {};
  return new Set(user.wrongTypes[wrongTypeKey(subjectId, grade, chapterId)] || []);
}

function recordWrongType(question, targetUser = null) {
  const user = targetUser || userData();
  user.wrongTypes ||= {};
  const subjectId = question.subjectId || state.quiz?.subjectId;
  const grade = question.grade || state.quiz?.grade;
  const chapterId = question.chapterId || state.quiz?.chapterId || parseBankKey(question.bankKey || "{}").chapterId;
  if (!subjectId || !grade || !chapterId || question.typeIndex === undefined) return;
  const key = wrongTypeKey(subjectId, grade, chapterId);
  const types = new Set(user.wrongTypes[key] || []);
  types.add(String(question.typeIndex));
  user.wrongTypes[key] = [...types];
  if (!targetUser) saveUser(user);
}

function isQuestionAlignedWithChapter(question, subjectId, chapter) {
  if (subjectId !== "math") return true;
  const text = normalizeQuestionText(`${question.prompt} ${question.answer} ${question.solution}`);
  const rules = {
    "m1-prime": {
      requireAny: ["소수", "소인수", "소인수분해", "약수", "공약수", "최대공약수", "공배수", "최소공배수", "서로소"],
      rejectAny: ["유리수", "음수", "양수", "절댓값", "수직선", "일차함수", "방정식", "좌표", "평균", "최빈값", "삼각형", "원의", "원주", "원기둥"]
    },
    "m1-rational": {
      requireAny: ["정수", "유리수", "음수", "양수", "절댓값", "수직선", "덧셈", "뺄셈", "곱", "나눗셈", "반대수"],
      rejectAny: ["소인수", "소인수분해", "최대공약수", "최소공배수", "일차함수", "방정식", "인수분해"]
    },
    "m1-expression": {
      requireAny: ["문자", "식", "일차식", "동류항", "계수", "상수항", "대입"],
      rejectAny: ["소인수", "유리수", "절댓값", "일차함수", "방정식"]
    },
    "m1-equation": {
      requireAny: ["방정식", "해", "양변", "이항", "x"],
      rejectAny: ["소인수", "유리수", "일차함수", "좌표", "평균"]
    },
    "m1-graph": {
      requireAny: ["좌표", "그래프", "일차함수", "정비례", "반비례", "기울기", "절편"],
      rejectAny: ["소인수", "절댓값", "방정식", "평균"]
    },
    "m1-geometry-basic": {
      requireAny: ["점", "선", "면", "직선", "반직선", "선분", "각", "맞꼭지각", "수직", "평행", "동위각", "엇각", "작도", "합동"],
      rejectAny: ["소인수", "유리수", "일차함수", "방정식", "좌표", "평균", "확률"]
    },
    "m1-plane-solid": {
      requireAny: ["다각형", "삼각형", "내각", "외각", "원", "부채꼴", "다면체", "회전체", "기둥", "뿔", "겉넓이", "부피"],
      rejectAny: ["소인수", "유리수", "일차함수", "방정식", "좌표", "평균"]
    }
  };
  const rule = rules[chapter.id];
  if (!rule) {
    const chapterWords = [chapter.title, ...(chapter.topics || [])].map(normalizeQuestionText).filter(Boolean);
    return chapterWords.some((word) => text.includes(word));
  }
  const hasRequired = rule.requireAny.some((word) => text.includes(normalizeQuestionText(word)));
  const hasRejected = rule.rejectAny.some((word) => text.includes(normalizeQuestionText(word)));
  return hasRequired && !hasRejected;
}

function bankTemplateId(template) {
  return `${template.createdAt || "no-date"}::${normalizeQuestionText(template.prompt)}::${normalizeQuestionText(template.answer)}`;
}

function dedupeQuestions(questions) {
  const unique = [];
  questions.forEach((question) => {
    if (!hasSimilarQuestion(unique, question)) unique.push(question);
  });
  return unique;
}

function hasSimilarQuestion(questions, candidate) {
  const candidateText = normalizeQuestionText(candidate.prompt);
  const candidateTokens = tokenSet(candidateText);
  return questions.some((question) => {
    const text = normalizeQuestionText(question.prompt);
    if (text === candidateText) return true;
    if (text.includes(candidateText) || candidateText.includes(text)) return Math.min(text.length, candidateText.length) > 24;
    const similarity = jaccard(candidateTokens, tokenSet(text));
    return similarity >= 0.72;
  });
}

function normalizeQuestionText(text) {
  return String(text)
    .replace(/\([^)]*\)/g, "")
    .replace(/\\\([^)]*\\\)/g, "")
    .replace(/\b\d+\b/g, "#")
    .replace(/[^\p{L}\p{N}#가-힣]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenSet(text) {
  return new Set(text.split(" ").filter((token) => token.length > 1));
}

function jaccard(a, b) {
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  return intersection / union.size;
}

function makeStoredVariant(template, index, subjectId, grade, chapter) {
  const storedType = chapter.types[template.typeIndex] || template.prompt.slice(0, 20);
  const storedIndex = Number(template.typeIndex);
  const item = { type: storedType, index: Number.isInteger(storedIndex) ? storedIndex : index };
  if (subjectId === "math") {
    return createMathQuestion(grade, chapter, item, getSubject(subjectId).name);
  }
  const variants = [
    ["민준", "서연"], ["운동장", "교실"], ["봄", "새 학기"], ["편지", "쪽지"], ["할머니", "선생님"]
  ];
  let prompt = template.prompt;
  let answer = template.answer;
  let solution = template.solution;
  let choices = [...template.choices];
  variants.forEach(([from, to], offset) => {
    const replacement = (Date.now() + index + offset) % 2 === 0 ? to : from;
    prompt = prompt.replaceAll(from, replacement);
    answer = answer.replaceAll(from, replacement);
    solution = solution.replaceAll(from, replacement);
    choices = choices.map((choice) => choice.replaceAll(from, replacement));
  });
  return { prompt, answer, choices: uniqueChoices(answer, choices.filter((choice) => choice !== answer)), solution };
}

function loadGptSettings() {
  localStorage.removeItem(`${STORE}:openaiKey`);
}

async function buildGptQuestionSet(subjectId, grade, chapter, count, existingBank = [], difficulty = "normal") {
  if (!isServerStorageEnabled()) throw new Error("서버 설정이 필요합니다. OpenAI API 키는 서버에서만 사용할 수 있습니다.");
  const session = readServerSession();
  if (!session) throw new Error("서버 로그인이 필요합니다.");
  const subject = getSubject(subjectId);
  const user = userData();
  const key = `${subjectId}:${grade}:${chapter.id}`;
  const seen = new Set(user.seen[key] || []);
  let pool = chapter.types.map((type, index) => ({ type, index })).filter((item) => !seen.has(item.index));
  if (pool.length < count) {
    pool = chapter.types.map((type, index) => ({ type, index }));
    user.seen[key] = [];
    saveUser(user);
  }
  shuffle(pool);
  const selectedTypes = pool.slice(0, count);
  const model = difficulty === "hard" ? "gpt-5" : "gpt-5-mini";
  let response;
  try {
    response = await fetch(serverQuestionFunctionUrl(), {
      method: "POST",
      headers: serverDataHeaders(session.access_token),
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: makeQuestionPrompt(subject.name, grade, chapter, selectedTypes, existingBank, difficulty)
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "edudash_questions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                questions: {
                  type: "array",
                  minItems: count,
                  maxItems: count,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      typeIndex: { type: "integer" },
                      prompt: { type: "string" },
                      choices: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                      answer: { type: "string" },
                      solution: { type: "string" }
                    },
                    required: ["typeIndex", "prompt", "choices", "answer", "solution"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }
      })
    });
  } catch {
    throw new Error("AI 문제 생성 서버 함수에 연결하지 못했습니다. Supabase Edge Function 주소와 CORS 설정을 확인해 주세요.");
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`서버 문제 생성 오류 ${response.status}: ${errorText.slice(0, 120)}`);
  }
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("문제 JSON을 받지 못했습니다");
  const parsed = JSON.parse(text);
  return parsed.questions.slice(0, selectedTypes.length).map((question, idx) => {
    const fallback = selectedTypes[idx];
    const typeIndex = fallback.index;
    const choices = uniqueChoices(question.answer, question.choices.filter((choice) => choice !== question.answer));
    if (!choices.includes(question.answer)) choices[0] = question.answer;
    return {
      id: `${chapter.id}:gpt:${typeIndex}:${Date.now()}:${Math.random()}`,
      typeIndex,
      grade,
      subjectName: subject.name,
      chapterTitle: chapter.title,
      prompt: question.prompt,
      choices: shuffle(choices),
      answer: question.answer,
      solution: question.solution
    };
  }).filter((question, index, list) => !hasSimilarQuestion(list.slice(0, index), question));
}

function makeQuestionPrompt(subjectName, grade, chapter, selectedTypes, existingBank = [], difficulty = "normal") {
  const existingSummary = existingBank.slice(-30).map((question, index) => `${index + 1}. ${question.prompt.slice(0, 160).replace(/\s+/g, " ")}`).join("\n");
  const difficultyGuide = {
    easy: "난이도 하: 개념 확인 중심, 계산은 짧게, 지문은 짧고 단서가 분명하게.",
    normal: "난이도 중: 개념 적용과 기본 추론을 포함하고, 보기 함정은 1~2개 포함.",
    hard: "난이도 상: 복합 추론, 여러 조건 연결, 고난도 문항. 단 정답은 명확해야 함."
  }[difficulty] || "";
  return `
중학교 ${grade}학년 ${subjectName} 학습 앱의 4지선다 문제를 생성해줘.
단원: ${chapter.title}
핵심 학습 요소: ${(chapter.topics || []).join(", ")}
${difficultyGuide}

반드시 지킬 규칙:
1. 아래 문제유형마다 정확히 1문제씩 만들기.
2. 유형명만 바꾸지 말고, 문제에서 요구하는 사고 과정과 풀이 방식이 서로 달라야 함.
3. 국어 문제는 매 문제마다 새 지문을 직접 작성하고, 지문·질문·정답·해설이 서로 정확히 일치해야 함.
4. 수학 문제는 계산 조건과 정답이 정확히 맞아야 하며, 해설에 풀이 과정을 포함해야 함.
5. 보기 4개 중 정답은 정확히 1개만 있어야 함.
6. 저작권 있는 교과서 지문이나 인터넷 문제를 그대로 쓰지 말고 새로 작성하기.
7. prompt에는 유형명 헤더를 쓰지 말고, 학생에게 보일 지문/문제만 작성하기.
8. answer 값은 choices 배열 안의 문자열 하나와 완전히 같아야 함.
9. 같은 단원 안에서도 서로 다른 지문, 조건, 수치, 상황을 사용해 문제은행에 저장할 가치가 있는 새 문제로 만들기.
10. 나중에 저장된 문제에서 수치와 조건을 변형해 재사용할 수 있도록, 수학 문제는 수치 조건과 계산 과정이 분명해야 함.
11. 아래 기존 문제와 지문, 상황, 질문 방식, 계산 구조가 겹치면 안 됨. 숫자만 바꾸는 변형도 금지.
12. 반드시 위 단원과 핵심 학습 요소 안에서만 출제하기. 다른 챕터의 개념, 공식, 문법 요소, 문학 요소를 섞지 말기.
13. 문제의 지문/상황/계산 조건/해설은 모두 해당 단원과 직접 연결되어야 함.

문제유형:
${selectedTypes.map((item) => `- typeIndex ${item.index}: ${item.type}`).join("\n")}

기존 문제 일부:
${existingSummary || "아직 없음"}
`;
}

function buildQuestionSet(subjectId, grade, chapter, count) {
  const user = userData();
  const key = `${subjectId}:${grade}:${chapter.id}`;
  const seen = new Set(user.seen[key] || []);
  let pool = chapter.types.map((type, index) => ({ type, index })).filter((item) => !seen.has(item.index));
  if (pool.length < count) {
    pool = chapter.types.map((type, index) => ({ type, index }));
    user.seen[key] = [];
    saveUser(user);
  }
  shuffle(pool);
  return pool.slice(0, count).map((item) => createQuestion(subjectId, grade, chapter, item));
}

function createQuestion(subjectId, grade, chapter, item) {
  const subject = getSubject(subjectId);
  if (subjectId === "math") return createMathQuestion(grade, chapter, item, subject.name);
  if (subjectId === "science") return createScienceQuestion(grade, chapter, item, subject.name);
  return createKoreanQuestion(grade, chapter, item, subject.name);
}

function createKoreanQuestion(grade, chapter, item, subjectName) {
  const built = buildKoreanVariant(chapter, item);
  return {
    id: `${chapter.id}:${item.index}:${Date.now()}:${Math.random()}`,
    typeIndex: item.index,
    grade,
    subjectName,
    chapterTitle: chapter.title,
    prompt: built.prompt,
    choices: shuffle(built.choices),
    answer: built.answer,
    solution: built.solution
  };
}

function createMathQuestion(grade, chapter, item, subjectName) {
  const n = item.index + 2;
  const a = (n % 7) + 2;
  const b = (n % 5) + 3;
  const x = (n % 6) + 1;
  return buildMathVariant(a, b, x, item, chapter, grade, subjectName);
}

function createScienceQuestion(grade, chapter, item, subjectName) {
  const topics = Array.isArray(chapter.topics) && chapter.topics.length ? chapter.topics : [chapter.title];
  const topic = topics[item.index % topics.length];
  const nextTopic = topics[(item.index + 1) % topics.length];
  const variants = [
    {
      prompt: `${chapter.title} 단원에서 '${topic}'의 의미로 가장 알맞은 것을 고르세요.`,
      answer: `${topic}와 관련된 현상이나 자료를 증거에 따라 설명하는 개념이다.`,
      wrongs: [`${nextTopic}와 관계없이 이름만 외우면 되는 내용이다.`, "관찰이나 실험 결과와 상관없이 항상 같은 결론을 내리는 절차이다.", "과학 단원과 관계없는 생활 상식만을 뜻한다."],
      solution: `${topic}는 ${chapter.title} 단원 안에서 관찰, 자료, 실험 결과와 연결해 이해해야 합니다.`
    },
    {
      prompt: `다음 중 '${topic}'을 탐구할 때 가장 적절한 태도나 과정은 무엇인가요?`,
      answer: "조건을 분명히 하고 관찰 결과를 근거로 결론을 정리한다.",
      wrongs: ["예상과 다른 자료는 모두 버리고 결론을 먼저 정한다.", "한 번의 관찰만으로 모든 경우에 적용되는 법칙이라고 단정한다.", "측정값을 기록하지 않고 느낌만으로 설명한다."],
      solution: "과학 탐구에서는 조건, 관찰, 측정, 자료 해석이 결론의 근거가 되어야 합니다."
    },
    {
      prompt: `${chapter.title}에서 '${topic}'과 가장 직접적으로 관련 있는 예를 고르세요.`,
      answer: `${topic}의 변화나 특징을 관찰하여 원인을 설명한다.`,
      wrongs: ["국어 글의 주제를 찾아 문단 구조를 분석한다.", "일차방정식을 세워 미지수의 값을 구한다.", `${chapter.title}와 무관한 역사적 사건의 순서를 외운다.`],
      solution: `선택한 챕터는 ${chapter.title}이므로 ${topic}와 직접 연결된 과학 현상을 골라야 합니다.`
    },
    {
      prompt: `'${topic}'에 대한 설명을 읽고 옳은 것을 고르세요.`,
      answer: `자료를 비교하면 ${topic}의 특징이나 변화를 더 정확히 판단할 수 있다.`,
      wrongs: [`${topic}는 실험이나 관찰 자료와 전혀 관련이 없다.`, `${topic}는 항상 하나의 암기 문장만으로 판단해야 한다.`, `${topic}를 설명할 때 원인과 결과를 구분할 필요가 없다.`],
      solution: "과학 개념은 자료를 비교하고 원인과 결과를 따져 해석할 때 더 정확해집니다."
    }
  ];
  const built = variants[item.index % variants.length];
  return {
    id: `${chapter.id}:${item.index}:${Date.now()}:${Math.random()}`,
    typeIndex: item.index,
    grade,
    subjectName,
    chapterTitle: chapter.title,
    prompt: built.prompt,
    choices: shuffle(uniqueChoices(built.answer, built.wrongs)),
    answer: built.answer,
    solution: built.solution
  };
}

function buildKoreanVariant(chapter, item) {
  const set = koreanQuestionSets[item.index % koreanQuestionSets.length];
  const type = item.type;
  const lead = set.passage;
  const variants = [
    () => koreanQuestion(lead, "위 글의 중심 내용을 가장 잘 정리한 것은 무엇인가요?", set.core, ["단어의 품사를 순서대로 설명한다.", "물건을 조립하는 절차를 안내한다.", "통계 자료의 증가율을 비교한다."], "중심 내용은 글 전체를 묶는 생각이어야 합니다."),
    () => koreanQuestion(lead, "이 글의 분위기로 가장 알맞은 것은 무엇인가요?", set.mood, ["차갑고 공격적인 분위기", "딱딱한 사용 설명서의 분위기", "복잡한 계산을 요구하는 분위기"], "분위기는 장면, 어휘, 정서를 함께 보아 판단합니다."),
    () => koreanQuestion(lead, "말하는 이의 태도로 가장 알맞은 것은 무엇인가요?", "대상을 주의 깊게 바라보며 의미를 생각한다.", ["대상을 조롱하며 비난한다.", "객관적 수치만 나열한다.", "상대에게 행동을 강하게 명령한다."], "짧은 문학적 문장은 대상에 대한 시선과 정서를 담습니다."),
    () => koreanQuestion(lead, "이 글에서 추론할 수 있는 내용으로 적절한 것은 무엇인가요?", set.inference, ["본문과 반대되는 일이 일어났다고 단정할 수 있다.", "글의 대상은 아무 의미가 없다고 볼 수 있다.", "문장 부호의 개수가 핵심 의미를 결정한다."], "추론은 본문 단서에서 자연스럽게 이끌어내야 합니다."),
    () => koreanQuestion(lead, "다음 중 이 글의 주제에 가장 가까운 것은 무엇인가요?", set.theme, ["빠른 결과만이 가치 있다.", "모든 글은 숫자로만 설명된다.", "과거의 일은 현재와 관련이 없다."], "주제는 장면이 전달하는 중심 생각입니다."),
    () => koreanQuestion(lead, "글에서 상징적으로 볼 수 있는 대상을 고르세요.", set.symbol, ["문장 부호", "글자 수", "띄어쓰기"], "상징은 구체적 대상이 더 큰 의미를 담을 때 성립합니다."),
    () => koreanQuestion(lead, "감각적 심상이 가장 잘 드러나는 표현 방식은 무엇인가요?", "장면을 떠올리게 하는 구체적 대상과 상황을 제시한다.", ["낱말의 사전 뜻만 반복한다.", "숫자를 표로만 배열한다.", "문법 용어만 나열한다."], "심상은 독자가 감각적으로 장면을 떠올리게 하는 표현입니다."),
    () => koreanQuestion(lead, "이 글의 제목으로 가장 알맞은 것을 고르세요.", set.title, ["정수의 계산법", "회의 진행 순서", "광고 문구 만들기"], "제목은 핵심 장면과 의미를 함께 담아야 합니다."),
    () => koreanQuestion(lead, "글의 표현 효과로 적절한 것은 무엇인가요?", "짧은 장면으로도 대상의 상태와 정서를 함축한다.", ["논쟁의 찬반 근거를 모두 제시한다.", "실험 과정을 단계별로 지시한다.", "상품 구매를 직접 요구한다."], "문학적 표현은 장면과 정서를 함축적으로 전달할 수 있습니다."),
    () => koreanQuestion(lead, "이 글을 읽은 반응으로 가장 타당한 것은 무엇인가요?", `${set.symbol}의 모습을 근거로 '${set.theme}'을 떠올릴 수 있다.`, ["본문과 상관없이 결론만 말하면 된다.", "가장 긴 보기가 항상 정답이다.", "읽지 않은 내용을 사실처럼 단정한다."], "감상은 본문에 나타난 표현과 장면을 근거로 해야 합니다."),
    () => koreanQuestion(lead, "글의 내용과 일치하는 설명을 고르세요.", set.exact, ["본문에 없는 사건이 중심적으로 일어난다.", "글은 표와 그래프만으로 이루어져 있다.", "글에는 대상이나 상황이 전혀 나타나지 않는다."], "내용 일치 문제는 본문에 직접 제시된 정보를 확인합니다."),
    () => koreanQuestion(lead, "이 글에서 대조적으로 느껴지는 두 요소를 고르세요.", set.contrast, ["글자 수와 쉼표", "제목과 쪽수", "문장 길이와 줄 간격"], "대조는 서로 다른 느낌이나 의미를 지닌 요소를 함께 볼 때 드러납니다."),
    () => koreanQuestion(lead, "다음 중 글의 흐름을 해치지 않는 문장을 고르세요.", "그 장면은 겉으로 드러난 모습보다 더 깊은 의미를 품고 있었다.", ["따라서 분모를 유리화해야 한다.", "회의 안건은 세 가지로 정리된다.", "제품을 구매하면 할인 쿠폰을 준다."], "문장 삽입은 앞뒤 분위기와 내용의 연결성을 기준으로 판단합니다."),
    () => koreanQuestion(lead, "이 글을 설명문으로 바꿀 때 가장 먼저 보완할 내용은 무엇인가요?", "글에 나타난 대상의 특징과 관련 배경을 구체적으로 설명한다.", ["정서를 더 모호하게 만든다.", "비유 표현만 계속 늘린다.", "결론을 삭제한다."], "설명문은 대상의 원리, 과정, 특징을 분명히 알려 주는 글입니다."),
    () => koreanQuestion(lead, "이 글에서 생략된 말하는 이의 마음으로 알맞은 것은 무엇인가요?", "대상에 담긴 의미를 조용히 헤아리는 마음", ["상대에 대한 노골적인 분노", "계산 결과에 대한 의심", "물건 구매에 대한 압박"], "말하는 이의 마음은 분위기와 대상의 상태에서 추론합니다."),
    () => koreanQuestion(lead, "보기 중 글의 갈래를 판단하는 근거로 알맞은 것은 무엇인가요?", "함축적 표현으로 정서와 의미를 드러낸다.", ["조항 번호가 차례대로 제시된다.", "실험 도구와 방법만 안내한다.", "찬성과 반대가 토론 형식으로 배열된다."], "문학 갈래는 표현 방식과 정서, 형상화 방식을 통해 판단합니다."),
    () => koreanQuestion(lead, "이 글의 표현을 더 생생하게 고칠 때 적절한 방향은 무엇인가요?", "대상의 모습이나 주변 분위기를 구체적인 감각어로 보완한다.", ["핵심 장면을 모두 삭제한다.", "문장을 모두 숫자로 바꾼다.", "서로 관련 없는 정보를 추가한다."], "표현을 생생하게 하려면 장면을 떠올릴 수 있는 구체성이 필요합니다."),
    () => koreanQuestion(lead, "문맥상 핵심 소재가 지닌 의미로 가장 적절한 것은 무엇인가요?", set.meaning, ["끝난 일을 잊으라는 명령", "정확한 계산 결과", "광고의 할인 기간"], "문맥 속 소재의 의미는 글 전체의 분위기와 연결해 판단합니다."),
    () => koreanQuestion(lead, "이 글의 서술상 특징으로 가장 알맞은 것은 무엇인가요?", "짧은 문장으로 하나의 인상적인 장면을 제시한다.", ["여러 인물의 토론을 직접 인용한다.", "통계 수치를 긴 표로 제시한다.", "사용 순서를 번호로 안내한다."], "서술상 특징은 글이 내용을 전달하는 방식에서 찾습니다."),
    () => koreanQuestion(lead, "이 글을 바탕으로 한 질문으로 가장 깊이 있는 것은 무엇인가요?", `이 장면이 말하는 '${set.theme}'은 우리 삶에서 어떻게 발견될 수 있을까?`, ["글자는 모두 몇 개인가?", "쉼표는 몇 번 나오는가?", "첫 글자의 획수는 얼마인가?"], "깊이 있는 질문은 글의 의미와 독자의 생각을 확장합니다.")
  ];
  return variants[item.index % variants.length]();
}

function koreanQuestion(lead, task, answer, wrongs, solution) {
  return {
    prompt: `${lead}\n\n${task}`,
    answer,
    choices: uniqueChoices(answer, wrongs),
    solution: `풀이: ${solution}`
  };
}

function buildMathVariant(a, b, x, item, chapter, grade, subjectName) {
  if (chapter.id === "m1-prime") return buildPrimeVariant(a, b, item, chapter, grade, subjectName);
  if (chapter.id === "m1-rational") return buildRationalVariant(a, b, x, item, chapter, grade, subjectName);
  if (chapter.id === "m1-expression") return buildExpressionVariant(a, b, x, item, chapter, grade, subjectName);
  if (chapter.id === "m1-equation") return buildEquationVariant(a, b, x, item, chapter, grade, subjectName);
  if (chapter.id === "m1-graph") return buildGraphVariant(a, b, x, item, chapter, grade, subjectName);
  if (chapter.id === "m1-geometry-basic") return buildGeometryBasicVariant(a, b, item, chapter, grade, subjectName);
  if (chapter.id === "m1-plane-solid") return buildPlaneSolidVariant(a, b, item, chapter, grade, subjectName);
  if (chapter.id === "m1-statistics") return buildStatisticsVariant(a, b, item, chapter, grade, subjectName);
  return buildGenericChapterVariant(a, b, x, item, chapter, grade, subjectName);
}

function buildGenericChapterVariant(a, b, x, item, chapter, grade, subjectName) {
  const topics = Array.isArray(chapter.topics) && chapter.topics.length ? chapter.topics : [chapter.title];
  const topic = topics[item.index % topics.length];
  const n = item.index + 1;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `${chapter.title} 단원에서 '${topic}'에 대한 설명으로 가장 알맞은 것을 고르세요.`, `${topic}의 핵심 개념을 조건에 맞게 판단한다.`, [`다른 단원의 계산 규칙을 먼저 적용한다.`, `문제의 조건과 관계없는 값을 고른다.`, `${chapter.title}과 관련 없는 용어만 비교한다.`], `${chapter.title} 단원의 핵심 주제인 ${topic}을 기준으로 판단합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `${chapter.title} 단원의 '${item.type}' 유형 문제입니다. 다음 중 풀이 방향으로 알맞은 것은 무엇인가요?`, `${topic}의 정의와 성질을 먼저 확인한다.`, [`소인수분해만 이용한다.`, `정수와 유리수의 부호만 판단한다.`, `그래프의 기울기만 구한다.`], `${chapter.title}에서는 ${topic}에 맞는 정의와 성질을 적용해야 합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `${chapter.title}에서 '${topic}'을 다룰 때 가장 먼저 확인할 조건은 무엇인가요?`, `${topic}과 관련된 조건`, [`확률의 전체 경우`, `방정식의 미지수`, `자료의 평균`], `선택한 챕터는 ${chapter.title}이므로 ${topic} 조건을 우선 확인합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `${chapter.title} 단원의 문제를 해결하는 과정으로 적절한 것을 고르세요.`, `${topic}의 성질을 문제 조건에 적용한다.`, [`서로 다른 단원의 공식을 임의로 적용한다.`, `조건을 보지 않고 보기를 고른다.`, `단원과 무관한 수만 계산한다.`], `${chapter.title} 문제는 단원 주제인 ${topic}과 연결해 풀어야 합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `${chapter.title}의 '${topic}' 개념을 잘못 이해한 설명을 고르세요.`, `${chapter.title}과 관계없는 개념으로만 설명한다.`, [`${topic}의 정의를 확인한다.`, `문제에 주어진 조건을 비교한다.`, `${chapter.title} 단원의 성질을 적용한다.`], `오답 설명은 ${chapter.title}의 ${topic}과 관계가 없습니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildExpressionVariant(a, b, x, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `\\(x=${x}\\)일 때 \\(${a}x+${b}\\)의 값을 고르세요.`, `${a * x + b}`, [`${a + x + b}`, `${a * x - b}`, `${x + b}`], `문자에 값을 대입해 계산합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `일차식 \\(${a}x+${b}x\\)를 간단히 한 것을 고르세요.`, `\\(${a + b}x\\)`, [`\\(${a * b}x\\)`, `\\(${a + b}\\)`, `\\(${a}x+${b}\\)`], `동류항의 계수끼리 더합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}(x+${b})\\)를 분배법칙으로 전개한 것을 고르세요.`, `\\(${a}x+${a * b}\\)`, [`\\(${a}x+${b}\\)`, `\\(${a + b}x\\)`, `\\(${a * b}x\\)`], `괄호 안의 각 항에 ${a}를 곱합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}x+${b}\\)에서 계수를 고르세요.`, `${a}`, [`${b}`, `${a + b}`, "x"], `계수는 문자에 곱해진 수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}x+${b}\\)에서 상수항을 고르세요.`, `${b}`, [`${a}`, "x", `${a + b}`], `문자가 없는 항이 상수항입니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildEquationVariant(a, b, x, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const c = a * x + b;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}x+${b}=${c}\\)일 때 \\(x\\)를 고르세요.`, `${x}`, [`${x + 1}`, `${x - 1}`, `${a}`], `양변에서 ${b}를 빼고 ${a}로 나눕니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다음 중 방정식의 해가 \\(${x}\\)인 것은 무엇인가요?`, `\\(${a}x+${b}=${c}\\)`, [`\\(${a}x+${b}=${c + 1}\\)`, `\\(${a}x-${b}=${c}\\)`, `\\(${b}x+${a}=${c}\\)`], `x에 ${x}를 대입하면 양변이 같습니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(x+${b}=${x + b}\\)의 해를 고르세요.`, `${x}`, [`${b}`, `${x + b}`, `${x - b}`], `양변에서 ${b}를 빼면 x만 남습니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}x=${a * x}\\)의 양변을 \\(${a}\\)로 나누면 무엇인가요?`, `\\(x=${x}\\)`, [`\\(x=${a}\\)`, `\\(x=${a * x}\\)`, `\\(${a}=${x}\\)`], `등식의 양변을 같은 수로 나누어도 등식은 성립합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}x+${b}=${c}\\)에서 먼저 해야 할 알맞은 과정은 무엇인가요?`, `양변에서 ${b}를 뺀다.`, [`양변에 x를 곱한다.`, `양변을 ${b}로 나눈다.`, `${a}와 ${b}를 더한다.`], `상수항을 먼저 이항합니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildGraphVariant(a, b, x, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `일차함수 \\(y=${a}x+${b}\\)의 기울기를 고르세요.`, `${a}`, [`${b}`, `${a + b}`, `${-a}`], `일차함수 y=ax+b에서 a가 기울기입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `일차함수 \\(y=${a}x+${b}\\)의 y절편을 고르세요.`, `${b}`, [`${a}`, `${a + b}`, `${-b}`], `y절편은 x=0일 때의 y값입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `점 \\((${x}, ${a * x + b})\\)가 놓이는 그래프로 알맞은 식은 무엇인가요?`, `\\(y=${a}x+${b}\\)`, [`\\(y=${b}x+${a}\\)`, `\\(y=${a + b}x\\)`, `\\(y=x+${a}\\)`], `x=${x}를 대입하면 y=${a * x + b}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `정비례식 \\(y=${a}x\\)에서 \\(x=${x}\\)일 때 y값을 고르세요.`, `${a * x}`, [`${a + x}`, `${a}`, `${x}`], `정비례식에 x값을 대입합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `반비례 관계 \\(y=\\frac{${a * b}}{x}\\)에서 \\(x=${a}\\)일 때 y값을 고르세요.`, `${b}`, [`${a}`, `${a * b}`, `${a + b}`], `반비례식에 x=${a}를 대입합니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildGeometryBasicVariant(a, b, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const angle = 30 + (item.index % 5) * 10;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `기본 도형에서 점, 선, 면에 대한 설명으로 알맞은 것을 고르세요.`, "선은 점이 움직인 자취로 볼 수 있다.", ["면은 두 점만으로 정해진다.", "점은 넓이를 가진 도형이다.", "선분은 끝점이 없는 직선이다."], `기본 도형에서는 점, 선, 면의 뜻을 구별합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다음 중 직선, 반직선, 선분의 구별로 알맞은 것은 무엇인가요?`, "선분은 양 끝점이 정해진 곧은 선의 일부이다.", ["직선은 양 끝점이 있다.", "반직선은 양쪽으로 끝없이 뻗는다.", "선분은 한쪽으로만 끝없이 뻗는다."], `기본 도형에서 직선, 반직선, 선분은 끝점의 개수로 구별합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `두 직선이 만나 생긴 맞꼭지각 중 하나가 \\(${angle}\\degree\\)일 때, 그 맞꼭지각의 크기를 고르세요.`, `\\(${angle}\\degree\\)`, [`\\(${180 - angle}\\degree\\)`, `\\(${90 - angle}\\degree\\)`, `\\(${angle + 20}\\degree\\)`], `맞꼭지각의 크기는 서로 같습니다.`),
    () => mathShape(chapter, item, grade, subjectName, `두 직선이 수직으로 만날 때 생기는 각의 크기를 고르세요.`, `\\(90\\degree\\)`, [`\\(45\\degree\\)`, `\\(120\\degree\\)`, `\\(180\\degree\\)`], `수직인 두 직선은 직각을 이룹니다.`),
    () => mathShape(chapter, item, grade, subjectName, `평행한 두 직선을 한 직선이 지날 때 서로 같은 크기가 되는 각을 고르세요.`, "동위각", ["소인수", "상수항", "최빈값"], `평행선에서 동위각과 엇각의 성질을 사용합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `기본 작도에서 컴퍼스의 주된 역할로 알맞은 것을 고르세요.`, "같은 길이를 옮기거나 원을 그린다.", ["정수의 부호를 정한다.", "평균을 계산한다.", "소인수분해를 완성한다."], `작도는 눈금 없는 자와 컴퍼스를 사용합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `수직이등분선에 대한 설명으로 알맞은 것을 고르세요.`, "선분을 수직으로 지나며 두 부분의 길이를 같게 나눈다.", ["각을 세 부분으로 나눈다.", "두 직선을 평행하게만 만든다.", "자료의 흩어진 정도를 나타낸다."], `수직이등분선은 수직과 이등분 조건을 모두 만족합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `두 도형이 합동일 때 항상 성립하는 설명을 고르세요.`, "대응변의 길이와 대응각의 크기가 각각 같다.", ["넓이만 같으면 항상 합동이다.", "모양은 달라도 둘레만 같으면 합동이다.", "한 각만 같으면 항상 합동이다."], `합동은 모양과 크기가 모두 같은 관계입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `각의 이등분선에 대한 설명으로 알맞은 것을 고르세요.`, "한 각을 크기가 같은 두 각으로 나눈다.", ["선분을 같은 길이로만 나눈다.", "두 직선을 반드시 평행하게 만든다.", "원 넓이를 구하는 선이다."], `각의 이등분선은 각의 크기를 똑같이 나눕니다.`),
    () => mathShape(chapter, item, grade, subjectName, `기본 도형 문제에서 대응점, 대응변, 대응각을 찾는 이유로 알맞은 것은 무엇인가요?`, "합동인 도형의 같은 위치 관계를 비교하기 위해서이다.", ["정수의 대소를 비교하기 위해서이다.", "자료의 평균을 구하기 위해서이다.", "확률의 분모를 찾기 위해서이다."], `합동 도형에서는 서로 대응하는 요소를 비교합니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildPlaneSolidVariant(a, b, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const sides = 5 + (item.index % 4);
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `\\(${sides}\\)각형의 내각의 합을 구하는 식으로 알맞은 것은 무엇인가요?`, `\\((${sides}-2)\\times180\\degree\\)`, [`\\(${sides}\\times180\\degree\\)`, `\\((${sides}+2)\\times90\\degree\\)`, `\\(${sides}\\times360\\degree\\)`], `다각형의 내각의 합은 \\((n-2)\\times180\\degree\\)입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다각형의 외각의 합으로 알맞은 것을 고르세요.`, `\\(360\\degree\\)`, [`\\(180\\degree\\)`, `\\(90\\degree\\)`, `\\(${sides * 180}\\degree\\)`], `볼록다각형의 외각의 합은 항상 360도입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `반지름이 \\(${a}\\)인 원의 둘레를 고르는 문제입니다. 알맞은 식은 무엇인가요?`, `\\(${2 * a}\\pi\\)`, [`\\(${a}\\pi\\)`, `\\(${a * a}\\pi\\)`, `\\(${a + 2}\\pi\\)`], `원의 둘레는 \\(2\\pi r\\)입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `부채꼴의 넓이를 구할 때 필요한 조건으로 알맞은 것은 무엇인가요?`, "반지름과 중심각", ["소인수와 지수", "기울기와 y절편", "평균과 최빈값"], `부채꼴은 원의 일부이므로 반지름과 중심각을 사용합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다면체의 구성 요소로 알맞은 것을 고르세요.`, "면, 모서리, 꼭짓점", ["계수, 상수항, 동류항", "소수, 합성수, 약수", "평균, 중앙값, 최빈값"], `다면체는 평면인 면들로 둘러싸인 입체도형입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `기둥의 부피를 구하는 방법으로 알맞은 것을 고르세요.`, "밑넓이에 높이를 곱한다.", ["밑넓이에 높이를 더한다.", "둘레만 구한다.", "외각의 합을 구한다."], `기둥의 부피는 밑넓이와 높이를 이용합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `뿔의 부피는 같은 밑넓이와 높이를 가진 기둥의 부피의 얼마인가요?`, `\\(\\frac{1}{3}\\)`, [`\\(\\frac{1}{2}\\)`, `2배`, `3배`], `뿔의 부피는 기둥 부피의 1/3입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `회전체를 만들 때 기준이 되는 것은 무엇인가요?`, "평면도형을 한 직선 둘레로 회전시킨다.", ["자료를 계급별로 나눈다.", "방정식의 해를 구한다.", "소인수의 지수를 비교한다."], `회전체는 평면도형을 회전시켜 만든 입체도형입니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildStatisticsVariant(a, b, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const targetAverage = a + b;
  const c = (targetAverage * 3) - a - b;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `자료 \\(${a}, ${b}, ${c}\\)의 평균을 고르세요.`, `${targetAverage}`, [`${a + b + c}`, `${c}`, `${a}`], `평균은 자료의 합을 자료 수로 나누므로 \\((${a}+${b}+${c})\\div3=${targetAverage}\\)입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `자료 \\(${a}, ${b}, ${a}, ${c}\\)의 최빈값을 고르세요.`, `${a}`, [`${b}`, `${c}`, `${a + b}`], `가장 자주 나타나는 값이 최빈값입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `도수가 가장 큰 계급을 무엇이라고 판단하나요?`, "자료가 가장 많이 모인 계급", ["자료가 없는 계급", "평균과 같은 계급", "계급값이 가장 작은 계급"], `도수는 각 계급에 속한 자료의 수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `전체 도수가 \\(${a + b}\\), 어떤 계급의 도수가 \\(${a}\\)일 때 상대도수는 무엇인가요?`, `\\(\\frac{${a}}{${a + b}}\\)`, [`\\(\\frac{${b}}{${a + b}}\\)`, `\\(${a + b}\\)`, `\\(${a}\\)`], `상대도수는 계급의 도수를 전체 도수로 나눈 값입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `줄기와 잎 그림에서 잎은 무엇을 나타내나요?`, "각 자료의 끝자리", ["자료의 개수만", "전체 평균", "가장 큰 계급"], `줄기와 잎 그림은 자료값을 줄기와 잎으로 나누어 나타냅니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildPrimeVariant(a, b, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const p = [2, 3, 5, 7, 11][item.index % 5];
  const q = [3, 5, 7, 11, 13][(item.index + 2) % 5];
  const value = p * p * q;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `다음 중 소수를 고르세요.`, `${p}`, [`${p * q}`, `${p * p}`, `${q * q}`], `소수는 1과 자기 자신만을 약수로 갖는 수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${value}\\)를 소인수분해한 것을 고르세요.`, `\\(${p}^2\\times${q}\\)`, [`\\(${p}\\times${q}^2\\)`, `\\(${p + q}\\times${p}\\)`, `\\(${value}\\)`], `나눗셈을 반복하면 ${value}=${p}\\times${p}\\times${q}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p}\\times${p}\\times${q}\\)를 거듭제곱 꼴로 바르게 나타낸 것은 무엇인가요?`, `\\(${p}^2\\times${q}\\)`, [`\\(${p}\\times${q}^2\\)`, `\\(${p + q}^2\\)`, `\\(${p}^3\\times${q}\\)`], `같은 소인수 ${p}가 두 번 곱해졌으므로 ${p}^2로 씁니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p}^2\\times${q}\\)의 약수의 개수를 고르세요.`, `6`, ["3", "4", "8"], `지수에 1을 더해 곱하면 \\((2+1)(1+1)=6\\)입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * q}\\)와 \\(${p * p}\\)의 최대공약수를 고르세요.`, `${p}`, [`${q}`, `${p * q}`, `${p + q}`], `공통으로 들어 있는 소인수는 ${p}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * q}\\)와 \\(${p * p}\\)의 최소공배수를 고르세요.`, `${p * p * q}`, [`${p * q}`, `${p * p}`, `${p + q}`], `각 소인수의 가장 큰 지수를 택하면 ${p}^2\\times${q}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다음 중 서로소인 두 수를 고르세요.`, `${p}와 ${q}`, [`${p}와 ${p * q}`, `${q}와 ${p * q}`, `${p * p}와 ${p}`], `서로소는 공약수가 1뿐인 두 수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * q}\\)의 소인수로만 묶인 것을 고르세요.`, `${p}, ${q}`, [`1, ${p * q}`, `${p + q}, ${q}`, `${p * p}, ${q}`], `소인수는 그 수를 나누는 소수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `어떤 수의 소인수분해가 \\(${p}^2\\times${q}\\)일 때 원래 수를 고르세요.`, `${value}`, [`${p * q}`, `${p + q}`, `${value + p}`], `소인수분해식을 모두 곱하면 원래 수가 됩니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p}\\)와 \\(${q}\\)의 공배수 중 가장 작은 수를 고르세요.`, `${p * q}`, [`${p + q}`, `${Math.max(p, q)}`, `${p * q + p}`], `서로소인 두 수의 최소공배수는 두 수의 곱입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${value}\\)가 \\(${p}\\)로 몇 번 나누어떨어지는지 고르세요.`, `2번`, ["1번", "3번", "나누어떨어지지 않음"], `소인수분해가 ${p}^2\\times${q}이므로 ${p}는 두 번 들어 있습니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * p}\\)의 모든 소인수의 곱으로 알맞은 것은 무엇인가요?`, `\\(${p}\\times${p}\\)`, [`\\(${p}+${p}\\)`, `\\(${p}\\times${q}\\)`, `\\(${p * p}\\times${q}\\)`], `소인수분해는 합이 아니라 소수들의 곱으로 나타냅니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * q}\\)와 \\(${q * q}\\)의 최대공약수를 소인수분해 관점에서 고르세요.`, `${q}`, [`${p}`, `${p * q}`, `${q * q}`], `두 수에 공통으로 들어 있는 소인수는 ${q}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p}\\)일마다 울리는 알림과 \\(${q}\\)일마다 울리는 알림이 함께 울리는 가장 빠른 날을 고르세요.`, `${p * q}일 후`, [`${p + q}일 후`, `${Math.max(p, q)}일 후`, `${p * q + 1}일 후`], `함께 반복되는 시점은 최소공배수로 구합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `약수의 개수가 \\(6\\)개인 소인수분해 꼴을 고르세요.`, `\\(${p}^2\\times${q}\\)`, [`\\(${p}\\times${q}\\)`, `\\(${p}^3\\times${q}\\)`, `\\(${p}^2\\times${q}^2\\)`], `약수의 개수는 지수에 1을 더해 곱합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p * p * q}\\)의 소인수분해에서 지수가 가장 큰 소인수를 고르세요.`, `${p}`, [`${q}`, `${p * q}`, `${p + q}`], `${value}=${p}^2\\times${q}이므로 지수가 가장 큰 소인수는 ${p}입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `두 수 \\(${p * p}\\), \\(${p * q}\\)를 나누어떨어지게 하는 가장 큰 수를 고르세요.`, `${p}`, [`${q}`, `${p * q}`, `${p * p * q}`], `가장 큰 공약수는 최대공약수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `두 수 \\(${p * p}\\), \\(${p * q}\\)의 공통 배수 중 가장 작은 수를 고르세요.`, `${p * p * q}`, [`${p}`, `${p * q}`, `${p * p}`], `공통 배수 중 가장 작은 수는 최소공배수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `다음 풀이 중 소인수분해로 바른 설명을 고르세요.`, `${value}=${p}^2\\times${q}`, [`${value}=${p + q}\\times${p}`, `${value}=${p}\\times${q}`, `${value}=${q}^2`], `소인수분해는 소수만의 곱으로 정확히 나타내야 합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${p}^2\\times${q}\\)와 \\(${p}\\times${q}^2\\)의 최대공약수를 고르세요.`, `${p * q}`, [`${p}`, `${q}`, `${p * p * q * q}`], `공통 부분은 각 소인수의 작은 지수인 ${p}\\times${q}입니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function buildRationalVariant(a, b, x, item, chapter, grade, subjectName) {
  const n = item.index + 1;
  const negative = -b;
  const builders = [
    () => mathShape(chapter, item, grade, subjectName, `다음 중 음수를 고르세요.`, `${negative}`, [`${a}`, "0", `${b}`], `0보다 작은 수가 음수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${negative}\\)와 \\(${a}\\) 중 더 큰 수를 고르세요.`, `${a}`, [`${negative}`, `${-a}`, "같다"], `양수는 음수보다 큽니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(|-${b}|\\)의 값을 고르세요.`, `${b}`, [`${negative}`, "0", `${b + 1}`], `절댓값은 수직선에서 0까지의 거리입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${a}+(-${b})\\)의 값을 고르세요.`, `${a - b}`, [`${a + b}`, `${b - a}`, `${a - b + 2}`], `부호가 다른 두 수의 덧셈은 절댓값의 차를 이용합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(${negative}-${a}\\)의 값을 고르세요.`, `${negative - a}`, [`${a - b}`, `${a + b}`, `${b - a}`], `빼는 수의 부호를 바꾸어 더합니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\((${negative})\\times${a}\\)의 부호를 고르세요.`, "음수", ["양수", "0", "판단할 수 없음"], `음수와 양수의 곱은 음수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\((${negative})\\div${a}\\)의 부호를 고르세요.`, "음수", ["양수", "0", "항상 자연수"], `음수와 양수의 나눗셈 결과는 음수입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `수직선에서 \\(${negative}\\)와 \\(${a}\\) 사이의 거리를 고르세요.`, `${a + b}`, [`${a - b}`, `${b - a}`, `${a * b}`], `두 점 사이의 거리는 두 수의 차의 절댓값입니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(-${b}\\), \\(0\\), \\(${a}\\)를 작은 수부터 나열한 것은 무엇인가요?`, `\\(-${b}, 0, ${a}\\)`, [`\\(${a}, 0, -${b}\\)`, `\\(0, -${b}, ${a}\\)`, `\\(-${b}, ${a}, 0\\)`], `음수, 0, 양수 순서로 커집니다.`),
    () => mathShape(chapter, item, grade, subjectName, `\\(-${b}\\)의 반대수를 고르세요.`, `${b}`, [`${negative}`, "0", `${b + a}`], `부호가 반대인 수가 반대수입니다.`)
  ];
  return builders[(n - 1) % builders.length]();
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function primeQuestion(a, b, item, chapter, grade, subjectName) {
  const n = a * b;
  return mathShape(chapter, item, grade, subjectName, `\\(${n}\\)의 약수 중 가장 큰 한 자리 약수를 고르세요.`, `${Math.max(...[1, a, b].filter((v) => v < 10 && n % v === 0))}`, [`${a + b}`, `${n}`, `${Math.max(a, b) + 2}`], `${n}의 약수를 확인하면 한 자리 약수 중 가장 큰 값이 정답입니다.`);
}

function rationalQuestion(a, b, item, chapter, grade, subjectName) {
  const value = a - b;
  return mathShape(chapter, item, grade, subjectName, `\\(${a}+(-${b})\\)의 값을 고르세요.`, `${value}`, [`${a + b}`, `${b - a}`, `${value - 2}`], `양수와 음수의 덧셈은 절댓값의 차를 구한 뒤 큰 수의 부호를 붙입니다.`);
}

function linearEquation(a, b, x, item, chapter, grade, subjectName) {
  const c = a * x + b;
  const answer = `${x}`;
  return mathShape(chapter, item, grade, subjectName, `\\(${a}x + ${b} = ${c}\\) 일 때, \\(x\\)의 값을 고르세요.`, answer, [`${x + 1}`, `${x - 1}`, `${x + 2}`], `양변에서 ${b}를 빼면 \\(${a}x=${a * x}\\), 양변을 ${a}로 나누면 \\(x=${x}\\)입니다.`);
}

function arithmetic(a, b, item, chapter, grade, subjectName) {
  const value = a * a + b * 2;
  return mathShape(chapter, item, grade, subjectName, `\\(${a}^2 + 2\\times${b}\\)의 값을 고르세요.`, `${value}`, [`${value + 2}`, `${value - 3}`, `${a + b}`], `거듭제곱을 먼저 계산해 \\(${a * a}\\), 곱셈 \\(${2 * b}\\)를 더하면 \\(${value}\\)입니다.`);
}

function factorQuestion(a, b, item, chapter, grade, subjectName) {
  const answer = `\\((x+${a})(x+${b})\\)`;
  return mathShape(chapter, item, grade, subjectName, `\\(x^2+${a + b}x+${a * b}\\)를 인수분해한 것을 고르세요.`, answer, [`\\((x+${a + b})(x+1)\\)`, `\\((x-${a})(x-${b})\\)`, `\\(x(x+${a * b})\\)`], `합이 ${a + b}, 곱이 ${a * b}인 두 수는 ${a}, ${b}이므로 ${answer}입니다.`);
}

function functionQuestion(a, b, x, item, chapter, grade, subjectName) {
  const value = a * x + b;
  return mathShape(chapter, item, grade, subjectName, `일차함수 \\(y=${a}x+${b}\\)에서 \\(x=${x}\\)일 때 \\(y\\)의 값을 고르세요.`, `${value}`, [`${value + a}`, `${value - b}`, `${x + b}`], `\\(x=${x}\\)를 대입하면 \\(y=${a}\\times${x}+${b}=${value}\\)입니다.`);
}

function geometryQuestion(a, b, item, chapter, grade, subjectName) {
  const value = 2 * (a + b);
  return mathShape(chapter, item, grade, subjectName, `가로가 \\(${a}\\), 세로가 \\(${b}\\)인 직사각형의 둘레를 고르세요.`, `${value}`, [`${a * b}`, `${a + b}`, `${value + 4}`], `직사각형의 둘레는 \\(2\\times(가로+세로)\\)이므로 \\(2\\times(${a}+${b})=${value}\\)입니다.`);
}

function statisticsQuestion(a, b, item, chapter, grade, subjectName) {
  const value = a + b;
  const c = (value * 3) - a - b;
  return mathShape(chapter, item, grade, subjectName, `자료 \\(${a}, ${b}, ${c}\\)의 평균을 고르세요.`, `${value}`, [`${a + b + c}`, `${c}`, `${value + 2}`], `평균은 자료의 합을 자료 수로 나누므로 \\((${a}+${b}+${c})\\div3=${value}\\)입니다.`);
}

function mathShape(chapter, item, grade, subjectName, prompt, answer, wrongs, solution) {
  return {
    id: `${chapter.id}:${item.index}:${Date.now()}:${Math.random()}`,
    typeIndex: item.index,
    grade,
    subjectName,
    chapterTitle: chapter.title,
    prompt,
    choices: shuffle(uniqueChoices(answer, wrongs)),
    answer,
    solution: `풀이: '${item.type}' 유형입니다. ${solution}`
  };
}

function uniqueChoices(answer, wrongs) {
  const values = [String(answer), ...wrongs.map(String)];
  const unique = [];
  values.forEach((value) => {
    if (!unique.includes(value)) unique.push(value);
  });
  const fillers = ["위 내용만으로는 알 수 없다.", "본문의 핵심과 관련이 없다.", "조건을 잘못 해석한 설명이다.", "계산 또는 판단 과정이 맞지 않다."];
  fillers.forEach((value) => {
    if (unique.length < 4 && !unique.includes(value)) unique.push(value);
  });
  return unique.slice(0, 4);
}

function renderQuizQuestion() {
  const quiz = state.quiz;
  const box = $("#quiz-runner");
  if (!quiz || quiz.finished) return;
  const q = quiz.questions[quiz.index];
  const percent = Math.round((quiz.index / quiz.questions.length) * 100);
  box.innerHTML = `
    <div class="question">
      <div class="progress"><span style="width:${percent}%"></span></div>
      <span class="badge">${quiz.index + 1} / ${quiz.questions.length}</span>
      <h3 class="question-title">${formatMathText(q.prompt)}</h3>
      <div class="choices">${q.choices.map((choice) => `<button class="choice" data-choice="${escapeAttr(choice)}">${formatMathText(choice)}</button>`).join("")}</div>
      <div id="solution-box"></div>
      <div class="inline-actions"><button id="next-question-btn" class="primary hidden">다음</button></div>
    </div>`;
  box.querySelectorAll(".choice").forEach((button) => button.addEventListener("click", () => answerQuestion(button.dataset.choice)));
  $("#next-question-btn").addEventListener("click", nextQuestion);
  renderMath();
}

function answerQuestion(choice) {
  const quiz = state.quiz;
  const q = quiz.questions[quiz.index];
  const correct = choice === q.answer;
  quiz.answered.push({ ...q, selected: choice, correct });
  if (correct) quiz.correct += 1;
  saveAnsweredQuestion(q, correct, choice, false);
  $$(".choice").forEach((button) => {
    button.disabled = true;
    if (button.dataset.choice === q.answer) button.classList.add("correct");
    if (button.dataset.choice === choice && !correct) button.classList.add("wrong");
  });
  $("#solution-box").innerHTML = `<div class="solution">${formatMathText(q.solution)}</div>`;
  $("#next-question-btn").classList.remove("hidden");
  renderMath();
}

function nextQuestion() {
  state.quiz.index += 1;
  if (state.quiz.index >= state.quiz.questions.length) finishQuiz();
  else renderQuizQuestion();
}

function finishPartialQuiz() {
  if (!state.quiz || state.quiz.answered.length === 0) return;
  finishQuiz(true);
}

function finishQuiz(partial = false) {
  const quiz = state.quiz;
  if (!quiz || quiz.finished) return;
  quiz.finished = true;
  const user = userData();
  const key = `${quiz.subjectId}:${quiz.grade}:${quiz.chapterId}`;
  const seen = new Set(user.seen[key] || []);
  quiz.answered.forEach((q) => seen.add(q.typeIndex));
  user.seen[key] = [...seen];
  user.servedBank ||= {};
  quiz.answered.forEach((q) => {
    const bankKey = q.bankKey || getBankKey(quiz.subjectId, quiz.grade, quiz.chapterId, quiz.difficulty || "normal");
    const served = new Set(user.servedBank[bankKey] || []);
    if (q.bankTemplateId) {
      served.add(q.bankTemplateId);
      user.servedBank[bankKey] = [...served];
    }
  });
  saveUser(user);
  $("#quiz-runner").innerHTML = `
    <div class="question">
      <h3>${partial ? "현재까지 학습 완료" : "퀴즈 완료"}</h3>
      <p class="muted">풀이한 문제 ${quiz.answered.length}개 중 ${quiz.correct}개를 맞혔습니다.</p>
      <div class="grid">
        <div class="stat">풀이<strong>${quiz.answered.length}</strong></div>
        <div class="stat">정답<strong>${quiz.correct}</strong></div>
        <div class="stat">오답<strong>${quiz.answered.length - quiz.correct}</strong></div>
        <div class="stat">정답률<strong>${quiz.answered.length ? Math.round((quiz.correct / quiz.answered.length) * 100) : 0}%</strong></div>
      </div>
      <div class="inline-actions"><button id="new-quiz-btn" class="primary">새 퀴즈</button></div>
    </div>`;
  $("#new-quiz-btn").addEventListener("click", () => {
    state.quiz = null;
    $("#quiz-runner").classList.add("hidden");
    $("#quiz-setup").classList.remove("hidden");
    render();
  });
}

function saveAnsweredQuestion(q, correct, selected, fromWrongNote) {
  const user = userData();
  const progressKey = `${q.grade || "-"}:${q.subjectName}:${q.chapterTitle}`;
  user.progress[progressKey] ||= { total: 0, correct: 0 };
  if (!fromWrongNote) {
    user.progress[progressKey].total += 1;
    if (correct) user.progress[progressKey].correct += 1;
  }
  if (!correct) {
    user.wrong = user.wrong.filter((item) => item.prompt !== q.prompt);
    user.wrong.push({ ...q, selected, savedAt: new Date().toISOString() });
  }
  saveUser(user);
}

function renderDashboard() {
  if (!state.user) return;
  const user = userData();
  const stats = Object.values(user.progress);
  const total = stats.reduce((sum, item) => sum + item.total, 0);
  const correct = stats.reduce((sum, item) => sum + item.correct, 0);
  $("#dashboard-view").innerHTML = `
    <div class="grid">
      <div class="stat">전체 풀이<strong>${total}</strong></div>
      <div class="stat">정답 확인<strong>${correct}</strong></div>
      <div class="stat">오답노트<strong>${user.wrong.length}</strong></div>
      <div class="stat">정답률<strong>${total ? Math.round((correct / total) * 100) : 0}%</strong></div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>최종 선택안</h3>
      <p class="muted">정적 HTML/CSS/Vanilla JS 앱으로 구현했습니다. 사용자 데이터와 문제은행은 서버에 저장하고, AI 문제 생성은 서버 함수가 처리합니다.</p>
    </div>`;
}

function renderWrongNote() {
  if (!state.user) return;
  const wrong = userData().wrong;
  $("#wrong-view").innerHTML = wrong.length
    ? `<div class="list">${wrong.map((q, i) => wrongCard(q, i)).join("")}</div>`
    : `<div class="panel"><h3>오답노트가 비어 있습니다</h3><p class="muted">틀린 문제가 생기면 이곳에서 바로 다시 풀 수 있습니다.</p></div>`;
  $$("#wrong-view .choice").forEach((button) => button.addEventListener("click", () => answerWrong(Number(button.dataset.index), button.dataset.choice)));
  renderMath();
}

async function renderQuestionBankView() {
  if (!state.user) return;
  const view = $("#bank-view");
  if (!view) return;
  if (!isBankAdmin()) {
    view.innerHTML = `<div class="panel"><h3>접근할 수 없습니다</h3><p class="muted">문제은행 관리는 관리자만 사용할 수 있습니다.</p></div>`;
    return;
  }
  const selectedSubject = localStorage.getItem(`${STORE}:bankSubject`) || db.subjects[0]?.id || "";
  const subject = getSubject(selectedSubject);
  const selectedGrade = localStorage.getItem(`${STORE}:bankGrade`) || "1";
  const grade = subject.grades[selectedGrade] ? selectedGrade : Object.keys(subject.grades)[0];
  const chapters = subject.grades[grade] || [];
  const selectedChapter = localStorage.getItem(`${STORE}:bankChapter`) || chapters[0]?.id || "";
  const chapter = chapters.find((item) => item.id === selectedChapter) || chapters[0];
  const difficulty = localStorage.getItem(`${STORE}:bankDifficulty`) || "normal";

  if (!chapter) {
    view.innerHTML = `<div class="panel"><h3>문제은행을 볼 수 없습니다</h3><p class="muted">과목과 챕터 데이터가 없습니다.</p></div>`;
    return;
  }

  const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
  const bank = await getQuestionBank(bankKey);
  view.innerHTML = `
    <div class="panel">
      <h3>문제은행 조회</h3>
      <div class="form-grid">
        <label>과목
          <select id="bank-subject-select">
            ${db.subjects.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}
          </select>
        </label>
        <label>학년
          <select id="bank-grade-select">
            ${Object.keys(subject.grades).map((item) => `<option value="${item}">${item}학년</option>`).join("")}
          </select>
        </label>
        <label>챕터
          <select id="bank-chapter-select">
            ${chapters.map((item) => `<option value="${item.id}">${item.title}</option>`).join("")}
          </select>
        </label>
        <label>난이도
          <select id="bank-difficulty-select">
            <option value="easy">하</option>
            <option value="normal">중</option>
            <option value="hard">상</option>
          </select>
        </label>
      </div>
      <p class="muted">${subject.name} ${grade}학년 · ${chapter.title} · ${difficultyLabel(difficulty)} 난이도: ${bank.length}/${BANK_LIMIT}개</p>
    </div>
    ${bank.length ? `<div class="list" style="margin-top:16px">${bank.map((question, index) => bankItem(question, index, bankKey)).join("")}</div>` : `<div class="panel" style="margin-top:16px"><h3>저장된 문제가 없습니다</h3><p class="muted">퀴즈를 시작하면 AI가 생성한 문제가 이곳에 저장됩니다.</p></div>`}
  `;

  $("#bank-subject-select").value = subject.id;
  $("#bank-grade-select").value = grade;
  $("#bank-chapter-select").value = chapter.id;
  $("#bank-difficulty-select").value = difficulty;
  $("#bank-subject-select").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankSubject`, event.target.value);
    localStorage.removeItem(`${STORE}:bankChapter`);
    renderQuestionBankView();
  });
  $("#bank-grade-select").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankGrade`, event.target.value);
    localStorage.removeItem(`${STORE}:bankChapter`);
    renderQuestionBankView();
  });
  $("#bank-chapter-select").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankChapter`, event.target.value);
    renderQuestionBankView();
  });
  $("#bank-difficulty-select").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankDifficulty`, event.target.value);
    renderQuestionBankView();
  });
  $$("#bank-view [data-delete-bank]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("선택한 문제를 문제은행에서 삭제할까요?")) return;
      await deleteQuestionFromBank(button.dataset.bankKey, button.dataset.createdAt, button.dataset.prompt);
      renderQuestionBankView();
      updateBankStatus();
    });
  });
}

function bankItem(question, index, bankKey) {
  const preview = formatMathText(question.prompt);
  return `<article class="panel bank-item">
    <div class="bank-meta">
      <span class="badge">#${index + 1}</span>
      <span class="badge">유형 ${Number(question.typeIndex) + 1}</span>
    </div>
    <p>${preview}</p>
    <p class="muted">정답: ${formatMathText(question.answer)}</p>
    <button class="danger" data-delete-bank="1" data-bank-key="${escapeAttr(bankKey)}" data-created-at="${escapeAttr(question.createdAt || "")}" data-prompt="${escapeAttr(question.prompt)}">삭제</button>
  </article>`;
}

function difficultyLabel(value) {
  return { easy: "하", normal: "중", hard: "상" }[value] || "중";
}

function wrongCard(q, index) {
  return `<article class="panel question" data-wrong-card="${index}">
    <span class="badge">${q.subjectName} · ${q.chapterTitle}</span>
    <h3 class="question-title">${formatMathText(q.prompt)}</h3>
    <div class="choices">${q.choices.map((choice) => `<button class="choice" data-index="${index}" data-choice="${escapeAttr(choice)}">${formatMathText(choice)}</button>`).join("")}</div>
    <div class="solution hidden">${formatMathText(q.solution)}</div>
  </article>`;
}

function answerWrong(index, choice) {
  const user = userData();
  const q = user.wrong[index];
  const correct = choice === q.answer;
  const card = $(`[data-wrong-card="${index}"]`);
  card.querySelectorAll(".choice").forEach((button) => {
    button.disabled = true;
    if (button.dataset.choice === q.answer) button.classList.add("correct");
    if (button.dataset.choice === choice && !correct) button.classList.add("wrong");
  });
  card.querySelector(".solution").classList.remove("hidden");
  if (correct) {
    user.wrong.splice(index, 1);
    saveUser(user);
    setTimeout(renderWrongNote, 700);
  } else {
    saveAnsweredQuestion(q, false, choice, true);
  }
}

function renderStats() {
  if (!state.user) return;
  const user = userData();
  const subjects = [...new Set(db.subjects.map((subject) => subject.name))];
  const selectedGrade = localStorage.getItem(`${STORE}:statsGrade`) || "all";
  const selectedSubject = localStorage.getItem(`${STORE}:statsSubject`) || "all";
  const rows = Object.entries(user.progress).filter(([key]) => {
    const [grade, subject] = key.split(":");
    return (selectedGrade === "all" || selectedGrade === grade) && (selectedSubject === "all" || selectedSubject === subject);
  }).map(([key, value]) => {
    const [grade, subject, chapter] = key.split(":");
    return `<div class="stat"><span class="badge">${grade}학년 · ${subject}</span><p>${chapter}</p><strong>${value.correct} / ${value.total}</strong></div>`;
  }).join("");
  const statsBody = rows
    ? `<div class="grid">${rows}</div>`
    : `<div class="panel"><h3>아직 학습 기록이 없습니다</h3><p class="muted">퀴즈를 풀면 학년별·과목별 학습 기록이 쌓입니다.</p></div>`;
  $("#stats-view").innerHTML = `
    <div class="panel" style="margin-bottom:16px">
      <div class="form-grid">
        <label>학년
          <select id="stats-grade">
            <option value="all">전체</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </label>
        <label>과목
          <select id="stats-subject">
            <option value="all">전체</option>
            ${subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    ${statsBody}`;
  $("#stats-grade").value = selectedGrade;
  $("#stats-subject").value = selectedSubject;
  $("#stats-grade").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:statsGrade`, event.target.value);
    renderStats();
  });
  $("#stats-subject").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:statsSubject`, event.target.value);
    renderStats();
  });
}

function addSubject() {
  const name = prompt("추가할 과목 이름을 입력하세요.");
  if (!name) return;
  const id = `custom-${Date.now()}`;
  const subject = {
    id,
    name,
    grades: {
      "1": [{ id: `${id}-g1-basic`, title: `${name} 1학년 기본`, types: makeCustomTypes(name) }],
      "2": [{ id: `${id}-g2-basic`, title: `${name} 2학년 기본`, types: makeCustomTypes(name) }],
      "3": [{ id: `${id}-g3-basic`, title: `${name} 3학년 기본`, types: makeCustomTypes(name) }]
    }
  };
  const custom = JSON.parse(localStorage.getItem(`${STORE}:customSubjects`) || "[]");
  custom.push(subject);
  localStorage.setItem(`${STORE}:customSubjects`, JSON.stringify(custom));
  db.subjects.push(subject);
  fillSubjectOptions();
}

function makeCustomTypes(name) {
  return expandChapterTypes("korean", { title: name, topics: [`${name} 핵심 개념`, `${name} 자료 해석`, `${name} 적용`, `${name} 문제 해결`, `${name} 실생활 활용`] });
}

function resetCurrentUser() {
  if (!confirm("현재 사용자의 학습 기록과 오답노트를 초기화할까요?")) return;
  const user = userData();
  user.progress = {};
  user.wrong = [];
  user.seen = {};
  user.solvedIds = [];
  user.servedBank = {};
  saveUser(user);
  state.quiz = null;
  $("#quiz-runner").classList.add("hidden");
  $("#quiz-setup").classList.remove("hidden");
  render();
}

async function renderUserAdminView() {
  const view = $("#users-view");
  if (!view) return;
  if (!isBankAdmin()) {
    view.innerHTML = `<div class="panel"><h3>접근할 수 없습니다</h3><p class="muted">관리자만 회원 정보를 조회할 수 있습니다.</p></div>`;
    return;
  }
  view.innerHTML = `<div class="panel"><h3>회원정보</h3><p class="muted">회원 목록을 불러오는 중입니다.</p></div>`;
  try {
    const result = await serverListUsers();
    const users = Array.isArray(result.users) ? result.users : [];
    view.innerHTML = `
      <div class="panel">
        <div class="section-head">
          <div>
            <h3>회원정보</h3>
            <p class="muted">총 ${users.length}명</p>
          </div>
          <button id="refresh-users-btn" class="secondary" type="button">새로고침</button>
        </div>
        <table class="summary-table users-table">
          <thead>
            <tr><th>사용자</th><th>이메일</th><th>가입일</th><th>최근 로그인</th><th>작업</th></tr>
          </thead>
          <tbody>
            ${users.length ? users.map(userAdminRow).join("") : `<tr><td colspan="5" class="muted">조회된 회원이 없습니다.</td></tr>`}
          </tbody>
        </table>
        <p id="users-message" class="message"></p>
      </div>
    `;
    $("#refresh-users-btn")?.addEventListener("click", renderUserAdminView);
    $$("#users-view [data-reset-user-password]").forEach((button) => {
      button.addEventListener("click", () => resetManagedUserPassword(button.dataset.username));
    });
    $$("#users-view [data-delete-managed-user]").forEach((button) => {
      button.addEventListener("click", () => deleteManagedUser(button.dataset.username));
    });
  } catch (error) {
    view.innerHTML = `<div class="panel"><h3>회원정보를 불러오지 못했습니다</h3><p class="message">${escapeText(error.message || "서버 오류가 발생했습니다.")}</p></div>`;
  }
}

function userAdminRow(user) {
  const username = user.username || "-";
  const disabled = username === "-" ? "disabled" : "";
  return `
    <tr>
      <td><strong>${escapeText(username)}</strong></td>
      <td>${escapeText(user.email || "-")}</td>
      <td>${formatDateTime(user.createdAt)}</td>
      <td>${formatDateTime(user.lastSignInAt)}</td>
      <td>
        <div class="row-actions">
          <button class="secondary" type="button" data-reset-user-password="1" data-username="${escapeAttr(username)}" ${disabled}>비밀번호 초기화</button>
          <button class="danger" type="button" data-delete-managed-user="1" data-username="${escapeAttr(username)}" ${disabled}>계정 삭제</button>
        </div>
      </td>
    </tr>
  `;
}

async function resetManagedUserPassword(username) {
  if (!username || username === "-") return;
  const newPassword = prompt(`${username} 사용자의 새 비밀번호를 입력하세요. 6자 이상이어야 합니다.`);
  if (!newPassword) return;
  if (newPassword.length < 6) {
    alert("비밀번호는 6자 이상이어야 합니다.");
    return;
  }
  const confirmPassword = prompt("새 비밀번호를 한 번 더 입력하세요.");
  if (newPassword !== confirmPassword) {
    alert("비밀번호가 서로 다릅니다.");
    return;
  }
  const message = $("#users-message");
  if (message) message.textContent = "비밀번호를 초기화하는 중입니다.";
  try {
    await serverResetUserPassword(username, newPassword);
    if (message) message.textContent = `${username} 사용자의 비밀번호를 초기화했습니다.`;
  } catch (error) {
    if (message) message.textContent = error.message || "비밀번호 초기화에 실패했습니다.";
  }
}

async function deleteManagedUser(username) {
  if (!username || username === "-") return;
  if (username === state.user && !confirm("현재 로그인한 관리자 계정입니다. 정말 삭제할까요?")) return;
  if (!confirm(`${username} 계정을 삭제할까요? 학습 기록도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
  const typed = prompt("삭제하려면 사용자 이름을 다시 입력하세요.");
  if (typed !== username) {
    const message = $("#users-message");
    if (message) message.textContent = "사용자 이름이 맞지 않아 삭제를 취소했습니다.";
    return;
  }
  const message = $("#users-message");
  if (message) message.textContent = "계정을 삭제하는 중입니다.";
  try {
    await serverDeleteUser(username);
    if (username === state.user) {
      logout();
      showAuth("계정을 삭제했습니다.");
      return;
    }
    if (message) message.textContent = `${username} 계정을 삭제했습니다.`;
    renderUserAdminView();
  } catch (error) {
    if (message) message.textContent = error.message || "계정 삭제에 실패했습니다.";
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function resetCurrentPassword() {
  if (!state.user) return;
  const newPassword = prompt("새 비밀번호를 입력하세요. 6자 이상이어야 합니다.");
  if (!newPassword) return;
  if (newPassword.length < 6) {
    alert("비밀번호는 6자 이상이어야 합니다.");
    return;
  }
  const confirmPassword = prompt("새 비밀번호를 한 번 더 입력하세요.");
  if (newPassword !== confirmPassword) {
    alert("비밀번호가 서로 다릅니다.");
    return;
  }
  try {
    if (isServerStorageEnabled()) {
      await serverResetCurrentPassword(newPassword);
    } else {
      const users = getUsers();
      if (!users[state.user]) throw new Error("사용자 정보를 찾을 수 없습니다.");
      users[state.user].password = newPassword;
      localStorage.setItem(`${STORE}:users`, JSON.stringify(users));
    }
    alert("비밀번호를 초기화했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
  } catch (error) {
    alert(error.message || "비밀번호 초기화에 실패했습니다.");
  }
}

async function deleteCurrentAccount() {
  if (!state.user) return;
  const username = state.user;
  if (!confirm(`${username} 계정을 삭제할까요? 학습 기록도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
  const typed = prompt("삭제하려면 사용자 이름을 다시 입력하세요.");
  if (typed !== username) {
    alert("사용자 이름이 맞지 않아 삭제를 취소했습니다.");
    return;
  }
  try {
    if (isServerStorageEnabled()) {
      await serverDeleteCurrentAccount();
      delete remoteUserCache[username];
    } else {
      const users = getUsers();
      delete users[username];
      localStorage.setItem(`${STORE}:users`, JSON.stringify(users));
    }
    logout();
    showAuth("계정을 삭제했습니다.");
  } catch (error) {
    alert(error.message || "계정 삭제에 실패했습니다.");
  }
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeText(text) {
  return String(text).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function formatMathText(text) {
  let value = escapeText(text)
    .replace(/\\\((.*?)\\\)/gs, '<span class="math-inline">$1</span>')
    .replace(/\\degree/g, "°")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span>$1</span><span>$2</span></span>')
    .replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>")
    .replace(/\^([0-9a-zA-Z+-]+)/g, "<sup>$1</sup>")
    .replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>")
    .replace(/_([0-9a-zA-Z+-]+)/g, "<sub>$1</sub>")
    .replace(/\n/g, "<br>");

  value = value.replace(/\\([a-zA-Z]+)/g, "$1");
  return value;
}

function escapeAttr(text) {
  return escapeText(text).replace(/`/g, "&#096;");
}

function renderMath() {
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
}

async function renderQuestionBankView() {
  if (!state.user) return;
  const view = $("#bank-view");
  if (!view) return;
  const summaries = await getBankSummaries();
  const selectedKey = localStorage.getItem(`${STORE}:bankSelectedKey`) || summaries.find((item) => item.count > 0)?.bankKey || summaries[0]?.bankKey || "";
  const selected = summaries.find((item) => item.bankKey === selectedKey) || summaries[0];
  const bank = selected ? await getQuestionBank(selected.bankKey) : [];
  const pageSize = 10;
  const pageKey = `${STORE}:bankPage:${selected?.bankKey || "none"}`;
  const totalPages = Math.max(1, Math.ceil(bank.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number(localStorage.getItem(pageKey)) || 1));
  const pageItems = bank.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  view.innerHTML = `
    <div class="panel">
      <h3>문제은행 수량</h3>
      <table class="bank-summary">
        <thead>
          <tr><th>학년</th><th>과목</th><th>챕터</th><th>난이도</th><th>수량</th><th>문제</th></tr>
        </thead>
        <tbody>
          ${summaries.map((item) => bankSummaryRow(item, selected?.bankKey)).join("")}
        </tbody>
      </table>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>${selected ? `${selected.grade}학년 · ${selected.subjectName} · ${selected.chapterTitle} · ${difficultyLabel(selected.difficulty)}` : "문제 내용"}</h3>
      <p class="muted">저장 문제 ${bank.length}/${BANK_LIMIT}개 · ${currentPage}/${totalPages}페이지</p>
      ${selected ? `<div class="inline-actions"><button id="generate-bank-btn" class="primary">AI로 요청 수만큼 생성</button><input id="generate-bank-count" type="number" min="1" max="20" value="5" style="max-width:120px"></div><p id="bank-message" class="message"></p>` : ""}
    </div>
    ${bank.length ? `<div class="list" style="margin-top:16px">${pageItems.map((question, index) => bankItem(question, index + ((currentPage - 1) * pageSize), selected.bankKey)).join("")}</div>${bankPagination(currentPage, totalPages)}` : `<div class="panel" style="margin-top:16px"><h3>저장된 문제가 없습니다</h3><p class="muted">퀴즈를 시작하면 AI가 생성한 문제가 이곳에 저장됩니다.</p></div>`}
  `;

  $$("#bank-view [data-bank-summary]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(`${STORE}:bankSelectedKey`, button.dataset.bankKey);
      localStorage.setItem(`${STORE}:bankPage:${button.dataset.bankKey}`, "1");
      renderQuestionBankView();
    });
  });
  $$("#bank-view [data-bank-page]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(pageKey, button.dataset.bankPage);
      renderQuestionBankView();
    });
  });
  $$("#bank-view [data-delete-bank]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("선택한 문제를 문제은행에서 삭제할까요?")) return;
      await deleteQuestionFromBank(button.dataset.bankKey, button.dataset.createdAt, button.dataset.prompt);
      renderQuestionBankView();
      updateBankStatus();
    });
  });
  const generateBtn = $("#generate-bank-btn");
  if (generateBtn && selected) {
    generateBtn.addEventListener("click", async () => {
      const message = $("#bank-message");
      const count = Math.max(1, Math.min(20, Number($("#generate-bank-count").value) || 5));
      generateBtn.disabled = true;
      generateBtn.textContent = "생성 중...";
      message.textContent = "";
      try {
        const [subjectId, grade, chapterId, difficulty] = selected.bankKey.split(":");
        const total = await generateBankQuestions(subjectId, grade, chapterId, difficulty, count);
        message.textContent = `문제은행이 ${total}/${BANK_LIMIT}개로 갱신되었습니다.`;
        renderQuestionBankView();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "AI로 요청 수만큼 생성";
      }
    });
  }
}

function bankPagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";
  const prev = Math.max(1, currentPage - 1);
  const next = Math.min(totalPages, currentPage + 1);
  return `<div class="pagination">
    <button class="secondary" data-bank-page="${prev}" ${currentPage === 1 ? "disabled" : ""}>이전</button>
    <span>${currentPage} / ${totalPages}</span>
    <button class="secondary" data-bank-page="${next}" ${currentPage === totalPages ? "disabled" : ""}>다음</button>
  </div>`;
}

async function getBankSummaries() {
  const rows = [];
  for (const subject of db.subjects) {
    for (const [grade, chapters] of Object.entries(subject.grades)) {
      for (const chapter of chapters) {
        for (const difficulty of ["easy", "normal", "hard"]) {
          const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
          const bank = await getQuestionBank(bankKey);
          rows.push({
            bankKey,
            grade,
            subjectName: subject.name,
            chapterTitle: chapter.title,
            difficulty,
            count: bank.length
          });
        }
      }
    }
  }
  return rows;
}

function bankSummaryRow(item, selectedKey) {
  const active = item.bankKey === selectedKey ? " class=\"active\"" : "";
  return `<tr${active}>
    <td>${item.grade}학년</td>
    <td>${escapeText(item.subjectName)}</td>
    <td>${escapeText(item.chapterTitle)}</td>
    <td>${difficultyLabel(item.difficulty)}</td>
    <td><strong>${item.count}</strong> / ${BANK_LIMIT}</td>
    <td><button class="secondary" data-bank-summary="1" data-bank-key="${escapeAttr(item.bankKey)}">보기</button></td>
  </tr>`;
}

function bankItem(question, index, bankKey) {
  const preview = formatMathText(question.prompt);
  return `<article class="panel bank-item">
    <div class="bank-meta">
      <span class="badge">#${index + 1}</span>
      <span class="badge">유형 ${Number(question.typeIndex) + 1}</span>
    </div>
    <p>${preview}</p>
    <p class="muted">정답: ${formatMathText(question.answer)}</p>
    <button class="danger" data-delete-bank="1" data-bank-key="${escapeAttr(bankKey)}" data-created-at="${escapeAttr(question.createdAt || "")}" data-prompt="${escapeAttr(question.prompt)}">삭제</button>
  </article>`;
}

function difficultyLabel(value) {
  return { easy: "하", normal: "중", hard: "상" }[value] || "중";
}

