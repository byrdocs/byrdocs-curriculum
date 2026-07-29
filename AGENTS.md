# AGENTS.md

This project is a Cloudflare Worker that serves course curriculum metadata and PDF files from a Cloudflare R2 bucket.

## R2 Bucket

Both metadata and PDFs are stored in the R2 bucket `byrdocs-curriculum`:

- `curriculum.json` — metadata for all curriculum files
- `{id}.pdf` — each PDF is named by its MD5 hash

Worker binding: `env.R2` -> `byrdocs-curriculum` (remote).

## curriculum.json Schema

```ts
Array<{
	id: string;                // MD5 hex digest, matches {id}.pdf in R2
	title: string;             // e.g. "计算机学院（国家示范性软件学院）2025级本科专业培养方案"
	school: string;
	year: string;
	major: Array<{
		type: "本科" | "本科（特殊培养）" | "预科" | "硕士研究生" | "博士研究生";
		name: string;
	}>;
}>
```

Currently 12 entries (~2023-2025, various BUPT schools). No search/pagination is needed — the dataset is small.

## API

### `GET /`

Returns the full `curriculum.json` from R2 as JSON.
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, max-age=3600`

### `GET /:id`

Downloads the PDF matching `{id}.pdf` from R2.
- `Content-Type: application/pdf`
- `Access-Control-Allow-Origin: *`
- Optional `?title=name` query param sets `Content-Disposition: attachment; filename*=UTF-8''{name}.pdf` so the browser downloads with a custom filename instead of the raw MD5 hash.

Unmatched paths and missing files return `404`.

## Current Implementation

- `src/index.ts` — Worker entry point with the two endpoints above
- `wrangler.toml` — Worker config with R2 binding
- `test/index.spec.ts` — Unit + integration tests (Vitest, `@cloudflare/vitest-pool-workers`)
- `curriculum.json` — Local copy of the metadata for reference/test fixtures

## Dev Commands

```
npm run dev       # wrangler dev (local dev server)
npm run deploy    # wrangler deploy
npm test          # vitest
npm run cf-typegen  # wrangler types (regenerate Env from wrangler.toml)
```
