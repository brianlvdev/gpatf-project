import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpile(readFileSync(new URL('../src/lib/communications.ts',import.meta.url),'utf8'),{module:ts.ModuleKind.ES2022});
const {publishedCommunications}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const items=[{id:'n',kind:'notice',active:true},{id:'a',kind:'announcement',active:true},{id:'old',active:true},{id:'paused',kind:'notice',active:false},{id:'removed',kind:'announcement',active:true,removed_at:'2026-01-01'},{id:'expired',kind:'notice',active:true,expires_at:'2025-01-01'}];
test('avisos destacados não entram no carrossel; legado continua anúncio',()=>{assert.deepEqual(publishedCommunications(items,'notice').map(a=>a.id),['n']);assert.deepEqual(publishedCommunications(items,'announcement').map(a=>a.id),['a','old']);});
test('publicações pausadas, removidas e vencidas ficam invisíveis',()=>{assert.equal(publishedCommunications(items.filter(a=>['paused','removed','expired'].includes(a.id)),'notice').length,0);assert.equal(publishedCommunications(items.filter(a=>a.id==='removed'),'announcement').length,0);});
