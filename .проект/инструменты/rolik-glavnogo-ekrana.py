"""Ставит ролик на главный экран сайта. Запуск из корня проекта:

    python3 .проект/инструменты/rolik-glavnogo-ekrana.py <горизонтальный 16:9> <вертикальный 9:16>

Что делает: сжимает оба ролика (без звука), делает кадры-обложки, кладёт всё в assets/video/,
заменяет блок HERO-VIDEO в index.html и пересобирает датскую страницу.
Исходные файлы не меняет. Нужна программа ffmpeg (проверка: ffmpeg -version).
Подробности и проверка результата: .проект/правила/ролик-главного-экрана.md"""
import json, pathlib, re, shutil, subprocess, sys

LIMIT_MB = 4.5            # больше — сайт будет медленно открываться на телефоне
TARGETS = {'wide': (1280, 720), 'tall': (720, 1280)}

def fail(msg): print('ОШИБКА:', msg); sys.exit(1)

if len(sys.argv) != 3: fail('нужно два файла: сначала горизонтальный, потом вертикальный')
if not shutil.which('ffmpeg') or not shutil.which('ffprobe'): fail('не найдена программа ffmpeg')
if not pathlib.Path('index.html').exists(): fail('запускайте из корня проекта (там, где index.html)')
src = {'wide': pathlib.Path(sys.argv[1]), 'tall': pathlib.Path(sys.argv[2])}
html = pathlib.Path('index.html').read_text(encoding='utf-8')
block = re.search(r'( *)<!-- HERO-VIDEO:START.*?-->.*?<!-- HERO-VIDEO:END -->', html, re.S)
if not block: fail('в index.html не найден блок HERO-VIDEO:START … HERO-VIDEO:END')

def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=width,height:stream_side_data=rotation:format=duration', '-of', 'json', str(path)],
                       capture_output=True, text=True)
    if r.returncode: fail(f'не удалось прочитать {path}: {r.stderr.strip()[:200]}')
    d = json.loads(r.stdout); st = d['streams'][0]
    w, h = st['width'], st['height']
    rot = abs(int(next((x.get('rotation', 0) for x in st.get('side_data_list', [])), 0)))
    if rot in (90, 270): w, h = h, w
    return w, h, float(d['format']['duration'])

for kind, path in src.items():
    if not path.exists(): fail(f'нет файла {path}')
    w, h, dur = probe(path)
    if kind == 'wide' and w <= h: fail(f'{path} не горизонтальный ({w}×{h}). Порядок: сначала 16:9, потом 9:16')
    if kind == 'tall' and h <= w: fail(f'{path} не вертикальный ({w}×{h}). Порядок: сначала 16:9, потом 9:16')
    if abs(w / h - TARGETS[kind][0] / TARGETS[kind][1]) > 0.03:
        print(f'ВНИМАНИЕ: {path} имеет пропорции {w}×{h}, края будут обрезаны до {"16:9" if kind == "wide" else "9:16"}')
    if dur > 20: print(f'ВНИМАНИЕ: {path} длится {dur:.0f} с — лучше 10–15 с, файл выйдет тяжёлым')

out = pathlib.Path('assets/video'); out.mkdir(parents=True, exist_ok=True)
for kind, path in src.items():
    tw, th = TARGETS[kind]
    vf = f'scale={tw}:{th}:force_original_aspect_ratio=increase,crop={tw}:{th},fps=30,format=yuv420p'
    mp4, poster = out / f'hero-{kind}.mp4', out / f'hero-{kind}.webp'
    for crf in (26, 29, 32, 35):          # ужимаем сильнее, пока файл не уложится в лимит
        r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-an', '-vf', vf, '-c:v', 'libx264',
                            '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-movflags', '+faststart', str(mp4)],
                           capture_output=True, text=True)
        if r.returncode: fail(f'ffmpeg: {r.stderr.strip()[:300]}')
        mb = mp4.stat().st_size / 1e6
        if mb <= LIMIT_MB: break
    else:
        print(f'ВНИМАНИЕ: {mp4} весит {mb:.1f} МБ — больше {LIMIT_MB} МБ. Сократите ролик.')
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(mp4), '-frames:v', '1', '-q:v', '70', str(poster)],
                       capture_output=True, text=True)
    if r.returncode: fail(f'ffmpeg (обложка): {r.stderr.strip()[:300]}')
    print(f'{mp4}: {mb:.1f} МБ, {tw}×{th};  обложка {poster}: {poster.stat().st_size // 1024} КБ')

ind = block.group(1)
new = f'''{ind}<!-- HERO-VIDEO:START (этот блок заменяет команда из .проект/правила/ролик-главного-экрана.md) -->
{ind}<div class="hero-video">
{ind}  <div class="frame hero-loop" data-wide="assets/video/hero-wide.mp4" data-tall="assets/video/hero-tall.mp4" data-poster-wide="assets/video/hero-wide.webp" data-poster-tall="assets/video/hero-tall.webp">
{ind}    <video muted loop playsinline preload="metadata" aria-label="Katja North showreel" translate="no"></video>
{ind}  </div>
{ind}</div>
{ind}<!-- HERO-VIDEO:END -->'''
html = html[:block.start()] + new + html[block.end():]
html = re.sub(r'\n<link rel="preload" href="assets/img/covers/skiCRepiLbw\.webp"[^>]*>', '', html)
pathlib.Path('index.html').write_text(html, encoding='utf-8')
print('index.html: блок главного экрана заменён')
r = subprocess.run([sys.executable, '.проект/инструменты/sborka.py'])
sys.exit(r.returncode)
