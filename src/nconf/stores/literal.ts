/*
 * literal.js: Simple literal Object store for nconf.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import { Memory } from "./memory.js";

export class Literal extends Memory {
  constructor(options: any = {}) {
    super(options);

    this.type = "literal";
    this.readOnly = true;
    this.store = options.store || options;
  }

  loadSync() {
    return this.store;
  }
}
