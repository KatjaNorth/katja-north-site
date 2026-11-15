"""Готовит ролик YouTube для портфолио. Запуск из корня проекта:

    python3 .проект/инструменты/rolik-portfolio.py <ссылка или номер ролика> <wide|tall> "<Название>" "<описание EN>" "<описание DA>"

wide — горизонтальный 16:9, tall — вертикальный 9:16.
Что делает: скачивает обложку с YouTube в assets/img/covers/<номер>.webp, добавляет датское описание
в assets/i18n/da.json и печатает готовый кусок HTML, который нужно вставить в index.html.
Сам index.html НЕ меняет. Куда вставлять и что делать дальше: .проект/правила/ролики-портфолио.md"""
import io, json, pathlib, re, sys, urllib.request

def fail(msg): print('ОШИБКА:', msg); sys.exit(1)

if len(sys.argv) != 6: fail('нужно 5 значений: ссылка, wide или tall, название, описание EN, описание DA')
link, kind, title, en, da_text = sys.argv[1:]
if kind not in ('wide', 'tall'): fail('второе значение — wide (горизонтальный) или tall (вертикальный)')
m = re.search(r'(?:v=|youtu\.be/|shorts/|embed/)([\w-]{11})', link) or re.fullmatch(r'([\w-]{11})', link)
if not m: fail('не удалось найти номер ролика (11 знаков) в ссылке')
vid = m.group(1)
if not pathlib.Path('index.html').exists(): fail('запускайте из корня проекта (там, где index.html)')
try:
    from PIL import Image
except ImportError:
    fail('нет библиотеки Pillow: pip install pillow')

names = ['oar2.jpg', 'maxresdefault.jpg', 'hqdefault.jpg'] if kind == 'tall' else ['maxresdefault.jpg', 'hqdefault.jpg']
img = None
for name in names:
    try:
        data = urllib.request.urlopen(f'https://i.ytimg.com/vi/{vid}/{name}', timeout=20).read()
        im = Image.open(io.BytesIO(data)).convert('RGB')
        if im.width > 200: img = im; break          # 120×90 — заглушка «нет картинки»
    except Exception:
        continue
if img is None: fail('не удалось скачать обложку: проверьте ссылку, доступ ролика («Открытый» или «По ссылке») и сеть (нужен адрес i.ytimg.com)')
if (kind == 'tall') != (img.height > img.width):
    print(f'ВНИМАНИЕ: обложка {img.width}×{img.height} не похожа на «{kind}» — проверьте, вертикальный ролик или горизонтальный')
w, h = (960, 540) if kind == 'wide' else (540, 960)
scale = max(w / img.width, h / img.height)
img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
left, top = (img.width - w) // 2, (img.height - h) // 2
out = pathlib.Path(f'assets/img/covers/{vid}.webp')
img.crop((left, top, left + w, top + h)).save(out, quality=78, method=6)

path = pathlib.Path('assets/i18n/da.json')
da = json.loads(path.read_text(encoding='utf-8'))
html = pathlib.Path('index.html').read_text(encoding='utf-8')
old = [m.group(1) for m in re.finditer(r'data-yt="' + vid + r'"(?:(?!</figure>).)*?<span data-i18n="(cap\.\w+)"', html, re.S)]
if old and old[0] in da:
    key = old[0]                                    # ролик уже есть на сайте — обновляем его описание
else:
    n = 1
    while f'cap.n{n}' in da: n += 1
    key = f'cap.n{n}'
da[key] = da_text
path.write_text(json.dumps(da, ensure_ascii=False, indent=1), encoding='utf-8')

esc = lambda t: t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
print(f'Обложка: {out} ({out.stat().st_size // 1024} КБ).  Датское описание записано в da.json, ключ {key}.')
print('\nВставьте этот блок в index.html (место — см. .проект/правила/ролики-портфолио.md):\n')
print(f'''        <figure class="video {kind}">
          <div class="frame"><button type="button" class="play-btn" data-yt="{vid}" data-title="{esc(title)}" aria-label="Play video: {esc(title)}"><img src="assets/img/covers/{vid}.webp" width="{w}" height="{h}" alt="" loading="lazy" decoding="async"><span class="play" aria-hidden="true"></span></button></div>
          <figcaption><strong translate="no">{esc(title)}</strong><span data-i18n="{key}">{esc(en)}</span></figcaption>
        </figure>''')
