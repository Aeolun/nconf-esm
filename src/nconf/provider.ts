/*
 * Provider.js: Abstraction providing an interface into pluggable configuration storage.
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import * as async from 'async';
import common from './common.js';
import {Argv} from './stores/argv.js';
import {Env} from './stores/env.js';
import {File} from './stores/file.js';
import {LIB_VERSION} from '../version';
import {Literal} from './stores/literal.js';
import {Memory} from './stores/memory.js';
import {Redis} from './stores/redis.js';
import formats from './formats.js';
import {Callback, IOptions} from './types.js';

/**
 * Throw the `err` if a callback is not supplied
 */
function onError(err, callback) {
  if (callback) {
    return callback(err);
  }

  throw err;
}

//
// ### function Provider (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Provider object responsible
// for exposing the pluggable storage features of `nconf`.
//
export class Provider {
  //
  // Setup default options for working with `stores`,
  // `overrides`, `process.env` and `process.argv`.
  //
  options: IOptions = {};
  stores: Record<string, any> = {};
  sources: any[] = [];

  Argv = Argv;
  Env = Env;
  File = File;
  Literal = Literal;
  Memory = Memory;
  Redis = Redis;

  key = common.key;
  path = common.path;
  loadFiles = common.loadFiles;
  loadFilesSync = common.loadFilesSync;
  formats = formats;
  Provider = Provider;

  //
  // Expose the version from the package.json
  //
  version = LIB_VERSION;

  //
  // ### function init (options)
  // #### @options {Object} Options to initialize this instance with.
  // Initializes this instance with additional `stores` or `sources` in the
  // `options` supplied.
  //
  constructor(options: IOptions = {}) {
    this.options = options;
    const self = this;

    //
    // Add any stores passed in through the options
    // to this instance.
    //
    if (options.type) {
      this.add(options.type, options);
    } else if (options.store) {
      this.add(options.store.name || options.store.type, options.store);
    } else if (options.stores) {
      Object.keys(options.stores).forEach(name => {
        const store = options.stores[name];
        self.add(store.name || name || store.type, store);
      });
    }

    //
    // Add any read-only sources to this instance
    //
    if (options.source) {
      this.sources.push(
        this.create(options.source.type || options.source.name, options.source),
      );
    } else if (options.sources) {
      Object.keys(options.sources).forEach(name => {
        const source = options.sources[name];
        self.sources.push(
          self.create(source.type || source.name || name, source),
        );
      });
    }
  }

  //
  // Define wrapper functions for using basic stores
  // in this instance
  //
  public argv(...argus) {
    const args = ['argv'].concat(Array.prototype.slice.call(argus));
    return this.add.apply(this, args);
  }

  public env(...argus) {
    const args = ['env'].concat(Array.prototype.slice.call(argus));
    return this.add.apply(this, args);
  }

  //
  // Define wrapper functions for using
  // overrides and defaults
  //
  defaults(options) {
    options = options || {};
    if (!options.type) {
      options.type = 'literal';
    }

    return this.add('defaults', options);
  }

  overrides(options) {
    options = options || {};
    if (!options.type) {
      options.type = 'literal';
    }

    return this.add('overrides', options);
  }

  //
  // ### function file (key, options)
  // #### @key {string|Object} Fully qualified options, name of file store, or path.
  // #### @path {string|Object} **Optional** Full qualified options, or path.
  // Adds a new `File` store to this instance. Accepts the following options
  //
  //    nconf.file({ file: '.jitsuconf', dir: process.env.HOME, search: true });
  //    nconf.file('path/to/config/file');
  //    nconf.file('userconfig', 'path/to/config/file');
  //    nconf.file('userconfig', { file: '.jitsuconf', search: true });
  //
  file(key, options?: any) {
    if (arguments.length == 1) {
      options = typeof key === 'string' ? {file: key} : key;
      key = 'file';
    } else {
      options = typeof options === 'string' ? {file: options} : options;
    }

    options.type = 'file';
    return this.add(key, options);
  }

