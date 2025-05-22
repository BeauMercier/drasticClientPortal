import json

# Load the ESLint report data
try:
    with open('eslint-report.json', 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: eslint-report.json not found. Please make sure the file is in the same directory.")
    exit()
except json.JSONDecodeError:
    print("Error: Could not decode JSON. The eslint-report.json file might be corrupted.")
    exit()

rule_counts = {}
for item in data:
    for message in item.get("messages", []):
        rule_id = message.get("ruleId")
        if rule_id:
            rule_counts[rule_id] = rule_counts.get(rule_id, 0) + 1

print("Rule Counts (sorted by frequency):")
for rule_id, count in sorted(rule_counts.items(), key=lambda item: item[1], reverse=True):
    print(f"- {rule_id}: {count}")

total_warnings = sum(item.get("warningCount", 0) for item in data)
total_errors = sum(item.get("errorCount", 0) for item in data) # Should be 0 based on last summary
print(f"\nTotal Warnings: {total_warnings}")
print(f"Total Errors: {total_errors}")

# Print counts for no-unsafe-* rules specifically
print("\nCounts for '@typescript-eslint/no-unsafe-*' rules:")
for rule_id, count in rule_counts.items():
    if rule_id and rule_id.startswith('@typescript-eslint/no-unsafe-'):
        print(f"- {rule_id}: {count}")
