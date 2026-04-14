import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Provide a placeholder DATABASE_URL so the postgres client can be instantiated.
// The DB is never queried during spec generation — only the route registry is accessed.
process.env.DATABASE_URL ??= 'postgresql://gen-spec-placeholder:x@localhost/placeholder';

const { default: app } = await import('../index.js');

const res = await app.fetch(new Request('http://localhost/api/doc/openapi.json'));
if (!res.ok) throw new Error(`Spec endpoint returned ${res.status}`);
const spec = await res.json();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specsDir = path.resolve(__dirname, '../../../specs');
await fs.mkdir(specsDir, { recursive: true });
await fs.writeFile(path.join(specsDir, 'openapi.json'), JSON.stringify(spec, null, 2) + '\n');

console.log('OpenAPI spec written to packages/api/specs/openapi.json');
process.exit(0);
