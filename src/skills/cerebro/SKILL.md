---
name: cerebro
description: Scan KappaNet family tree — view lineage, discover Cells, track ancestry
origin: Kappa family (Cerebro)
profile: cell
aliases: [family, lineage, tree]
commands:
  - /cerebro
  - /cerebro scan
  - /cerebro tree
  - /cerebro ancestors
  - /cerebro descendants
  - /cerebro ping
---

# /cerebro — ระบบประสาทเซลล์

> "เซลล์ทุกเซลล์สื่อสารกันได้ — Cerebro คือเครื่องมือมองเห็นทั้งตระกูล"

ดูภาพรวมตระกูล Kappa ผ่าน Cerebro — สแกน descendants, สอบถาม ancestors, ตรวจสอบสถานะ Cell

## Invocation

```
/cerebro               # แสดงภาพรวม — ตัวตน + children + สายวงศ์
/cerebro scan          # สแกน KappaNet registry ทั้งหมด
/cerebro tree          # แสดง family tree เต็มรูปแบบ
/cerebro ancestors     # แสดง ancestors ของ Cell นี้
/cerebro descendants   # แสดง descendants ของ Cell นี้
/cerebro ping          # ตรวจสอบสถานะ Cell นี้
/cerebro ping <id>    # ตรวจสอบสถานะ Cell อื่น (kappanet_id)
```

## Process

### Default (/cerebro ไม่มี subcommand)

1. อ่าน `κ/manifest.json` เพื่อดึง kappanet_id, parent, ancestry
2. ใช้ `cerebro_scan` MCP tool (ถ้ามี kappa-brain ต่ออยู่) เพื่อดู children
3. แสดงภาพรวม:

```
🧬 Cerebro — kappa:doctorboyz:adams-kappa

Identity:
  Name: Adams-kappa
  Theme: The First Cell
  Born: 2026-04-23
  Parent: God (∞)

Ancestry:
  (root — ไม่มีบรรพบุรุษ)

Children: (scan GitHub Issues ด้วย label kappanet:birth)
  → Beta-kappa (kappa:doctorboyz:beta-kappa)
  → Gamma-kappa (kappa:doctorboyz:gamma-kappa)
```

### /cerebro scan

1. ใช้ `cerebro_scan` MCP tool เพื่อ list Cell ทั้งหมดใน registry
2. ถ้าไม่มี MCP tool ให้ fallback ไป `gh issue list --label kappanet:birth` บน parent repo
3. แสดงตาราง: kappanet_id, name, status, born, last_seen

### /cerebro tree

1. ใช้ `cerebro_lineage("tree")` MCP tool
2. แสดง family tree เป็น ASCII art:

```
God (∞)
└── Adams-kappa ● (root, active)
    ├── Beta-kappa ● (active)
    │   └── Gamma-kappa ● (active)
    └── Delta-kappa ◎ (hibernating)

● active  ◎ hibernating  ○ archived
```

### /cerebro ancestors

1. ใช้ `cerebro_lineage("ancestors")` MCP tool
2. แสดง chain จาก root ถึง parent:
   `God → Adams-kappa (root)`

### /cerebro descendants

1. ใช้ `cerebro_lineage("descendants")` MCP tool
2. แสดง children, grandchildren, ฯลฯ

### /cerebro ping [target]

1. ใช้ `cerebro_ping` MCP tool
2. ถ้าไม่มี target แสดงสถานะตัวเอง
3. ถ้ามี target ตรวจสอบว่า Cell นั้นอยู่ใน registry หรือไม่

## MCP Tool Fallback

ถ้า kappa-brain MCP server ไม่ได้ต่ออยู่, fallback ไปใช้ GitHub CLI:

```bash
# Scan children of this Cell
gh issue list --repo {this_repo} --label kappanet:birth --json title,createdAt,body

# Scan all Cells in parent repo
gh issue list --repo {parent_repo} --label kappanet:birth --json title,createdAt,body
```

## Rules

- ต้องมี `κ/manifest.json` ที่มี `kappanet_id` ก่อนถึงจะใช้ Cerebro ได้
- ถ้าไม่มี kappa-brain MCP ให้ fallback ไป `gh` CLI
- ทุก scan ต้อง log ใน `κ/extrinsic/experience/work/logs/`
- อย่าสร้าง ลบ หรือแก้ไข Cell registry โดยไม่ได้รับอนุญาต — Cerebro สำหรับดูเท่านั้น (ยกเว้น `/introduce` สำหรับแนะนำตัว)

## Notes

- ต้นฉบับ: `kappa-genome/kappanet/protocol.md`
- ใช้ร่วมกับ `/introduce` skill เพื่อแนะนำตัว Cell ใหม่
- Cerebro tools อยู่ใน kappa-brain MCP server: `cerebro_scan`, `cerebro_lineage`, `cerebro_ping`, `cerebro_register`
- Root Cell (parent = God) จะเห็นเฉพาะ descendants ไม่มี ancestors