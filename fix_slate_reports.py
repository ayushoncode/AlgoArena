import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements
    content = re.sub(r'bg-slate-950/?\d*', 'bg-[color:var(--c-panel2)]', content)
    content = re.sub(r'border-slate-800/?\d*', 'border-[color:var(--c-border)]', content)
    content = re.sub(r'text-slate-200', 'text-[color:var(--c-text)]', content)
    content = re.sub(r'text-slate-400', 'text-[color:var(--c-text-dim)]', content)
    content = re.sub(r'text-slate-500', 'text-[color:var(--c-text-mute)]', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

for file in glob.glob('frontend/src/pages/IntelReport*.jsx'):
    process_file(file)

print("Done")
