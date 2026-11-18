"""Generate checked-in, bilingual static detail pages; no runtime build required."""
import json
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
projects=json.loads((ROOT/'data/projects.json').read_text())
entries=json.loads((ROOT/'data/journal.json').read_text())
def b(value,tag='span'):
 if isinstance(value,str):return escape(value)
 return f'<{tag} data-en="{escape(value["en"],quote=True)}" data-zh="{escape(value["zh"],quote=True)}">{escape(value["en"])}</{tag}>'
def pair(en,zh,tag='span'):return b(dict(en=en,zh=zh),tag)
def shell(title,body):
 return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)} · Cheong Zhi Teng</title><meta name="description" content="{escape(title)} — project notes from Cheong Zhi Teng."><link rel="icon" href="../../pictures/favicon.svg"><link rel="stylesheet" href="../../style.css"><link rel="stylesheet" href="../../enhancements.css"><script src="../../i18n.js" defer></script><script src="../../experience.js" defer></script></head><body class="detail-page"><a class="skip-link" href="#main">Skip to content</a><header class="detail-header"><a class="detail-brand" href="../../index.html">‹ {pair('Back to workspace','返回工作空间')}</a><div class="page-controls"><button class="button secondary locale-toggle" type="button" aria-label="Switch language">中文</button><button class="button secondary motion-toggle" type="button">Animations on</button></div></header><main id="main" class="detail-main">{body}</main><footer class="detail-footer">© Cheong Zhi Teng · <a href="mailto:mr.cheongzhiteng@gmail.com">{pair('Get in touch','联系我')}</a></footer><div id="toast" role="status" class="toast" hidden></div></body></html>'''
status={'development':dict(en='In development',zh='开发中'),'released':dict(en='Public release',zh='已发布')}
for p in projects:
 path=ROOT/'projects'/p['slug'];path.mkdir(parents=True,exist_ok=True)
 features=''.join(b(x,'li') for x in p['features'])
 notes=''.join(b(x,'p') for x in p['notes'])
 stack=''.join(f'<span class="tech-tag">{escape(x)}</span>' for x in p['stack'])
 demo=(f'<button class="button primary launch-preview" data-demo="{escape(p["demo"])}">{pair("Load interactive preview","加载交互预览")}</button><a class="button secondary" href="{escape(p["demo"])}" target="_blank" rel="noopener">{pair("Open in new tab","在新标签页打开")}</a><p class="preview-note">{pair("The preview loads only when requested. If the host blocks embedding or playback, use Open in new tab.","仅在点击后加载预览。如果网站限制嵌入或播放，请在新标签页打开。")}</p><div class="iframe-mount" aria-live="polite"></div>') if p['demo'] else pair('Screenshot walkthrough: use the image below to explore the interface. A public interactive demo is not linked for this project.','截图导览：通过下方图片了解界面。此项目暂未提供公开交互演示链接。','p')
 body=f'''<section class="detail-hero"><div class="section-kicker">{pair('PROJECT NOTES','项目笔记')}</div><span class="status-badge">{b(status[p['status']])}</span><h1>{escape(p['title'])}</h1>{b(p['summary'],'p')}<div class="detail-actions"><a class="button primary" href="#preview">{pair('Explore preview','探索预览')}</a><a class="button secondary" href="{p['source']}" target="_blank" rel="noopener">{pair('View source','查看源码')} ↗</a></div></section><section id="preview" class="detail-section reveal"><h2>{pair('A closer look','近距离了解')}</h2><div class="demo-controls">{demo}</div><figure><a href="../../pictures/projects/{p['image']}" target="_blank" rel="noopener" aria-label="View full screenshot"><img class="project-screenshot" src="../../pictures/projects/{p['image']}" alt="{escape(p['title'])} interface preview" width="1200" height="820" loading="lazy"></a>{b(p['caption'],'figcaption')}</figure></section><div class="detail-columns"><section class="detail-section reveal"><h2>{pair('What it does','主要功能')}</h2><ul class="feature-list">{features}</ul></section><section class="detail-section reveal"><h2>{pair('Built with','技术栈')}</h2><div class="tech-tags">{stack}</div><h3>{pair('Project status','项目状态')}</h3>{b(p['scope'],'p')}</section></div><section class="detail-section reveal"><div class="section-kicker">{pair('LESSONS FROM THE IMPLEMENTATION','实现中的经验')}</div><h2>{pair('Engineering notes','工程笔记')}</h2>{notes}<p class="source-note">{pair('Notes are based on the project source and documentation.','笔记基于项目源码与文档。')} <a href="{p['source']}" target="_blank" rel="noopener">{pair('Read the source','阅读源码')} ↗</a></p></section><a class="text-link" href="../../index.html#projects">← {pair('Explore more projects','探索更多项目')}</a>'''
 (path/'index.html').write_text(shell(p['title'],body).replace("↗",'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>'))
for e in entries:
 path=ROOT/'journal'/e['slug'];path.mkdir(parents=True,exist_ok=True)
 body=f'<article class="journal-article"><div class="section-kicker">{b(e["tag"])} · <time datetime="{e["date"]}">{e["date"]}</time></div>{b(e["title"],"h1")}<div class="journal-body">'+''.join(b(x,'p') for x in e['body'])+'</div><a class="text-link" href="../../index.html#journal">← '+pair('Back to journal','返回开发日志')+'</a></article>'
 (path/'index.html').write_text(shell(e['title']['en'],body))
(ROOT/'content.js').write_text('window.PORTFOLIO = '+json.dumps({'projects':projects,'journal':entries},ensure_ascii=False)+';\n')
