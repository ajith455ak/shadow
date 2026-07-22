# 📱 Shadow AI — Mobile Application Repository

Shadow AI Mobile is a cyberpunk stealth & tactical agent mobile game built with **React Native (Expo)**, **FastAPI (Python)**, and **MongoDB**.

## 🚀 Mobile App Stack
- **Mobile Frontend**: React Native (Expo SDK 50+), React Navigation, Reanimated.
- **Backend API**: FastAPI, AsyncIOMotorClient (MongoDB), PyJWT, Bcrypt.
- **Automation & E2E Testing**: Selenium WebDriver (Mobile UI suite), Pytest Backend Suite, Baseline APM Load Tests.
- **Deployment**: Render Cloud Web Service, GitHub Actions CI/CD Pipeline.

## 🛠️ Local Mobile Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8001
```

### 2. Mobile App Setup
```bash
cd frontend
yarn install
# Run on Android
npx expo run:android
# Run on iOS
npx expo run:ios
```

### 3. Run Mobile Selenium Automation Tests
```bash
cd frontend/selenium-tests
npm install
npm run test:register
npm run test:login
npm run test:dashboard
```

## 🔄 CI/CD Pipelines
This repository uses GitHub Actions workflows for automated testing and deployment:
- **CI Pipeline**: Pytest backend tests, Selenium mobile E2E suite, APM load testing, Docker build.
- **Deploy to Render**: Automated production deployment to Render upon successful CI completion.
- **Security Review**: Gitleaks secret detection, Semgrep SAST, and Dependency vulnerability scanning.
