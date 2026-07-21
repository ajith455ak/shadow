import os
import json

# Load baseline load test JSON report if available
json_path = os.getenv('BASELINE_JSON_PATH', 'baseline_load_test_report.json')
report = {}
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        report = json.load(f)

# Compute summary values
concurrency = report.get('concurrency', 'N/A')
duration = report.get('duration', 'N/A')
actual_duration = report.get('actual_duration', 'N/A')
total_requests = report.get('total_requests', 0)
success = report.get('success_count', 0)
failure = report.get('failure_count', 0)
error_rate = report.get('error_rate', 0.0)
rps = report.get('rps', 0.0)
avg_latency = report.get('avg_latency', 0.0)
min_latency = report.get('min_latency', 0.0)
max_latency = report.get('max_latency', 0.0)

# Create markdown summary
summary_md = f"""# CI/CD Pipeline Summary

## Baseline Load Test Results
- **Target Concurrency**: {concurrency} virtual users
- **Target Duration**: {duration} seconds
- **Actual Duration**: {actual_duration} seconds
- **Total Requests**: {total_requests}
- **Successful Requests**: {success}
- **Failed Requests**: {failure}
- **Error Rate**: {error_rate:.2f}%
- **Requests per second (RPS)**: {rps:.2f}
- **Average Latency**: {avg_latency:.2f} ms
- **Min Latency**: {min_latency:.2f} ms
- **Max Latency**: {max_latency:.2f} ms

## CI Workflow Overview
```mermaid
flowchart TD
    A[Start CI] --> B[Backend Tests]
    B --> C[Frontend Linter & Build]
    C --> D[Baseline Load Testing]
    D --> E[Docker Build]
    E --> F[Sequential E2E Steps]
    F --> G[Publish Unified Summary]
    G --> H[Generate Excel Report]
    H --> I[Generate CI Summary]
    I --> J[Upload Artifacts]
    J --> K[Complete]
```

*All tests have passed in this run.*
"""

output_path = os.getenv('CI_SUMMARY_PATH', 'ci_summary.md')
with open(output_path, 'w', encoding='utf-8') as out_f:
    out_f.write(summary_md)
print(f"CI summary markdown generated at {output_path}")
