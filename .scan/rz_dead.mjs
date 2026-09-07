import fs from 'fs'; import path from 'path';
import { pathToFileURL } from 'url';
const ROOT='/Users/rexzchen/Codes/PhDSim/src';
const files=[]; (function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);st.isDirectory()?w(p):p.endsWith('.js')&&files.push(p);}})(ROOT);
const code = files.filter(f=>!f.includes('/i18n/')).map(f=>[f,fs.readFileSync(f,'utf8')]);
const allTxt = code.map(([,t])=>t).join('\n');
const targets = process.argv.slice(2);
for (const f of files.filter(f=>!f.includes('/i18n/')).filter(f=>!targets.length||targets.some(t=>f.includes(t)))) {
  let mod; try { mod = await import(pathToFileURL(f).href); } catch(e){ continue; }
  for (const [name, val] of Object.entries(mod)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    // is the whole object iterated / indexed dynamically?
    const dyn = new RegExp(`(Object\\.(values|keys|entries)\\(\\s*${name}|${name}\\s*\\[|pick\\([^,]+,\\s*${name}|for \\(const [^)]*of ${name}\\b)`).test(allTxt);
    for (const k of Object.keys(val)) {
      const v = val[k];
      const isStr = typeof v === 'string' || (Array.isArray(v) && typeof v[0] === 'string');
      if (!isStr) continue;
      const used = new RegExp(`(?:^|[^A-Za-z0-9_$])${k}\\b`, 'm');
      // count references to `.k` outside the defining file
      const refs = code.filter(([cf,t]) => cf!==f && new RegExp(`\\.${k}\\b|\\['${k}'\\]|\\["${k}"\\]|\\bskip${k}|\\bhold${k}`).test(t)).length;
      const selfRefs = new RegExp(`\\.${k}\\b`).test(fs.readFileSync(f,'utf8').split('export const '+name)[0]||'');
      if (!refs && !dyn) console.log(`DEAD? ${f.replace(ROOT,'src')} :: ${name}.${k}` + (Array.isArray(v)?` [${v.length} lines]`:''));
    }
  }
}
