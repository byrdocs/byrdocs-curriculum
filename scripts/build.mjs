import { readFileSync, writeFileSync } from 'node:fs';
import { load } from 'js-yaml';

const raw = readFileSync('curricula.yaml', 'utf8');
const data = load(raw);
writeFileSync('src/curricula.json', JSON.stringify(data.curricula));
