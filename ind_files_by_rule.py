import json
from collections import defaultdict

# --- Configuration ---
# You can change this to target a different rule later
TARGET_RULE_ID = "@typescript-eslint/no-unsafe-assignment"
# --- End Configuration ---

try:
    with open('eslint-report.json', 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    print(f"Error: eslint-report.json not found. Please make sure the file is in the current directory.")
    exit()
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from eslint-report.json. The file might be corrupted.")
    exit()

file_rule_counts = defaultdict(int)
found_rule_in_files = False

for item in data:
    filePath = item.get("filePath")
    if not filePath:
        continue
    
    for message in item.get("messages", []):
        rule_id = message.get("ruleId")
        if rule_id == TARGET_RULE_ID:
            file_rule_counts[filePath] += 1
            found_rule_in_files = True

if not found_rule_in_files:
    print(f"No instances of the rule '{TARGET_RULE_ID}' found in the report.")
else:
    print(f"\nFiles with '{TARGET_RULE_ID}' warnings (sorted by frequency, then by path):")
    # Sort by count (descending), then by file path (ascending) for stable order
    sorted_files = sorted(file_rule_counts.items(), key=lambda item: (-item[1], item[0]))
    
    for file_path, count in sorted_files:
        if count > 0: # Ensure we only print files that actually have the warning
            # Make file paths relative to workspace for brevity if possible
            # This assumes the script is run from the workspace root.
            relative_path = file_path
            if "drasticClientPortal/" in file_path: # Heuristic based on your path
                 relative_path = file_path.split("drasticClientPortal/", 1)[-1]
            print(f"- {relative_path}: {count}")
