!function(e){function t(e){Object.defineProperty(this,e,{enumerable:!0,get:function(){return this[m][e]}})}function r(e){var t;if(e&&e.__esModule){t={};for(var r in e)Object.hasOwnProperty.call(e,r)&&(t[r]=e[r]);t.__useDefault&&delete t.__useDefault,t.__esModule=!0}else{if("[object Module]"===Object.prototype.toString.call(e)||"undefined"!=typeof System&&System.isModule&&System.isModule(e))return e;t={default:e,__useDefault:!0}}return new o(t)}function o(e){Object.defineProperty(this,m,{value:e}),Object.keys(e).forEach(t,this)}function n(e){return"@node/"===e.substr(0,6)?c(e,r(v(e.substr(6))),{}):p[e]}function u(e){var t=n(e);if(!t)throw new Error('Module "'+e+'" expected, but not contained in build.');if(t.module)return t.module;var r=t.linkRecord;return d(t,r),a(t,r,[]),t.module}function d(e,t){if(!t.depLoads){t.declare&&i(e,t),t.depLoads=[];for(var r=0;r<t.deps.length;r++){var o=n(t.deps[r]);t.depLoads.push(o),o.linkRecord&&d(o,o.linkRecord);var u=t.setters&&t.setters[r];u&&(u(o.module||o.linkRecord.moduleObj),o.importerSetters.push(u))}return e}}function i(t,r){var o=r.moduleObj,n=t.importerSetters,u=!1,d=r.declare.call(e,function(e,t){if(!u){if("object"==typeof e)for(var r in e)"__useDefault"!==r&&(o[r]=e[r]);else o[e]=t;u=!0;for(var d=0;d<n.length;d++)n[d](o);return u=!1,t}},{id:t.key});"function"!=typeof d?(r.setters=d.setters,r.execute=d.execute):(r.setters=[],r.execute=d)}function l(e,t,r){return p[e]={key:e,module:void 0,importerSetters:[],linkRecord:{deps:t,depLoads:void 0,declare:r,setters:void 0,execute:void 0,moduleObj:{}}}}function f(e,t,r,o){return p[e]={key:e,module:void 0,importerSetters:[],linkRecord:{deps:t,depLoads:void 0,declare:void 0,execute:o,executingRequire:r,moduleObj:{default:{},__useDefault:!0},setters:void 0}}}function s(e,t,r){return function(o){for(var n=0;n<e.length;n++)if(e[n]===o){var u,d=t[n],i=d.linkRecord;return u=i?-1===r.indexOf(d)?a(d,i,r):i.moduleObj:d.module,u.__useDefault?u.default:u}}}function a(t,r,n){if(n.push(t),t.module)return t.module;var u;if(r.setters){for(var d=0;d<r.deps.length;d++){var i=r.depLoads[d],l=i.linkRecord;l&&-1===n.indexOf(i)&&(u=a(i,l,l.setters?n:[]))}r.execute.call(y)}else{var f={id:t.key},c=r.moduleObj;Object.defineProperty(f,"exports",{configurable:!0,set:function(e){c.default=e},get:function(){return c.default}});var p=s(r.deps,r.depLoads,n);if(!r.executingRequire)for(var d=0;d<r.deps.length;d++)p(r.deps[d]);var m=r.execute.call(e,p,c.default,f);if(void 0!==m?c.default=m:f.exports!==c.default&&(c.default=f.exports),c.default&&c.default.__esModule)for(var v in c.default)Object.hasOwnProperty.call(c.default,v)&&"default"!==v&&(c[v]=c.default[v])}var f=t.module=new o(r.moduleObj);if(!r.setters)for(var d=0;d<t.importerSetters.length;d++)t.importerSetters[d](f);return f}function c(e,t){return p[e]={key:e,module:t,importerSetters:[],linkRecord:void 0}}var p={},m="undefined"!=typeof Symbol?Symbol():"@@baseObject";o.prototype=Object.create(null),"undefined"!=typeof Symbol&&Symbol.toStringTag&&(o.prototype[Symbol.toStringTag]="Module");var v="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&"undefined"!=typeof require.resolve&&"undefined"!=typeof process&&process.platform&&require,y={};return Object.freeze&&Object.freeze(y),function(e,t,n,d){return function(i){i(function(i){var s={_nodeRequire:v,register:l,registerDynamic:f,registry:{get:function(e){return p[e].module},set:c},newModule:function(e){return new o(e)}};c("@empty",new o({}));for(var a=0;a<t.length;a++)c(t[a],r(arguments[a],{}));d(s);var m=u(e[0]);if(e.length>1)for(var a=1;a<e.length;a++)u(e[a]);return n?m.default:(m instanceof o&&Object.defineProperty(m,"__esModule",{value:!0}),m)})}}}("undefined"!=typeof self?self:global)

(["a"], [], false, function($__System) {
var require = this.require, exports = this.exports, module = this.module;
$__System.registerDynamic('b', ['c'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  // More proper implementation would be
  // isDescriptor(obj) || isStamp(obj)
  // but there is no sense since stamp is function and function is object.
  module.exports = $__require('c');
});
$__System.registerDynamic('d', ['e', 'f', 'c', '10', 'b', '11', '12'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  var isArray = $__require('e');
  var isFunction = $__require('f');
  var isObject = $__require('c');
  var isStamp = $__require('10');
  var isComposable = $__require('b');

  var assign = $__require('11');
  var merge = $__require('12');

  var slice = Array.prototype.slice;

  /**
   * Creates new factory instance.
   * @returns {Function} The new factory function.
   */
  function createFactory() {
    return function Stamp(options) {
      var descriptor = Stamp.compose || {};
      // Next line was optimized for most JS VMs. Please, be careful here!
      var obj = { __proto__: descriptor.methods }; // jshint ignore:line

      merge(obj, descriptor.deepProperties);
      assign(obj, descriptor.properties);
      Object.defineProperties(obj, descriptor.propertyDescriptors || {});

      if (!descriptor.initializers || descriptor.initializers.length === 0) return obj;

      if (options === undefined) options = {};
      var inits = descriptor.initializers;
      var length = inits.length;
      for (var i = 0; i < length; i += 1) {
        var initializer = inits[i];
        if (isFunction(initializer)) {
          var returnedValue = initializer.call(obj, options, { instance: obj, stamp: Stamp, args: slice.apply(arguments) });
          obj = returnedValue === undefined ? obj : returnedValue;
        }
      }

      return obj;
    };
  }

  /**
   * Returns a new stamp given a descriptor and a compose function implementation.
   * @param {Descriptor} [descriptor={}] The information about the object the stamp will be creating.
   * @param {Compose} composeFunction The "compose" function implementation.
   * @returns {Stamp}
   */
  function createStamp(descriptor, composeFunction) {
    var Stamp = createFactory();

    if (descriptor.staticDeepProperties) {
      merge(Stamp, descriptor.staticDeepProperties);
    }
    if (descriptor.staticProperties) {
      assign(Stamp, descriptor.staticProperties);
    }
    if (descriptor.staticPropertyDescriptors) {
      Object.defineProperties(Stamp, descriptor.staticPropertyDescriptors);
    }

    var composeImplementation = isFunction(Stamp.compose) ? Stamp.compose : composeFunction;
    Stamp.compose = function _compose() {
      'use strict'; // to make sure `this` is not pointing to `global` or `window`

      return composeImplementation.apply(this, arguments);
    };
    assign(Stamp.compose, descriptor);

    return Stamp;
  }

  function concatAssignFunctions(dstObject, srcArray, propName) {
    if (!isArray(srcArray)) return;

    var length = srcArray.length;
    var dstArray = dstObject[propName] || [];
    dstObject[propName] = dstArray;
    for (var i = 0; i < length; i += 1) {
      var fn = srcArray[i];
      if (isFunction(fn) && dstArray.indexOf(fn) < 0) {
        dstArray.push(fn);
      }
    }
  }

  function combineProperties(dstObject, srcObject, propName, action) {
    if (!isObject(srcObject[propName])) return;
    if (!isObject(dstObject[propName])) dstObject[propName] = {};
    action(dstObject[propName], srcObject[propName]);
  }

  function deepMergeAssign(dstObject, srcObject, propName) {
    combineProperties(dstObject, srcObject, propName, merge);
  }
  function mergeAssign(dstObject, srcObject, propName) {
    combineProperties(dstObject, srcObject, propName, assign);
  }

  /**
   * Mutates the dstDescriptor by merging the srcComposable data into it.
   * @param {Descriptor} dstDescriptor The descriptor object to merge into.
   * @param {Composable} [srcComposable] The composable
   * (either descriptor or stamp) to merge data form.
   */
  function mergeComposable(dstDescriptor, srcComposable) {
    var srcDescriptor = srcComposable && srcComposable.compose || srcComposable;

    mergeAssign(dstDescriptor, srcDescriptor, 'methods');
    mergeAssign(dstDescriptor, srcDescriptor, 'properties');
    deepMergeAssign(dstDescriptor, srcDescriptor, 'deepProperties');
    mergeAssign(dstDescriptor, srcDescriptor, 'propertyDescriptors');
    mergeAssign(dstDescriptor, srcDescriptor, 'staticProperties');
    deepMergeAssign(dstDescriptor, srcDescriptor, 'staticDeepProperties');
    mergeAssign(dstDescriptor, srcDescriptor, 'staticPropertyDescriptors');
    mergeAssign(dstDescriptor, srcDescriptor, 'configuration');
    deepMergeAssign(dstDescriptor, srcDescriptor, 'deepConfiguration');
    concatAssignFunctions(dstDescriptor, srcDescriptor.initializers, 'initializers');
    concatAssignFunctions(dstDescriptor, srcDescriptor.composers, 'composers');
  }

  /**
   * Given the list of composables (stamp descriptors and stamps) returns
   * a new stamp (composable factory function).
   * @typedef {Function} Compose
   * @param {...(Composable)} [arguments] The list of composables.
   * @returns {Stamp} A new stamp (aka composable factory function)
   */
  module.exports = function compose() {
    'use strict'; // to make sure `this` is not pointing to `global` or `window`

    var descriptor = {};
    var composables = [];
    if (isComposable(this)) {
      mergeComposable(descriptor, this);
      composables.push(this);
    }

    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (isComposable(arg)) {
        mergeComposable(descriptor, arg);
        composables.push(arg);
      }
    }

    var stamp = createStamp(descriptor, compose);

    var composers = descriptor.composers;
    if (isArray(composers) && composers.length > 0) {
      for (var j = 0; j < composers.length; j += 1) {
        var composer = composers[j];
        var returnedValue = composer({ stamp: stamp, composables: composables });
        stamp = isStamp(returnedValue) ? returnedValue : stamp;
      }
    }

    return stamp;
  };

  /**
   * The Stamp Descriptor
   * @typedef {Function|Object} Descriptor
   * @returns {Stamp} A new stamp based on this Stamp
   * @property {Object} [methods] Methods or other data used as object instances' prototype
   * @property {Array<Function>} [initializers] List of initializers called for each object instance
   * @property {Array<Function>} [composers] List of callbacks called each time a composition happens
   * @property {Object} [properties] Shallow assigned properties of object instances
   * @property {Object} [deepProperties] Deeply merged properties of object instances
   * @property {Object} [staticProperties] Shallow assigned properties of Stamps
   * @property {Object} [staticDeepProperties] Deeply merged properties of Stamps
   * @property {Object} [configuration] Shallow assigned properties of Stamp arbitrary metadata
   * @property {Object} [deepConfiguration] Deeply merged properties of Stamp arbitrary metadata
   * @property {Object} [propertyDescriptors] ES5 Property Descriptors applied to object instances
   * @property {Object} [staticPropertyDescriptors] ES5 Property Descriptors applied to Stamps
   */

  /**
   * The Stamp factory function
   * @typedef {Function} Stamp
   * @returns {*} Instantiated object
   * @property {Descriptor} compose - The Stamp descriptor and composition function
   */

  /**
   * A composable object - stamp or descriptor
   * @typedef {Stamp|Descriptor} Composable
   */
});
$__System.registerDynamic('13', ['d'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  var compose = $__require('d');

  function createShortcut(propName) {
    return function (arg) {
      'use strict';

      var param = {};
      param[propName] = arg;
      return this && this.compose ? this.compose(param) : compose(param);
    };
  }

  var properties = createShortcut('properties');
  var staticProperties = createShortcut('staticProperties');
  var configuration = createShortcut('configuration');
  var deepProperties = createShortcut('deepProperties');
  var staticDeepProperties = createShortcut('staticDeepProperties');
  var deepConfiguration = createShortcut('deepConfiguration');
  var initializers = createShortcut('initializers');

  module.exports = compose({
    staticProperties: {
      methods: createShortcut('methods'),

      props: properties,
      properties: properties,

      statics: staticProperties,
      staticProperties: staticProperties,

      conf: configuration,
      configuration: configuration,

      deepProps: deepProperties,
      deepProperties: deepProperties,

      deepStatics: staticDeepProperties,
      staticDeepProperties: staticDeepProperties,

      deepConf: deepConfiguration,
      deepConfiguration: deepConfiguration,

      init: initializers,
      initializers: initializers,

      composers: createShortcut('composers'),

      propertyDescriptors: createShortcut('propertyDescriptors'),

      staticPropertyDescriptors: createShortcut('staticPropertyDescriptors')
    }
  });
});
$__System.registerDynamic('10', ['f'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  var isFunction = $__require('f');

  module.exports = function isStamp(arg) {
    return isFunction(arg) && isFunction(arg.compose);
  };
});
$__System.registerDynamic('f', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = function isFunction(arg) {
    return typeof arg === 'function';
  };
});
$__System.registerDynamic('14', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
  };
});
$__System.registerDynamic('c', [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = function isObject(arg) {
    var type = typeof arg;
    return Boolean(arg) && (type === 'object' || type === 'function');
  };
});
$__System.registerDynamic("e", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = Array.isArray;
});
$__System.registerDynamic('12', ['14', 'c', 'e'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  var isPlainObject = $__require('14');
  var isObject = $__require('c');
  var isArray = $__require('e');

  /**
   * The 'src' argument plays the command role.
   * The returned values is always of the same type as the 'src'.
   * @param dst The object to merge into
   * @param src The object to merge from
   * @returns {*}
   */
  function mergeOne(dst, src) {
    if (src === undefined) return dst;

    // According to specification arrays must be concatenated.
    // Also, the '.concat' creates a new array instance. Overrides the 'dst'.
    if (isArray(src)) return (isArray(dst) ? dst : []).concat(src);

    // Now deal with non plain 'src' object. 'src' overrides 'dst'
    // Note that functions are also assigned! We do not deep merge functions.
    if (!isPlainObject(src)) return src;

    // See if 'dst' is allowed to be mutated.
    // If not - it's overridden with a new plain object.
    var returnValue = isObject(dst) ? dst : {};

    var keys = Object.keys(src);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];

      var srcValue = src[key];
      // Do not merge properties with the 'undefined' value.
      if (srcValue !== undefined) {
        var dstValue = returnValue[key];
        // Recursive calls to mergeOne() must allow only plain objects or arrays in dst
        var newDst = isPlainObject(dstValue) || isArray(srcValue) ? dstValue : {};

        // deep merge each property. Recursion!
        returnValue[key] = mergeOne(newDst, srcValue);
      }
    }

    return returnValue;
  }

  module.exports = function (dst) {
    for (var i = 1; i < arguments.length; i++) {
      dst = mergeOne(dst, arguments[i]);
    }
    return dst;
  };
});
$__System.registerDynamic("11", [], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  module.exports = Object.assign;
});
$__System.registerDynamic('15', ['d', '13', '10', 'c', 'f', '12', '11'], true, function ($__require, exports, module) {
  var global = this || self,
      GLOBAL = global;
  var compose = $__require('d');
  var Shortcut = $__require('13');
  var isStamp = $__require('10');
  var isObject = $__require('c');
  var isFunction = $__require('f');
  var merge = $__require('12');
  var assign = $__require('11');

  var concat = Array.prototype.concat;
  function extractFunctions() {
    var fns = concat.apply([], arguments).filter(isFunction);
    return fns.length === 0 ? undefined : fns;
  }

  function standardiseDescriptor(descr) {
    if (!isObject(descr)) return descr;

    var methods = descr.methods;
    var properties = descr.properties;
    var props = descr.props;
    var initializers = descr.initializers;
    var init = descr.init;
    var composers = descr.composers;
    var deepProperties = descr.deepProperties;
    var deepProps = descr.deepProps;
    var pd = descr.propertyDescriptors;
    var staticProperties = descr.staticProperties;
    var statics = descr.statics;
    var staticDeepProperties = descr.staticDeepProperties;
    var deepStatics = descr.deepStatics;
    var spd = descr.staticPropertyDescriptors;
    var configuration = descr.configuration;
    var conf = descr.conf;
    var deepConfiguration = descr.deepConfiguration;
    var deepConf = descr.deepConf;

    var p = isObject(props) || isObject(properties) ? assign({}, props, properties) : undefined;

    var dp = isObject(deepProps) ? merge({}, deepProps) : undefined;
    dp = isObject(deepProperties) ? merge(dp, deepProperties) : dp;

    var sp = isObject(statics) || isObject(staticProperties) ? assign({}, statics, staticProperties) : undefined;

    var sdp = isObject(deepStatics) ? merge({}, deepStatics) : undefined;
    sdp = isObject(staticDeepProperties) ? merge(sdp, staticDeepProperties) : sdp;

    var c = isObject(conf) || isObject(configuration) ? assign({}, conf, configuration) : undefined;

    var dc = isObject(deepConf) ? merge({}, deepConf) : undefined;
    dc = isObject(deepConfiguration) ? merge(dc, deepConfiguration) : dc;

    var ii = extractFunctions(init, initializers);

    var cc = extractFunctions(composers);

    var descriptor = {};
    if (methods) descriptor.methods = methods;
    if (p) descriptor.properties = p;
    if (ii) descriptor.initializers = ii;
    if (cc) descriptor.composers = cc;
    if (dp) descriptor.deepProperties = dp;
    if (sp) descriptor.staticProperties = sp;
    if (sdp) descriptor.staticDeepProperties = sdp;
    if (pd) descriptor.propertyDescriptors = pd;
    if (spd) descriptor.staticPropertyDescriptors = spd;
    if (c) descriptor.configuration = c;
    if (dc) descriptor.deepConfiguration = dc;

    return descriptor;
  }

  function stampit() {
    'use strict'; // to make sure `this` is not pointing to `global` or `window`

    var length = arguments.length,
        args = [];
    for (var i = 0; i < length; i += 1) {
      var arg = arguments[i];
      args.push(isStamp(arg) ? arg : standardiseDescriptor(arg));
    }

    return compose.apply(this || baseStampit, args); // jshint ignore:line
  }

  var baseStampit = Shortcut.compose({
    staticProperties: {
      create: function () {
        return this.apply(this, arguments);
      },
      compose: stampit // infecting
    }
  });

  var shortcuts = Shortcut.compose.staticProperties;
  for (var prop in shortcuts) stampit[prop] = shortcuts[prop].bind(baseStampit);
  stampit.compose = stampit.bind();

  module.exports = stampit;
});
$__System.register('a', ['15'], function (_export, _context) {
  "use strict";

  var stampit, _defineProperty, CaptainHook$1, properties, methods, base_plugin, basePluginStamp;

  /**
   * Constructor/initializer for this plugin.
   * 
   * We only keep track of uptime.
   */
  function init() {
    var _this3 = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$log = _ref.log,
        log = _ref$log === undefined ? console : _ref$log;

    this.log = log;

    this.interval_secondly = setInterval(function () {
      // run every second
      _this3.uptime++;
    }, 1000);
  }

  // mix in event emitter behavior
  return {
    setters: [function (_) {
      stampit = _.default;
    }],
    execute: function () {
      _defineProperty = function (obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          obj[key] = value;
        }

        return obj;
      };

      CaptainHook$1 = function CaptainHook$1() {
        var _ref2;

        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$on_prop = _ref.on_prop,
            on_prop = _ref$on_prop === undefined ? 'on' : _ref$on_prop,
            _ref$once_prop = _ref.once_prop,
            once_prop = _ref$once_prop === undefined ? 'once' : _ref$once_prop,
            _ref$off_prop = _ref.off_prop,
            off_prop = _ref$off_prop === undefined ? 'off' : _ref$off_prop,
            _ref$emit_prop = _ref.emit_prop,
            emit_prop = _ref$emit_prop === undefined ? '_emit' : _ref$emit_prop,
            _ref$handlers_prop = _ref.handlers_prop,
            handlers_prop = _ref$handlers_prop === undefined ? '_handlers' : _ref$handlers_prop;

        var privatehandlers = void 0;
        if (handlers_prop == null) {
          // Use a truly private storage for event handlers instead of a
          // publicly accessible one.
          privatehandlers = {};
        }

        return _ref2 = {}, _defineProperty(_ref2, on_prop, function (eventname, callable) {
          var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          var handler = {
            callable: callable,
            tag: options.tag,
            priority: options.priority || 10,
            context: options.context || this,
            once: options.once || false
          };

          // Choose and initialize the handlers storage
          var handlers = void 0;
          if (handlers_prop) {
            if (!this[handlers_prop]) {
              // Only ran once.
              // `this` will be the instance, not the prototype.
              this[handlers_prop] = {};
            }
            handlers = this[handlers_prop];
          } else {
            // Use the privately scoped storage instead.
            handlers = privatehandlers;
          }

          if (!handlers[eventname]) {
            handlers[eventname] = [handler];
          } else {
            handlers[eventname].push(handler);
          }
          handlers[eventname].sort(function (a, b) {
            return b.priority - a.priority;
          });
        }), _defineProperty(_ref2, once_prop, function (eventname, callable) {
          var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          options.once = true;
          this[on_prop](eventname, callable, options);
        }), _defineProperty(_ref2, off_prop, function (eventname, tag) {
          // Choose the handlers storage.
          var handlers = void 0;
          if (handlers_prop) {
            handlers = this[handlers_prop];
          } else {
            handlers = privatehandlers;
          }

          if (!tag || !handlers || !handlers[eventname]) {
            // Nothing to do.
            return;
          }

          var eventhandlers = handlers[eventname];

          // Find the event handler with matching tag in the array.
          var i = 0;
          var found = false;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = eventhandlers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var eventhandler = _step.value;

              if (eventhandler.tag == tag) {
                found = true;
                break;
              }
              i++;
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          if (found) {
            // Remove this handler
            eventhandlers.splice(i, 1);
          }
        }), _defineProperty(_ref2, emit_prop, function (eventname) {
          // Choose the handlers storage.
          var handlers = void 0;
          if (handlers_prop) {
            handlers = this[handlers_prop];
          } else {
            handlers = privatehandlers;
          }

          var retvals = [];
          if (!handlers || !handlers[eventname]) {
            // Nothing to do
            return retvals;
          }

          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = handlers[eventname][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var _eventhandler$callabl;

              var eventhandler = _step2.value;

              retvals.push((_eventhandler$callabl = eventhandler.callable).call.apply(_eventhandler$callabl, [eventhandler.context].concat(args)));
            }

            // remove one-time event handlers
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          for (var i = handlers[eventname].length - 1; i >= 0; i--) {
            var handler = handlers[eventname][i];
            if (handler.once) {
              handlers[eventname].splice(i, 1);
            }
          }

          return retvals;
        }), _ref2; // return
      };

      properties = {
        session: null, // an instance of a Session (see `session.js`)
        id: null, // on the server, this is called the 'handle'
        name: 'unset', // the plugin name string in the C source code
        label: 'unset', // just used for shorter debugging
        attached: false,
        uptime: 0, // seconds since attached
        interval_secondly: null
      };
      methods = {
        /**
         * Attach the server-side plugin (by `this.name`) to the session.
         * 
         * The internal method `this._onAttached()` will be called.
         * 
         * The event 'attached' will be emitted additionally for potential subscribers.
         * 
         * @param {Session} - A Session instance (see `session.js`)
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         */
        attach: function attach(session) {
          var _this = this;

          this.log.debug("attach()");

          this.session = session;

          var msg = {
            janus: "attach",
            plugin: this.name
          };

          return this.session.send(msg).then(function (response) {
            _this.id = response.data.id;
            _this.attached = true;
            _this._onAttached();
            _this._emit('attached');
            return response;
          });
        },

        /**
         * This 'private' method is supposed to be overriden to add plugin-specific
         * behavior.
         */
        _onAttached: function _onAttached() {
          this.log.warn("_onAttached(): Handling of this event is plugin-specific. You can override the _onAttached() method with plugins-specific behavior.");
        },

        /**
         * This 'private' method is supposed to be overriden to add plugin-specific
         * behavior.
         */
        _onDetached: function _onDetached() {
          this.log.warn("_onDetached(): Handling of this event is plugin-specific. You can override the _onDetached() method with plugins-specific behavior.");
        },

        /**
         * Detach this plugin from the session.
         * 
         * The internal method `this._onDetached()` will be called.
         * 
         * The event 'detached' will be emitted additionally for potential subscribers.
         * 
         * Janus will also push an event `janus: 'detached'`.
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         */
        detach: function detach() {
          var _this2 = this;

          this.log.debug("detach()");
          return this.send({
            janus: "detach"
          }).then(function () {
            _this2.attached = false;
            _this2._onDetached();
            _this2._emit('detached');
            clearInterval(_this2.interval_secondly);
          });
        },

        /**
         * Send a plugin-related message to the janus core.
         * 
         * You should prefer the higher-level methods
         * `sendMessage(), sendTrickle(), attach(), detach(), hangup()`
         * 
         * @param {Object} obj - Should be JSON-serializable. Excpected to have a key
         * called 'janus' with one of the following values:
         * 'attach|detach|message|trickle|hangup'
         * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         **/
        send: function send(obj) {
          this.log.debug("send()");
          return this.session.send(Object.assign({ handle_id: this.id }, obj));
        },

        /**
         * Send a message to the server-side plugin.
         * 
         * Janus will call the plugin C function `.handle_message` with the provided
         * arguments.
         * 
         * @param {Object} body - Should be JSON-serializable. Janus expects this. Will be
         * provided to the `.handle_message` C function as `json_t *message`.
         * @param {Object} [jsep] - Should be JSON-serializable. Will be provided to the
         * `.handle_message` C function as `json_t *jsep`.
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         */
        sendMessage: function sendMessage(body) {
          var jsep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

          var msg = { janus: 'message' };
          if (body) {
            msg.body = body; // 'body' recognized key by Janus. 3rd arg in .handle_message().
          } else {
            msg.body = {}; // Janus requires a body, otherwise error by Janus
          }
          if (jsep) {
            msg.jsep = jsep; // 'jsep' recognized key by Janus. 4th arg in .handle_message().
          }
          this.log.debug("sendMessage()");
          return this.send(msg);
        },

        /**
         * Send trickle ICE candidates to the janus core, related to this plugin.
         * 
         * @param {[Object|Array|null]} candidate - Should be JSON-serializable.
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         */
        sendTrickle: function sendTrickle(candidate) {
          this.log.debug("sendTrickle()");
          return this.send({ janus: "trickle", candidate: candidate });
        },

        /**
         * Hangup the WebRTC peer connection, but keep the plugin attached.
         * 
         * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
         */
        hangup: function hangup() {
          this.log.debug("hangup()");
          return this.send({ janus: "hangup" });
        },

        /**
         * Receive an asynchronous (pushed) message sent by the Janus core.
         * 
         * Such messages have a 'sender' key and usually contain
         * `janus: 'event|media|webrtcup|slowlink|hangup'`
         * 
         * The parent Session is responsible for dispatching such messages here.
         * (see session.js).
         * 
         * This method always contains plugin-specific logic and should be overridden.
         * 
         * @param {Object} msg - Object parsed from server-side JSON
         */
        receive: function receive(msg) {
          if (msg.sender.toString() != this.id) {
            this.log(LOG_WARN, "Received message, but it is not for this plugin instance. This is probably the mistake of the parent application using this plugin");
            return;
          }

          this.log.warn("Received message, but handling it is plugin-specific. You should override the receive(msg) method.");
        }
      };
      Object.assign(methods, CaptainHook$1());

      base_plugin = { properties: properties, methods: methods, init: init };
      basePluginStamp = stampit({
        properties: base_plugin.properties,
        methods: base_plugin.methods,
        init: base_plugin.init
      });

      _export('default', basePluginStamp);
    }
  };
});
})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define([], factory);
  else if (typeof module == 'object' && module.exports && typeof require == 'function')
    module.exports = factory();
  else
    factory();
});
//# sourceMappingURL=base-plugin.js.map