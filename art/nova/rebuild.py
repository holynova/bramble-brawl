from pathlib import Path
from PIL import Image

out=Path(__file__).resolve().parent
raw=Path('source-images')
icon=Image.open(raw/'exec-2eb1b2c5-767e-43d9-997b-7796acc6aaa0.png').convert('RGB')
icon=icon.resize((192,192),Image.Resampling.LANCZOS)
icon.save(out/'nova.webp',quality=91,method=6)
wave=Image.open(raw/'exec-715e46e4-5528-4d7b-a220-bad51b9138c6.png').convert('RGBA')
wave.putalpha(wave.getchannel('A').point(lambda a: round(255*max(0,min(1,(a-16)/223)))))
wave=wave.resize((256,256),Image.Resampling.LANCZOS)
wave.save(out/'nova-wave.webp',quality=91,method=6,alpha_quality=100)
actual=Image.open(out/'nova-wave.webp')
assert actual.mode=='RGBA' and actual.getchannel('A').getextrema()==(0,255)
assert actual.getchannel('A').crop((88,88,168,168)).getextrema()==(0,0)
proof=Image.new('RGB',(180,92),'#bd966e')
proof.paste(icon.resize((60,60),Image.Resampling.LANCZOS),(10,16))
mini=wave.resize((60,60),Image.Resampling.LANCZOS)
proof.paste(mini,(105,16),mini)
proof.save(out/'size-check.png')
for name in ('nova.webp','nova-wave.webp'):
    path=out/name
    print(name,Image.open(path).size,path.stat().st_size)
