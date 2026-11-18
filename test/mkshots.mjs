// test screenshots go to shots/ (gitignored); make sure it exists on a fresh clone
import { mkdirSync } from 'node:fs';
mkdirSync(new URL('../shots/', import.meta.url), { recursive: true });
