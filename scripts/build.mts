import { readFileSync, writeFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const raw = readFileSync('curricula.yaml', 'utf8');
const data = load(raw);
const entries = data.curricula;

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKey || !secretKey) {
	console.error('R2 credentials (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) not set.');
	process.exit(1);
}

console.log(`Checking ${entries.length} PDFs in R2 bucket...`);

const s3 = new S3Client({
	region: 'auto',
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

let r2Keys = new Set<string>();
let token: string | undefined;
do {
	const res = await s3.send(new ListObjectsV2Command({
		Bucket: 'byrdocs-curriculum',
		ContinuationToken: token,
	}));
	for (const obj of res.Contents ?? []) {
		if (obj.Key) r2Keys.add(obj.Key);
	}
	token = res.NextContinuationToken;
} while (token);

const results = entries.map((entry) => {
	const key = `${entry.id}.pdf`;
	return { key, entry, ok: r2Keys.has(key) };
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

console.log('Generating src/curricula.json...');
writeFileSync('src/curricula.json', JSON.stringify(entries));
