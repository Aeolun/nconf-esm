/*
 * argv.js: Simple memory-based store for command-line arguments.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import common from "../common.js";
import { Memory } from "./memory.js";
import yargsLib from 'yargs';

function isYargs(obj) {
  return (
    (typeof obj === "function" || typeof obj === "object") && "argv" in obj
  );
}

//
// ### function Argv (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Argv nconf store, a simple abstraction
// around the Memory store that can read command-line arguments.
//
export class Argv extends Memory {
  usage;
  transform;
  showHelp;
  help;

  constructor(options: any = {}, usage?: any) {
    super(options);

    this.type = "argv";
    this.readOnly = options.readOnly !== undefined ? options.readOnly : true;
    this.usage = usage;

    if (typeof options.readOnly === "boolean") {
      this.readOnly = options.readOnly;
      delete options.readOnly;
      // FIXME; should not mutate options!!!!
    } else {
      this.readOnly = true;
    }

    if (typeof options.transform === "function") {
      this.transform = options.transform;
      delete options.transform;
    } else {
      this.transform = false;
    }
  }

  //
  // ### function loadSync ()
  // Loads the data passed in from `process.argv` into this instance.
  //
  loadSync() {
    this.loadArgv();
    return this.store;
  }

  //
  // ### function loadArgv ()
  // Loads the data passed in from the command-line arguments
  // into this instance.
  //
  loadArgv() {
    var self = this,
      argv;

    // Only pass things that could conceivably be yargs options
    const filteredOptions: Record<string, any> = {}
    Object.keys(this.options).filter(o => {
      return typeof this.options[o] === 'object'
    }).forEach(o => {
      filteredOptions[o] = this.options[o]
    })

    const yargs = isYargs(this.options)
      ? this.options
      : typeof this.options === "object"
      ? yargsLib(process.argv.slice(2)).options(filteredOptions)
      : yargsLib(process.argv.slice(2));

    if (typeof this.usage === "string") {
      yargs.usage(this.usage);
    }

    argv = yargs.argv;

    if (!argv) {
      return;
    }

    if (this.transform) {
      argv = common.transform(argv, this.transform);
    }

    var tempWrite = false;

    if (this.readOnly) {
      this.readOnly = false;
      tempWrite = true;
    }

    Object.keys(argv).forEach(function (key) {
      var val = argv[key];

      if (typeof val !== "undefined") {
        if (self.parseValues) {
          val = common.parseValues(val);
        }

        self.set(key, val);
      }
    });

    this.showHelp = yargs.showHelp;
    this.help = yargs.help;

    if (tempWrite) {
      this.readOnly = true;
    }
    return this.store;
  }
}
