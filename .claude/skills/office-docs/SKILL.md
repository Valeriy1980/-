---
name: office-docs
description: >-
  Генерація й редагування офісних документів — Word (DOCX), Excel (XLSX),
  PowerPoint (PPTX) та PDF — прямо з Claude Code. Використовуй, коли користувач
  просить зробити комерційну пропозицію, прайс-лист, рахунок, звіт, таблицю
  товарів, презентацію чи будь-який документ у цих форматах.
---

# Office Documents — створення DOCX / XLSX / PPTX / PDF

Цей скіл дає змогу генерувати професійні офісні документи через Python.
Типові задачі для цього проєкту (B2C Showroom Portal):

- **Комерційна пропозиція** партнеру (DOCX/PDF) на основі вибраних товарів.
- **Прайс-лист** (XLSX) з категоріями, цінами, залишками.
- **Рахунок / специфікація** замовлення з checkout (DOCX/PDF).
- **Презентація** каталогу або нової колекції (PPTX).
- **Звіт** по продажах/залишках (XLSX з формулами та форматуванням).

## Передумови (один раз)

Потрібен Python 3 і бібліотеки. Перевір і за потреби встанови:

```bash
python3 -m pip install --quiet python-docx openpyxl python-pptx reportlab
```

- `python-docx` — Word (.docx)
- `openpyxl` — Excel (.xlsx), формули, стилі, ширини колонок
- `python-pptx` — PowerPoint (.pptx)
- `reportlab` — PDF

## Робочий процес

1. **З'ясуй вміст.** Які дані йдуть у документ (товари, ціни, реквізити,
   логотип). Якщо дані вже є в проєкті (mock-каталог, типи в `src/types/`) —
   бери звідти, не вигадуй.
2. **Напиши Python-скрипт** у `scratchpad` (НЕ засмічуй репозиторій), який
   будує документ і зберігає у файл.
3. **Запусти** скрипт, переконайся, що файл створено без помилок.
4. **Віддай файл користувачу** через інструмент надсилання файлів, з коротким
   підписом. За потреби — покажи прев'ю вмісту.

## Стиль документів

- Дотримуйся брендових кольорів проєкту з `tailwind.config.ts`, якщо доречно.
- Грошові суми форматуй як у `formatPrice` (`src/lib/utils.ts`) — гривні,
  розділювач тисяч.
- Українська мова за замовчуванням (це мова проєкту).
- Для прайсів: заморожуй шапку (`freeze_panes`), став автоширину колонок,
  жирну шапку, грошовий формат у колонці ціни.

## Приклади-шаблони

### Прайс-лист (XLSX)
```python
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Прайс"
headers = ["Категорія", "Товар", "Бренд", "Ціна, ₴", "Залишок"]
ws.append(headers)
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1F2937")
    c.alignment = Alignment(horizontal="center")
# ... ws.append([...]) для кожного товару ...
ws.freeze_panes = "A2"
ws.column_dimensions["B"].width = 40
wb.save("scratchpad/price.xlsx")
```

### Комерційна пропозиція (DOCX)
```python
from docx import Document
from docx.shared import Pt, RGBColor

doc = Document()
doc.add_heading("Комерційна пропозиція", level=0)
doc.add_paragraph("Шановний партнере, пропонуємо наступні позиції:")
table = doc.add_table(rows=1, cols=3)
table.style = "Light Grid Accent 1"
hdr = table.rows[0].cells
hdr[0].text, hdr[1].text, hdr[2].text = "Товар", "Ціна, ₴", "К-сть"
# ... додай рядки ...
doc.save("scratchpad/proposal.docx")
```

## Чого НЕ робити

- Не зберігай згенеровані документи в git-репозиторії — лише в scratchpad.
- Не встановлюй важкі залежності без потреби (PDF через reportlab, не LaTeX).
- Не вигадуй ціни/залишки — бери реальні дані проєкту або питай користувача.
