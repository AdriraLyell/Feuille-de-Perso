
import json

with open('eslint-fresh-analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for file in data:
    unused_vars = [m for m in file['messages'] if m.get('ruleId') == '@typescript-eslint/no-unused-vars']
    if unused_vars:
        print(f"File: {file['filePath']}")
        for m in unused_vars:
            print(f"  Line {m['line']}: {m['message']}")
