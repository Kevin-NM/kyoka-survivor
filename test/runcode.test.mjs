// run-code format: v3 codes made by the previous encoder still decode; v4 round-trips levels past MAX (endless)
import { encodeRun, decodeRun } from '../src/runcode.js';
import assert from 'node:assert/strict';
const V3 = ['H8F2-7TDV-JDSW-C34D-ETX7-AZPM-B7BX-MRCN-KUZD-ZS7M-XTTM-NEPV', '9TQV-3R22-WNFH-HXRP-BKCN-8ETJ-XP2M-F5M6-9FCC-S3AZ-YDAR-MTKC']; // made with the v3 encoder (639b5a6)
const a = decodeRun(V3[0]), b = decodeRun(V3[1]);
assert.ok(a && b, 'v3 codes decode');
assert.equal(a.ver, 3); assert.equal(a.stage, 'road'); assert.equal(a.t, 1250); assert.deepEqual(a.weapons, { berry: 5, lariat: 5, beam: 3 }); assert.deepEqual(a.evo, { berry: true });
assert.deepEqual(a.passives, { shoes: 3, ribbon: 2 }); assert.deepEqual(a.boost, { b_atk: 4 }); assert.equal(a.sp, 0.4); assert.deepEqual(a.over, {});
assert.equal(b.stage, 'apple'); assert.equal(b.t, 123); assert.deepEqual(b.weapons, { berry: 2 }); assert.deepEqual(b.over, {});
const r = { ...a, id: 999, over: { berry: 37, lariat: 1, shoes: 12 } };
const c = encodeRun(r), d = decodeRun(c);
assert.ok(d, 'v4 code decodes'); assert.equal(d.ver, 4); assert.deepEqual(d.over, { berry: 37, lariat: 1, shoes: 12 });
assert.deepEqual(d.weapons, a.weapons); assert.deepEqual(d.passives, a.passives); assert.equal(d.t, 1250);
const e = decodeRun(encodeRun({ ...b, id: 5 })); assert.ok(e && e.ver === 4 && Object.keys(e.over).length === 0, 'v4 without over levels');
assert.equal(decodeRun(c.replace(/^./, ch => ch === '2' ? '3' : '2')), null, 'a typo is caught');
console.log(`run code tests passed (v3 ${V3[0].replace(/-/g, '').length} chars, v4 with over levels ${c.replace(/-/g, '').length} chars)`);
