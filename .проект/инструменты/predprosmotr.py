"""Собирает index.html в один файл для закрытого предпросмотра (стили, скрипт,
шрифты и картинки встраиваются внутрь). Запуск из корня: python3 .проект/инструменты/predprosmotr.py <куда.html>"""
import base64, mimetypes, re, sys, pathlib

root = pathlib.Path('.')
html = (root / 'index.html').read_text(encoding='utf-8')

def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or {'.woff2': 'font/woff2', '.webp': 'image/webp'}[path.suffix]
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

css = (root / 'assets/css/style.css').read_text(encoding='utf-8')
css = re.sub(r'url\("\.\./([^"]+)"\)', lambda m: f'url("{data_uri(root / "assets" / m.group(1))}")', css)
js = (root / 'assets/js/main.js').read_text(encoding='utf-8')

title = '<title>Katja North</title>'
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = re.sub(r'<script src="assets/js/main\.js" defer></script>', '', body)
body = re.sub(r'src="(assets/img/[^"]+)"', lambda m: f'src="{data_uri(root / m.group(1))}"', body)

out = f'{title}\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n{css}\n</style>\n{body}\n<script>\n{js}\n</script>\n'
pathlib.Path(sys.argv[1]).write_text(out, encoding='utf-8')
print(len(out) // 1024, 'КБ')
