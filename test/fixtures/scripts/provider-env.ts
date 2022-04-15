/*
 * provider-argv.js: Test fixture for using process.env defaults with nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import nconf from '../../../src';

var provider = new (nconf.Provider)().env();

process.stdout.write(provider.get('SOMETHING'));