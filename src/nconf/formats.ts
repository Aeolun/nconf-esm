/*
 * formats.js: Default formats supported by nconf
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import * as oini from "ini";

//
// ### @json
// Standard JSON format which pretty prints `.stringify()`.
//
const json = {
  stringify: function (obj, replacer, spacing) {
    return JSON.stringify(obj, replacer || null, spacing || 2);
  },
  parse: JSON.parse,
};

export default {
  json,
  ini: oini,
};
