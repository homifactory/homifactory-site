# HOMI.FACTORY 공식 홈페이지

호미팩토리(Homi Factory)의 공식 웹사이트 저장소입니다.

- **배포 주소**: https://homifactory.com
- **스테이지**: 1단계 (정적 HTML) — 2단계부터 Next.js + Notion CMS 연동 예정
- **호스팅**: Vercel (GitHub 연동 자동 배포)
- **도메인**: 가비아 (DNS만 관리, 호스팅은 Vercel)

## 디렉토리 구조

```
homifactory-site/
├── index.html        # 메인 페이지 (히어로 · 5개 부서 · Stats · FAQ · 문의)
├── about.html        # 회사소개 (스토리 · 가치 · 팀 · 히스토리 · 법인 정보)
├── reference.html    # 레퍼런스 · 포트폴리오 (캠페인 사례)
├── blog.html         # 블로그 · 뉴스룸
├── style.css         # 공통 스타일 (컬러 토큰 · 네비 · 푸터)
├── common.js         # 공통 스크립트 (커서 · 햄버거 · 리빌 · 카운터)
├── vercel.json       # Vercel 배포 설정 (cleanUrls · 보안 헤더 · 캐시)
├── robots.txt        # 검색엔진 크롤링 규칙
└── sitemap.xml       # 검색엔진 사이트맵
```

## 직원용 수정 가이드 (간단 편집)

### 블로그 글 하나 수정하고 싶다면
1. GitHub 웹에서 `blog.html` 열기
2. 연필(Edit) 아이콘 클릭
3. 원하는 글 블록 텍스트 수정
4. 페이지 하단 "Commit changes" 클릭
5. 1분 후 사이트에 자동 반영

### 레퍼런스 카드 하나 추가/수정
1. `reference.html` 수정 (`<div class="ref-card ...">` 블록 복사해서 수정)
2. 커밋 → 자동 배포

### 색상·폰트 변경
1. `style.css` 최상단 `:root { ... }` 블록에서 컬러 토큰만 변경
2. 다른 파일은 건드리지 않아도 전체 사이트에 일괄 반영됨

> ⚠️ 2단계부터는 Notion DB에서 직접 글을 올리면 자동 반영되도록 전환 예정입니다. 그때까지는 간단한 수정만 GitHub 웹 UI에서 진행해 주세요.

## 개발자 로컬 실행

```bash
# 저장소 클론
git clone https://github.com/<YOUR-USERNAME>/homifactory-site.git
cd homifactory-site

# 로컬 미리보기 (Python 3)
python -m http.server 8000
# → http://localhost:8000 접속
```

## 배포 흐름

`main` 브랜치에 push → Vercel이 감지 → 약 30초 내 자동 배포 → https://homifactory.com 반영

프리뷰 URL은 다른 브랜치 push 시 자동 생성됩니다 (예: `feature/new-blog-post.homifactory.vercel.app`).

## 2단계 로드맵 (미래)

- [ ] Next.js로 전환 (SEO · 이미지 최적화 · 라우팅)
- [ ] Notion DB 연동 — 블로그·레퍼런스·FAQ·팀원 프로필을 Notion에서 직접 편집
- [ ] `theme.json` 기반 디자인 토큰 시스템 (색상·폰트 GUI 편집)
- [ ] `/admin` 관리자 페이지 (필요시)
- [ ] 이메일 문의 실제 발송 (Resend · SendGrid 연동)

## 법인 정보

- **상호**: 호미 팩토리 / Homi Factory
- **대표**: 윤호성 · 배수빈 · 최성용 (공동대표 3인)
- **사업자등록번호**: 295-20-02749
- **주소**: 경기도 용인시 처인구 금령로 23, 302-73호
- **문의**: hosung@homifactory.com

---

© 2026 Homi Factory. All rights reserved.
