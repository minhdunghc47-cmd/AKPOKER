import os
import re

files = [f for f in os.listdir('.') if f.endswith('.html')]
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # test functions
    if 'test' in content.lower():
        print(f"{f}: 'test' string found")
    if 'dummy' in content.lower():
        print(f"{f}: 'dummy' string found")
    if 'mock' in content.lower():
        print(f"{f}: 'mock' string found")
    
