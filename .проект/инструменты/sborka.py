"""Сборка сайта. Запуск из корня проекта:  python3 .проект/инструменты/sborka.py

Делает из английской страницы index.html и перевода assets/i18n/da.json
датскую страницу da/index.html, а также sitemap.xml и robots.txt.
Запускать после ЛЮБОЙ правки index.html или da.json.
При смене адреса сайта: поменять BASE здесь и тот же адрес в <head> файла index.html."""
import json, pathlib, re, sys

BASE = 'https://katjanorth.github.io/katja-north-site/'
root = pathlib.Path('.')
html = (root / 'index.html').read_text(encoding='utf-8')
da = json.loads((root / 'assets/i18n/da.json').read_text(encoding='utf-8'))
esc = lambda t: t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
problems = []

# 1. Тексты: содержимое каждого элемента с data-i18n="ключ"
keys = re.findall(r'data-i18n="([\w.]+)"', html)
def swap(m):
    key = m.group(3)
    if key not in da:
        problems.append(f'нет перевода для ключа «{key}»')
        return m.group(0)
    return m.group(1) + esc(da[key]) + m.group(5)
out = re.sub(r'(<(\w+)\b[^>]*\bdata-i18n="([\w.]+)"[^>]*>)(.*?)(</\2>)', swap, html, flags=re.S)
for k in da:
    if k not in keys and not k.startswith(('meta.', 'ui.')):
        problems.append(f'ключ «{k}» есть в da.json, но не используется в index.html')

# 2. Подписи для программ чтения с экрана
out = re.sub(r'aria-label="Sections"', f'aria-label="{da["ui.sections"]}"', out)
out = out.replace('aria-label="Play video: ', f'aria-label="{da["ui.play"]}')

# 3. Заголовок, описание, адреса
def must(pattern, repl, text, count=1):
    new, n = re.subn(pattern, repl, text, count=count, flags=re.S)
    if n == 0: problems.append(f'в index.html не найдено: {pattern[:50]}')
    return new
out = must(r'<html lang="en">', '<html lang="da">', out)
out = must(r'<title>.*?</title>', f'<title>{esc(da["meta.title"])}</title>', out)
out = must(r'(<meta name="description" content=")[^"]*', r'\g<1>' + da['meta.description'], out)
out = must(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + da['meta.title'].split(' | ')[0], out)
out = must(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + da['meta.description'], out)
out = must(r'(<meta property="og:locale" content=")[^"]*', r'\g<1>da_DK', out)
out = must(r'(<meta property="og:url" content=")[^"]*', r'\g<1>' + BASE + 'da/', out)
out = must(r'(<link rel="canonical" href=")[^"]*', r'\g<1>' + BASE + 'da/', out)

# 4. Переключатель языка
out = must(r'<!-- LANG:START -->.*?<!-- LANG:END -->',
           '<!-- LANG:START -->\n      <a href="../" lang="en" hreflang="en" aria-label="English">EN</a>\n'
           '      <a href="./" lang="da" hreflang="da" aria-current="true" aria-label="Dansk">DA</a>\n      <!-- LANG:END -->', out)

# 5. Пути к файлам: страница лежит на уровень глубже
out = out.replace('"assets/', '"../assets/')

(root / 'da').mkdir(exist_ok=True)
(root / 'da/index.html').write_text(out, encoding='utf-8')
(root / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url><loc>{BASE}</loc></url>\n  <url><loc>{BASE}da/</loc></url>\n</urlset>\n', encoding='utf-8')
(root / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n', encoding='utf-8')

if BASE not in html: problems.append('адрес BASE не совпадает с адресом в <head> index.html')
if problems:
    print('ЕСТЬ ЗАМЕЧАНИЯ:'); [print(' -', p) for p in problems]; sys.exit(1)
print(f'Готово: da/index.html ({len(keys)} текстов), sitemap.xml, robots.txt')
