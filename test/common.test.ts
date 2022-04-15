/*
 * common.js: Tests for common utility function in nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import fs from 'fs';
import path from 'path';
import * as helpers from './helpers';
import nconf from '../src';

var mergeDir = path.join(__dirname, 'fixtures', 'merge');
var files = fs.readdirSync(mergeDir).map(function (f) { return path.join(mergeDir, f) });

describe('nconf/common', () => {
  describe('Using nconf.common module', () => {
    it('the loadFiles() method should merge the files correctly', done => {
        nconf.loadFiles(files, (err, res) => {
            helpers.assertMerged(err, res);
            done();
        });
    });
    it("the loadFilesSync() method should merge the files correctly", () => {
        helpers.assertMerged(null, nconf.loadFilesSync(files));
    });
  });
});