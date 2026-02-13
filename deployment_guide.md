# Deployment Guide - Seed of Thought (생각의 씨앗)

This guide provides steps to deploy the 'Seed of Thought' application to a production environment.

## 1. Backend Deployment (NestJS)

### Infrastructure Recommendation
- **Platform**: Render, Railway, or AWS App Runner (Easy to set up for NestJS).
- **Database**: Managed PostgreSQL (e.g., Amazon RDS, Render PostgreSQL).

### Deployment Steps
1. **Database Migration**:
   - Ensure your production database URL is set in `DATABASE_URL`.
   - Run `npx prisma migrate deploy` to apply the schema.
2. **Environment Variables**:
   - Set the following in your hosting provider's dashboard:
     - `NODE_ENV=production`
     - `PORT=3000`
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `OPENAI_API_KEY`
     - `GOOGLE_VISION_API_KEY` (Optional for MVP OCR)
     - `KAKAO_CLIENT_ID`
3. **Build & Start**:
   - `npm install`
   - `npm run build`
   - `npm run start:prod`

---

## 2. Frontend Deployment (React Native)

### Android Deployment
1. **Update API Endpoint**:
   - In `src/screens/*.tsx`, change `http://localhost:3000` to your production backend URL.
2. **Generate Signing Key**:
   - Run `keytool -genkeypair -v -keystore my-upload-key.keystore ...`
3. **Build APK/Bundle**:
   - `cd android && ./gradlew assembleRelease` (for APK)
   - `cd android && ./gradlew bundleRelease` (for Google Play)

### iOS Deployment
1. **Update API Endpoint**:
   - Change `http://localhost:3000` to your production backend URL.
2. **Configure Xcode**:
   - Open `ios/SeedOfThought.xcworkspace` in Xcode.
   - Set the **Bundle Identifier** and **Signing & Capabilities**.
3. **Archive & Upload**:
   - Select 'Any iOS Device' as the target.
   - Product -> Archive -> Distribute App.

---

## 3. Production Checklist
- [ ] Backend URL updated in Frontend store/services.
- [ ] Database backups enabled.
- [ ] OpenAI usage limits set (to prevent unexpected costs).
- [ ] App Store/Play Store assets (icons, splash screens) prepared.
