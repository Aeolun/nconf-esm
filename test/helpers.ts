/*
 * helpers.js: Test helpers for nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

var spawn = require('child_process').spawn;
import fs from 'fs';
import path from 'path';

export const assertMerged = function (err, merged) {
  expect(err).toBeNull();
  expect(typeof merged).toBe('object');
  expect(merged.apples).toBeTruthy();
  expect(merged.bananas).toBeTruthy();
  expect(typeof merged.candy).toBe('object');
  expect(merged.candy.something1).toBeTruthy();
  expect(merged.candy.something2).toBeTruthy();
  expect(merged.candy.something3).toBeTruthy();
  expect(merged.candy.something4).toBeTruthy();
  expect(merged.dates).toBeTruthy();
  expect(merged.elderberries).toBeTruthy();
};

//FIXME TODO
export const assertSystemConf = function (options) {
  return done => {
    var env = null;

    if (options.env) {
      env = {}
      Object.keys(process.env).forEach(function (key) {
        env[key] = process.env[key];
      });

      Object.keys(options.env).forEach(function (key) {
        env[key] = options.env[key];
      });
    }

    var child = spawn('node', [options.script].concat(options.argv), {env: env});
    child.stdout.once('data', data => {
      expect(data.toString()).toEqual('foobar');
      done();
    });
  }
}

// copy a file
export const cp = function (from, to, callback) {
  fs.readFile(from, function (err, data) {
    if (err) return callback(err);
    fs.writeFile(to, data, callback);
  });
};

export const fixture = function (file) {
  return path.join(__dirname, 'fixtures', file);
};
