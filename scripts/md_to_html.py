import sys
import os
import re
import base64

def get_base64_image(image_path):
    if not os.path.exists(image_path):
        return ""
    mime_type = "image/jpeg" if image_path.endswith(('.jpg', '.jpeg')) else "image/png"
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime_type};base64,{data}"

def md_to_html(md_path, html_path):
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    logo_b64 = get_base64_image("docs/assets/udinus_logo.jpeg")
    
    diagram_mapping = {
        0: ("docs/assets/diagrams/architecture.png", "Gambar 1.5 - Arsitektur Terpadu Ekosistem KostKu"),
        1: ("docs/assets/diagrams/context_diagram.png", "Gambar 3.2.1 - Diagram Konteks Sistem KostKu"),
        2: ("docs/assets/diagrams/dfd_level1.png", "Gambar 3.2.2 - Data Flow Diagram (DFD) Level 1 KostKu"),
        3: ("docs/assets/diagrams/dfd_level2_kamar.png", "Gambar 3.2.2.1 - DFD Level 2 (Manajemen Kamar & Properti)"),
        4: ("docs/assets/diagrams/dfd_level2_transaksi.png", "Gambar 3.2.2.2 - DFD Level 2 (Transaksi Sewa & Mitra Afiliasi)"),
        5: ("docs/assets/diagrams/erd.png", "Gambar 3.3.1 - Entity Relationship Diagram (ERD) Basis Data KostKu"),
        6: ("docs/assets/diagrams/traceability_flow.png", "Gambar 3.6 - Diagram Alur Kerunutan Kebutuhan Sistem")
    }

    # Replace logo url/path with base64
    content = re.sub(r'!\[Logo UDINUS\]\([^\)]+\)', f'<img src="{logo_b64}" alt="Logo UDINUS" class="logo-udinus" />', content)

    # Process mermaid blocks and replace with rendered base64 images
    mermaid_blocks = re.findall(r'```mermaid\s*\n([\s\S]*?)\n```', content)
    for idx, code in enumerate(mermaid_blocks):
        if idx in diagram_mapping:
            img_file, caption = diagram_mapping[idx]
            img_b64 = get_base64_image(img_file)
            replacement = f'''
<figure class="diagram-figure">
  <div class="diagram-img-container">
    <img src="{img_b64}" alt="{caption}" class="diagram-img" />
  </div>
  <figcaption class="diagram-caption">{caption}</figcaption>
</figure>
'''
            # Replace only the first occurrence of this block
            pattern = re.escape('```mermaid\n' + code + '\n```')
            content = re.sub(pattern, replacement, content, count=1)

    # Convert Markdown to HTML
    lines = content.split('\n')
    html_lines = []
    
    in_table = False
    table_rows = []
    is_toc = False

    for line in lines:
        stripped = line.strip()

        # Handle Tables
        if stripped.startswith('|') and '|' in stripped[1:]:
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(stripped)
            continue
        elif in_table:
            # End of table, process table_rows
            parsed = []
            for tr in table_rows:
                cells = [c.strip() for c in tr.strip('|').split('|')]
                if all(re.match(r'^:?-+:?$', c) for c in cells if c):
                    continue
                parsed.append(cells)
            
            if parsed:
                html_lines.append('<div class="table-container">')
                html_lines.append('<table class="skpl-table">')
                
                # Check if it's the cover table
                is_cover = any('logo-udinus' in c for r in parsed for c in r)
                
                for r_idx, row in enumerate(parsed):
                    is_head = (r_idx == 0) and not is_cover
                    tag = 'th' if is_head else 'td'
                    html_lines.append('  <tr>')
                    for cell in row:
                        cell_content = cell
                        
                        # Add badge tags for status
                        if 'Ditambahkan' in cell_content or 'Added' in cell_content:
                            cell_content = re.sub(r'\b(Ditambahkan|Added)\b', r'<span class="badge badge-added">\1</span>', cell_content)
                        if 'Diubah' in cell_content or 'Modified' in cell_content:
                            cell_content = re.sub(r'\b(Diubah|Modified)\b', r'<span class="badge badge-modified">\1</span>', cell_content)
                        if 'Dihapus' in cell_content or 'Dieliminasi' in cell_content:
                            cell_content = re.sub(r'\b(Dihapus|Dieliminasi)\b', r'<span class="badge badge-removed">\1</span>', cell_content)
                        
                        # Bold and code formatting
                        cell_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', cell_content)
                        cell_content = re.sub(r'`(.*?)`', r'<code>\1</code>', cell_content)

                        html_lines.append(f'    <{tag}>{cell_content}</{tag}>')
                    html_lines.append('  </tr>')
                html_lines.append('</table>')
                html_lines.append('</div>')
            in_table = False
            table_rows = []

        if not stripped:
            continue

        # Horizontal rule
        if re.match(r'^[-*_]{3,}$', stripped):
            html_lines.append('<hr class="divider" />')
            continue

        # Headings
        if stripped.startswith('# '):
            title = stripped[2:].replace('**', '')
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
            html_lines.append(f'<h1 id="{slug}" class="heading-1">{title}</h1>')
            continue
        elif stripped.startswith('## '):
            title = stripped[3:].replace('**', '')
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
            html_lines.append(f'<h2 id="{slug}" class="heading-2">{title}</h2>')
            continue
        elif stripped.startswith('### '):
            title = stripped[4:].replace('**', '')
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
            html_lines.append(f'<h3 id="{slug}" class="heading-3">{title}</h3>')
            continue
        elif stripped.startswith('#### '):
            title = stripped[5:].replace('**', '')
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
            html_lines.append(f'<h4 id="{slug}" class="heading-4">{title}</h4>')
            continue

        # Bullet lists
        if stripped.startswith('* ') or stripped.startswith('- '):
            text = stripped[2:]
            text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
            text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
            html_lines.append(f'<li class="bullet-item">{text}</li>')
            continue

        # Numbered lists
        m_num = re.match(r'^(\d+)\.\s+(.*)$', stripped)
        if m_num:
            num = m_num.group(1)
            text = m_num.group(2)
            text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
            text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
            html_lines.append(f'<div class="numbered-item"><span class="item-num">{num}.</span> <span class="item-text">{text}</span></div>')
            continue

        # Paragraphs
        p_text = stripped
        p_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p_text)
        p_text = re.sub(r'`(.*?)`', r'<code>\1</code>', p_text)
        html_lines.append(f'<p class="para">{p_text}</p>')

    body_html = '\n'.join(html_lines)

    # Full HTML Template with Taste Skill styling
    full_html = f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SKPL KostKu - Program Studi S1 Teknik Informatika UDINUS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {{
      --primary: #1e3a8a;       /* Deep Navy */
      --primary-light: #3b82f6; /* Electric Blue */
      --accent: #0d9488;        /* Teal */
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #475569;
      --border: #e2e8f0;
      --border-focus: #3b82f6;
      --green-bg: #dcfce7;
      --green-text: #15803d;
      --amber-bg: #fef3c7;
      --amber-text: #b45309;
      --rose-bg: #fee2e2;
      --rose-text: #b91c1c;
      --indigo-bg: #e0e7ff;
      --indigo-text: #3730a3;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
    }}

    /* Top Navigation Bar */
    .top-nav {{
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }}

    .nav-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .nav-logo-badge {{
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #fff;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
    }}

    .nav-title {{
      font-weight: 700;
      font-size: 15px;
      color: var(--text);
    }}

    .nav-actions {{
      display: flex;
      gap: 10px;
    }}

    .btn {{
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }}

    .btn-primary {{
      background: #2563eb;
      color: #fff;
    }}

    .btn-primary:hover {{
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }}

    .btn-outline {{
      background: #fff;
      color: var(--text);
      border: 1px solid var(--border);
    }}

    .btn-outline:hover {{
      background: #f1f5f9;
    }}

    /* Main Container Layout */
    .layout {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }}

    .document-card {{
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 48px;
      box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
    }}

    /* Headings */
    .heading-1 {{
      font-size: 26px;
      font-weight: 800;
      color: var(--primary);
      margin-top: 40px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e7ff;
      letter-spacing: -0.5px;
    }}

    .heading-2 {{
      font-size: 20px;
      font-weight: 700;
      color: #1e40af;
      margin-top: 32px;
      margin-bottom: 12px;
      letter-spacing: -0.3px;
    }}

    .heading-3 {{
      font-size: 17px;
      font-weight: 700;
      color: #0f766e;
      margin-top: 24px;
      margin-bottom: 10px;
    }}

    .heading-4 {{
      font-size: 15px;
      font-weight: 700;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
    }}

    .para {{
      margin-bottom: 14px;
      color: #334155;
    }}

    /* Lists */
    .bullet-item {{
      margin-left: 24px;
      margin-bottom: 6px;
      color: #334155;
    }}

    .numbered-item {{
      margin-left: 8px;
      margin-bottom: 8px;
      display: flex;
      gap: 8px;
    }}

    .item-num {{
      font-weight: 700;
      color: #2563eb;
      min-width: 24px;
    }}

    .item-text {{
      color: #334155;
    }}

    /* Divider */
    .divider {{
      border: none;
      height: 1px;
      background: #e2e8f0;
      margin: 36px 0;
    }}

    /* Tables */
    .table-container {{
      overflow-x: auto;
      margin: 20px 0 28px 0;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }}

    .skpl-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      background: #fff;
    }}

    .skpl-table th {{
      background: linear-gradient(135deg, #1e3a8a, #1e40af);
      color: #ffffff;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #1e3a8a;
    }}

    .skpl-table td {{
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }}

    .skpl-table tr:nth-child(even) td {{
      background-color: #f8fafc;
    }}

    .skpl-table tr:hover td {{
      background-color: #f1f5f9;
    }}

    /* Badges */
    .badge {{
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }}

    .badge-added {{
      background-color: var(--green-bg);
      color: var(--green-text);
      border: 1px solid #bbf7d0;
    }}

    .badge-modified {{
      background-color: var(--amber-bg);
      color: var(--amber-text);
      border: 1px solid #fde68a;
    }}

    .badge-removed {{
      background-color: var(--rose-bg);
      color: var(--rose-text);
      border: 1px solid #fecaca;
    }}

    /* Code & Pre */
    code {{
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12.5px;
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }}

    /* Diagrams */
    .diagram-figure {{
      margin: 28px 0 36px 0;
      text-align: center;
    }}

    .diagram-img-container {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      display: inline-block;
      box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
      max-width: 100%;
      overflow-x: auto;
    }}

    .diagram-img {{
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }}

    .diagram-caption {{
      margin-top: 10px;
      font-size: 13px;
      font-style: italic;
      color: #2563eb;
      font-weight: 600;
    }}

    .logo-udinus {{
      max-width: 80px;
      height: auto;
      display: block;
      margin: 0 auto;
    }}

    /* Print Styles */
    @media print {{
      .top-nav {{
        display: none !important;
      }}
      body {{
        background: #fff !important;
      }}
      .layout {{
        padding: 0 !important;
        max-width: 100% !important;
      }}
      .document-card {{
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }}
      .heading-1 {{
        page-break-before: always;
      }}
    }}
  </style>
</head>
<body>

  <!-- Sticky Top Navigation -->
  <header class="top-nav">
    <div class="nav-brand">
      <span class="nav-logo-badge">KostKu RPL</span>
      <span class="nav-title">Spesifikasi Kebutuhan Perangkat Lunak (SKPL)</span>
    </div>
    <div class="nav-actions">
      <button class="btn btn-outline" onclick="window.scrollTo({{ top: 0, behavior: 'smooth' }})">↑ Ke Atas</button>
      <button class="btn btn-primary" onclick="window.print()">🖨 Cetak / Simpan PDF</button>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="layout">
    <article class="document-card">
      {body_html}
    </article>
  </main>

</body>
</html>
'''

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"Generated standalone colorful HTML viewer at: {html_path}")

if __name__ == '__main__':
    md = sys.argv[1] if len(sys.argv) > 1 else 'docs/SKPL_KostKu.md'
    out_html = sys.argv[2] if len(sys.argv) > 2 else '/home/rena/Desktop/SKPL_KostKu.html'
    md_to_html(md, out_html)
