---
name: emergency
description: Security hardening — lock down the cell, verify safety hooks, check for exposed secrets
origin: Kappa family (medical theme)
profile: standard
aliases: []
---

# Emergency

> "เมื่อฉุกเฉิน — รักษาก่อน ถามทีหลัง"

In a medical emergency, the first priority is stabilization — secure the airway, stop the bleeding, then diagnose. `/emergency` is the Kappa equivalent: harden security immediately, check for exposed secrets, verify safety hooks are active, and lock down the cell. Run this when something feels wrong, or as a preventive check.

Also available as an alias in cell profile for lightweight security checks.

## Invocation

```
/emergency                     # Full security hardening check
```

## Checklist

### 1. Secret Scan
- Scan for hardcoded credentials, API keys, tokens, passwords in tracked files
- Check `.env` files, config files, and `CLAUDE.md` for leaked secrets
- Flag any matches — never auto-remove, always present to human

### 2. Settings Verification
- Verify `.claude/settings.json` has proper permission controls
- Check that `allowedTools` is not overly permissive
- Ensure no `--dangerously-skip-permissions` usage in history

### 3. Safety Hooks
- Confirm `safety-check-destructive.sh` is active (blocks `rm -rf`, `git push --force`)
- Confirm `safety-check-sensitive-files.sh` is active (blocks edits to `.env`, `.pem`, `.key`)
- Confirm `block-no-verify` is active (blocks `--no-verify` on commits)
- Confirm `config-protection` is active (blocks modifications to linter/formatter configs)

### 4. Access Audit
- Review recent file access patterns for anomalies
- Check for unexpected outbound network calls in agent history
- Verify no credential exfiltration patterns

### 5. Remediation Report
- Present all findings ranked by severity (CRITICAL / HIGH / MEDIUM / LOW)
- Suggest fixes for each issue
- Apply fixes only after human approval (Principle 3)

## Rules

- NEVER auto-delete or auto-fix — always present findings to human first (Principle 3)
- CRITICAL findings must be addressed before continuing any other work
- Secret scans use pattern matching, not external services — no data leaves the machine
- If secrets are found, remind the human to rotate them immediately
- All findings are logged to `κ/extrinsic/experience/work/logs/` (Principle 1)
- Medical metaphor: emergency = triage and stabilization — secure the patient before anything else

## Notes

New Kappa skill — no Oracle predecessor.
- Inspired by security-review agent but specialized for Kappa cell hardening
- Available in cell profile as alias for lightweight checks
- Medical metaphor is natural: emergency = Code Blue, stabilize first