  //
  // ### function use (name, options)
  // #### @type {string} Type of the nconf store to use.
  // #### @options {Object} Options for the store instance.
  // Adds (or replaces) a new store with the specified `name`
  // and `options`. If `options.type` is not set, then `name`
  // will be used instead:
  //
  //    provider.use('file');
  //    provider.use('file', { type: 'file', filename: '/path/to/userconf' })
  //
  public use(name, options?: any) {
    options = options || {};

    function sameOptions(store) {
      return Object.keys(options).every(key => options[key] === store[key]);
    }

    const store = this.stores[name];
    const update = store && !sameOptions(store);

    if (!store || update) {
      if (update) {
        this.remove(name);
      }

      this.add(name, options);
    }

    return this;
  }

  //
  // ### function add (name, options)
  // #### @name {string} Name of the store to add to this instance
  // #### @options {Object} Options for the store to create
  // Adds a new store with the specified `name` and `options`. If `options.type`
  // is not set, then `name` will be used instead:
  //
  //    provider.add('memory');
  //    provider.add('userconf', { type: 'file', filename: '/path/to/userconf' })
  //
  add(name, options?: any, usage?: any) {
    options = options || {};
    const type = options.type || name;

    if (!this[common.capitalize(type)]) {
      throw new Error('Cannot add store with unknown type: ' + common.capitalize(type));
    }

    this.stores[name] = this.create(type, options, usage);

    if (this.stores[name].loadSync) {
      this.stores[name].loadSync();
    }

    return this;
  }

  //
  // ### function remove (name)
  // #### @name {string} Name of the store to remove from this instance
  // Removes a store with the specified `name` from this instance. Users
  // are allowed to pass in a type argument (e.g. `memory`) as name if
  // this was used in the call to `.add()`.
  //
  remove(name) {
    delete this.stores[name];
    return this;
  }

  //
  // ### function create (type, options)
  // #### @type {string} Type of the nconf store to use.
  // #### @options {Object} Options for the store instance.
  // Creates a store of the specified `type` using the
  // specified `options`.
  //
  create(type, options, usage?: any) {
    return new this[common.capitalize(type.toLowerCase())](
      options,
      usage,
    );
  }

  //
  // ### function get (key, callback)
  // #### @key {string} Key to retrieve for this instance.
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Retrieves the value for the specified key (if any).
  //
  get(key?: string, callback?: Callback) {
    if (typeof key === 'function') {
      // Allow a * key call to be made
      callback = key;
      key = null;
    }

    //
    // If there is no callback we can short-circuit into the default
    // logic for traversing stores.
    //
    if (!callback) {
      return this._execute('get', 1, key, callback);
    }

    //
    // Otherwise the asynchronous, hierarchical `get` is
    // slightly more complicated because we do not need to traverse
    // the entire set of stores, but up until there is a defined value.
    //
    let current = 0;
    const names = Object.keys(this.stores);
    const self = this;
    let response;
    const mergeObjs = [];

    async.whilst(
      cb => cb(null, typeof response === 'undefined' && current < names.length),
      next => {
        const store = self.stores[names[current]];
        current++;

        if (store.get.length >= 2) {
          return store.get(key, (err, value) => {
            if (err) {
              next(err); return;
            }

            response = value;

            // Merge objects if necessary
            if (
              response
              && typeof response === 'object'
              && !Array.isArray(response)
            ) {
              mergeObjs.push(response);
              response = undefined;
            }

            next();
          });
        }

        response = store.get(key);

        // Merge objects if necessary
        if (
          response
          && typeof response === 'object'
          && !Array.isArray(response)
        ) {
          mergeObjs.push(response);
          response = undefined;
        }

        next();
      },
      err => {
        if (!err && mergeObjs.length) {
          response = common.merge(mergeObjs.reverse());
        }

        err ? callback(err) : callback(null, response);
      },
    );
  }

