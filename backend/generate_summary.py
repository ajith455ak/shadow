import os
import json
import xml.etree.ElementTree as ET
import sys

def parse_junit(xml_path):
    if not os.path.exists(xml_path):
        return []
    
    test_cases = []
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        # In pytest, root can be <testsuites> or <testsuite>
        suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
        
        for suite in suites:
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
                test_cases.append({
                    "category": category,
                    "name": name,
                    "status": status,
                    "error": error_details
                })
    except Exception as e:
        print(f"Error parsing {xml_path}: {e}")
        
    return test_cases

def parse_playwright(json_path):
    if not os.path.exists(json_path):
        return []
    
    try:
        with open(json_path, "r") as f:
            data = json.load(f)
            return [
                {
                    "category": tc.get("category", "Frontend"),
                    "name": tc.get("name", ""),
                    "status": tc.get("status", "PENDING"),
                    "error": tc.get("error", "None")
                }
                for tc in data
            ]
    except Exception as e:
        print(f"Error parsing {json_path}: {e}")
    return []

def main():
    # Paths to the reports
    backend_xml = "backend_report.xml"
    selenium_xml = "selenium_report.xml"
    playwright_json = "playwright_report.json"
    
    # Parse results
    backend_cases = parse_junit(backend_xml)
    selenium_cases = parse_junit(selenium_xml)
    playwright_cases = parse_playwright(playwright_json)
    
    # Overall calculations
    def get_summary(cases):
        total = len(cases)
        passed = sum(1 for c in cases if c["status"] == "PASSED")
        failed = sum(1 for c in cases if c["status"] == "FAILED")
        skipped = sum(1 for c in cases if c["status"] in ("SKIPPED", "PENDING"))
        rate = f"{int(passed/total*100)}%" if total > 0 else "N/A"
        return total, passed, failed, skipped, rate
    
    b_tot, b_pass, b_fail, b_skip, b_rate = get_summary(backend_cases)
    s_tot, s_pass, s_fail, s_skip, s_rate = get_summary(selenium_cases)
    p_tot, p_pass, p_fail, p_skip, p_rate = get_summary(playwright_cases)
    
    # Generate Markdown Dashboard
    md = []
    md.append("# 🧪 Shadow Nexus Unified Test Verification Dashboard\n")
    md.append("This dashboard presents a unified summary of E2E tests and backend unit tests across all major components: Website E2E, Mobile/Selenium E2E, and Backend API.\n")
    
    md.append("## 📊 Unified Summary Overview\n")
    md.append("| Component | Test Suite / Report | Total Tests | Passed / Fixed | Failed / Open | Pass/Fix Rate | Status |")
    md.append("| --- | --- | --- | --- | --- | --- | --- |")
    
    # Playwright row
    p_status = "✅ PASS" if p_fail == 0 and p_tot > 0 else ("❌ FAIL" if p_fail > 0 else "➖ N/A")
    md.append(f"| Website E2E (Playwright) | [Playwright Web E2E Suite](#playwright-details) | {p_tot} | {p_pass} | {p_fail} | {p_rate} | {p_status} |")
    
    # Selenium row
    s_status = "✅ PASS" if s_fail == 0 and s_tot > 0 else ("❌ FAIL" if s_fail > 0 else "➖ N/A")
    md.append(f"| E2E (Selenium) | [Python Selenium E2E Suite](#selenium-details) | {s_tot} | {s_pass} | {s_fail} | {s_rate} | {s_status} |")
    
    # Backend row
    b_status = "✅ PASS" if b_fail == 0 and b_tot > 0 else ("❌ FAIL" if b_fail > 0 else "➖ N/A")
    md.append(f"| Backend Security & API | [Pytest Backend Suite](#backend-details) | {b_tot} | {b_pass} | {b_fail} | {b_rate} | {b_status} |")
    md.append("\n")
    
    # Collapsible details helper
    def render_details_table(cases, title, anchor):
        lines = []
        lines.append(f"### <a name='{anchor}'></a>🌐 {title}\n")
        lines.append(f"<details><summary>Click to view {title} Cases ({len(cases)} tests)</summary>\n")
        lines.append("| No. | Category | Test Name | Status | Error Details |")
        lines.append("| --- | --- | --- | --- | --- |")
        
        for idx, tc in enumerate(cases, 1):
            status_icon = "✅ PASSED" if tc["status"] == "PASSED" else ("❌ FAILED" if tc["status"] == "FAILED" else "⚠️ SKIPPED")
            error_details = tc["error"].replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {idx} | {tc['category']} | `{tc['name']}` | {status_icon} | {error_details} |")
            
        lines.append("\n</details>\n")
        return "\n".join(lines)
        
    if playwright_cases:
        md.append(render_details_table(playwright_cases, "Playwright E2E Test Verification Details", "playwright-details"))
    if selenium_cases:
        md.append(render_details_table(selenium_cases, "Selenium E2E Test Verification Details", "selenium-details"))
    if backend_cases:
        md.append(render_details_table(backend_cases, "Pytest Backend Test Verification Details", "backend-details"))
        
    # Add link to Excel Artifacts
    repo = os.getenv("GITHUB_REPOSITORY", "")
    run_id = os.getenv("GITHUB_RUN_ID", "")
    if repo and run_id:
        md.append("\n## 📥 Test Artifacts & Downloads\n")
        md.append(f"- **[Download Excel Test Automation Report](https://github.com/{repo}/actions/runs/{run_id}#artifacts)**: Access the complete Excel sheet containing E2E test cases and pipeline architecture details.\n")

    # Write to step summary if env exists, else output to file
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "w") as f:
            f.write("\n".join(md))
        print("Successfully wrote to GITHUB_STEP_SUMMARY")
    else:
        with open("unified_test_dashboard.md", "w") as f:
            f.write("\n".join(md))
        print("Wrote to local unified_test_dashboard.md")

if __name__ == "__main__":
    main()
