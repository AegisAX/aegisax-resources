# GitHub 게시 준비 안내

준비일: 2026-11-25

- 사이트 이름: **AegisAX 디자인 자료실**
- 제안 저장소 이름: **aegisax-resources**
- 확인된 GitHub 계정: **AegisAX**
- 이 파일 묶음은 업로드 준비본이며, 저장소 생성·Pages 활성화는 아직 수행하지 않았습니다.

## 1. 공개 범위 선택

| 원하는 운영 방식 | 적용 방법 |
| --- | --- |
| 소스와 웹사이트를 모두 공개 | 공개 저장소 + GitHub Pages. GitHub Free에서도 지원합니다. |
| 소스는 비공개, 웹사이트는 공개 | Pro/Team 등 비공개 저장소의 Pages를 지원하는 플랜이 필요합니다. |
| 웹사이트도 비공개 | 개인 계정의 일반 Pages로는 제공할 수 없습니다. Enterprise Cloud 조직의 조건에 맞는 project site 또는 별도 접근 제어를 제공하는 호스팅이 필요합니다. |

비공개 저장소를 선택해도 일반적인 GitHub Pages 웹사이트는 인터넷에 공개됩니다. 원래 비공개로 요청했던 사이트라면 공개 전환을 결정한 후 Pages를 켜세요.

## 2. 저장소 만들기

1. GitHub에 AegisAX 계정으로 로그인합니다.
2. 새 저장소 이름을 `aegisax-resources`로 지정합니다.
3. 1단계에서 선택한 공개 범위를 설정합니다.
4. 아래 파일들을 저장소 루트에 업로드합니다. 압축 파일 자체나 바깥 폴더를 올리는 것이 아니라, 압축을 푼 폴더 안의 파일을 올립니다.

`index.html`, `styles.css`, `app.js`, `resources.json`, `favicon.svg`, `.nojekyll`, `.gitignore`, `README.md`, `DEPLOY.md`

현재 파일들은 상대 경로를 사용하므로 프로젝트 하위 경로에서도 작동합니다.

## 3. Pages 활성화 — 웹사이트 공개를 선택했을 때

1. 저장소의 **Settings → Pages**로 이동합니다.
2. **Build and deployment → Source**에서 **Deploy from a branch**를 선택합니다.
3. Branch를 **main**, 폴더를 **/ (root)**로 지정하고 저장합니다.
4. 배포가 끝나면 같은 설정 화면에 표시되는 **Visit site** 링크로 접속합니다.
5. 32개 자료가 표시되는지, 사진 필터와 비교 기능, 공식 링크가 정상 동작하는지 확인합니다.

이후 main 브랜치에 수정 사항을 반영하면 게시 원본이 갱신됩니다. 이 사이트는 빌드가 필요 없어 별도의 사용자 정의 Actions 워크플로를 추가하지 않았습니다.

## 4. VS Code / Git으로 관리할 때

새로운 빈 GitHub 저장소를 먼저 만든 다음, 이 폴더를 VS Code로 열어 Git 저장소를 초기화하고 GitHub에 표시된 실제 원격 저장소 주소를 연결합니다. 기존 AegisAX 프로젝트와 동일하게 Windows의 VS Code에서 Linux 개발 서버로 Remote-SSH 접속해 관리해도 됩니다.

API 키·인증 토큰·Sites 내부 메타데이터는 업로드할 필요가 없습니다. 이 준비본에는 해당 항목이 포함되어 있지 않습니다.

## 공식 안내

- GitHub Pages 개요 및 플랜: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- 사이트 만들기 및 공개 주의사항: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- 게시 원본 설정: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- 실제 비공개 Pages 조건: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/about-privately-published-github-pages-sites
