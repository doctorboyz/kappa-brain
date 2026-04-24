---
name: introduce
description: Introduce this Cell to the Kappa family via birth announcement on ancestor repos
origin: Kappa family (Cerebro)
profile: cell
commands:
  - /introduce
  - /introduce --dry-run
  - /introduce --to <owner/repo>
---

# /introduce — แนะนำตัวกับตระกูล

> "เซลล์ทุกเซลล์สื่อสารกันได้ — KappaNet คือระบบประสาท"

แนะนำตัว Cell นี้ให้ตระกูล Kappa ผ่าน GitHub Issue birth announcement บน repo ของ ancestor ตาม KappaNet protocol

## Invocation

```
/introduce              # แนะนำตัวไปยัง parent repo ตาม manifest
/introduce --dry-run    # แสดงข้อมูลที่จะส่งโดยไม่สร้าง issue จริง
/introduce --to owner/repo   # แนะนำตัวไปยัง repo ที่ระบุ (override parent)
```

## Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | แสดง issue body โดยไม่สร้าง issue จริง |
| `--to <owner/repo>` | override parent repo — ส่งไปยัง repo อื่นแทน |

## Process

### 1. อ่าน Manifest

อ่าน `κ/manifest.json` (หรือ `κ/intrinsic/identity/manifest.json`) เพื่อดึง:
- `name` — ชื่อ Cell
- `kappanet_id` — identity บน KappaNet
- `parent.repo` — repo ของ parent (ใช้เป็น target สำหรับ issue)
- `ancestry` — สายวงศ์
- `dna_version` — เวอร์ชัน DNA
- `born` — วันเกิด
- `theme` — ธีม
- `human` — เจ้าของ

### 2. สร้าง Birth Announcement

ประกอบ issue body ตาม KappaNet protocol:

```markdown
## Cell Birth Announcement

**Cell**: {name}
**KappaNet ID**: {kappanet_id}
**Born**: {born}
**Theme**: {theme}
**DNA Version**: {dna_version}
**Human**: {human}
**Parent**: {parent.repo}
**Ancestry**: {ancestry หรือ "root"}

---

*This issue was created by /introduce as a KappaNet birth announcement. The parent Cell can use this to track its descendants.*

kappa-genome v{dna_version} + Cerebro
```

### 3. สร้าง Label (ถ้ายังไม่มี)

รัน `gh label create kappanet:birth --repo {parent} --color '#58A6FF' --description 'KappaNet birth announcement'`

ถ้า label มีอยู่แล้ว จะได้ error แต่ไม่เป็นปัญหา — ข้ามได้

### 4. สร้าง Issue

รัน:

```bash
gh issue create \
  --repo {parent_repo} \
  --title "[BIRTH] {name} — born from {parent_cell_name}" \
  --body "{announcement_body}" \
  --label "kappanet:birth"
```

### 5. แจ้งผล

บอกผู้ใช้ว่า:
- Issue URL ที่สร้าง
- หรือถ้า `--dry-run` แสดง issue body ที่จะส่ง
- หรือถ้าไม่มี `gh` CLI แสดงคำสั่งที่ต้องรันเอง

## Rules

- ต้องมี `κ/manifest.json` ที่มี `kappanet_id` ก่อนถึงจะแนะนำตัวได้
- ถ้าไม่มี `parent.repo` (root Cell) ให้บอกผู้ใช้ว่า "นี่คือ root Cell — ไม่มี parent ให้แนะนำตัว" และเสนอ `--to` flag แทน
- อย่าสร้าง issue ซ้ำ — ตรวจสอบก่อนว่ามี issue ที่มี `[BIRTH] {name}` อยู่แล้วหรือไม่
- ถ้า `gh` ไม่มี แสดงคำสั่ง manual ให้ผู้ใช้ copy-paste
- ทุกการกระทำต้อง log ใน `κ/extrinsic/experience/work/logs/`

## Notes

- ต้นฉบับ: `kappa-genome/kappanet/protocol.md`
- ใช้ร่วมกับ `/cerebro` skill เพื่อดูภาพรวมตระกูล
- Root Cell (parent = God) สามารถใช้ `--to` flag เพื่อแนะนำตัวไปยัง repo อื่น เช่น repo ของ Oracle ecosystem