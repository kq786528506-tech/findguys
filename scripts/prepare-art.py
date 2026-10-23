from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
for name in ('courtyard','greenhouse','market','moon'):
    source=root/'art-source'/f'{name}.jpg'
    if source.exists():
        image=Image.open(source).convert('RGB')
        image=image.resize((1200,1800),Image.Resampling.LANCZOS)
        image.save(root/'public'/'art'/f'{name}.webp',quality=88,method=6)
        print(name,(root/'public'/'art'/f'{name}.webp').stat().st_size)
