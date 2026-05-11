# 우리 크리에이터 — 사진/링크 추가 가이드

이 폴더는 about.html 의 **우리 크리에이터** 섹션에 표시되는 카드 사진을 보관합니다.

---

## 1. 사진 파일 준비

- **포맷**: JPG (또는 PNG)
- **사이즈**: 가로 400px × 세로 500px 이상 (4:5 비율 권장)
- **파일 이름**: 소문자·언더스코어, 띄어쓰기 X
  - 예: `dance_studio.jpg`, `vocal_kim.jpg`, `food_diary.jpg`
- **저장 위치**: `assets/creators/` 폴더 안

---

## 2. about.html 카드 코드 수정

`about.html` 파일에서 `<!-- 1차 세트 -->`와 `<!-- 2차 세트 -->` 두 곳을 찾으세요.
**같은 카드를 두 번 (1차/2차 세트 모두)** 동일하게 적어야 무한 루프가 자연스럽게 이어집니다.

### 기존 (이모지 placeholder)

```html
<a href="https://www.instagram.com/dance_studio/" target="_blank" rel="noopener" class="creator-card">
  <div class="creator-photo">✨</div>
  <div class="creator-info">
    <div class="creator-name">Creator 01</div>
    <div class="creator-handle">@dance_studio</div>
  </div>
</a>
```

### 사진 추가 후

```html
<a href="https://www.instagram.com/dance_studio/" target="_blank" rel="noopener" class="creator-card">
  <div class="creator-photo"><img src="assets/creators/dance_studio.jpg" alt="댄스 스튜디오"></div>
  <div class="creator-info">
    <div class="creator-name">댄스 스튜디오</div>
    <div class="creator-handle">@dance_studio</div>
  </div>
</a>
```

**바뀐 부분**:
- `<div class="creator-photo">✨</div>` → `<div class="creator-photo"><img src="assets/creators/{파일명}.jpg" alt="{이름}"></div>`
- `<div class="creator-name">Creator 01</div>` → `<div class="creator-name">{실제 이름}</div>`
- `href="https://www.instagram.com/{handle}/"` → 실제 인스타·틱톡·유튜브 등 프로필 URL
- `<div class="creator-handle">@{handle}</div>` → 실제 핸들

---

## 3. 새 크리에이터 추가하려면

`<!-- 1차 세트 -->`와 `<!-- 2차 세트 -->` **양쪽 모두**에 같은 카드를 추가하세요.

```html
<a href="https://www.instagram.com/{핸들}/" target="_blank" rel="noopener" class="creator-card">
  <div class="creator-photo"><img src="assets/creators/{핸들}.jpg" alt="{이름}"></div>
  <div class="creator-info">
    <div class="creator-name">{이름}</div>
    <div class="creator-handle">@{핸들}</div>
  </div>
</a>
```

---

## 4. 다른 플랫폼 링크

`href` 만 바꾸면 됩니다.
- 인스타: `https://www.instagram.com/{핸들}/`
- 틱톡: `https://www.tiktok.com/@{핸들}`
- 유튜브: `https://www.youtube.com/@{핸들}`
- 자체 페이지: `creators/{핸들}.html` (나중에 개별 프로필 페이지 만들면)

---

## 5. 커밋 후 30초 안에 라이브 반영

수정 → 커밋 → Vercel 자동 배포 → 1분 안에 https://homifactory.com/about.html 에 반영됩니다.
