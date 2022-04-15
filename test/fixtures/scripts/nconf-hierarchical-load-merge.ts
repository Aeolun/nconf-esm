/*
 * nconf-hierarchical-load-merge.js: Test fixture for loading and merging nested objects across stores.
 *
 * (C) 2012, Charlie Robbins and the Contributors.
 * (C) 2012, Michael Hart
 *
 */

import path from 'path';
import nconf from '../../../src'

nconf.argv()
     .file(path.join('src', 'test', 'fixtures', 'merge', 'file1.json'));

process.stdout.write(JSON.stringify({
  apples: nconf.get('apples'),
  candy: nconf.get('candy')
}));
