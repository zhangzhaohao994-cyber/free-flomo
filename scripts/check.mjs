import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error('Expected one self-contained application script');
new Function(scripts[0][1]);
if(/<script[^>]+src=|<link[^>]+href="https?:/i.test(html))throw Error('Unexpected external dependency in standalone HTML');
for(const file of ['server/server.mjs','server/store.mjs','server/intelligence.mjs','server/wechat.mjs','server/remote-store.mjs','server/transfers.mjs','server/account.mjs','server.mjs','scripts/bootstrap-owner.mjs'])execFileSync(process.execPath,['--check',file]);
console.log(`Standalone HTML and backend syntax verified (${Buffer.byteLength(html).toLocaleString()} bytes HTML)`);
