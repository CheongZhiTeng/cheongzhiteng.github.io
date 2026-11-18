import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1]
(root/'docs/screenshots').mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://api.github.com/**',lambda route:route.fulfill(status=503,body='unavailable'))
 page.goto('http://127.0.0.1:3000')
 page.wait_for_selector('#dataNotice:not([hidden])')
 assert page.locator('.repo-card').count()==4
 page.screenshot(path=str(root/'docs/screenshots/desktop.png'),full_page=True)
 page.locator('[data-save]').first.click()
 page.locator('[data-nav="saved"]').click()
 expect(page.locator('.repo-card')).to_have_count(1)
 page.reload();page.wait_for_selector('.repo-card')
 expect(page.locator('.repo-card')).to_have_count(1)
 page.locator('[data-nav="projects"]').click()
 page.locator('#searchInput').fill('music')
 expect(page.locator('.repo-card')).to_have_count(1)
 page.locator('#searchInput').fill('nothingmatches')
 assert page.locator('.empty-state').count()==1
 page.locator('#clearFilters').click()
 page.locator('[data-language="TypeScript"]').click()
 expect(page.locator('.repo-card')).to_have_count(1)
 page.locator('[data-language="all"]').click()
 page.locator('#listView').click()
 assert page.locator('.list-view').count()==1
 page.locator('#sortSelect').select_option('name')
 names=page.locator('.repo-name').all_text_contents()
 assert names==sorted(names,key=str.lower)
 page.locator('#gridView').click()
 page.locator('#themeToggle').click()
 assert page.locator('html').get_attribute('data-theme')=='dark'
 page.screenshot(path=str(root/'docs/screenshots/dark.png'),full_page=True)
 page.locator('#themeToggle').click()
 for width in [320,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':900})
  page.evaluate('window.scrollTo(0,0)')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
  if width==390:page.screenshot(path=str(root/'docs/screenshots/mobile.png'),full_page=True)
 assert not errors,errors
 print('PASS: fallback, search, language filter, sort, saved persistence, grid/list, theme, and five responsive widths; no runtime errors')
 # Verify live data path, escaping, and cache fallback using synthetic responses.
 ctx=b.new_context()
 live=ctx.new_page()
 fixture=[{'name':'test-project','html_url':'https://github.com/cheongzhiteng/test-project','description':'<img src=x onerror=alert(1)>','language':'Python','topics':['test'],'updated_at':'2026-11-01T00:00:00Z','stargazers_count':5,'forks_count':1,'homepage':'javascript:alert(1)'}]
 live.route('https://api.github.com/**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(fixture)))
 live.goto('http://127.0.0.1:3000');live.wait_for_function('document.querySelector("#starCount").textContent === "5"')
 assert live.locator('.repo-desc img').count()==0
 assert live.locator('.repo-links a').get_attribute('href').startswith('https://github.com/')
 live.unroute('https://api.github.com/**');live.route('https://api.github.com/**',lambda route:route.abort())
 live.reload();live.wait_for_selector('#dataNotice:not([hidden])')
 assert live.locator('.repo-name').inner_text()=='test-project'
 print('PASS: successful API response, safe rendering, blocked script URL, cached-data recovery')
 b.close()
