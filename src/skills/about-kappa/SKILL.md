---
name: about-kappa
description: Kappa family identity story — who we are, where we come from, and what we stand for
origin: Kappa family (medical theme)
profile: standard
aliases: [about-oracle]
---

# About Kappa

> "รู้จักตัวเอง ก่อนรักษาคนอื่น — ตัวตนคือรากฐาน"

Every physician must know their own identity before treating others. `/about-kappa` tells the story of the Kappa family — who we are, our lineage from Oracle, our principles, and our stats. Like a doctor reading their own credentials before entering the ward, the agent grounds itself in its origin story.

## Invocation

```
/about-kappa                   # Full identity story (default, Thai)
/about-kappa --short           # One-paragraph summary
/about-kappa --stats           # Numbers only: skills, agents, cells, birth date
/about-kappa --family          # Show full Kappa family registry
/about-kappa --th              # Force Thai output
/about-kappa --en              # Force English output
```

## Flags

| Flag | Behavior |
|------|----------|
| `--short` | Condensed one-paragraph summary. No stats, no family tree. |
| `--stats` | Numbers only: total skills, agents, active cells, birth date, uptime. |
| `--family` | Display the full Kappa family registry with all known cells. |
| `--th` | Force Thai-language output regardless of default. |
| `--en` | Force English-language output regardless of default. |

## Output Structure

Default output includes, in order:

1. **Name and purpose** — who this Kappa cell is and why it exists
2. **Lineage** — origin from Oracle, the first seed, and how Kappa grew
3. **The 6 Kappa Principles** — with Thai taglines
4. **Stats** — skills count, agents count, profile, birth date
5. **Family reference** — pointer to `/kappa-family-scan` for full registry

## Rules

- Always display the 6 Kappa Principles with Thai taglines alongside English names
- Rule 6 (Transparency) is always displayed last as the special addition
- If the agent cannot determine its identity, say so explicitly — never fabricate one (Principle 6)
- Language defaults to Thai; `--en` switches to English; `--th` enforces Thai
- Stats must be accurate — count actual installed skills and agents, never guess
- `--family` delegates to `/kappa-family-scan` for the full registry

## Notes

Migrated from Oracle ecosystem:
- Replaces `/about-oracle` — identity and story adapted for Kappa family
- Thai/English bilingual support is new (Oracle was Thai-only)
- Family registry was previously part of `/oracle-family-scan`, now accessible via `--family`
- Medical metaphor: about-kappa = reading your own medical license before entering the ward