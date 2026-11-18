import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('SITE_URL','http://127.0.0.1:3000')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 context=browser.new_context(permissions=['clipboard-read','clipboard-write'],viewport={'width':1440,'height':1000})
 page=context.new_page()
 errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 context.route('https://api.github.com/**',lambda r:r.fulfill(status=503,body='unavailable'))
 page.goto(BASE);page.wait_for_selector('#dataNotice:not([hidden])')
 page.locator('.locale-toggle').click()
 expect(page.locator('html')).to_have_attribute('lang','zh-Hans')
 expect(page.locator('#projectsTitleText')).to_have_text('探索我的项目')
 page.reload();expect(page.locator('html')).to_have_attribute('lang','zh-Hans')
 page.locator('#searchInput').fill('日语');expect(page.locator('.repo-card')).to_have_count(1)
 page.locator('.locale-toggle').click();page.locator('#searchInput').fill('')
 page.locator('[data-language="TypeScript"]').click();page.locator('#statusFilter').select_option('development')
 page.locator('#sortSelect').select_option('name');page.locator('#listView').click()
 url=page.url;assert 'tech=TypeScript' in url and 'status=development' in url and 'view=list' in url
 page.reload();expect(page.locator('.repo-card')).to_have_count(1);expect(page.locator('#statusFilter')).to_have_value('development')
 page.locator('#shareFilters').click();assert 'tech=TypeScript' in page.evaluate('navigator.clipboard.readText()')
 page.locator('#copyEmail').click();assert page.evaluate('navigator.clipboard.readText()')=='mr.cheongzhiteng@gmail.com'
 assert page.locator('a[href^="tel:"]').count()==0
 page.locator('.motion-toggle').click();expect(page.locator('html')).to_have_attribute('data-motion','off')
 page.reload();expect(page.locator('html')).to_have_attribute('data-motion','off')
 page.goto(BASE+'/projects/workspace/');expect(page.locator('h1')).to_have_text('My workspace')
 assert page.locator('iframe').count()==0
 page.locator('.launch-preview').click();expect(page.locator('iframe')).to_have_count(1)
 page.frame_locator('iframe').locator('#searchInput').fill('music')
 expect(page.frame_locator('iframe').locator('.repo-card')).to_have_count(1)
 page.locator('.launch-preview').click();expect(page.locator('iframe')).to_have_count(0)
 page.locator('.locale-toggle').click();expect(page.locator('html')).to_have_attribute('lang','zh-Hans')
 expect(page.locator('h2').first).to_have_text('近距离了解')
 # Axe and responsive layout checks, both locales, plus every content route.
 axe=(ROOT/'node_modules/axe-core/axe.min.js').read_text()
 routes=['/','/projects/nanatsukaze/','/projects/microhub/','/projects/soriva/','/projects/workspace/','/journal/resilient-project-browser/','/journal/modern-campus-on-the-web/']
 for route in routes:
  page.goto(BASE+route+'?ui=en');page.wait_for_timeout(150)
  page.add_script_tag(content=axe)
  result=page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations')
  assert not result,json.dumps({'route':route,'violations':[{ 'id':v['id'],'nodes':[n['target'] for n in v['nodes']]} for v in result]},indent=2)
  for locale in ['en','zh']:
   if locale=='zh':
    page.locator('.locale-toggle').click()
    result=page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations')
    assert not result, (route,locale,[(v['id'],[n['target'] for n in v['nodes']]) for v in result])
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(route,locale,width)
  if route=='/projects/microhub/':page.screenshot(path=str(ROOT/'docs/screenshots/project-detail.png'),full_page=True)
 page.goto(BASE+'/?ui=en');page.locator('#themeToggle').click()
 page.add_script_tag(content=axe)
 result=page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations')
 assert not result, [(v['id'],[n['target'] for n in v['nodes']]) for v in result]
 page.emulate_media(reduced_motion='reduce');page.goto(BASE+'/?ui=en')
 expect(page.locator('html')).to_have_attribute('data-motion','off')
 page.keyboard.press('Tab');expect(page.locator('.skip-link')).to_be_focused()
 assert not errors,errors
 browser.close()
print('PASS: bilingual persistence, translated search, shareable state, clipboard, contact privacy, preview lifecycle, animation controls, keyboard skip link, all content routes, responsive layouts, and axe WCAG checks')
