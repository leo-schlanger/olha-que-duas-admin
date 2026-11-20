# Side-by-side sheet: current program covers + the 4 new ones, hub order, at 300/160/112 px.
from PIL import Image,ImageDraw,ImageFont,ImageOps
R='_ref/'
items=[("Notícias",R+"programa-capa-noticias-olha-que-duas-v3.jpg"),("Curtas Biografias",R+"curtas-biografias.jpg"),("Pimenta na Língua",R+"pimenta-na-lingua.jpg"),("Mente Aberta",R+"programa-capa-mente-aberta.jpg"),("Lendas",R+"programa-capa-lendas-de-portugal.jpg"),("Céu de Cada Mês",R+"programa-capa-ceu-de-cada-mes-v2.jpg"),("NOVA Entrevistas","entrevistas-v1.jpg"),("NOVA Top 10","top10-v1.jpg"),("NOVA Vidioteca","vidioteca-v1.jpg"),("NOVA Cantinho","cantinho-v1.jpg")]
F=ImageFont.truetype("src/fonts/Inter[opsz,wght].ttf",18);F2=ImageFont.truetype("src/fonts/Inter[opsz,wght].ttf",26)
g=20;W1=300;W2=160;W3=112;H1=400;cols=5
Wt=max(g+cols*(W1+g),g+10*(W2+12))
H=60+2*(H1+40+g)+54+int(W2*4/3)+30+int(W3*4/3)+g
s=Image.new("RGB",(Wt,H),"#f4f1ea");d=ImageDraw.Draw(s)
d.text((g,18),"Programas OQD: capas 3:4 (900x1200). As 4 novas (NOVA) ao lado das atuais, na ordem do hub",fill="#1c0a0e",font=F2)
for i,(n,f) in enumerate(items):
  im=ImageOps.fit(Image.open(f).convert("RGB"),(W1,H1),Image.LANCZOS)
  x=g+(i%cols)*(W1+g);yy=60+(i//cols)*(H1+40+g)
  s.paste(im,(x,yy));d.text((x,yy+H1+8),n,fill="#c8241b" if n.startswith("NOVA") else "#1c0a0e",font=F)
y=60+2*(H1+40+g)+4
d.text((g,y),"Tamanho do cartão a 390 (160 px) e do hero (112 px)",fill="#1c0a0e",font=F2);y+=44
for W in (W2,W3):
  for i,(n,f) in enumerate(items):
    s.paste(ImageOps.fit(Image.open(f).convert("RGB"),(W,int(W*4/3)),Image.LANCZOS),(g+i*(W+12),y))
  y+=int(W*4/3)+30
s.save("folha-lado-a-lado.jpg",quality=88);print(s.size)
