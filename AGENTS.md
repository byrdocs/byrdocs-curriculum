# AGENTS.md

This project is a Cloudflare Worker that serves course curriculum metadata and PDF files from a Cloudflare R2 bucket.

## Data Source

Editable source for curriculum metadata is `curricula.yaml` in the repo root. At build time, `scripts/build.mjs` converts it to `src/curricula.json` (the top-level `curricula` key is unwrapped into a flat array), which is bundled into the Worker.

PDFs are stored in the R2 bucket `byrdocs-curriculum`:

- `{id}.pdf` — each PDF is named by its MD5 hash

Worker binding: `env.R2` -> `byrdocs-curriculum` (remote).

## curricula.yaml Schema

```yaml
curricula:
  - id: string              # MD5 hex digest, matches {id}.pdf in R2
    title: string           # e.g. "计算机学院（国家示范性软件学院）2025级本科专业培养方案"
    school: string
    year: string
    major:
      - type: "本科" | "本科（特殊培养）" | "预科" | "硕士研究生" | "博士研究生"
        name: string
```

Currently 12 entries (~2023-2025, various BUPT schools). No search/pagination is needed — the dataset is small.

## API

### `GET /`

Returns the full curricula array as JSON (bundled at build time, not fetched from R2).
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, max-age=3600`

### `GET /file/:id`

Downloads the PDF matching `{id}.pdf` from the R2 public domain (`CURRICULUM_FILE_URL`).
- `Content-Type: application/pdf`
- `Access-Control-Allow-Origin: *`
- Optional `?title=name` query param sets `Content-Disposition: attachment; filename*=UTF-8''{name}.pdf` so the browser downloads with a custom filename instead of the raw MD5 hash.

Unmatched paths and missing files return `404`.

## Current Implementation

- `curricula.yaml` — Editable YAML source for curriculum metadata
- `scripts/build.mjs` — Converts `curricula.yaml` to `src/curricula.json` (run before dev/deploy)
- `src/index.ts` — Worker entry point with the two endpoints above. Proxies PDF requests to `CURRICULUM_FILE_URL`.
- `src/curricula.json` — Generated JSON, bundled into the Worker at build time
- `wrangler.toml` — Worker config with R2 binding and env vars (`CURRICULUM_FILE_URL`, `CURRICULUM_URL`)
- `.github/workflows/check-pr.yaml` — CI workflow that validates PRs touching `curricula.yaml`

## CI / PR Workflow

`.github/workflows/check-pr.yaml` uses `pull_request_target` so R2 secrets are available, then explicitly checks out the PR's code. For security, the `npm run build` step (which needs R2 credentials to verify PDF existence) is **skipped if any file other than `curricula.yaml` was modified in the PR**. This prevents untrusted code in `scripts/build.mts` from running with secret access. A workflow warning is emitted listing the extra files — manual review is required before merging.

## Dev Commands

```
npm run build        # Generate src/curricula.json from curricula.yaml
npm run dev          # npm run build && wrangler dev (local dev server)
npm run deploy       # npm run build && wrangler deploy
npm test             # vitest
npm run cf-typegen   # wrangler types (regenerate Env from wrangler.toml)
```