  //
  // ### function any (keys, callback)
  // #### @keys {array|string...} Array of keys to query, or a variable list of strings
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Retrieves the first truthy value (if any) for the specified list of keys.
  //
  any(...argus);
  any(keys = [], callback?: Callback) {
    if (!Array.isArray(keys)) {
      keys = Array.prototype.slice.call(arguments);
      if (keys.length > 0 && typeof keys[keys.length - 1] === 'function') {
        callback = keys.pop();
      } else {
        callback = null;
      }
    }

    //
    // If there is no callback, use the short-circuited "get"
    // on each key in turn.
    //
    if (!callback) {
      let val;
      for (let i = 0; i < keys.length; ++i) {
        val = this._execute('get', 1, keys[i], callback);
        if (val) {
          return val;
        }
      }

      return null;
    }

    let keyIndex = 0;
    let result;
    const self = this;

    async.whilst(
      cb => cb(null, !result && keyIndex < keys.length),
      next => {
        const key = keys[keyIndex];
        keyIndex++;

        self.get(key, (err, v) => {
          if (err) {
            next(err);
          } else {
            result = v;
            next();
          }
        });
      },
      err => {
        err ? callback(err) : callback(null, result);
      },
    );
  }

  //
  // ### function set (key, value, callback)
  // #### @key {string} Key to set in this instance
  // #### @value {literal|Object} Value for the specified key
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Sets the `value` for the specified `key` in this instance.
  //
  set(key, value?: any, callback?: Callback) {
    return this._execute('set', 2, key, value, callback);
  }

  //
  // ### function required (keys)
  // #### @keys {array} List of keys
  // Throws an error if any of `keys` has no value, otherwise returns `true`
  required(keys) {
    if (!Array.isArray(keys)) {
      throw new Error('Incorrect parameter, array expected');
    }

    const missing = [];
    keys.forEach(function (key) {
      if (typeof this.get(key) === 'undefined') {
        missing.push(key);
      }
    }, this);

    if (missing.length) {
      throw new Error('Missing required keys: ' + missing.join(', '));
    } else {
      return this;
    }
  }

  //
  // ### function reset (callback)
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Clears all keys associated with this instance.
  //
  reset(callback?: Callback) {
    return this._execute('reset', 0, callback);
  }

  //
  // ### function clear (key, callback)
  // #### @key {string} Key to remove from this instance
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Removes the value for the specified `key` from this instance.
  //
  clear(key, callback?: Callback) {
    return this._execute('clear', 1, key, callback);
  }

  //
  // ### function merge ([key,] value [, callback])
  // #### @key {string} Key to merge the value into
  // #### @value {literal|Object} Value to merge into the key
  // #### @callback {function} **Optional** Continuation to respond to when complete.
  // Merges the properties in `value` into the existing object value at `key`.
  //
  // 1. If the existing value `key` is not an Object, it will be completely overwritten.
  // 2. If `key` is not supplied, then the `value` will be merged into the root.
  //
  merge(...argus) {
    const self = this;
    const args = Array.prototype.slice.call(argus);
    const callback = typeof args[args.length - 1] === 'function' && args.pop();
    const value = args.pop();
    const key = args.pop();

    function mergeProperty(prop, next) {
      return self._execute('merge', 2, prop, value[prop], next);
    }

    if (!key) {
      if (Array.isArray(value) || typeof value !== 'object') {
        return onError(
          new Error('Cannot merge non-Object into top-level.'),
          callback,
        );
      }

      async.forEach(
        Object.keys(value),
        mergeProperty,
        callback || (() => {}),
      ); return;
    }

    return this._execute('merge', 2, key, value, callback);
  }

  //
  // ### function load (callback)
  // #### @callback {function} Continuation to respond to when complete.
  // Responds with an Object representing all keys associated in this instance.
  //
  public load(callback?: Callback) {
    const self = this;

    function getStores() {
      const stores = Object.keys(self.stores);
      stores.reverse();
      return stores.map(name => self.stores[name]);
    }

    function loadStoreSync(store) {
      if (!store.loadSync) {
        throw new Error(
          'nconf store ' + store.type + ' has no loadSync() method',
        );
      }

      return store.loadSync();
    }

    function loadStore(store, next) {
      if (!store.load && !store.loadSync) {
        return next(
          new Error('nconf store ' + store.type + ' has no load() method'),
        );
      }

      return store.loadSync ? next(null, store.loadSync()) : store.load(next);
    }

    function loadBatch(targets, done?: any) {
      if (!done) {
        return common.merge(targets.map(loadStoreSync));
      }

      async.map(targets, loadStore, (err, objs) => err ? done(err) : done(null, common.merge(objs)));
    }

    function mergeSources(data) {
      //
      // If `data` was returned then merge it into
      // the system store.
      //
      if (data && typeof data === 'object') {
        self.use('sources', {
          type: 'literal',
          store: data,
        });
      }
    }

    function loadSources() {
      const sourceHierarchy = self.sources.splice(0);
      sourceHierarchy.reverse();

      //
      // If we don't have a callback and the current
      // store is capable of loading synchronously
      // then do so.
      //
      if (!callback) {
        mergeSources(loadBatch(sourceHierarchy));
        return loadBatch(getStores());
      }

      loadBatch(sourceHierarchy, (err, data) => {
        if (err) {
          callback(err); return;
        }

        mergeSources(data);
        return loadBatch(getStores(), callback);
      });
    }

    return self.sources.length
      ? loadSources()
      : loadBatch(getStores(), callback);
  }

