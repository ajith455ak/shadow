import os
import json
import xml.etree.ElementTree as ET
import sys

def find_file(filename):
    if os.path.exists(filename):
        return filename
    # Try parent directory
    parent_path = os.path.join("..", filename)
    if os.path.exists(parent_path):
        return parent_path
    # Try backend subdirectory
    backend_path = os.path.join("backend", filename)
    if os.path.exists(backend_path):
        return backend_path
    return filename

def parse_junit(xml_path):
    resolved_path = find_file(xml_path)
    if not os.path.exists(resolved_path):
        return [], 0.0
    
    test_cases = []
    duration = 0.0
    try:
        tree = ET.parse(resolved_path)
        root = tree.getroot()
        
        try:
            duration = float(root.get("time", "0.0"))
        except ValueError:
            pass
            
        suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
        
        for suite in suites:
            if root.tag != "testsuite":
                try:
                    duration += float(suite.get("time", "0.0"))
                except ValueError:
                    pass
            for tc in suite.findall("testcase"):
                name = tc.get("name", "")
                classname = tc.get("classname", "")
                
                # Default status is PASSED
                status = "PASSED"
                error_details = "None"
                
                # Check for failure
                failure = tc.find("failure")
                if failure is not None:
                    status = "FAILED"
                    error_details = failure.text.strip().split("\n")[0] if failure.text else "Assertion Error"
                
                # Check for error
                error = tc.find("error")
                if error is not None:
                    status = "FAILED"
                    error_details = error.text.strip().split("\n")[0] if error.text else "System Error"
                
                # Check for skipped
                skipped = tc.find("skipped")
                if skipped is not None:
                    status = "SKIPPED"
                    error_details = skipped.get("message", "Skipped by pytest")
                
                # Category can be module or classname
                category = classname.split(".")[-1]
                if category.startswith("Test"):
                    category = category[4:]
                if not category:
                    if "load_test" in name or "load_test" in classname:
                        category = "Load Test"
                    else:
                        category = "General"
                
                # Special mapping for selenium test cases
                if "test_selenium" in classname or xml_path == "selenium_report.xml":
                    sel_mapping = {
                        "test_01_registration_and_otp": ("Register Page", "test_registration_form_submission"),
                        "test_02_login": ("Login Page", "test_login_authentication"),
                        "test_03_character_creation": ("Character Page", "test_character_creation_and_setup"),
                        "test_04_dashboard_and_navigation": ("Dashboard Page", "test_dashboard_routes_and_navigation"),
                        "test_05_leaderboard_view": ("Leaderboard Page", "test_leaderboard_rankings"),
                        "test_06_mission_xp_progression": ("Missions Page", "test_mission_xp_progression"),
                        "test_07_responsive_ui": ("Layout Page", "test_layout_responsiveness"),
                        "test_08_profile_and_logout": ("Profile Page", "test_profile_and_logout"),
                    }
                    if name in sel_mapping:
                        category, name = sel_mapping[name]
                    else:
                        category = "Mobile E2E"
                
                test_cases.append({
                    "category": category,
                    "name": name,
                    "status": status,
                    "error": error_details
                })
    except Exception as e:
        print(f"Error parsing {resolved_path}: {e}")
        
    return test_cases, duration

