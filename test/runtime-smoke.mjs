import assert from 'node:assert/strict';
import { _$n__$M_ as map } from '@calcit/procs';
import { vals } from '../js-out/calcit.core.mjs';

// Exercise generated core against the matching JS runtime, not just codegen.
const values = vals(map('first', 1, 'second', 1));
assert.equal(values.toString(), '(#{} 1)');
