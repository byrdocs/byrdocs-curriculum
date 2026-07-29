# byrdocs-curriculum

API for serving BUPT course curriculum metadata and PDF files.

## API

Base URL: `https://curriculum.byrdocs.com`

### List all curricula

```bash
curl https://curriculum.byrdocs.com/
```

Returns `curriculum.json` — an array of a bunch of entries with `id`, `title`, `school`, `year`, and `major[]`.

### Download a PDF

```
https://curriculum.byrdocs.com/{id}
```

Replace `{id}` with the MD5 hash from the metadata.

You can also use param `title` to set a custom download filename, for example:

```
https://curriculum.byrdocs.com/08a3cce729ab303b325c69c42b548499?title=计算机学院（国家示范性软件学院）2025级本科专业培养方案
```
