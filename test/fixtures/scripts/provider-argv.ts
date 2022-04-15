/*
 * provider-argv.js: Test fixture for using yargs defaults with nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import nconf from '../../../src';

var provider = new (nconf.Provider)().argv();

process.stdout.write(provider.get('something'));
