import sys, glob
from PIL import Image, ImageDraw
files = sys.argv[2:]
ims = [Image.open(f) for f in files]
w, h = ims[0].size
cols = 2
rows = (len(ims) + 1) // 2
sheet = Image.new('RGB', (w * cols + 10, h * rows + 10 * (rows - 1)), (60, 60, 60))
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * (w + 10), (i // cols) * (h + 10)
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).text((x + 8, y + 6), f.split('/')[-1], fill=(255, 0, 0))
sheet.save(sys.argv[1], quality=88)
