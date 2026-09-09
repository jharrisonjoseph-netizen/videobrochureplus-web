from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree
from collections import Counter
from PIL import Image
import json, re

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.videobrochureplus.com'
PUBLIC = [
 'index.html','video-brochure.html','video-mailers.html','video-box.html','video-greeting-card.html',
 'video-business-cards.html','video-folders.html','video-wedding-invitations.html',
 'video-brochure-sizes.html','video-brochure-cost.html','video-brochure-samples.html',
 'artwork-video-guide.html','manufacturing-process.html','about.html'
]

class Page(HTMLParser):
 def __init__(self):
  super().__init__(); self.ids=[]; self.links=[]; self.images=[]; self.canon=[]; self.schemas=[]; self.h1=0; self.title=''; self.in_title=False; self.descriptions=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if a.get('id'): self.ids.append(a['id'])
  if tag=='a' and a.get('href'): self.links.append(a['href'])
  if tag=='img': self.images.append(a)
  if tag=='link' and a.get('rel')=='canonical': self.canon.append(a.get('href'))
  if tag=='meta' and a.get('name')=='description': self.descriptions.append(a.get('content',''))
  if tag=='script' and a.get('type')=='application/ld+json': self.schemas.append('')
  if tag=='h1': self.h1+=1
  if tag=='title': self.in_title=True
 def handle_endtag(self,tag):
  if tag=='title': self.in_title=False
 def handle_data(self,data):
  if self.in_title:self.title+=data

titles=[]; descriptions=[]; canonicals=[]
pages={}
for name in PUBLIC:
 path=ROOT/name; assert path.exists(), name
 raw=path.read_text(); page=Page(); page.feed(raw); pages[name]=(raw,page)
 expected=BASE+'/' if name=='index.html' else BASE+'/'+name[:-5]
 assert page.h1==1, (name,page.h1)
 assert len(page.canon)==1 and page.canon[0]==expected, (name,page.canon)
 assert len(page.descriptions)==1 and 90<=len(page.descriptions[0])<=180, (name,len(page.descriptions[0]))
 assert page.title.strip() and len(page.title.strip())<=70, (name,page.title)
 assert len(page.ids)==len(set(page.ids)), (name,Counter(page.ids))
 assert len(re.findall(r'<script type="application/ld\+json">(.*?)</script>',raw,re.S))>=1, name
 for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',raw,re.S): json.loads(block)
 visible=' '.join(re.sub(r'<(?:script|style).*?</(?:script|style)>',' ',raw,flags=re.S|re.I).split())
 visible=re.sub(r'<[^>]+>',' ',visible)
 assert len(visible.split())>=250, (name,len(visible.split()))
 assert 'formsubmit.co' not in raw.lower(), name
 assert 'cdn.tailwindcss.com' not in raw.lower(), name
 assert 'sc01.alicdn.com' not in raw.lower() and 'sc02.alicdn.com' not in raw.lower(), name
 titles.append(page.title.strip()); descriptions.append(page.descriptions[0]); canonicals.append(page.canon[0])
 for image in page.images:
  assert image.get('alt','').strip(), (name,image)
  assert image.get('width') and image.get('height'), (name,image)
  src=urlsplit(image['src']).path
  if src.startswith('/'): target=ROOT/src[1:]
  elif image['src'].startswith('http'): continue
  else: target=ROOT/src
  assert target.exists(), (name,target)
  with Image.open(target) as im:
   declared=int(image['width'])/int(image['height']); actual=im.width/im.height
   assert abs(declared-actual)<.02, (name,target,declared,actual)

assert len(titles)==len(set(titles))
assert len(descriptions)==len(set(descriptions))
assert len(canonicals)==len(set(canonicals))

def resolve(path):
 path=unquote(path)
 if path=='/': return ROOT/'index.html'
 candidate=ROOT/(path.lstrip('/')+'.html')
 if candidate.exists(): return candidate
 return ROOT/path.lstrip('/')

for name,(raw,page) in pages.items():
 for href in page.links:
  u=urlsplit(href)
  if u.scheme in ('mailto','tel') or u.netloc and u.netloc!='www.videobrochureplus.com': continue
  if u.netloc=='www.videobrochureplus.com' or href.startswith('/'):
   target=resolve(u.path or '/')
  elif href.startswith('#'):
   target=ROOT/name
  else:
   target=resolve('/'+u.path)
  assert target.exists(), (name,href,target)
  if u.fragment:
   target_name='index.html' if target.name=='index.html' else target.name
   assert u.fragment in pages.get(target_name,(target.read_text(),Page()))[0], (name,href)

ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
tree=ElementTree.parse(ROOT/'sitemap.xml')
sitemap={node.text for node in tree.findall('.//s:loc',ns)}
assert sitemap==set(canonicals), (sitemap,set(canonicals))
robots=(ROOT/'robots.txt').read_text()
assert 'OAI-SearchBot' in robots and 'Googlebot' in robots and BASE+'/sitemap.xml' in robots
vercel=json.loads((ROOT/'vercel.json').read_text())
assert vercel['cleanUrls'] is True and vercel['trailingSlash'] is False
assert vercel['buildCommand']=='node build-site.mjs' and vercel['outputDirectory']=='dist'
assert any(x['source']=='/index' and x['destination']=='/' for x in vercel['redirects'])
home=(ROOT/'index.html').read_text()
assert 'autoplay' not in home and 'preload="none"' in home
assert home.count('data-inquiry-form')==2
assert 'https://api.web3forms.com/submit' in (ROOT/'forms-core.mjs').read_text()
print(f'Validated {len(PUBLIC)} indexable pages, metadata, schema, sitemap, links, images, forms and redirects.')