def parse_playwright(json_path):
    resolved_path = find_file(json_path)
    if not os.path.exists(resolved_path):
        return [], 0.0
    
    try:
        with open(resolved_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                steps = data.get("steps", [])
                duration = data.get("duration", 0.0)
            else:
                steps = data
                duration = 0.0
                
            cases = [
                {
                    "category": tc.get("category", "Frontend"),
                    "name": tc.get("name", ""),
                    "status": tc.get("status", "PENDING"),
                    "error": tc.get("error", "None")
                }
                for tc in steps
            ]
            return cases, duration
    except Exception as e:
        print(f"Error parsing {resolved_path}: {e}")
    return [], 0.0

def parse_selenium_js(json_path):
    # Default 5 steps
    default_steps = {
        1: {"category": "Register Page", "name": "test_registration_form_submission", "status": "PENDING", "error": "Not run (dependent step failed/skipped)."},
        2: {"category": "Verification Page", "name": "test_email_otp_verification", "status": "PENDING", "error": "Not run (dependent step failed/skipped)."},
        3: {"category": "Login Page", "name": "test_login_authentication", "status": "PENDING", "error": "Not run (dependent step failed/skipped)."},
        4: {"category": "Character Page", "name": "test_character_creation_and_setup", "status": "PENDING", "error": "Not run (dependent step failed/skipped)."},
        5: {"category": "Dashboard Page", "name": "test_dashboard_routes_and_navigation", "status": "PENDING", "error": "Not run (dependent step failed/skipped)."}
    }
    
    resolved_path = find_file(json_path)
    if os.path.exists(resolved_path):
        try:
            with open(resolved_path, "r", encoding="utf-8") as f:
                steps = json.load(f)
                for tc in steps:
                    step_id = tc.get("id")
                    if step_id in default_steps:
                        default_steps[step_id]["status"] = tc.get("status", "PENDING")
                        default_steps[step_id]["error"] = tc.get("error", "None")
        except Exception as e:
            print(f"Error parsing {resolved_path}: {e}")
            
    return list(default_steps.values())

def parse_load_test_json(json_path):
    resolved_path = find_file(json_path)
    if not os.path.exists(resolved_path):
        return None
    try:
        with open(resolved_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error parsing {resolved_path}: {e}")
    return None

def main():
    # Paths to the reports
    backend_xml = "backend_report.xml"
    selenium_xml = "selenium_report.xml"
    playwright_json = "playwright_report.json"
    selenium_js_json = "selenium_js_report.json"
    load_test_json = "baseline_load_test_report.json"
    
    # Parse results
    backend_cases, b_dur = parse_junit(backend_xml)
    selenium_cases, s_dur = parse_junit(selenium_xml)
    playwright_cases, p_dur = parse_playwright(playwright_json)
    selenium_js_cases = parse_selenium_js(selenium_js_json)
    load_test_data = parse_load_test_json(load_test_json)
    
    # Overall calculations
    def get_summary(cases):
        total = len(cases)
        passed = sum(1 for c in cases if c["status"] == "PASSED")
        failed = sum(1 for c in cases if c["status"] == "FAILED")
        skipped = sum(1 for c in cases if c["status"] in ("SKIPPED", "PENDING"))
        return total, passed, failed, skipped
    
    p_tot, p_pass, p_fail, p_skip = get_summary(playwright_cases)
    s_tot, s_pass, s_fail, s_skip = get_summary(selenium_cases)
    b_tot, b_pass, b_fail, b_skip = get_summary(backend_cases)
    
    # Calculate Pass/Fix rate based on (total - failed) / total to correctly count skipped as non-failures
    p_rate = f"{int((p_tot - p_fail)/p_tot*100)}%" if p_tot > 0 else "N/A"
    s_rate = f"{(s_tot - s_fail)/s_tot*100:.1f}%" if s_tot > 0 else "N/A"
    b_rate = f"{int((b_tot - b_fail)/b_tot*100)}%" if b_tot > 0 else "N/A"
    
    # Generate Markdown Dashboard
    md = []
    md.append("# 🧪 Shadow Nexus Unified Test Verification Dashboard\n")
    md.append("This dashboard presents a unified summary of E2E tests, load testing, and security scans across all major components: Website, Mobile App, and Backend.\n")
    
    md.append("## 📊 Unified Summary Overview\n")
    md.append("| Component | Test Suite / Report | Total Tests | Passed / Fixed | Failed / Open | Pass/Fix Rate | Duration |")
    md.append("| --- | --- | --- | --- | --- | --- | --- |")
    
    # Playwright row
    p_dur_str = f"{p_dur:.1f}s" if p_dur > 0 else "N/A"
    md.append(f"| Website E2E | [Shadow Web App – Full E2E Workflow](#website-e2e-test-verification-details) | {p_tot} | ✅ {p_pass} | ❌ {p_fail} | {p_rate} | {p_dur_str} |")
    
    # Selenium row
    s_dur_str = f"{s_dur:.2f}s" if s_dur > 0 else "N/A"
    md.append(f"| Mobile E2E (Pytest) | [Shadow AI - Python Selenium E2E Suite](#mobile-app-e2e-test-verification-details) | {s_tot} | ✅ {s_pass} | ❌ {s_fail} | {s_rate} | {s_dur_str} |")
    
    # Selenium JS E2E Steps row
    sj_tot, sj_pass, sj_fail, sj_skip = get_summary(selenium_js_cases)
    sj_rate = f"{int((sj_tot - sj_fail)/sj_tot*100)}%" if sj_tot > 0 else "N/A"
    md.append(f"| Mobile E2E (JS Workflow) | [Shadow AI - JS E2E Workflow Actions](#mobile-js-workflow-step-results) | {sj_tot} | ✅ {sj_pass} | ❌ {sj_fail} | {sj_rate} | N/A |")
 
    # Load Testing row
    if load_test_data:
        l_tot = load_test_data["total_requests"]
        l_pass = load_test_data["success_count"]
        l_fail = load_test_data["failure_count"]
        l_rate = f"{100.0 - load_test_data['error_rate']:.2f}%"
        l_dur_str = f"{load_test_data['actual_duration']}s"
        md.append(f"| Backend Load Test | [Baseline Performance Benchmark (100 VUs)](#backend-load-test-benchmark-results) | {l_tot} | ✅ {l_pass} | ❌ {l_fail} | {l_rate} | {l_dur_str} |")

    # Backend row
    md.append(f"| Backend Security | [Shadow AI — Security Vulnerability Report](#backend-security-scan-details) | {b_tot} | ✅ {b_pass} | 📄 {b_fail} | {b_rate} | N/A |")
    md.append("\n")
    
    # 1. Directly visible Mobile JS Workflow Steps Results
    if selenium_js_cases:
        md.append("## <a name='mobile-js-workflow-step-results'></a>📱 Mobile App JS E2E Workflow Step Results\n")
        md.append("| Step | Category | Test Name | Status | Error Details |")
        md.append("| --- | --- | --- | --- | --- |")
        for idx, tc in enumerate(selenium_js_cases, 1):
            status_icon = "✅ `PASSED`" if tc["status"] == "PASSED" else ("❌ `FAILED`" if tc["status"] == "FAILED" else "⚠️ `PENDING`")
            error_details = tc["error"].replace("|", "\\|").replace("\n", " ")
            if error_details == "None":
                error_details = "None — step passed successfully."
            md.append(f"| {idx} | {tc['category']} | `{tc['name']}` | {status_icon} | {error_details} |")
        md.append("\n")

    # 2. Directly visible Backend Load Test Benchmark details
    if load_test_data:
        md.append("## <a name='backend-load-test-benchmark-results'></a>📈 Backend Load Test Benchmark Results\n")
        md.append("| Metric | Value | Description |")
        md.append("| --- | --- | --- |")
        md.append(f"| Concurrency Level | `{load_test_data['concurrency']} virtual users` | Number of simultaneous simulated agents |")
        md.append(f"| Target Duration | `{load_test_data['duration']} seconds` | Target duration of continuous load |")
        md.append(f"| Actual Duration | `{load_test_data['actual_duration']} seconds` | Measured elapsed duration |")
        md.append(f"| Total Requests | `{load_test_data['total_requests']}` | Total transaction queries made |")
        md.append(f"| Successful Requests | `✅ {load_test_data['success_count']}` | Status 200 OK responses |")
        md.append(f"| Failed Requests | `❌ {load_test_data['failure_count']}` | Failed / Timeout transactions |")
        md.append(f"| Error Rate | `{load_test_data['error_rate']}%` | Percentage of request failures |")
        md.append(f"| Throughput (RPS) | `⚡ {load_test_data['rps']} req/sec` | Transactions completed per second |")
        md.append(f"| Average Latency | `{load_test_data['avg_latency']} ms` | Mean response time |")
        md.append(f"| Minimum Latency | `{load_test_data['min_latency']} ms` | Fastest transaction time |")
        md.append(f"| Maximum Latency | `{load_test_data['max_latency']} ms` | Slowest transaction time |")
        md.append("\n")

    # Collapsible details helper for large reports
    def render_details_table(cases, title_with_emoji, type_text, anchor):
        lines = []
        lines.append(f"## <a name='{anchor}'></a>{title_with_emoji}\n")
        lines.append(f"<details><summary>Click to view {type_text} Test Cases ({len(cases)} tests)</summary>\n")
        lines.append("| No. | Category | Test Name | Status | Error Details |")
        lines.append("| --- | --- | --- | --- | --- |")
        
        for idx, tc in enumerate(cases, 1):
            status_icon = "✅ `PASSED`" if tc["status"] == "PASSED" else ("❌ `FAILED`" if tc["status"] == "FAILED" else "⚠️ `SKIPPED`")
            error_details = tc["error"].replace("|", "\\|").replace("\n", " ")
            if error_details == "None":
                error_details = "None — test passed successfully."
            lines.append(f"| {idx} | {tc['category']} | `{tc['name']}` | {status_icon} | {error_details} |")
            
        lines.append("\n</details>\n")
        return "\n".join(lines)
        
    if playwright_cases:
        md.append(render_details_table(playwright_cases, "🌐 Website E2E Test Verification Details", "Website E2E", "website-e2e-test-verification-details"))
    if selenium_cases:
        md.append(render_details_table(selenium_cases, "📱 Mobile App E2E Test Verification Details", "Mobile E2E", "mobile-app-e2e-test-verification-details"))
    if backend_cases:
        md.append(render_details_table(backend_cases, "🛡️ Backend Security Scan Details", "Backend Security", "backend-security-scan-details"))
        
    # Add Flowchart of the workflow
    md.append("## 🔄 CI/CD Pipeline Workflow & Architecture")
    md.append("Below is the flowchart representing the parallel execution flow, test artifact collection, and automated summary reporting in our GitHub Actions workflow:\n")
    md.append("```mermaid")
    md.append("graph TD")
    md.append("    A[Code Push / PR] --> B[CI Pipeline Triggered]")
    md.append("    subgraph Parallel Verification Stages")
    md.append("        B --> C[Backend Unit/Integration Tests]")
    md.append("        B --> D[Frontend Linter & Expo Build]")
    md.append("        B --> E[Baseline Load Testing]")
    md.append("        B --> F[Docker Build Verification]")
    md.append("    end")
    md.append("    subgraph Sequential JS E2E Workflow")
    md.append("        C --> G[Step 1: User Registration]")
    md.append("        D --> G")
    md.append("        G --> H[Step 2: Email OTP Verification]")
    md.append("        H --> I[Step 3: User Login]")
    md.append("        I --> J[Step 4: Character Creation]")
    md.append("        J --> K[Step 5: Dashboard Verification]")
    md.append("    end")
    md.append("    C --> L[Publish Unified Summary]")
    md.append("    D --> L")
    md.append("    E --> L")
    md.append("    F --> L")
    md.append("    K --> L")
    md.append("    L --> M[Parse XML/JSON Results]")
    md.append("    L --> N[Build Excel Report Artifact]")
    md.append("    L --> O[Publish Step Summary Dashboard]")
    md.append("```")

    # Add link to Excel Artifacts
    repo = os.getenv("GITHUB_REPOSITORY", "")
    run_id = os.getenv("GITHUB_RUN_ID", "")
    if repo and run_id:
        md.append("\n## 📥 Test Artifacts & Downloads\n")
        md.append(f"- **[Download Excel Test Automation Report](https://github.com/{repo}/actions/runs/{run_id}#artifacts)**: Access the complete Excel sheet containing E2E test cases and pipeline architecture details.\n")

    # Write to step summary if env exists, else output to file
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "w", encoding="utf-8") as f:
            f.write("\n".join(md))
        print("Successfully wrote to GITHUB_STEP_SUMMARY")
    else:
        with open("unified_test_dashboard.md", "w", encoding="utf-8") as f:
            f.write("\n".join(md))
        print("Wrote to local unified_test_dashboard.md")

if __name__ == "__main__":
    main()
