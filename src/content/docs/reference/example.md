---
title: 기여방법 안내
description: sar-kict 페이지의 내용을 수정 제안하는 방법입니다.
---

아래는 다른 사람들이 당신의 블로그 레포지토리(`husky81/sar-kict-pages`)에 글을 작성하고 기여할 수 있도록 돕는 **기여 가이드 안내문**입니다.
`CONTRIBUTING.md` 파일로 저장해 레포지토리에 포함하거나, README.md에 포함해도 좋습니다.

---

# 🤝 기여 안내 (Contributing Guide)

안녕하세요! 이 저장소는 **Astro + Starlight** 기반으로 만든 블로그입니다.
누구나 새로운 글이나 문서를 작성해 제안할 수 있으며, Pull Request를 통해 기여해 주시면 감사합니다 🙏

---

## 📌 기여 방법 요약

1. **저장소 복제**
2. **새 글 작성 또는 기존 글 수정**
3. **커밋 후 Pull Request 생성**
4. **리뷰 후 반영**

---

## 🛠️ 1. 저장소 복제 및 설치

```bash
git clone https://github.com/husky81/sar-kict-pages.git
cd sar-kict-pages
npm install
```

Astro 프로젝트가 정상적으로 설치되면 아래 명령으로 개발 서버를 실행할 수 있습니다:

```bash
npm run dev
```

브라우저에서 `http://localhost:4321` 에 접속해 확인해보세요.

---

## ✍️ 2. 글 작성 방법

### 📁 위치: `src/content/blog/`

모든 블로그 글은 마크다운(`.md` 또는 `.mdx`) 파일로 구성되어 있습니다.
새 글을 작성할 때는 아래처럼 새 파일을 만들어주세요:

```bash
src/content/blog/2024-07-my-new-post.md
```

### 🧾 파일 템플릿 예시

```md
---
title: "AI 기반 구조물 손상 평가 사례"
description: "SAR와 AI 모델을 활용한 구조물 위험도 분석 예시"
pubDate: "2025-07-11"
author: "홍길동"
tags: ["AI", "인프라", "손상 평가"]
---

이 문서는 구조물 손상 평가를 위한 AI 모델 적용 사례를 소개합니다.

## 분석 개요

- InSAR 기반 변위 추정
- AI 기반 위험도 분류
- GIS 연동 결과 시각화

...
```

---

## 🔁 3. 변경사항 커밋 후 PR 보내기

변경/작성 완료 후, 아래처럼 커밋하고 브랜치를 푸시해주세요:

```bash
git checkout -b feature/your-post-title
git add .
git commit -m "블로그 글: AI 구조물 손상 평가 작성"
git push origin feature/your-post-title
```

그 다음 GitHub에서 **Pull Request**를 생성해주세요.

---

## ✅ 4. 리뷰 및 병합

PR이 제출되면 관리자가 내용을 확인 후 리뷰 또는 병합(Merge)합니다.
필요 시 수정을 요청드릴 수 있습니다.

---

## 🧼 기타 작성 규칙

* 파일 이름은 영어로 작성해주세요. (`my-first-post.md`)
* 이미지가 있다면 `public/images/` 폴더에 넣고 상대경로로 링크하세요.
* 가능한 간결하고 이해하기 쉬운 마크다운 문법을 사용해주세요.

---

## 🙋‍♂️ 도움이 필요하면

이슈를 생성하거나, PR에 질문을 포함해 주세요. 함께 만들어가는 공간입니다!
감사합니다 😊

---

필요하면 `LICENSE`, `README`, `CODE_OF_CONDUCT`도 함께 설정해 오픈소스 기여 문화를 완성할 수 있습니다.
위 안내문을 `CONTRIBUTING.md`로 레포지토리 루트에 추가하시면 다른 기여자들에게 자동으로 노출됩니다.