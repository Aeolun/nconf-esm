/*
 * memory.js: Simple memory storage engine for nconf configuration(s)
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import common from "../common.js";

const DEFAULT_ACCESS_SEPARATOR = ":";
const DEFAULT_INPUT_SEPARATOR = "__";

// Helper function for preparing a string for regex matching
function escapeRegExp(string) {
  return (
    typeof string === "string" && string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ); // $& means the whole matched string
}

//
// ### function Memory (options)
// #### @options {Object} Options for this instance
// Constructor function for the Memory nconf store which maintains
// a nested json structure based on key delimiters `:`.
//
// e.g. `my:nested:key` ==> `{ my: { nested: { key: } } }`
//
export class Memory {
  options: any
  type;
  store;
  mtimes;
  readOnly;
  loadFrom;
  accessSeparator;
  inputSeparator;
  parseValues;
  disableDefaultAccessSeparator;

  constructor(options: any = {}) {
    this.options = options;
    this.type = "memory";
    this.store = {};
    this.mtimes = {};
    this.readOnly = false;
    this.loadFrom = options.loadFrom || null;
    this.accessSeparator = options.accessSeparator || DEFAULT_ACCESS_SEPARATOR;
    this.inputSeparator = options.inputSeparator || DEFAULT_INPUT_SEPARATOR;
    this.parseValues = options.parseValues || false;
    this.disableDefaultAccessSeparator =
      options.disableDefaultAccessSeparator || false;

    if (typeof options === "string" || options instanceof RegExp) {
      this.inputSeparator = options;
    }

    if (this.loadFrom) {
      this.store = common.loadFilesSync(this.loadFrom);
    }
  }

  _normalizeKey(key) {
    let inputSeparator = this.inputSeparator;
    if (inputSeparator instanceof RegExp) {
      inputSeparator = inputSeparator.source;
    } else {
      inputSeparator = escapeRegExp(inputSeparator);
    }
    let separatorRegexStr = `${escapeRegExp(
      this.accessSeparator
    )}|${inputSeparator}`;

    if (!this.disableDefaultAccessSeparator) {
      separatorRegexStr += `|${DEFAULT_ACCESS_SEPARATOR}`;
    }

    const separatorRegEx = new RegExp(separatorRegexStr, "g");
    return key && key.replace(separatorRegEx, this.accessSeparator);
  }

  //
  // ### function get (key)
  // #### @key {string} Key to retrieve for this instance.
  // Retrieves the value for the specified key (if any).
  //
  get(key) {
    var target = this.store,
      path = common.path(this._normalizeKey(key), this.accessSeparator);

    //
    // Scope into the object to get the appropriate nested context
    //
    while (path.length > 0) {
      key = path.shift();
      if (
        target &&
        typeof target !== "string" &&
        Object.hasOwnProperty.call(target, key)
      ) {
        target = target[key];
        continue;
      }
      return undefined;
    }

    return target;
  }

  //
  // ### function set (key, value)
  // #### @key {string} Key to set in this instance
  // #### @value {literal|Object} Value for the specified key
  // Sets the `value` for the specified `key` in this instance.
  //
  set(key, value) {
    if (this.readOnly) {
      return false;
    }

    var target = this.store,
      path = common.path(this._normalizeKey(key), this.accessSeparator);

    if (path.length === 0) {
      //
      // Root must be an object
      //
      if (!value || typeof value !== "object") {
        return false;
      } else {
        this.reset();
        this.store = value;
        return true;
      }
    }

    //
    // Update the `mtime` (modified time) of the key
    //
    this.mtimes[key] = Date.now();

    //
    // Scope into the object to get the appropriate nested context
    //
    while (path.length > 1) {
      key = path.shift();
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }

      target = target[key];
    }

    // Set the specified value in the nested JSON structure
    key = path.shift();
    if (this.parseValues) {
      value = common.parseValues.call(common, value);
    }
    target[key] = value;
    return true;
  }

  //
  // ### function clear (key)
  // #### @key {string} Key to remove from this instance
  // Removes the value for the specified `key` from this instance.
  //
  clear(key) {
    if (this.readOnly) {
      return false;
    }

    var target = this.store,
      value = target,
      path = common.path(key, this.accessSeparator);

    //
    // Remove the key from the set of `mtimes` (modified times)
    //
    delete this.mtimes[key];

    //
    // Scope into the object to get the appropriate nested context
    //
    for (var i = 0; i < path.length - 1; i++) {
      key = path[i];
      value = target[key];
      if (typeof value !== "function" && typeof value !== "object") {
        return false;
      }
      target = value;
    }

    // Delete the key from the nested JSON structure
    key = path[i];
    delete target[key];
    return true;
  }

  //
  // ### function merge (key, value)
  // #### @key {string} Key to merge the value into
  // #### @value {literal|Object} Value to merge into the key
  // Merges the properties in `value` into the existing object value
  // at `key`. If the existing value `key` is not an Object, it will be
  // completely overwritten.
  //
  merge(key, value) {
    if (this.readOnly) {
      return false;
    }

    //
    // If the key is not an `Object` or is an `Array`,
    // then simply set it. Merging is for Objects.
    //
    if (typeof value !== "object" || Array.isArray(value) || value === null) {
      return this.set(key, value);
    }

    var self = this,
      target = this.store,
      path = common.path(key, this.accessSeparator),
      fullKey = key;

    //
    // Update the `mtime` (modified time) of the key
    //
    this.mtimes[key] = Date.now();

    //
    // Scope into the object to get the appropriate nested context
    //
    while (path.length > 1) {
      key = path.shift();
      if (!target[key]) {
        target[key] = {};
      }

      target = target[key];
    }

    // Set the specified value in the nested JSON structure
    key = path.shift();

    //
    // If the current value at the key target is not an `Object`,
    // or is an `Array` then simply override it because the new value
    // is an Object.
    //
    if (typeof target[key] !== "object" || Array.isArray(target[key])) {
      target[key] = value;
      return true;
    }

    return Object.keys(value).every(function (nested) {
      return self.merge(
        common.keyed(self.accessSeparator, fullKey, nested),
        value[nested]
      );
    });
  }

  //
  // ### function reset (callback)
  // Clears all keys associated with this instance.
  //
  reset() {
    if (this.readOnly) {
      return false;
    }

    this.mtimes = {};
    this.store = {};
    return true;
  }

  //
  // ### function loadSync
  // Returns the store managed by this instance
  //
  loadSync() {
    return this.store || {};
  }
}
