"""Сборка сайта. Запуск из корня проекта:  python3 .проект/инструменты/sborka.py

Делает из английских страниц (index.html, privacy.html) и перевода assets/i18n/da.json
датские страницы в папке da/, а также sitemap.xml и robots.txt.
Запускать после ЛЮБОЙ правки английской страницы или da.json.
При смене адреса сайта: поменять BASE здесь и тот же адрес в <head> английских страниц."""
import json, pathlib, re, sys

BASE = 'https://katjanorth.github.io/katja-north-site/'
PAGES = {'index.html': 'meta', 'privacy.html': 'privmeta'}     # страница -> начало ключей заголовка и описания
root = pathlib.Path('.')
da = json.loads((root / 'assets/i18n/da.json').read_text(encoding='utf-8'))
esc = lambda t: t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
problems, used, total = [], set(), 0

for page, meta in PAGES.items():
    html = (root / page).read_text(encoding='utf-8')
    url = '' if page == 'index.html' else page          # адрес страницы внутри сайта
    keys = re.findall(r'data-i18n="([\w.]+)"', html)
    used.update(keys); total += len(keys)

    # 1. Тексты: содержимое каждого элемента с data-i18n="ключ"
    def swap(m):
        key = m.group(3)
        if key not in da:
            problems.append(f'{page}: нет перевода для ключа «{key}»')
            return m.group(0)
        return m.group(1) + esc(da[key]) + m.group(5)
    out = re.sub(r'(<(\w+)\b[^>]*\bdata-i18n="([\w.]+)"[^>]*>)(.*?)(</\2>)', swap, html, flags=re.S)

    # 2. Подписи для программ чтения с экрана
    out = out.replace('aria-label="Sections"', f'aria-label="{da["ui.sections"]}"')
    out = out.replace('aria-label="Play video: ', f'aria-label="{da["ui.play"]}')

    # 3. Заголовок, описание, адреса
    def sub(pattern, repl, text, required=True):
        new, n = re.subn(pattern, repl, text, count=1, flags=re.S)
        if n == 0 and required: problems.append(f'{page}: не найдено {pattern[:50]}')
        return new
    title, descr = da[meta + '.title'], da[meta + '.description']
    out = sub(r'<html lang="en">', '<html lang="da">', out)
    out = sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', out)
    out = sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + descr, out)
    out = sub(r'(<link rel="canonical" href=")[^"]*', r'\g<1>' + BASE + 'da/' + url, out)
    og = page == 'index.html'                              # превью для соцсетей есть только у главной
    out = sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + title.split(' | ')[0], out, og)
    out = sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + descr, out, og)
    out = sub(r'(<meta property="og:locale" content=")[^"]*', r'\g<1>da_DK', out, og)
    out = sub(r'(<meta property="og:url" content=")[^"]*', r'\g<1>' + BASE + 'da/', out, og)

    # 4. Переключатель языка
    out = sub(r'<!-- LANG:START -->.*?<!-- LANG:END -->',
              f'<!-- LANG:START -->\n      <a href="../{url}" lang="en" hreflang="en" aria-label="English">EN</a>\n'
              f'      <a href="{url or "./"}" lang="da" hreflang="da" aria-current="true" aria-label="Dansk">DA</a>\n      <!-- LANG:END -->', out)

    # 5. Пути к файлам: страница лежит на уровень глубже
    out = out.replace('"assets/', '"../assets/')

    if BASE not in html: problems.append(f'{page}: адрес BASE не совпадает с адресом в <head>')
    (root / 'da').mkdir(exist_ok=True)
    (root / 'da' / page).write_text(out, encoding='utf-8')

for k in da:
    if k not in used and not k.startswith(('meta.', 'privmeta.', 'ui.')):
        problems.append(f'ключ «{k}» есть в da.json, но не используется на страницах')

locs = [BASE + ('' if p == 'index.html' else p) for p in PAGES] + [BASE + 'da/' + ('' if p == 'index.html' else p) for p in PAGES]
(root / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in locs) + '</urlset>\n', encoding='utf-8')
(root / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n', encoding='utf-8')

if problems:
    print('ЕСТЬ ЗАМЕЧАНИЯ:'); [print(' -', p) for p in problems]; sys.exit(1)
print(f'Готово: da/index.html, da/privacy.html ({total} текстов), sitemap.xml, robots.txt')
