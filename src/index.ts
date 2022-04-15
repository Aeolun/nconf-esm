/*
 * nconf.js: Top-level include for the nconf module
 *
 * (C) 2011, Charlie Robbins and the Contributors.
 *
 */

import { Provider } from "./nconf/provider.js";

//
// `nconf` is by default an instance of `nconf.Provider`.
//
const provider = new Provider();

export default provider
