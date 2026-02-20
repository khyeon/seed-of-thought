# 🚀 향후 개발 및 배포 전략 가이드

본 문서는 v1.0 이후 추가 기능 개발 및 개선 시 적용될 요구사항 문서화 구조와 Git 배포 전략을 정의합니다.

---

## 1. 요구사항 문서화 구조 (Documentation Flow)

새로운 기능을 추가하거나 큰 개선을 할 때마다 `docs/roadmap/` 폴더 내에 버전별/기능별 문서를 생성하여 관리하는 것을 추천합니다.

### 1.1 문서 관리 구조
- `docs/roadmap/v2.0_requirements.md`: 차기 대규모 업데이트 계획.
- `docs/roadmap/feature_character_customizing.md`: 특정 대형 기능 전용 기획서.

### 1.2 요구사항 템플릿 (추천 구성)
새로운 요청을 하실 때 아래 항목을 포함하면 개발 효율이 극대화됩니다:
1. **Goal**: 이 기능을 왜 만드는가?
2. **User Scenario**: 사용자가 어떤 과정을 통해 이 기능을 경험하는가?
3. **Requirement Details**: 구체적인 작동 방식 (예: 버튼 클릭 시 애니메이션, 데이터 저장 주기 등).
4. **UI/UX Changes**: 변경되거나 추가될 화면의 느낌.
5. **Technical Impact**: 기존 DB 스키마나 API에 미칠 영향 분석.

---

## 2. Git 배포 및 브랜치 전략 (GitFlow 기반)

안전한 운영을 위해 **'기능 개발 -> 통합 테스트 -> 운영 배포'**의 단계를 거치는 GitFlow 전략을 권장합니다.

### 2.1 브랜치 구조
- **`main`**: **운영 전용 브랜치**. 항상 바로 서비스 가능한 상태여야 하며, `develop`에서 검토 완료된 코드만 머지됩니다. (배포: Vercel/Render Production)
- **`develop`**: **개발 통합 브랜치**. 각 기능들이 모여서 함께 테스트되는 공간입니다.
- **`feature/기능명`**: **개별 기능 개발용 브랜치**. `develop`에서 생성하고, 개발 완료 후 `develop`으로 머지합니다.
- **`hotfix/버그명`**: **운영 긴급 수정**. `main`에서 직접 생성하여 빠르게 배포한 후 `develop`에도 반영합니다.

### 2.2 배포 워크플로우
1. 💡 **기획**: `docs/roadmap/`에 새 요구사항 문서 작성.
2. 🔨 **개발 시작**: `develop` 브랜치에서 `feature/new-api` 브랜치 생성.
3. 🧪 **검증**: 개발이 완료되면 `develop`으로 머지하고 로컬/개발 서버에서 통합 테스트.
4. 🚀 **배포**: 출시 준비가 되면 `develop`을 `main`으로 머지 -> Render/Vercel 자동 배포 트리거.
5. 📝 **마무리**: `MASTER_DOCUMENTATION.md`에 변경된 기술/기획 내용 업데이트.

---

## 3. 협업 및 자동화 팁 (Next Steps)

- **Github Pull Requests (PR)**: 브랜치를 머지할 때 PR을 사용하여 변경 사항을 한 번 더 검토하세요.
- **Version Tagging**: `main`에 머지할 때마다 `git tag v1.1`과 같이 버전을 기록하면 향후 특정 시점으로 복구하기 쉽습니다.
- **Issue Tracking**: GitHub Issues를 활용해 작업 항목을 관리하고 문서 링크를 연결하면 히스토리 파악이 매우 용이합니다.
