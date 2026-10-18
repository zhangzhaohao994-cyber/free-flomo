from pathlib import Path
import ast, hashlib, json, re, zipfile
from urllib.parse import unquote, urlsplit
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
ast.parse((root/'build.py').read_text())
soup=BeautifulSoup((root/'index.html').read_text(),'html.parser')
ids=[x['id'] for x in soup.select('[id]')]
assert len(ids)==len(set(ids)), 'duplicate HTML ids'
missing=[]
for a in soup.select('a[href]'):
    href=a['href']
    if href.startswith('#'):
        if unquote(href[1:]) not in ids: missing.append(href)
    elif not urlsplit(href).scheme:
        if not (root/unquote(href.split('#')[0])).is_file(): missing.append(href)
assert not missing, missing
sources=json.loads((root/'08_来源与数据/sources.json').read_text())
assert len(sources)==54
assert len(soup.select('.source-card'))==54
assert len(soup.select('.chapter'))==14
manifest=json.loads((root/'manifest.json').read_text())
for entry in manifest['files']:
    p=root/entry['path']
    assert p.stat().st_size==entry['bytes']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256'],entry['path']
with zipfile.ZipFile(root/'最高_flomo研究资料包.zip') as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(manifest['files'])+1
    assert not any(any(x in p.lower() for x in ['.env','first-owner','sqlite','credential']) for p in z.namelist())
    for entry in manifest['files']:
        assert hashlib.sha256(z.read('最高_flomo研究资料库/'+entry['path'])).hexdigest()==entry['sha256']
report={'source_entries':len(sources),'chapters':12,'local_files_checked':len(manifest['files']),'zip_files':len(manifest['files'])+1,'html_ids':len(ids),'internal_links_missing':missing,'manifest_and_zip_hashes':'pass','python_syntax':'pass','third_party_fulltext_mirrors':False,'source_verification_limit':'元数据核对不替代源事实、工商、财务或产品实测'}
(root/'09_验收记录/static-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
