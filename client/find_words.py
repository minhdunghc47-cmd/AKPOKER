import os
import re

files = [f for f in os.listdir('.') if f.endswith('.html')]
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    for word in ['test', 'dummy', 'mock', 'rác', 'rac']:
        idx = content.lower().find(word)
        if idx != -1:
            # print context around word
            start = max(0, idx - 50)
            end = min(len(content), idx + 50)
            print(f"{f} contains '{word}': ...{content[start:end]}...")
