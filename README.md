# 📱 Shadow AI — Mobile Application Repository

Shadow AI Mobile is a cyberpunk stealth & tactical agent mobile game built with **React Native (Expo)**, **FastAPI (Python)**, and **MongoDB**.

## 🚀 Mobile App Stack
- **Mobile Frontend**: React Native (Expo SDK 50+), React Navigation, Reanimated.
- **Backend API**: FastAPI, AsyncIOMotorClient (MongoDB), PyJWT, Bcrypt.
- **Automation & E2E Testing**: Selenium WebDriver (Mobile UI suite), Pytest Backend Suite, Baseline APM Load Tests.
- **Deployment**: Render Cloud Web Service, GitHub Actions CI/CD Pipeline.

---

## 📊 CI/CD Workflow & Test Execution Architecture

Below is the execution flowchart representing all test stages, parallel executions, artifact collections, and report generation in our GitHub Actions pipeline:

```mermaid
graph TD
    A[Code Push / PR to main] --> B[GitHub Actions Triggered]
    
    subgraph Stage 1: Parallel Core Verification
        B --> C[Backend Pytest Unit & Integration Suite]
        B --> D[Frontend Linter & Expo Build]
        B --> E[Backend Docker Image Build Verification]
    end

    subgraph Stage 2: Performance & Mobile E2E Automation
        B --> F[APM Baseline Load Testing]
        D --> G1[Selenium Step 1: User Registration]
        G1 --> G2[Selenium Step 2: Email OTP Verification]
        G2 --> G3[Selenium Step 3: User Login Authentication]
        G3 --> G4[Selenium Step 4: Character Class Creation]
        G4 --> G5[Selenium Step 5: Dashboard & Mission Routes]
    end

    subgraph Stage 3: Security & Vulnerability Scans
        B --> H1[Secret Detection - Gitleaks]
        B --> H2[SAST Static Analysis - Semgrep]
        B --> H3[Dependency Vulnerability Audit - Safety & NPM Audit]
    end

    subgraph Stage 4: Artifact Generation & Dashboard Publishing
        C --> I[Upload backend_report.xml]
        F --> J[Upload load_test_report.json]
        G5 --> K[Upload selenium_state_reports]
        H1 --> L[Upload gitleaks.json]
        H2 --> L
        H3 --> L
        
        I --> M[Publish Unified Test Dashboard]
        J --> M
        K --> M
        L --> M
        M --> N[Build Excel Test Automation Report (.xlsx)]
        M --> O[Publish GitHub Step Summary]
    end
```

---

## 🧪 Comprehensive Workflow Test Matrix

| Category | Test Suite / Job | Tool / Framework | Scope & Coverage | Generated Artifact |
| --- | --- | --- | --- | --- |
| **Backend Unit & Integration** | `backend-tests` | Pytest | FastAPI routes, Auth, JWT tokens, MongoDB models, NPC trust | `backend_report.xml` |
| **APM Performance & Load** | `baseline-load-testing` | Python `httpx` + `psutil` | Concurrent load, P50/P90/P99 latency, RPS throughput | `load-test-report` |
| **Mobile E2E UI Automation** | `e2e-step-1..5` | Selenium WebDriver (Mocha) | Registration, OTP verification, Login, Character setup, Dashboard | `selenium-state-1..5` |
| **Frontend Linter & Build** | `frontend-linter-build` | ESLint + Expo Export | Code linting, bundle export, assets validation | `frontend-reports` |
| **Container Build** | `backend-docker-build` | Docker Buildx | Container build validation for production deployment | Docker build status |
| **Secret Detection** | `secret-detection` | Gitleaks Action | Git repository commit history scan for hardcoded secrets | `gitleaks-report` |
| **SAST Analysis** | `sast-semgrep` | Semgrep | Static application security testing for vulnerabilities | `semgrep-report` |
| **Dependency Audits** | `dependency-scan` | PyUP Safety + NPM Audit | Third-party library security vulnerability scanning | `dependency-reports` |
| **Excel Summary Report** | `publish-unified-summary` | `openpyxl` | Generates 2-tab Excel report containing 400 test cases & workflow maps | `Selenium_Test_Automation_Report.xlsx` |

---

## 📑 Excel Report Structure (`Selenium_Test_Automation_Report.xlsx`)

The automated workflow generates a 2-tab Excel workbook:
1. **Tab 1 — "Selenium E2E Test Cases"**: Full catalog of 400 E2E mobile test cases detailing:
   - `Test Case ID` (TC_001 to TC_400)
   - `Test Case Name` & `Module` (Signup, Login, Verification, Character, Dashboard, Missions, Profile, Security)
   - `Test Steps` (Executable Selenium JavaScript code snippets)
   - `Expected Result` vs `Actual Result`
   - `Status` (PASS/FAIL), `Browser`, `Execution Date`, `Bug ID`, and `Remarks`
2. **Tab 2 — "CI-CD Workflow Architecture"**: Workflow pipeline map detailing every job, tool, environment variables, execution triggers, and output artifacts.

---

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

### 3. Run Mobile Selenium Automation Tests & Excel Report Generator
```bash
cd frontend/selenium-tests
npm install
npm run test:register
npm run test:login
npm run test:dashboard

# Generate Excel Report locally
python backend/generate_excel.py
python backend/generate_summary.py
```

## 🔄 CI/CD Pipelines
This repository uses GitHub Actions workflows for automated testing and deployment:
- **CI Pipeline**: Pytest backend tests, Selenium mobile E2E suite, APM load testing, Docker build.
- **Deploy to Render**: Automated production deployment to Render upon successful CI completion.
- **Security Review**: Gitleaks secret detection, Semgrep SAST, and Dependency vulnerability scanning.
