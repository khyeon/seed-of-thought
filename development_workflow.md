# Development Workflow & Guidelines (개발 프로세스 및 지침)

이 문서는 'Seed of Thought' 프로젝트에서 신규 기능을 구현하고 배포할 때 준수해야 하는 환경 분리 정책 및 개발 프로세스를 설명합니다.

---

## 1. 개발(Dev) 및 운영(Prod) 환경 구성 개요

### 💻 데이터베이스 (Neon DB - PostgreSQL)
개발 환경과 운영 환경의 데이터베이스 인스턴스가 완벽히 분리되어 있어, 개발 중의 실수나 테스트 데이터가 운영 데이터베이스에 영향을 주지 않습니다.

* **개발 환경 (Dev DB)**
  * 연결 문자열: `ep-fragrant-shape-a1a9lyw7-pooler.ap-southeast-1.aws.neon.tech`
  * 설정 파일: `backend/.env.development`
* **운영 환경 (Prod DB)**
  * 연결 문자열: `ep-steep-bar-a1vjtgfo-pooler.ap-southeast-1.aws.neon.tech`
  * 설정 파일: `backend/.env.production`

### ⚙️ 백엔드 (NestJS)
`NODE_ENV` 환경 변수에 따라 적합한 설정 파일을 로드하여 동작합니다.
* **로컬 개발 실행**: `npm run start:dev` (자동 리로드 활성화, `.env.development` 사용)
* **운영 서버 실행**: `npm run start:prod` (빌드본 실행, `.env.production` 사용)

### 📱 프론트엔드 (React Native)
`__DEV__` 글로벌 상수를 기준으로 API 엔드포인트를 자동 스위칭합니다.
* **에뮬레이터/시뮬레이터 개발 모드**: `http://localhost:3000` (또는 Android `10.0.2.2:3000`)
* **프로덕션/릴리즈 빌드 모드**: `https://seed-of-thought.onrender.com`

---

## 2. 단계별 신규 기능 구현 프로토콜 (반드시 준수)

신규 기능을 추가하거나 시스템을 변경할 때는 다음 프로세스를 엄격히 따릅니다.

### 1단계: 설계 및 계획 (Planning)
* 어떤 환경 변수가 필요한지 미리 정의합니다.
* 데이터베이스 스키마 변경(`schema.prisma`)이 수반되는지 검토합니다.

### 2단계: 로컬 환경 및 개발 DB에서 개발 진행 (Development)
1. 백엔드에서 **개발 모드**로 서버를 실행합니다.
   ```bash
   cd backend
   npm run start:dev
   ```
2. 데이터베이스 스키마를 수정할 경우, `prisma:dev` 명령어를 통해 **개발 환경**에 먼저 마이그레이션을 적용하고 클라이언트를 생성합니다.
   ```bash
   # 개발 DB 스키마 수정 반영 및 마이그레이션 생성
   npm run prisma:dev migrate dev --name <migration_name>
   
   # 또는 스키마가 변경되지 않았고 클라이언트만 재생성할 경우
   npm run prisma:dev generate
   ```

### 3단계: 로컬 및 시뮬레이터 테스트 (Testing)
* 프론트엔드 및 백엔드를 로컬에서 연동하여 비즈니스 로직을 검증합니다.
* 이 단계에서 쓰거나 지우는 모든 데이터는 **개발 DB (Neon Dev)**에만 쌓이므로 안전하게 테스트를 진행합니다.

### 4단계: 운영 배포 준비 및 마이그레이션 (Staging/Production Deploy)
1. **운영 DB 스키마 업데이트 (Prisma Deploy)**:
   운영 서버를 실행하기 전에 마이그레이션을 운영 DB에 안전하게 반영해야 합니다.
   ```bash
   cd backend
   npm run prisma:prod migrate deploy
   ```
   > [!IMPORTANT]
   > `migrate dev`를 운영 환경에 사용하면 안 됩니다. 운영 환경에는 반드시 `migrate deploy` 명령어를 통해 생성된 마이그레이션 이력 파일들만 반영되도록 해야 합니다.

2. **백엔드 배포**:
   * Render 대시보드나 CLI 환경을 통해 배포를 진행합니다. (자동 빌드 트리거 혹은 `npm run render-deploy` 실행)
   * 운영 환경에 새 환경 변수가 추가되었다면, Render 설정의 **Environment Variables**에 값을 등록해야 합니다.

3. **프론트엔드 빌드 및 릴리즈**:
   * API 엔드포인트 변경 및 코드 검증을 완료한 후 Android 및 iOS 운영 빌드를 수행합니다.

### 5단계: 배포 후 검증 (Post-deployment Verification)
* 운영 환경 앱을 사용하여 실서버에서도 오류 없이 신규 기능이 작동하는지 최종 모니터링합니다.
