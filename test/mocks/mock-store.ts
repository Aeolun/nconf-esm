/*
 * mock-store.js: Mock store for ensuring certain operations are actually called.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import events from 'events'
import nconf from '../../src'

class Mock extends events.EventEmitter {
  type: string

  constructor() {
    super()

    this.type = 'mock';
  }

  //
  // ### function save (value, callback)
  // #### @value {Object} _Ignored_ Left here for consistency
  // #### @callback {function} Continuation to respond to when complete.
  // Waits `1000ms` and then calls the callback and emits the `save` event.
  //
  save(value, callback) {
    if (!callback && typeof value === 'function') {
      callback = value;
      value = null;
    }

    var self = this;

    setTimeout(function () {
      self.emit('save');
      callback();
    }, 1000);
  }
}

//@ts-ignore
nconf.Mock = Mock