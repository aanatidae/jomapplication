// Browser-only bootstrap for a confirmed empty development project. Produces a
// local SQL transaction from versioned migrations, recording CLI-compatible history.
// Never re-run this on an existing/applied schema. Use CLI db push for later work.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort();
const history = `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
alter table supabase_migrations.schema_migrations enable row level security;
revoke all on schema supabase_migrations from anon, authenticated;
revoke all on supabase_migrations.schema_migrations from anon, authenticated;`;
let sql = `begin;\n${history}\n`;
for (const file of files) {
  const body = await readFile(`supabase/migrations/${file}`, 'utf8');
  const version = file.split('_')[0];
  const name = file.slice(version.length + 1, -4);
  sql += `${body}\ninsert into supabase_migrations.schema_migrations(version, statements, name) values ('${version}', array[]::text[], '${name}');\n`;
}
sql += (await readFile('supabase/seed.sql', 'utf8')) + '\ncommit;\n';
await mkdir('.local', { recursive: true });
await writeFile('.local/phase9-bootstrap.sql', sql);
console.log('Prepared .local/phase9-bootstrap.sql from versioned migrations and seed.');
