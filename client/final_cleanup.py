import re
import os

def clean_hr_management():
    with open('hr_management.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove manualSeed function
    content = re.sub(r'\s*function manualSeed\(\)\s*\{[^}]*socket\.emit\(\'seed_staff_data\'[^}]*\}[^}]*\}[^}]*\}', '', content, flags=re.DOTALL)
    
    # Remove manualSeed button
    content = re.sub(r'\s*<button[^>]*onclick="manualSeed\(\)"[^>]*>.*?<\/button>', '', content, flags=re.DOTALL)

    with open('hr_management.html', 'w', encoding='utf-8') as f:
        f.write(content)


def clean_hr_kiosk():
    with open('hr_kiosk.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove old socket event
    content = re.sub(r'\s*// Listen to old update_staff_list.*?\s*socket\.on\(\'update_staff_list\', \(staffList\) => \{[^}]*\}\);', '', content, flags=re.DOTALL)

    with open('hr_kiosk.html', 'w', encoding='utf-8') as f:
        f.write(content)

def clean_empty_divs(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find totally empty divs without any attributes: <div></div> or <div> </div>
    # Actually user might mean <div class="whatever"></div> that is totally unused.
    # But since we saw they are used as placeholders for dynamic data, we must ONLY remove <div></div> or <div>\s*</div> with NO classes or ids.
    content = re.sub(r'<div>\s*</div>', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

clean_hr_management()
clean_hr_kiosk()

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        clean_empty_divs(filename)

print("Done")
