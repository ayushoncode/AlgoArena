import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements for IntelReportDetail.jsx
    if "IntelReportDetail" in filepath:
        # Wrap the author info in a Link/button
        content = re.sub(
            r'(<div className="flex items-center gap-3">.*?<UserAvatar[^>]*/>\s*<div>.*?</div>\s*</div>)',
            r'<button onClick={() => navigate(`/profile/${report.author.username}`)} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">\n              <UserAvatar\n                username={report.author.username}\n                seed={report.author.avatar_seed}\n                style={report.author.avatar_style}\n                elo={report.author.elo_rating}\n                size={34}\n              />\n              <div>\n                <p className="font-mono text-xs font-bold text-[color:var(--c-text)]">\n                  {report.author.username}\n                </p>\n                {report.author.elo_rating && (\n                  <RankBadge elo={report.author.elo_rating} size="xs" />\n                )}\n              </div>\n            </button>',
            content,
            flags=re.DOTALL
        )
        content = re.sub(r'text-amber-400', 'text-[color:var(--c-gold)]', content)
        content = re.sub(r'text-amber-300', 'text-[color:var(--c-gold)]', content)
        content = re.sub(r'text-cyan-400', 'text-[color:var(--c-blue)]', content)
        content = re.sub(r'border-cyan-500', 'border-[color:var(--c-blue)]', content)
        content = re.sub(r'bg-slate-950', 'bg-[color:var(--c-panel2)]', content)

    # Replacements for Profile.jsx
    if "Profile" in filepath:
        content = re.sub(r'text-slate-200', 'text-[color:var(--c-text)]', content)
        content = re.sub(r'text-slate-500', 'text-[color:var(--c-text-mute)]', content)
        content = re.sub(r"text-\[\#F5B942\]", "text-[color:var(--c-gold)]", content)
        content = re.sub(r"bg-\[\#F5B942\]/10", "bg-[color:var(--c-gold)]/10", content)
        content = re.sub(r"border-\[\#F5B942\]/30", "border-[color:var(--c-gold)]/30", content)

    # Replacements for IntelReports.jsx
    if "IntelReports" in filepath:
        content = re.sub(r'text-amber-400', 'text-[color:var(--c-gold)]', content)
        content = re.sub(r'bg-slate-950', 'bg-[color:var(--c-panel)]', content)

    with open(filepath, 'w') as f:
        f.write(content)

for file in glob.glob('frontend/src/pages/*.jsx'):
    process_file(file)

print("Done")