  //
  // ### function save (callback)
  // #### @callback {function} **optional**  Continuation to respond to when
  // complete.
  // Instructs each provider to save.  If a callback is provided, we will attempt
  // asynchronous saves on the providers, falling back to synchronous saves if
  // this isn't possible.  If a provider does not know how to save, it will be
  // ignored.  Returns an object consisting of all of the data which was
  // actually saved.
  //
  save(value?: any, callback?: Callback) {
    if (!callback && typeof value === 'function') {
      callback = value;
      value = null;
    }

    const self = this;
    const names = Object.keys(this.stores);

    function saveStoreSync(memo, name) {
      const store = self.stores[name];

      //
      // If the `store` doesn't have a `saveSync` method,
      // just ignore it and continue.
      //
      if (store.saveSync) {
        const ret = store.saveSync();
        if (typeof ret === 'object' && ret !== null) {
          memo.push(ret);
        }
      }

      return memo;
    }

    function saveStore(memo, name, next) {
      const store = self.stores[name];

      //
      // If the `store` doesn't have a `save` or saveSync`
      // method(s), just ignore it and continue.
      //

      if (store.save) {
        return store.save(value, (err, data) => {
          if (err) {
            return next(err);
          }

          if (typeof data === 'object' && data !== null) {
            memo.push(data);
          }

          next(null, memo);
        });
      }

      if (store.saveSync) {
        memo.push(store.saveSync());
      }

      next(null, memo);
    }

    //
    // If we don't have a callback and the current
    // store is capable of saving synchronously
    // then do so.
    //
    if (!callback) {
      return common.merge(names.reduce(saveStoreSync, []));
    }

    async.reduce(names, [], saveStore, (err, objs) => {
      err ? callback(err) : callback(null, common.merge(objs));
    });
  }

  //
  // ### @private function _execute (action, syncLength, [arguments])
  // #### @action {string} Action to execute on `this.store`.
  // #### @syncLength {number} Function length of the sync version.
  // #### @arguments {Array} Arguments array to apply to the action
  // Executes the specified `action` on all stores for this instance, ensuring a callback supplied
  // to a synchronous store function is still invoked.
  //
  _execute(action, syncLength, ...args) {
    const callback = typeof args[args.length - 1] === 'function' && args.pop();
    const destructive = ['set', 'clear', 'merge', 'reset'].includes(action);
    const self = this;
    let response;
    const mergeObjs = [];
    const keys = Object.keys(this.stores);

    function runAction(name, next) {
      const store = self.stores[name];

      if (destructive && store.readOnly) {
        return next();
      }

      return store[action].length > syncLength
        ? store[action].apply(store, args.concat(next))
        : next(null, store[action].apply(store, args));
    }

    if (callback) {
      async.forEach(keys, runAction, err => err ? callback(err) : callback()); return;
    }

    keys.forEach(name => {
      if (typeof response === 'undefined') {
        const store = self.stores[name];

        if (destructive && store.readOnly) {
          return;
        }

        response = store[action].apply(store, args);

        // Merge objects if necessary
        if (
          response
          && action === 'get'
          && typeof response === 'object'
          && !Array.isArray(response)
        ) {
          mergeObjs.push(response);
          response = undefined;
        }
      }
    });

    if (mergeObjs.length) {
      response = common.merge(mergeObjs.reverse());
    }

    return response;
  }
}
