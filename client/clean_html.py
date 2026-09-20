import os
import re
from bs4 import BeautifulSoup

def clean_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove generic test functions using regex
    content = re.sub(r'function\s+test[a-zA-Z0-9_]*\s*\([^)]*\)\s*\{[^}]*\}', '', content, flags=re.IGNORECASE)
    content = re.sub(r'function\s+mock[a-zA-Z0-9_]*\s*\([^)]*\)\s*\{[^}]*\}', '', content, flags=re.IGNORECASE)
    
    # Remove dummy data arrays like const dummy = [...]
    content = re.sub(r'(const|let|var)\s+dummy[a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?\];', '', content, flags=re.IGNORECASE)
    content = re.sub(r'(const|let|var)\s+mock[a-zA-Z0-9_]*\s*=\s*\[[\s\S]*?\];', '', content, flags=re.IGNORECASE)

    # Use BeautifulSoup to remove empty meaningless divs
    soup = BeautifulSoup(content, 'html.parser')
    for div in soup.find_all('div'):
        # If div has no attributes and no text and no children
        if not div.attrs and not div.contents and not div.get_text(strip=True):
            div.decompose()
            
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(str(soup))

files = [f for f in os.listdir('.') if f.endswith('.html')]
for f in files:
    clean_file(f)
