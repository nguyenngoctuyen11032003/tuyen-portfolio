import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1200,630
HERE=os.path.dirname(os.path.abspath(__file__))
def font(cands,size):
    for c in cands:
        if os.path.exists(c): return ImageFont.truetype(c,size)
    raise SystemExit("no font")
serif=["/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"]#,"/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"]
sans=[os.path.join(HERE,"Barlow-Regular.ttf"),"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
sansm=[os.path.join(HERE,"Barlow-Medium.ttf")]+sans
img=Image.new("RGB",(W,H),(0,0,0))
glow=Image.new("RGBA",(W,H),(0,0,0,0))
gd=ImageDraw.Draw(glow)
cx,cy,R=140,80,620
for i in range(60,0,-1):
    r=R*i/60
    a=int(255*0.15*(1-i/60)**1.6*1.0)+0
    gd.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(52,211,153,a))
glow=glow.filter(ImageFilter.GaussianBlur(20))
img.paste(glow,(0,0),glow)
d=ImageDraw.Draw(img,"RGBA")
random.seed(7)
for _ in range(70):
    x,y=random.randint(0,W),random.randint(0,H); r=random.choice([1,1,2])
    d.ellipse([x-r,y-r,x+r,y+r],fill=(52,211,153,random.randint(30,90)))
d.text((80,190),"Nguyễn Ngọc Tuyền",font=font(serif,84),fill=(244,241,234))
d.text((80,315),"IT Engineer · Full-Stack Developer",font=font(sansm,40),fill=(52,211,153))
d.text((80,385),"NestJS · Next.js · React · Flutter · PostgreSQL",font=font(sans,28),fill=(255,255,255,153))
img.save("public/og-cover.jpg","JPEG",quality=88)
