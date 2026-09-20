import os
import re
files = [f for f in os.listdir('.') if f.endswith('.html')]
empty_div_pattern = re.compile(r'<div[^>]*>\s*</div>', re.IGNORECASE)
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    empty_divs = empty_div_pattern.findall(content)
    if empty_divs:
        print(f"--- {f} ---")
        for d in set(empty_divs):
            print(d)
