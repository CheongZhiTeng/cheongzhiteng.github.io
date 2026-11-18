"""Validate local assets, page links and fragments without needing a network."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(); self.refs=[];self.ids=set();self.feed(text)
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.add(attrs['id'])
  for attr in ('href','src'):
   if attrs.get(attr):self.refs.append(attrs[attr])
  if attrs.get('srcset'):
   self.refs.extend(x.strip().split()[0] for x in attrs['srcset'].split(','))
pages={p:Page(p.read_text()) for p in [ROOT/'index.html',*ROOT.glob('projects/*/index.html'),*ROOT.glob('journal/*/index.html')]}
errors=[]
for file,page in pages.items():
 for ref in page.refs:
  url=urlsplit(ref)
  if url.scheme or url.netloc:continue
  target=(file.parent/unquote(url.path)).resolve() if url.path else file
  if target.is_dir():target=target/'index.html'
  if not target.is_file():errors.append(f'{file.relative_to(ROOT)}: missing {ref}')
  elif url.fragment and target in pages and url.fragment not in pages[target].ids and url.fragment!='saved':errors.append(f'{file.relative_to(ROOT)}: missing fragment {ref}')
assert not errors,'\n'.join(errors)
print(f'PASS: local links, fragments, and image variants on {len(pages)} pages')
