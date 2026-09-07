import fs from 'fs'; import path from 'path';
import { pathToFileURL } from 'url';
const ROOT='/Users/rexzchen/Codes/PhDSim/src';
const files=[]; (function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);st.isDirectory()?w(p):p.endsWith('.js')&&files.push(p);}})(ROOT);
const scan = files.filter(f=>!f.includes('/i18n/'));
const code = scan.map(f=>[f,fs.readFileSync(f,'utf8')]);
const extra = ['/Users/rexzchen/Codes/PhDSim/scripts/balance.mjs','/Users/rexzchen/Codes/PhDSim/scripts/i18n-audit.mjs','/Users/rexzchen/Codes/PhDSim/tests/game.test.js'].filter(f=>fs.existsSync(f)).map(f=>[f,fs.readFileSync(f,'utf8')]);
const all = [...code, ...extra];
for (const f of scan.filter(f=>f.includes('/data/'))) {
  let mod; try { mod = await import(pathToFileURL(f).href); } catch(e){ console.log('SKIP',f,e.message.slice(0,60)); continue; }
  for (const name of Object.keys(mod)) {
    const v = mod[name];
    const kind = Array.isArray(v)?'array':typeof v;
    if (!['array','string','object'].includes(kind)) continue;
    const re = new RegExp(`(?:^|[^A-Za-z0-9_$.])${name}(?![A-Za-z0-9_$])`);
    const users = all.filter(([cf,t]) => cf!==f && re.test(t));
    if (!users.length) console.log(`UNUSED EXPORT ${f.replace(ROOT,'src')} :: ${name} (${kind}${kind==='array'?', '+v.length+' entries':''})`);
  }
}
