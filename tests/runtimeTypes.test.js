import test from 'node:test';
import assert from 'node:assert/strict';
import { arrayOf, isRecord, isString, numberValue, recordArray, requireRecord, stringValue } from '../src/lib/runtimeTypes.js';

test('record guards reject arrays, strings, and null', () => {
  assert.equal(isRecord({ ok: true }), true);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord('object'), false);
  assert.equal(isRecord(null), false);
  assert.throws(() => requireRecord('bad', 'LLM response'), /LLM response must be an object/);
});

test('primitive readers use safe fallbacks', () => {
  assert.equal(stringValue('value'), 'value');
  assert.equal(stringValue(7, 'fallback'), 'fallback');
  assert.equal(numberValue(12), 12);
  assert.equal(numberValue(Number.NaN, 4), 4);
});

test('array readers retain only guarded values', () => {
  assert.deepEqual(arrayOf(['a', 1, 'b'], isString), ['a', 'b']);
  assert.deepEqual(recordArray([{ id: 1 }, null, [], 'bad']), [{ id: 1 }]);
});
