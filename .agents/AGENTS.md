# Project-specific Rules: Seed of Thought

## 개발 및 운영 배포 환경 지침

이 프로젝트에서는 신규 기능이나 코드를 구현할 때 아래 환경 분리 지침을 반드시 숙지하고 개발을 진행해야 합니다.

1. **데이터베이스 분리 정책**:
   - 개발 및 로컬 테스트 단계에서는 **개발용 DB (Neon Dev)**를 사용하며, `.env.development`에 주입되어 있습니다.
   - 운영 서버 배포 및 운영 단계의 스키마 변경 시에는 **운영용 DB (Neon Prod)**를 사용하며, `.env.production`에 주입되어 있습니다.

2. **개발 및 스키마 변경 워크플로우**:
   - **백엔드 시작**: `npm run start:dev` (로컬 개발용)
   - **Prisma 개발 스키마 반영**: `npx dotenv-cli -e .env.development -- npx prisma db push` (데이터를 유실하지 않고 스키마를 동기화하기 위해 migrate dev 대신 db push를 필수적으로 사용합니다.)
   - **Prisma 운영 스키마 반영**: `npx dotenv-cli -e .env.production -- npx prisma db push` (배포 전 반드시 단독 실행하여 운영 DB 스키마 반영)

3. **프론트엔드 환경 스위칭**:
   - `__DEV__` 값에 따라 로컬 백엔드(`localhost:3000`) 또는 실서버 API(`https://seed-of-thought.onrender.com`)로 자동 분기되므로 하드코딩하지 않습니다.

상세 워크플로우 가이드는 루트 디렉토리의 [development_workflow.md](file:///Users/kyouhwayeon/Documents/Seed%20of%20Thought/development_workflow.md)를 참고하세요.
