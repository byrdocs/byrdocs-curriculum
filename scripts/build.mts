import { readFileSync, writeFileSync } from 'node:fs';
import { load } from 'js-yaml';

const skipValidation = process.argv.includes('--skip-validation');

const raw = readFileSync('curricula.yaml', 'utf8');
const data = load(raw);
const entries = data.curricula;

if (!skipValidation) {
	const curriculumUrl = process.env.CURRICULUM_SITE_URL;

	console.log(`Fetching R2 keys from ${curriculumUrl}/ls-bucket...`);
	const response = await fetch(`${curriculumUrl}/ls-bucket`);
	if (!response.ok) {
		console.error(`Failed to fetch /ls-bucket: ${response.status} ${response.statusText}`);
		process.exit(1);
	}
	const r2Keys = await response.json() as string[];

	console.log(`Checking ${entries.length} PDFs...`);

	const results = entries.map((entry) => {
		const key = `${entry.id}.pdf`;
		return { key, entry, ok: r2Keys.includes(key) };
	});

	for (const r of results) {
		if (r.ok) {
			console.log(`  \x1b[32m✓\x1b[0m ${r.key}`);
		} else {
			console.error(`  \x1b[31m✗\x1b[0m ${r.key} — MISSING from R2`);
		}
	}

	const missing = results.filter((r) => !r.ok).map((r) => r.entry);

	if (missing.length > 0) {
		console.error(`\nBuild failed: ${missing.length} PDF(s) missing from R2:`);
		for (const entry of missing) {
			console.error(`  - ${entry.id}.pdf ${entry.title}`);
		}
		process.exit(1);
	}

	console.log('All PDFs verified.');
}

console.log('Generating src/curricula.json...');
writeFileSync('src/curricula.json', JSON.stringify(entries));
