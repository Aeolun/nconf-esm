/*
 * nconf-env.js: Test fixture for using process.env defaults with nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

var nconf = require('../../../../lib/index').default.env();

process.stdout.write(nconf.get('SOMETHING'));