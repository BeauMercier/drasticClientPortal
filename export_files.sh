#!/bin/zsh

# Define the output file
OUTPUT_FILE="debug_export.txt"

# Clear the output file if it exists
> $OUTPUT_FILE

# List of files to export
FILES=(
  "src/app/client/new-dashboard/NewClientPage.tsx"
  "src/app/client/new-dashboard/page.tsx"
  "src/components/DashboardCard.tsx"
)

# Loop through the files and append their content to the output file
for FILE in "${FILES[@]}"
do
  echo "\n\n================================================================================\nFile: $FILE\n================================================================================\n\n" >> $OUTPUT_FILE
  cat "$FILE" >> $OUTPUT_FILE
done

echo "✅ Export complete. All files have been saved to $OUTPUT_FILE"
