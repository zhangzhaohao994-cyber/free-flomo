import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../public/speech/v1/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
for(const item of manifest.files){const bytes=await readFile(new URL(item.path,base));if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Speech asset integrity failed: '+item.path)}
console.log(`Speech assets verified: ${manifest.files.length} files, ${manifest.totalBytes} bytes`);
