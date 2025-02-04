/*
 * redis-store-test.js: Tests for the redis nconf storage engine.
 *
 * (C) 2011, Charlie Robbins
 *
 */

import nconf from '../../src'
import { data, merge } from '../fixtures/data'

describe('nconf/stores/redis', () => {
  let result, error
  const callback = (newError, newResult) => {
    error = newError
    result = newResult
  }
  describe("When using the nconf redis store", () => {
    const store = new nconf.Redis()
    describe("the set() method", () => {
      test("with a literal", () => {
        store.set('foo:literal', 'bazz', callback)
        expect(error).toBeUndefined()
      })
    })
  })
})
// }).addBatch({
//   : {
//     topic: ,
//     : {
//       ,
//       "with an Array": {
//         topic: function (store) {
//           store.set('foo:array', data.arr, this.callback)
//         },
//         "should respond without an error": function (err, ok) {
//           assert.isNull(err);
//         }
//       },
//       "with an Object": {
//         topic: function (store) {
//           store.set('foo:object', data.obj, this.callback)
//         },
//         "should respond without an error": function (err, ok) {
//           assert.isNull(err);
//         }
//       },
//       "with null": {
//         topic: function (store) {
//           store.set('falsy:object', null, this.callback);
//         },
//         "should respond without an error": function(err, ok) {
//           assert.isNull(err);
//         }
//       }
//     }
//   }
// }).addBatch({
//   "When using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the get() method": {
//       "with a literal value": {
//         topic: function (store) {
//           store.get('foo:literal', this.callback);
//         },
//         "should respond with the correct value": function (err, value) {
//           assert.equal(value, data.literal);
//         }
//       },
//       "with an Array value": {
//         topic: function (store) {
//           store.get('foo:array', this.callback);
//         },
//         "should respond with the correct value": function (err, value) {
//           assert.deepEqual(value, data.arr);
//         }
//       },
//       "with an Object value": {
//         topic: function (store) {
//           store.get('foo:object', this.callback);
//         },
//         "should respond with the correct value": function (err, value) {
//           assert.deepEqual(value, data.obj);
//         }
//       },
//       "with a nested Object value": {
//         topic: function (store) {
//           store.get('foo:object:auth', this.callback);
//         },
//         "should respond with the correct value": function (err, value) {
//           assert.deepEqual(value, data.obj.auth);
//         }
//       },
//       "with null": {
//         topic: function(store) {
//           store.get('falsy:object', this.callback);
//         },
//         "should respond with the correct value": function(err, value) {
//           assert.equal(value, null);
//         }
//       }
//     }
//   }
// }).addBatch({
//   "When using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the clear() method": {
//       topic: function (store) {
//         var that = this;
//         store.clear('foo', function (err) {
//           if (err) {
//             return that.callback(err);
//           }
//
//           store.get('foo', that.callback);
//         });
//       },
//       "should actually remove the value from Redis": function (err, value) {
//         assert.isNull(err);
//         assert.isNull(value);
//       }
//     }
//   }
// }).addBatch({
//   "When using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the save() method": {
//       topic: function (store) {
//         var that = this;
//         store.save(data, function (err) {
//           if (err) {
//             return that.callback(err);
//           }
//
//           store.get('obj', that.callback);
//         });
//       },
//       "should set all values correctly": function (err, value) {
//         assert.isNull(err);
//         assert.deepEqual(value, data.obj);
//       }
//     }
//   }
// }).addBatch({
//   "When using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the load() method": {
//       topic: function (store) {
//         store.load(this.callback);
//       },
//       "should respond with the correct object": function (err, value) {
//         assert.isNull(err);
//         assert.deepEqual(value, data);
//       }
//     }
//   }
// }).addBatch({
//   "when using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the merge() method": {
//       "when overriding an existing literal value": {
//         topic: function (store) {
//           var that = this;
//           store.set('merge:literal', 'string-value', function () {
//             store.merge('merge:literal', merge, function () {
//               store.get('merge:literal', that.callback);
//             });
//           });
//         },
//         "should merge correctly": function (err, data) {
//           assert.deepEqual(data, merge);
//         }
//       },
//       "when overriding an existing Array value": {
//         topic: function (store) {
//           var that = this;
//           store.set('merge:array', [1, 2, 3, 4], function () {
//             store.merge('merge:array', merge, function () {
//               store.get('merge:array', that.callback);
//             });
//           });
//         },
//         "should merge correctly": function (err, data) {
//           assert.deepEqual(data, merge);
//         }
//       },
//       "when merging into an existing Object value": {
//         topic: function (store) {
//           var that = this, current;
//           current = {
//             prop1: 2,
//             prop2: 'prop2',
//             prop3: {
//               bazz: 'bazz'
//             },
//             prop4: ['foo', 'bar']
//           };
//
//           store.set('merge:object', current, function () {
//             store.merge('merge:object', merge, function () {
//               store.get('merge:object', that.callback);
//             });
//           });
//         },
//         "should merge correctly": function (err, data) {
//           assert.equal(data['prop1'], 1);
//           assert.equal(data['prop2'].length, 3);
//           assert.deepEqual(data['prop3'], {
//             foo: 'bar',
//             bar: 'foo',
//             bazz: 'bazz'
//           });
//           assert.equal(data['prop4'].length, 2);
//         }
//       }
//     }
//   }
// }).addBatch({
//   "When using the nconf redis store": {
//     topic: new nconf.Redis(),
//     "the reset() method": {
//       topic: function (store) {
//         var that = this;
//         this.store = store;
//
//         store.reset(function (err) {
//           if (err) {
//             return that.callback(err);
//           }
//
//           store.get('obj', that.callback);
//         });
//       },
//       "should remove all keys from redis": function (err, value) {
//         assert.isNull(err);
//         assert.isNull(value);
//         assert.length(Object.keys(this.store.cache.store), 0);
//       }
//     }
//   }
// }).export(module);