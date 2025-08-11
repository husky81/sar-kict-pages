---
title: 페이지 수정 요청
description: sar-kict 페이지의 내용을 수정 제안하는 방법입니다.
---

sar-kict-pages는 Astro + Starlight 기반으로 작성했습니다.
누구나 마크다운 형식으로 새로운 글이나 문서를 작성해 제안할 수 있습니다.

# 소스코드 다운로드

윈도우에서 파워쉘에서 다음 명령 실행

```powershell
git clone https://github.com/husky81/sar-kict-pages
cd sar-kict-pages
npm install
npm run dev
```

git과 Node.js가 설치되어있지 않으면 다운 받아서 설치
(주의) 건설연 원내에서는 실시간 미리보기가 가능한 npm run dev가 실행되지 않지만, 수정 제안은 가능합니다.

---

# 페이지 수정 제안 방법
git 저장소 소유자가 아닌 사람이 저장소에 직접 수정 권한이 없을 때, 수정 요청을 하는 일반적인 방법은 **Fork & Pull Request (PR)** 입니다.
다음 내용을 수정한 후 
- 문서 내용: ./src/content/docs/
- 문서 목록: ./astro.config.mjs

1. **저장소 포크(Fork)하기**

   * GitHub 같은 플랫폼에서 원본 저장소를 자신의 계정으로 복사합니다.
   * 예: 저장소 우측 상단의 `Fork` 버튼 클릭

2. **포크한 저장소 클론(Clone)하기**

   * 내 로컬 컴퓨터에 포크한 저장소를 내려받습니다.

   ```
   git clone https://github.com/내계정/포크한저장소.git
   ```

3. **수정 작업하기**

   * 코드를 수정하고 커밋(commit) 합니다.

4. **포크한 저장소에 푸시(Push)하기**

   ```
   git push origin 브랜치이름
   ```

5. **Pull Request 생성하기**

   * GitHub 원본 저장소 페이지에 들어가서 `Compare & pull request` 버튼 클릭
   * 변경 사항을 설명하는 제목과 내용을 작성 후 PR 제출

6. **원본 저장소 소유자/관리자가 PR 검토 후 병합(Merge)**

   * 리뷰, 승인, 병합 과정을 통해 변경 사항이 관리자 확인 후 공식 저장소에 반영됨
