'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var store = require('svelte/store');
var tc = require('@spaceavocado/type-check');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var tc__default = /*#__PURE__*/_interopDefaultLegacy(tc);

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

function isAbsolute(pathname) {
  return pathname.charAt(0) === '/';
}

// About 1.5x faster than the two-arg version of Array#splice()
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) {
    list[i] = list[k];
  }

  list.pop();
}

// This implementation is based heavily on node's url.parse
function resolvePathname(to, from) {
  if (from === undefined) from = '';

  var toParts = (to && to.split('/')) || [];
  var fromParts = (from && from.split('/')) || [];

  var isToAbs = to && isAbsolute(to);
  var isFromAbs = from && isAbsolute(from);
  var mustEndAbs = isToAbs || isFromAbs;

  if (to && isAbsolute(to)) {
    // to is absolute
    fromParts = toParts;
  } else if (toParts.length) {
    // to is relative, drop the filename
    fromParts.pop();
    fromParts = fromParts.concat(toParts);
  }

  if (!fromParts.length) return '/';

  var hasTrailingSlash;
  if (fromParts.length) {
    var last = fromParts[fromParts.length - 1];
    hasTrailingSlash = last === '.' || last === '..' || last === '';
  } else {
    hasTrailingSlash = false;
  }

  var up = 0;
  for (var i = fromParts.length; i >= 0; i--) {
    var part = fromParts[i];

    if (part === '.') {
      spliceOne(fromParts, i);
    } else if (part === '..') {
      spliceOne(fromParts, i);
      up++;
    } else if (up) {
      spliceOne(fromParts, i);
      up--;
    }
  }

  if (!mustEndAbs) for (; up--; up) fromParts.unshift('..');

  if (
    mustEndAbs &&
    fromParts[0] !== '' &&
    (!fromParts[0] || !isAbsolute(fromParts[0]))
  )
    fromParts.unshift('');

  var result = fromParts.join('/');

  if (hasTrailingSlash && result.substr(-1) !== '/') result += '/';

  return result;
}

var isProduction = "production" === 'production';
var prefix = 'Invariant failed';
function invariant(condition, message) {
    if (condition) {
        return;
    }
    if (isProduction) {
        throw new Error(prefix);
    }
    var provided = typeof message === 'function' ? message() : message;
    var value = provided ? "".concat(prefix, ": ").concat(provided) : prefix;
    throw new Error(value);
}

function addLeadingSlash(path) {
  return path.charAt(0) === '/' ? path : '/' + path;
}
function stripLeadingSlash(path) {
  return path.charAt(0) === '/' ? path.substr(1) : path;
}
function hasBasename(path, prefix) {
  return path.toLowerCase().indexOf(prefix.toLowerCase()) === 0 && '/?#'.indexOf(path.charAt(prefix.length)) !== -1;
}
function stripBasename(path, prefix) {
  return hasBasename(path, prefix) ? path.substr(prefix.length) : path;
}
function stripTrailingSlash(path) {
  return path.charAt(path.length - 1) === '/' ? path.slice(0, -1) : path;
}
function parsePath(path) {
  var pathname = path || '/';
  var search = '';
  var hash = '';
  var hashIndex = pathname.indexOf('#');

  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }

  var searchIndex = pathname.indexOf('?');

  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  };
}
function createPath(location) {
  var pathname = location.pathname,
      search = location.search,
      hash = location.hash;
  var path = pathname || '/';
  if (search && search !== '?') path += search.charAt(0) === '?' ? search : "?" + search;
  if (hash && hash !== '#') path += hash.charAt(0) === '#' ? hash : "#" + hash;
  return path;
}

function createLocation$1(path, state, key, currentLocation) {
  var location;

  if (typeof path === 'string') {
    // Two-arg form: push(path, state)
    location = parsePath(path);
    location.state = state;
  } else {
    // One-arg form: push(location)
    location = _extends({}, path);
    if (location.pathname === undefined) location.pathname = '';

    if (location.search) {
      if (location.search.charAt(0) !== '?') location.search = '?' + location.search;
    } else {
      location.search = '';
    }

    if (location.hash) {
      if (location.hash.charAt(0) !== '#') location.hash = '#' + location.hash;
    } else {
      location.hash = '';
    }

    if (state !== undefined && location.state === undefined) location.state = state;
  }

  try {
    location.pathname = decodeURI(location.pathname);
  } catch (e) {
    if (e instanceof URIError) {
      throw new URIError('Pathname "' + location.pathname + '" could not be decoded. ' + 'This is likely caused by an invalid percent-encoding.');
    } else {
      throw e;
    }
  }

  if (key) location.key = key;

  if (currentLocation) {
    // Resolve incomplete/relative pathname relative to current location.
    if (!location.pathname) {
      location.pathname = currentLocation.pathname;
    } else if (location.pathname.charAt(0) !== '/') {
      location.pathname = resolvePathname(location.pathname, currentLocation.pathname);
    }
  } else {
    // When there is no prior location and pathname is empty, set it to /
    if (!location.pathname) {
      location.pathname = '/';
    }
  }

  return location;
}

function createTransitionManager() {
  var prompt = null;

  function setPrompt(nextPrompt) {
    prompt = nextPrompt;
    return function () {
      if (prompt === nextPrompt) prompt = null;
    };
  }

  function confirmTransitionTo(location, action, getUserConfirmation, callback) {
    // TODO: If another transition starts while we're still confirming
    // the previous one, we may end up in a weird state. Figure out the
    // best way to handle this.
    if (prompt != null) {
      var result = typeof prompt === 'function' ? prompt(location, action) : prompt;

      if (typeof result === 'string') {
        if (typeof getUserConfirmation === 'function') {
          getUserConfirmation(result, callback);
        } else {
          callback(true);
        }
      } else {
        // Return false from a transition hook to cancel the transition.
        callback(result !== false);
      }
    } else {
      callback(true);
    }
  }

  var listeners = [];

  function appendListener(fn) {
    var isActive = true;

    function listener() {
      if (isActive) fn.apply(void 0, arguments);
    }

    listeners.push(listener);
    return function () {
      isActive = false;
      listeners = listeners.filter(function (item) {
        return item !== listener;
      });
    };
  }

  function notifyListeners() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    listeners.forEach(function (listener) {
      return listener.apply(void 0, args);
    });
  }

  return {
    setPrompt: setPrompt,
    confirmTransitionTo: confirmTransitionTo,
    appendListener: appendListener,
    notifyListeners: notifyListeners
  };
}

var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);
function getConfirmation(message, callback) {
  callback(window.confirm(message)); // eslint-disable-line no-alert
}
/**
 * Returns true if the HTML5 history API is supported. Taken from Modernizr.
 *
 * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
 * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
 * changed to avoid false negatives for Windows Phones: https://github.com/reactjs/react-router/issues/586
 */

function supportsHistory() {
  var ua = window.navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) && ua.indexOf('Mobile Safari') !== -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('Windows Phone') === -1) return false;
  return window.history && 'pushState' in window.history;
}
/**
 * Returns true if browser fires popstate on hash change.
 * IE10 and IE11 do not.
 */

function supportsPopStateOnHashChange() {
  return window.navigator.userAgent.indexOf('Trident') === -1;
}
/**
 * Returns false if using go(n) with hash history causes a full page reload.
 */

function supportsGoWithoutReloadUsingHash() {
  return window.navigator.userAgent.indexOf('Firefox') === -1;
}
/**
 * Returns true if a given popstate event is an extraneous WebKit event.
 * Accounts for the fact that Chrome on iOS fires real popstate events
 * containing undefined state when pressing the back button.
 */

function isExtraneousPopstateEvent(event) {
  return event.state === undefined && navigator.userAgent.indexOf('CriOS') === -1;
}

var PopStateEvent = 'popstate';
var HashChangeEvent = 'hashchange';

function getHistoryState() {
  try {
    return window.history.state || {};
  } catch (e) {
    // IE 11 sometimes throws when accessing window.history.state
    // See https://github.com/ReactTraining/history/pull/289
    return {};
  }
}
/**
 * Creates a history object that uses the HTML5 history API including
 * pushState, replaceState, and the popstate event.
 */


function createBrowserHistory(props) {
  if (props === void 0) {
    props = {};
  }

  !canUseDOM ? invariant(false) : void 0;
  var globalHistory = window.history;
  var canUseHistory = supportsHistory();
  var needsHashChangeListener = !supportsPopStateOnHashChange();
  var _props = props,
      _props$forceRefresh = _props.forceRefresh,
      forceRefresh = _props$forceRefresh === void 0 ? false : _props$forceRefresh,
      _props$getUserConfirm = _props.getUserConfirmation,
      getUserConfirmation = _props$getUserConfirm === void 0 ? getConfirmation : _props$getUserConfirm,
      _props$keyLength = _props.keyLength,
      keyLength = _props$keyLength === void 0 ? 6 : _props$keyLength;
  var basename = props.basename ? stripTrailingSlash(addLeadingSlash(props.basename)) : '';

  function getDOMLocation(historyState) {
    var _ref = historyState || {},
        key = _ref.key,
        state = _ref.state;

    var _window$location = window.location,
        pathname = _window$location.pathname,
        search = _window$location.search,
        hash = _window$location.hash;
    var path = pathname + search + hash;
    if (basename) path = stripBasename(path, basename);
    return createLocation$1(path, state, key);
  }

  function createKey() {
    return Math.random().toString(36).substr(2, keyLength);
  }

  var transitionManager = createTransitionManager();

  function setState(nextState) {
    _extends(history, nextState);

    history.length = globalHistory.length;
    transitionManager.notifyListeners(history.location, history.action);
  }

  function handlePopState(event) {
    // Ignore extraneous popstate events in WebKit.
    if (isExtraneousPopstateEvent(event)) return;
    handlePop(getDOMLocation(event.state));
  }

  function handleHashChange() {
    handlePop(getDOMLocation(getHistoryState()));
  }

  var forceNextPop = false;

  function handlePop(location) {
    if (forceNextPop) {
      forceNextPop = false;
      setState();
    } else {
      var action = 'POP';
      transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
        if (ok) {
          setState({
            action: action,
            location: location
          });
        } else {
          revertPop(location);
        }
      });
    }
  }

  function revertPop(fromLocation) {
    var toLocation = history.location; // TODO: We could probably make this more reliable by
    // keeping a list of keys we've seen in sessionStorage.
    // Instead, we just default to 0 for keys we don't know.

    var toIndex = allKeys.indexOf(toLocation.key);
    if (toIndex === -1) toIndex = 0;
    var fromIndex = allKeys.indexOf(fromLocation.key);
    if (fromIndex === -1) fromIndex = 0;
    var delta = toIndex - fromIndex;

    if (delta) {
      forceNextPop = true;
      go(delta);
    }
  }

  var initialLocation = getDOMLocation(getHistoryState());
  var allKeys = [initialLocation.key]; // Public interface

  function createHref(location) {
    return basename + createPath(location);
  }

  function push(path, state) {
    var action = 'PUSH';
    var location = createLocation$1(path, state, createKey(), history.location);
    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;
      var href = createHref(location);
      var key = location.key,
          state = location.state;

      if (canUseHistory) {
        globalHistory.pushState({
          key: key,
          state: state
        }, null, href);

        if (forceRefresh) {
          window.location.href = href;
        } else {
          var prevIndex = allKeys.indexOf(history.location.key);
          var nextKeys = allKeys.slice(0, prevIndex + 1);
          nextKeys.push(location.key);
          allKeys = nextKeys;
          setState({
            action: action,
            location: location
          });
        }
      } else {
        window.location.href = href;
      }
    });
  }

  function replace(path, state) {
    var action = 'REPLACE';
    var location = createLocation$1(path, state, createKey(), history.location);
    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;
      var href = createHref(location);
      var key = location.key,
          state = location.state;

      if (canUseHistory) {
        globalHistory.replaceState({
          key: key,
          state: state
        }, null, href);

        if (forceRefresh) {
          window.location.replace(href);
        } else {
          var prevIndex = allKeys.indexOf(history.location.key);
          if (prevIndex !== -1) allKeys[prevIndex] = location.key;
          setState({
            action: action,
            location: location
          });
        }
      } else {
        window.location.replace(href);
      }
    });
  }

  function go(n) {
    globalHistory.go(n);
  }

  function goBack() {
    go(-1);
  }

  function goForward() {
    go(1);
  }

  var listenerCount = 0;

  function checkDOMListeners(delta) {
    listenerCount += delta;

    if (listenerCount === 1 && delta === 1) {
      window.addEventListener(PopStateEvent, handlePopState);
      if (needsHashChangeListener) window.addEventListener(HashChangeEvent, handleHashChange);
    } else if (listenerCount === 0) {
      window.removeEventListener(PopStateEvent, handlePopState);
      if (needsHashChangeListener) window.removeEventListener(HashChangeEvent, handleHashChange);
    }
  }

  var isBlocked = false;

  function block(prompt) {
    if (prompt === void 0) {
      prompt = false;
    }

    var unblock = transitionManager.setPrompt(prompt);

    if (!isBlocked) {
      checkDOMListeners(1);
      isBlocked = true;
    }

    return function () {
      if (isBlocked) {
        isBlocked = false;
        checkDOMListeners(-1);
      }

      return unblock();
    };
  }

  function listen(listener) {
    var unlisten = transitionManager.appendListener(listener);
    checkDOMListeners(1);
    return function () {
      checkDOMListeners(-1);
      unlisten();
    };
  }

  var history = {
    length: globalHistory.length,
    action: 'POP',
    location: initialLocation,
    createHref: createHref,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    block: block,
    listen: listen
  };
  return history;
}

var HashChangeEvent$1 = 'hashchange';
var HashPathCoders = {
  hashbang: {
    encodePath: function encodePath(path) {
      return path.charAt(0) === '!' ? path : '!/' + stripLeadingSlash(path);
    },
    decodePath: function decodePath(path) {
      return path.charAt(0) === '!' ? path.substr(1) : path;
    }
  },
  noslash: {
    encodePath: stripLeadingSlash,
    decodePath: addLeadingSlash
  },
  slash: {
    encodePath: addLeadingSlash,
    decodePath: addLeadingSlash
  }
};

function stripHash(url) {
  var hashIndex = url.indexOf('#');
  return hashIndex === -1 ? url : url.slice(0, hashIndex);
}

function getHashPath() {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  var href = window.location.href;
  var hashIndex = href.indexOf('#');
  return hashIndex === -1 ? '' : href.substring(hashIndex + 1);
}

function pushHashPath(path) {
  window.location.hash = path;
}

function replaceHashPath(path) {
  window.location.replace(stripHash(window.location.href) + '#' + path);
}

function createHashHistory(props) {
  if (props === void 0) {
    props = {};
  }

  !canUseDOM ? invariant(false) : void 0;
  var globalHistory = window.history;
  supportsGoWithoutReloadUsingHash();
  var _props = props,
      _props$getUserConfirm = _props.getUserConfirmation,
      getUserConfirmation = _props$getUserConfirm === void 0 ? getConfirmation : _props$getUserConfirm,
      _props$hashType = _props.hashType,
      hashType = _props$hashType === void 0 ? 'slash' : _props$hashType;
  var basename = props.basename ? stripTrailingSlash(addLeadingSlash(props.basename)) : '';
  var _HashPathCoders$hashT = HashPathCoders[hashType],
      encodePath = _HashPathCoders$hashT.encodePath,
      decodePath = _HashPathCoders$hashT.decodePath;

  function getDOMLocation() {
    var path = decodePath(getHashPath());
    if (basename) path = stripBasename(path, basename);
    return createLocation$1(path);
  }

  var transitionManager = createTransitionManager();

  function setState(nextState) {
    _extends(history, nextState);

    history.length = globalHistory.length;
    transitionManager.notifyListeners(history.location, history.action);
  }

  var forceNextPop = false;
  var ignorePath = null;

  function locationsAreEqual$$1(a, b) {
    return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;
  }

  function handleHashChange() {
    var path = getHashPath();
    var encodedPath = encodePath(path);

    if (path !== encodedPath) {
      // Ensure we always have a properly-encoded hash.
      replaceHashPath(encodedPath);
    } else {
      var location = getDOMLocation();
      var prevLocation = history.location;
      if (!forceNextPop && locationsAreEqual$$1(prevLocation, location)) return; // A hashchange doesn't always == location change.

      if (ignorePath === createPath(location)) return; // Ignore this change; we already setState in push/replace.

      ignorePath = null;
      handlePop(location);
    }
  }

  function handlePop(location) {
    if (forceNextPop) {
      forceNextPop = false;
      setState();
    } else {
      var action = 'POP';
      transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
        if (ok) {
          setState({
            action: action,
            location: location
          });
        } else {
          revertPop(location);
        }
      });
    }
  }

  function revertPop(fromLocation) {
    var toLocation = history.location; // TODO: We could probably make this more reliable by
    // keeping a list of paths we've seen in sessionStorage.
    // Instead, we just default to 0 for paths we don't know.

    var toIndex = allPaths.lastIndexOf(createPath(toLocation));
    if (toIndex === -1) toIndex = 0;
    var fromIndex = allPaths.lastIndexOf(createPath(fromLocation));
    if (fromIndex === -1) fromIndex = 0;
    var delta = toIndex - fromIndex;

    if (delta) {
      forceNextPop = true;
      go(delta);
    }
  } // Ensure the hash is encoded properly before doing anything else.


  var path = getHashPath();
  var encodedPath = encodePath(path);
  if (path !== encodedPath) replaceHashPath(encodedPath);
  var initialLocation = getDOMLocation();
  var allPaths = [createPath(initialLocation)]; // Public interface

  function createHref(location) {
    var baseTag = document.querySelector('base');
    var href = '';

    if (baseTag && baseTag.getAttribute('href')) {
      href = stripHash(window.location.href);
    }

    return href + '#' + encodePath(basename + createPath(location));
  }

  function push(path, state) {
    var action = 'PUSH';
    var location = createLocation$1(path, undefined, undefined, history.location);
    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;
      var path = createPath(location);
      var encodedPath = encodePath(basename + path);
      var hashChanged = getHashPath() !== encodedPath;

      if (hashChanged) {
        // We cannot tell if a hashchange was caused by a PUSH, so we'd
        // rather setState here and ignore the hashchange. The caveat here
        // is that other hash histories in the page will consider it a POP.
        ignorePath = path;
        pushHashPath(encodedPath);
        var prevIndex = allPaths.lastIndexOf(createPath(history.location));
        var nextPaths = allPaths.slice(0, prevIndex + 1);
        nextPaths.push(path);
        allPaths = nextPaths;
        setState({
          action: action,
          location: location
        });
      } else {
        setState();
      }
    });
  }

  function replace(path, state) {
    var action = 'REPLACE';
    var location = createLocation$1(path, undefined, undefined, history.location);
    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function (ok) {
      if (!ok) return;
      var path = createPath(location);
      var encodedPath = encodePath(basename + path);
      var hashChanged = getHashPath() !== encodedPath;

      if (hashChanged) {
        // We cannot tell if a hashchange was caused by a REPLACE, so we'd
        // rather setState here and ignore the hashchange. The caveat here
        // is that other hash histories in the page will consider it a POP.
        ignorePath = path;
        replaceHashPath(encodedPath);
      }

      var prevIndex = allPaths.indexOf(createPath(history.location));
      if (prevIndex !== -1) allPaths[prevIndex] = path;
      setState({
        action: action,
        location: location
      });
    });
  }

  function go(n) {
    globalHistory.go(n);
  }

  function goBack() {
    go(-1);
  }

  function goForward() {
    go(1);
  }

  var listenerCount = 0;

  function checkDOMListeners(delta) {
    listenerCount += delta;

    if (listenerCount === 1 && delta === 1) {
      window.addEventListener(HashChangeEvent$1, handleHashChange);
    } else if (listenerCount === 0) {
      window.removeEventListener(HashChangeEvent$1, handleHashChange);
    }
  }

  var isBlocked = false;

  function block(prompt) {
    if (prompt === void 0) {
      prompt = false;
    }

    var unblock = transitionManager.setPrompt(prompt);

    if (!isBlocked) {
      checkDOMListeners(1);
      isBlocked = true;
    }

    return function () {
      if (isBlocked) {
        isBlocked = false;
        checkDOMListeners(-1);
      }

      return unblock();
    };
  }

  function listen(listener) {
    var unlisten = transitionManager.appendListener(listener);
    checkDOMListeners(1);
    return function () {
      checkDOMListeners(-1);
      unlisten();
    };
  }

  var history = {
    length: globalHistory.length,
    action: 'POP',
    location: initialLocation,
    createHref: createHref,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    block: block,
    listen: listen
  };
  return history;
}

/**
 * Svelte Router history module.
 * @module svelte-router/history
 */

/**
 * History modes.
 */
var HISTORY_MODE = /*#__PURE__*/function (HISTORY_MODE) {
  /** History mode. */
  HISTORY_MODE["HISTORY"] = "HISTORY";
  /** Hash mode. */
  HISTORY_MODE["HASH"] = "HASH";
  return HISTORY_MODE;
}(HISTORY_MODE || {});
/**
 * History actions.
 */
var HISTORY_ACTION = /*#__PURE__*/function (HISTORY_ACTION) {
  /** Push into location. */
  HISTORY_ACTION["PUSH"] = "PUSH";
  /** Replace in location. */
  HISTORY_ACTION["REPLACE"] = "REPLACE";
  /** Pop from the location. */
  HISTORY_ACTION["POP"] = "POP";
  return HISTORY_ACTION;
}(HISTORY_ACTION || {});

/**
 * History hash types
 */
var HASH_TYPE = /*#__PURE__*/function (HASH_TYPE) {
  /** The default. */
  HASH_TYPE["SLASH"] = "SLASH";
  /** Omit the leading slash. */
  HASH_TYPE["NOSLASH"] = "NOSLASH";
  /** Google's legacy AJAX URL format. */
  HASH_TYPE["HASHBANG"] = "HASHBANG";
  return HASH_TYPE;
}(HASH_TYPE || {});

/**
 * Create a new history wrapper.
 * @param {HISTORY_MODE} mode history mode,
 * defaults to HISTORY_MODE.HISTORY.
 * @param {object} opts options of individual modes,
 * see https://github.com/ReactTraining/history.
 * @return {object}
 */
var history = function history(mode, opts) {
  opts = opts || {};
  switch (mode) {
    case HISTORY_MODE.HISTORY:
      return createBrowserHistory(opts);
    case HISTORY_MODE.HASH:
    default:
      return createHashHistory(opts);
  }
};

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function _createForOfIteratorHelper(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (!t) {
    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
      t && (r = t);
      var n = 0,
        F = function () {};
      return {
        s: F,
        n: function () {
          return n >= r.length ? {
            done: !0
          } : {
            done: !1,
            value: r[n++]
          };
        },
        e: function (r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var o,
    a = !0,
    u = !1;
  return {
    s: function () {
      t = t.call(r);
    },
    n: function () {
      var r = t.next();
      return a = r.done, r;
    },
    e: function (r) {
      u = !0, o = r;
    },
    f: function () {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    }
  };
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * Default configs.
 */
var DEFAULT_DELIMITER = '/';
var DEFAULT_DELIMITERS = './';

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
  // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
  '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
  var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
  var pathEscaped = false;
  var res;

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue
    }

    var prev = '';
    var next = str[index];
    var name = res[2];
    var capture = res[3];
    var group = res[4];
    var modifier = res[5];

    if (!pathEscaped && path.length) {
      var k = path.length - 1;

      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k];
        path = path.slice(0, k);
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
      pathEscaped = false;
    }

    var partial = prev !== '' && next !== undefined && next !== prev;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = prev || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
    });
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (data, options) {
    var path = '';
    var encode = (options && options.encode) || encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;
        continue
      }

      var value = data ? data[token.name] : undefined;
      var segment;

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
        }

        if (value.length === 0) {
          if (token.optional) continue

          throw new TypeError('Expected "' + token.name + '" to not be empty')
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j], token);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        segment = encode(String(value), token);

        if (!matches[i].test(segment)) {
          throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
        }

        path += token.prefix + segment;
        continue
      }

      if (token.optional) {
        // Prepend partial segment prefixes.
        if (token.partial) path += token.prefix;

        continue
      }

      throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$/()])/g, '\\$1')
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options && options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  if (!keys) return path

  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        pattern: null
      });
    }
  }

  return path
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  return new RegExp('(?:' + parts.join('|') + ')', flags(options))
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  options = options || {};

  var strict = options.strict;
  var start = options.start !== false;
  var end = options.end !== false;
  var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
  var delimiters = options.delimiters || DEFAULT_DELIMITERS;
  var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
  var route = start ? '^' : '';
  var isEndDelimited = tokens.length === 0;

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
      isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
    } else {
      var capture = token.repeat
        ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
        : token.pattern;

      if (keys) keys.push(token);

      if (token.optional) {
        if (token.partial) {
          route += escapeString(token.prefix) + '(' + capture + ')?';
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')';
      }
    }
  }

  if (end) {
    if (!strict) route += '(?:' + delimiter + ')?';

    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
  } else {
    if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
    if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')';
  }

  return new RegExp(route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys)
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
  }

  return stringToRegexp(/** @type {string} */ (path), keys, options)
}
pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/**
 * String has prefix predicate.
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {boolean}
 */
function hasPrefix(s, prefix) {
  if (prefix.length == 0 || s.length == 0) {
    return false;
  }
  if (prefix.length <= s.length) {
    if (s.slice(0, prefix.length) == prefix) {
      return true;
    }
  }
  return false;
}

/**
 * String has suffix predicate.
 * @param {string} s tested string.
 * @param {string} suffix needle.
 * @return {boolean}
 */
function hasSuffix(s, suffix) {
  if (suffix.length == 0 || s.length == 0) {
    return false;
  }
  if (suffix.length <= s.length) {
    if (s.slice(-1 * suffix.length) == suffix) {
      return true;
    }
  }
  return false;
}

/**
 * Trim prefix
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {string}
 */
function trimPrefix(s, prefix) {
  if (prefix.length > 0 && hasPrefix(s, prefix)) {
    return s.substr(prefix.length);
  }
  return s;
}

/**
 * Join URL paths.
 * @param {string} a URL path A.
 * @param {string} b URL path B.
 * @return {string}
 */
function joinPath(a, b) {
  var aSlash = hasSuffix(a, '/');
  var bSlash = hasPrefix(b, '/');
  if (aSlash && bSlash) {
    return a + b.slice(1);
  }
  if (!aSlash && !bSlash) {
    return a + '/' + b;
  }
  return a + b;
}

/**
 * URL match predicate
 * @param {string} a URL a.
 * @param {string} b URL b.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
function urlMatch(a, b) {
  var sections = a.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }
  a = sections[0];
  sections = b.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }
  b = sections[0];
  if (hasPrefix(a, '/') == false) {
    a = "/".concat(a);
  }
  if (hasSuffix(a, '/') == false) {
    a = "".concat(a, "/");
  }
  if (hasPrefix(b, '/') == false) {
    b = "/".concat(b);
  }
  if (hasSuffix(b, '/') == false) {
    b = "".concat(b, "/");
  }
  return a == b;
}

/**
 * URL prefix predicate
 * @param {string} haystack URL haystack.
 * @param {string} prefix URL prefix.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
function urlPrefix(haystack, prefix) {
  if (haystack.length == 0 || prefix.length == 0) {
    return false;
  }
  if (hasPrefix(haystack, '/') == false) {
    haystack = "/".concat(haystack);
  }
  if (hasPrefix(prefix, '/') == false) {
    prefix = "/".concat(prefix);
  }
  return hasPrefix(haystack, prefix);
}

/**
 * Parsed URL object.
 */

/**
 * Extract query param and hash from URL and return
 * the base URL, dictionary of query params, and the hash.
 * @param {string} path full URL.
 * @throws an error if the URL is not valid.
 * @return {ParsedURL}
 */
function parseURL(path) {
  var hash = '';
  var sections = path.split('#');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  } else if (sections.length == 2) {
    path = sections[0];
    hash = sections[1];
  }
  sections = path.split('?');
  if (sections.length > 2) {
    throw new Error('invalid URL');
  }
  var result = {
    base: sections[0],
    query: {},
    hash: hash
  };
  if (sections.length == 2) {
    var entries = sections[1].split('&');
    var _iterator = _createForOfIteratorHelper(entries),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var entry = _step.value;
        var keyValue = entry.split('=');
        result.query[keyValue[0]] = keyValue[1];
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  return result;
}

/**
 * Get full URL from the base URL, query object, and hash.
 * @param {string} path URL base path without query or hash.
 * @param {object?} query query param dictionary.
 * @param {string} hash hash param.
 * @return {string}
 */
function fullURL(path, query, hash) {
  var queryPath = '';
  if (tc__default["default"].not.isNullOrUndefined(query)) {
    for (var key in query) {
      if (query.hasOwnProperty(key)) {
        if (queryPath.length > 0) {
          queryPath += '&';
        }
        if (typeof query[key] !== 'undefined') {
          queryPath += "".concat(key, "=").concat(query[key]);
        } else {
          queryPath += key;
        }
      }
    }
    if (queryPath.length > 0) {
      path = "".concat(path, "?").concat(queryPath);
    }
  }
  if (hash.length > 0) {
    path = "".concat(path, "#").concat(hash);
  }
  return path;
}

/**
 * History location object
 */

/**
 * Get full URL from the history location object.
 * @param {HistoryLocation} location history location objec.
 * @return {string}
 */
function historyFullURL(location) {
  return "".concat(location.pathname).concat(location.search).concat(location.hash);
}

/**
 * Is whole number predicate
 * @param {string} s Tested string.
 * @return {boolean}
 */
function isWholeNumber(s) {
  return s.match(/^0$|^[1-9]\d*$/) !== null;
}

/**
 * Is float number predicate
 * @param {string} s Tested string.
 * @return {boolean}
 */
function isFloatNumber(s) {
  return s.match(/^\d*\.\d*$/) !== null;
}

/**
 * Simple object deep clone.
 * @param {object} o source object.
 * @return {object}
 */
function deepClone(o) {
  if (tc__default["default"].isNullOrUndefined(o) || tc__default["default"].not.isObject(o)) {
    return {};
  }
  return JSON.parse(JSON.stringify(o));
}

/**
 * Name property has higher priority that path property.
 */

/**
 * Create location object.
 * @param {RawLocation} rawLocation raw location object.
 * @return {Location}
 */
function createLocation(rawLocation) {
  var location = {
    path: '',
    hash: '',
    query: {},
    params: {},
    action: HISTORY_ACTION.PUSH
  };
  location.path = rawLocation.path || '';
  if (location.path.length > 0 && hasPrefix(location.path, '/') == false) {
    location.path = '/' + location.path;
  }
  if (tc__default["default"].not.isNullOrUndefined(rawLocation.replace) && rawLocation.replace === true) {
    location.action = HISTORY_ACTION.REPLACE;
  }
  if (tc__default["default"].not.isNullOrUndefined(rawLocation.name) && tc__default["default"].isString(rawLocation.name)) {
    location.name = rawLocation.name;
  }
  if (tc__default["default"].not.isNullOrUndefined(rawLocation.hash) && tc__default["default"].isString(rawLocation.hash)) {
    location.hash = rawLocation.hash.replace('#', '');
  }

  // Param object
  if (tc__default["default"].not.isNullOrUndefined(rawLocation.params) && tc__default["default"].isObject(rawLocation.params)) {
    for (var key in rawLocation.params) {
      if (rawLocation.params.hasOwnProperty(key)) {
        location.params[key] = rawLocation.params[key];
      }
    }
  }

  // Query object
  if (tc__default["default"].not.isNullOrUndefined(rawLocation.query) && tc__default["default"].isObject(rawLocation.query)) {
    for (var _key in rawLocation.query) {
      if (rawLocation.query.hasOwnProperty(_key)) {
        location.query[_key] = rawLocation.query[_key];
      }
    }
  }
  if (location.path.length == 0) {
    return location;
  }

  // Query in URL
  try {
    var parsedURL = parseURL(location.path);
    location.path = parsedURL.base;
    location.query = _objectSpread2(_objectSpread2({}, location.query), parsedURL.query);
    if (parsedURL.hash.length > 0) {
      location.hash = parsedURL.hash;
    }
  } catch (e) {
    throw new Error("invalid URL, ".concat(e.toString()));
  }
  return location;
}

/**
 * Svelte Router route module.
 * @module svelte-router/route
 */

/**
 * Route redirect.
 * * string: plain URL.
 * * object: route name {name: 'ROUTE'}.
 * * function: callback function fn(to) to resolve the redirect.
 */

/**
 * Props passed to component.
 * * false: default. do not resolve props.
 * * true: auto-resolve props from route params.
 * * object: pass this object directly to component as props.
 * * function: callback function to resolve props from route object.
 * fn(router) => props.
 */

/**
 * Route config prefab used to generate Route RouteConfig.
 */

/**
 * Route Config
 */

/**
 * Create route config object.
 * @param {module:svelte-router/route~RouteConfig} prefab route config prefab,
 * only properties defined on svelte-router/route~RouteConfig will be used.
 * @throws Will throw an error if the route prefab config is invalid.
 * @return {module:svelte-router/route~RouteConfig}
 */
function createRouteConfig(prefab) {
  if (tc__default["default"].isNullOrUndefined(prefab) || tc__default["default"].not.isObject(prefab)) {
    throw new Error('invalid route config prefab');
  }
  if (tc__default["default"].isNullOrUndefined(prefab.path) || tc__default["default"].not.isString(prefab.path)) {
    throw new Error('invalid route config path property');
  }
  if (tc__default["default"].not.isNullOrUndefined(prefab.component) && tc__default["default"].not.isFunction(prefab.component) && tc__default["default"].not.isPromise(prefab.component)) {
    throw new Error('invalid route config component property');
  }
  if (prefab.meta && tc__default["default"].not.isObject(prefab.meta)) {
    throw new Error('invalid route config meta property');
  }
  if (tc__default["default"].isNullOrUndefined(prefab.redirect)) {
    prefab.redirect = null;
  } else if (tc__default["default"].not.isString(prefab.redirect) && tc__default["default"].not.isObject(prefab.redirect) && tc__default["default"].not.isFunction(prefab.redirect)) {
    throw new Error('invalid route config redirect property');
  }
  if (tc__default["default"].isNullOrUndefined(prefab.props)) {
    prefab.props = false;
  } else if (prefab.props !== true && tc__default["default"].not.isObject(prefab.props) && tc__default["default"].not.isFunction(prefab.props)) {
    throw new Error('invalid route config props property');
  }
  return {
    id: Symbol('Route ID'),
    path: prefab.path,
    redirect: prefab.redirect,
    component: prefab.component || false,
    async: tc__default["default"].not.isNullOrUndefined(prefab.component) && tc__default["default"].isPromise(prefab.component),
    name: prefab.name,
    meta: prefab.meta || {},
    props: prefab.props,
    children: [],
    parent: null,
    paramKeys: [],
    matcher: /^\s$/,
    generator: function generator() {
      return '';
    }
  };
}

/**
 * Route record.
 */

/**
 * Create route record.
 * @param {RouteConfig} route Matching route config.
 * @param {string[]|object} params Regex exec output or params object.
 * @return {Record}
 */
function createRouteRecord(route, params) {
  var record = {
    id: route.id,
    path: route.path,
    redirect: route.redirect,
    name: route.name,
    component: route.component || false,
    async: route.async,
    meta: route.meta,
    props: route.props,
    params: {}
  };

  /**
   * Convert value to number if possible.
   * @param {string} s Tested string.
   * @return {string|number}
   */
  var resolveNumber = function resolveNumber(s) {
    if (tc__default["default"].isNumber(s)) {
      return s;
    }
    if (isWholeNumber(s)) {
      return parseInt(s);
    } else if (isFloatNumber(s)) {
      return parseFloat(s);
    }
    return s;
  };

  // Regex array setter
  var setParamValue = function setParamValue(key, collection, index) {
    index++;
    if (+index < +params.length) {
      collection[key] = resolveNumber(params[index]);
    }
  };

  // Object setter
  if (tc__default["default"].isObject(params)) {
    setParamValue = function setParamValue(key, collection) {
      if (tc__default["default"].not.isNullOrUndefined(params[key])) {
        collection[key] = resolveNumber(params[key]);
      }
    };
  }

  // Params
  for (var i = 0; i < route.paramKeys.length; i++) {
    setParamValue(route.paramKeys[i].name, record.params, i);
  }
  return record;
}

/**
 * Route object.
 */

/**
 * Create route object.
 * @param {Location} location triggered location.
 * @param {Record[]} matches collection of matched route records.
 * @return {Route}
 */
function createRoute(location, matches) {
  // Get the last route in the stack as the resolved route
  var route = matches[matches.length - 1];
  return {
    name: route.name,
    action: location.action,
    path: location.path,
    redirect: route.redirect,
    hash: location.hash,
    fullPath: fullURL(location.path, location.query, location.hash),
    params: route.params,
    query: location.query,
    meta: route.meta,
    matched: matches
  };
}

/**
 * Deep clone route.
 * @param {Route} route source route.
 * @return {Route}
 */
function cloneRoute(route) {
  if (route == null) {
    return {};
  }
  var clone = deepClone(route);
  clone.redirect = route.redirect;
  for (var i = 0; i < route.matched.length; i++) {
    clone.matched[i].component = route.matched[i].component;
    clone.matched[i].props = route.matched[i].props;
    clone.matched[i].meta = route.matched[i].meta;
    clone.matched[i].redirect = route.matched[i].redirect;
  }
  return clone;
}

/**
 * History lib configuration.
 */

/**
 * Router configuration.
 */

/**
 * Possible actions:
 * * fn() or fn(true) = Continue.
 * * fn(false) = Abort the navigation.
 * * fn(Error) = Abort the navigation and trigger navigation error.
 * * fn(url) or fn(RawLocation) = Break the navigation
 * and resolve the new navigation.
 */

/**
 * Navigation Guard entry.
 */

/**
 * Router event listeners collection.
 */

/**
 * Svelte Router core class.
 */
var Router = /*#__PURE__*/function () {
  /**
   * @constructor
   * @param {RouterConfig} opts
   */
  function Router(opts) {
    _classCallCheck(this, Router);
    _defineProperty(this, "_mode", void 0);
    _defineProperty(this, "_basename", void 0);
    _defineProperty(this, "_routes", void 0);
    _defineProperty(this, "_activeClass", void 0);
    _defineProperty(this, "_history", void 0);
    _defineProperty(this, "_historyListener", void 0);
    _defineProperty(this, "_navigationGuards", void 0);
    _defineProperty(this, "_listeners", void 0);
    _defineProperty(this, "_currentRoute", null);
    _defineProperty(this, "_pendingRoute", null);
    _defineProperty(this, "_asyncViews", void 0);
    _defineProperty(this, "_lastCommandIsBack", false);
    // @ts-ignore
    opts = opts || {};
    opts.historyOpts = {};
    opts.mode = opts.mode || HISTORY_MODE.HISTORY;
    if (tc__default["default"].not.isEnumKey(opts.mode, HISTORY_MODE)) {
      throw new Error("invalid router mode, \"".concat(opts.mode, "\""));
    }
    opts.historyOpts.basename = opts.basename || '';
    if (tc__default["default"].not.isString(opts.historyOpts.basename)) {
      throw new Error("invalid basename, \"".concat(opts.historyOpts.basename, "\""));
    }
    if (opts.historyOpts.basename.length > 0 && hasPrefix(opts.historyOpts.basename, '/') == false) {
      opts.historyOpts.basename = '/' + opts.historyOpts.basename;
    }
    if (opts.mode == HISTORY_MODE.HASH) {
      opts.historyOpts.hashType = opts.hashType || HASH_TYPE.SLASH;
      if (tc__default["default"].not.isEnumKey(opts.historyOpts.hashType, HASH_TYPE)) {
        throw new Error("invalid hash type, \"".concat(opts.historyOpts.hashType, "\""));
      }
      opts.historyOpts.hashType = opts.historyOpts.hashType.toLowerCase();
    }
    this._mode = opts.mode;
    this._basename = opts.historyOpts.basename;
    this._routes = [];
    this._activeClass = opts.activeClass || 'active';
    this._history = history(this._mode, opts.historyOpts || {});
    this._lastCommandIsBack = false;
    this._historyListener = this._history.listen(this.onHistoryChange.bind(this));

    // Navigation guards and listeners
    this._navigationGuards = [];
    this._listeners = {
      onError: new Map(),
      onBeforeNavigation: new Map(),
      onBeforeNavigationBack: new Map(),
      onNavigationChanged: new Map()
    };

    // Current resolved route and resolved pending route
    this._currentRoute = null;
    this._pendingRoute = null;

    // Async views
    this._asyncViews = new Map();
    window.history.scrollRestoration = 'manual';
    var cb1 = function cb1() {
      var newState = Object.assign({}, window.history.state, {
        scrollPosition: {
          x: window.pageXOffset,
          y: window.pageYOffset
        }
      });
      window.history.replaceState(newState, '', location.href);
    };
    this.onBeforeNavigation(cb1);
    this.onBeforeNavigationBack(cb1);
    this.onNavigationChanged(function () {
      setTimeout(function () {
        var _window$history$state;
        window.scrollTo({
          top: ((_window$history$state = window.history.state) === null || _window$history$state === void 0 || (_window$history$state = _window$history$state.scrollPosition) === null || _window$history$state === void 0 ? void 0 : _window$history$state.y) || 0,
          // tslint:disable-next-line
          behavior: 'auto'
        });
      }, 0);
    });

    // Preprocess routes
    this.preprocessRoutes(this._routes, opts.routes);
  }

  /**
   * Trigger the on load history change.
   */
  return _createClass(Router, [{
    key: "start",
    value: function start() {
      this.onHistoryChange(this._history.location, HISTORY_ACTION.POP);
    }

    /**
     * Get router mode
     */
  }, {
    key: "mode",
    get: function get() {
      return this._mode;
    }

    /**
     * Get router basename
     */
  }, {
    key: "basename",
    get: function get() {
      return this._basename;
    }

    /**
     * Get routes
     */
  }, {
    key: "routes",
    get: function get() {
      return this._routes;
    }

    /**
     * Get current resolved route
     */
  }, {
    key: "currentRoute",
    get: function get() {
      return this._currentRoute;
    }

    /**
     * Get router link active class
     */
  }, {
    key: "activeClass",
    get: function get() {
      return this._activeClass;
    }

    /**
     * Register a navigation guard which will be called
     * whenever a navigation is triggered.
     * All registered navigation guards are resolved in sequence.
     * Navigation guard must call the next() function to continue
     * the execution of navigation change.
     * @param {function} guard Guard callback function.
     * @return {function} Unregister guard function.
     */
  }, {
    key: "navigationGuard",
    value: function navigationGuard(guard) {
      var _this = this;
      var key = Symbol();
      this._navigationGuards.push({
        key: key,
        guard: guard
      });
      return function () {
        _this.removeNavigationGuard(key);
      };
    }

    /**
     * Register a callback which will be called before
     * execution of navigation guards.
     * @param {function} callback callback function.
     * @return {function} Unregister listener function.
     */
  }, {
    key: "onBeforeNavigation",
    value: function onBeforeNavigation(callback) {
      var _this2 = this;
      var key = Symbol();
      this._listeners.onBeforeNavigation.set(key, callback);
      return function () {
        _this2._listeners.onBeforeNavigation["delete"](key);
      };
    }

    /**
     * adsasd
     * @param {function} callback callback function.
     * @return {function} Unregister listener function.
     */
  }, {
    key: "onBeforeNavigationBack",
    value: function onBeforeNavigationBack(callback) {
      var _this3 = this;
      var key = Symbol();
      this._listeners.onBeforeNavigationBack.set(key, callback);
      return function () {
        _this3._listeners.onBeforeNavigationBack["delete"](key);
      };
    }

    /**
     * Register a callback which will be called when
     * all navigation guards are resolved, and the final
     * navigation change is resolved.
     * @param {function} callback callback function.
     * @return {function} Unregister listener function.
     */
  }, {
    key: "onNavigationChanged",
    value: function onNavigationChanged(callback) {
      var _this4 = this;
      var key = Symbol();
      this._listeners.onNavigationChanged.set(key, callback);
      return function () {
        _this4._listeners.onNavigationChanged["delete"](key);
      };
    }

    /**
     * Register a callback which will be called when an error
     * is caught during a route navigation.
     * @param {function} callback Callback function.
     * @return {function} Unregister callback function.
     */
  }, {
    key: "onError",
    value: function onError(callback) {
      var _this5 = this;
      var key = Symbol();
      this._listeners.onError.set(key, callback);
      return function () {
        _this5._listeners.onError["delete"](key);
      };
    }

    /**
     * Push to navigation.
     * @param {RawLocation|string} rawLocation raw path or location object.
     * @param {function?} onComplete On complete callback function.
     * @param {function?} onAbort On abort callback function.
     * @throws When the rawLocation is invalid or when the path is invalid.
     */
  }, {
    key: "push",
    value: function push(rawLocation, onComplete, onAbort) {
      var location;
      try {
        location = this.rawLocationToLocation(rawLocation, false);
      } catch (e) {
        if (onAbort && tc__default["default"].isFunction(onAbort)) {
          onAbort();
        }
        this.notifyOnError(new Error("invalid location, ".concat(e.toString())));
        return;
      }
      this.resolveRoute(location, tc__default["default"].isFunction(onComplete) ? onComplete : undefined, tc__default["default"].isFunction(onAbort) ? onAbort : undefined);
    }

    /**
     * Replace in navigation
     * @param {RawLocation|string} rawLocation raw path or location object.
     * @param {function?} onComplete On complete callback function.
     * @param {function?} onAbort On abort callback function.
     * @throws when the rawLocation is invalid or when the path is invalid.
     */
  }, {
    key: "replace",
    value: function replace(rawLocation, onComplete, onAbort) {
      var location;
      try {
        location = this.rawLocationToLocation(rawLocation, true);
      } catch (e) {
        if (onAbort && tc__default["default"].isFunction(onAbort)) {
          onAbort();
        }
        this.notifyOnError(new Error("invalid location, ".concat(e.toString())));
        return;
      }
      this.resolveRoute(location, tc__default["default"].isFunction(onComplete) ? onComplete : undefined, tc__default["default"].isFunction(onAbort) ? onAbort : undefined);
    }

    /**
     * Go to a specific history position in the navigation history.
     * @param {number} n number of steps to forward
     * or backwards (negative number).
     */
  }, {
    key: "go",
    value: function go(n) {
      this._history.go(n);
    }

    /**
     * Go one step back in the navigation history.
     */
  }, {
    key: "back",
    value: function back() {
      this._lastCommandIsBack = true;
      this.notifyOnBeforeNavigationBack();
      this._history.goBack();
      // TODO Здесь скролл вернуть в иходную позитцию?*
    }

    /**
     * Go one step forward in the navigation history.
     */
  }, {
    key: "forward",
    value: function forward() {
      this._history.goForward();
    }

    /**
     * Generate route URL from the the raw location.
     * @param {RawLocation} rawLocation raw location object.
     * @throws when the route is not found or the route params are not valid.
     * @return {string}
     */
  }, {
    key: "routeURL",
    value: function routeURL(rawLocation) {
      if (tc__default["default"].isNullOrUndefined(rawLocation)) {
        throw new Error('invalid rawLocation');
      }
      if (tc__default["default"].isNullOrUndefined(rawLocation.name) || tc__default["default"].not.isString(rawLocation.name)) {
        throw new Error('missing or invalid route name');
      }
      if (tc__default["default"].not.isNullOrUndefined(rawLocation.params) && tc__default["default"].not.isObject(rawLocation.params)) {
        throw new Error('invalid params property, expected object.');
      }
      if (tc__default["default"].not.isNullOrUndefined(rawLocation.query) && tc__default["default"].not.isObject(rawLocation.query)) {
        throw new Error('invalid query property, expected object.');
      }
      if (tc__default["default"].not.isNullOrUndefined(rawLocation.hash) && tc__default["default"].not.isString(rawLocation.hash)) {
        throw new Error('invalid hash property');
      }
      rawLocation.params = rawLocation.params || {};
      rawLocation.query = rawLocation.query || {};
      rawLocation.hash = rawLocation.hash || '';

      // Try to find the route
      var match = this.findRouteByName(rawLocation.name, this._routes);
      if (match == null) {
        throw new Error("no matching route found for name:".concat(rawLocation.name));
      }

      // Try to generate the route URL with the given params
      // to validate the route and to get the params
      var url = '';
      try {
        url = match.generator(rawLocation.params || {});
      } catch (e) {
        throw new Error("invalid route parameters, :".concat(e.toString()));
      }

      // Resolve query params
      url = fullURL(url, rawLocation.query, rawLocation.hash);

      // Basename
      if (this._basename.length > 0) {
        url = joinPath(this._basename, url);
      }
      return url;
    }

    /**
     * Convert routes prefabs into route configs, recursively.
     * @param {RouteConfig[]} routes Routes reference collection.
     * @param {RouteConfigPrefab[]} prefabs Collection of route prefabs.
     * @param {RouteConfig|null} parent Parent route.
     */
  }, {
    key: "preprocessRoutes",
    value: function preprocessRoutes(routes, prefabs) {
      var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      for (var i = 0; i < prefabs.length; i++) {
        var route = void 0;
        try {
          prefabs[i].children = prefabs[i].children || [];
          route = createRouteConfig(prefabs[i]);
          route.parent = null;
          routes.push(route);
        } catch (e) {
          console.error(new Error("invalid route, ".concat(e.toString())));
          continue;
        }

        // Append parent path prefix
        if (parent != null) {
          route.parent = parent;
          if (route.path.length > 0) {
            route.path = joinPath(parent.path, route.path);
          } else {
            route.path = parent.path;
          }
        }

        // Generate the regex matcher and params keys
        route.paramKeys = [];
        // Any URL
        if (route.path == '*') {
          route.matcher = /.*/i;
          route.generator = function () {
            return '/';
          };
          // Regex based
        } else {
          route.matcher = pathToRegexp_1(route.path, route.paramKeys, {
            end: prefabs[i].children.length == 0
          });
          route.generator = pathToRegexp_1.compile(route.path);
        }

        // Process children
        if (prefabs[i].children.length > 0) {
          this.preprocessRoutes(route.children, prefabs[i].children, route);
        }
      }
    }

    /**
     * On history change event.
     * @param {HistoryLocation} location
     * @param {HISTORY_ACTION} action
     */
  }, {
    key: "onHistoryChange",
    value: function onHistoryChange(location, action) {
      // Resolve route when the history is popped.
      if (action == HISTORY_ACTION.POP) {
        this.push(historyFullURL(location));
      }
    }

    /**
     * Convert raw Location to Location.
     * @param {RawLocation | string} rawLocation raw path or location object.
     * @param {boolean} replace history replace flag.
     * @throws when the rawLocation is invalid or when the path is invalid.
     * @return {Location}
     */
  }, {
    key: "rawLocationToLocation",
    value: function rawLocationToLocation(rawLocation, replace) {
      if (tc__default["default"].isNullOrUndefined(rawLocation)) {
        throw new Error('invalid rawLocation');
      }
      if (tc__default["default"].isString(rawLocation)) {
        rawLocation = {
          path: rawLocation
        };
      }
      rawLocation.replace = replace;
      var location;
      try {
        location = createLocation(rawLocation);
      } catch (e) {
        throw e;
      }
      return location;
    }

    /**
     * Resolve route from the requested location.
     * @param {Location} location
     * @param {function?} onComplete On complete request callback.
     * @param {function?} onAbort On abort request callback.
     */
  }, {
    key: "resolveRoute",
    value: function resolveRoute(location, onComplete, onAbort) {
      var matches = [];
      if (this._basename.length > 0) {
        location.path = trimPrefix(location.path, this._basename);
      }

      // Resolve named route
      if (location.name) {
        var match = this.findRouteByName(location.name, this._routes);
        if (match == null) {
          if (onAbort != null) {
            onAbort();
          }
          this.notifyOnError(new Error("no matching route found for name:".concat(location.name)));
          return;
        }

        // Try to generate the route URL with the given params
        // to validate the route and to get the params
        try {
          location.path = match.generator(location.params);
        } catch (e) {
          if (onAbort != null) {
            onAbort();
          }
          this.notifyOnError(new Error("invalid route parameters, :".concat(e.toString())));
          return;
        }

        // Generate the route records
        matches.push(createRouteRecord(match, location.params));
        while (match.parent != null) {
          match = match.parent;
          matches.push(createRouteRecord(match, location.params));
        }
        if (matches.length > 1) {
          matches = matches.reverse();
        }

        // Resolved route by path
        // and generate the route records
      } else {
        if (this.matchRoute(location.path, this._routes, matches) == false) {
          if (onAbort != null) {
            onAbort();
          }
          this.notifyOnError(new Error("no matching route found for path:".concat(location.path)));
          return;
        }
      }

      // Create new pending route
      this._pendingRoute = createRoute(location, matches);

      // Resolve redirect
      if (this._pendingRoute.redirect != null) {
        this.resolveRedirect(this._pendingRoute.redirect, onComplete, onAbort);
        return;
      }

      // Skip the same location
      if (this._currentRoute && this._pendingRoute.fullPath == this._currentRoute.fullPath) {
        this._pendingRoute = null;
        if (onComplete != null) {
          onComplete();
        }
        return;
      }
      Object.freeze(this._currentRoute);
      Object.freeze(this._pendingRoute);

      // Notify all before navigation listeners
      this.notifyOnBeforeNavigation(Object.freeze(cloneRoute(this._currentRoute)), Object.freeze(cloneRoute(this._pendingRoute)));

      // Resolve navigation guards
      this.resolveNavigationGuard(0, onComplete, onAbort);
    }

    /**
     * Match route by path, recursively.
     * @param {string} path Base path without query or hash.
     * @param {RouteConfig[]} routes All routes.
     * @param {Record[]} matches Matched routes.
     * @return {boolean}
     */
  }, {
    key: "matchRoute",
    value: function matchRoute(path, routes, matches) {
      for (var i = 0; i < routes.length; i++) {
        var match = routes[i].matcher.exec(path);
        if (match) {
          matches.push(createRouteRecord(routes[i], match));
          // Final route
          if (routes[i].children.length == 0) {
            return true;
          }
          // Segment
          if (this.matchRoute(path, routes[i].children, matches)) {
            return true;
          } else {
            matches.pop();
          }
        }
      }
      return false;
    }

    /**
     * Find route by name, recursively.
     * @param {string} name Name of the route.
     * @param {RouteConfig[]} routes Route config collection.
     * @return {RouteConfig|null}
     */
  }, {
    key: "findRouteByName",
    value: function findRouteByName(name, routes) {
      for (var i = 0; i < routes.length; i++) {
        if (routes[i].name == name) {
          return routes[i];
        }
        var match = this.findRouteByName(name, routes[i].children);
        if (match != null) {
          return match;
        }
      }
      return null;
    }

    /**
     * Resolve pending route redirect.
     * @param {function|object|string} redirect Redirect resolver.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
  }, {
    key: "resolveRedirect",
    value: function resolveRedirect(redirect, onComplete, onAbort) {
      // Function
      if (tc__default["default"].isFunction(redirect)) {
        redirect = redirect(this._pendingRoute);
      }

      // External
      if (tc__default["default"].isString(redirect) && hasPrefix(redirect, 'http')) {
        window.location.replace(redirect);
        return;
      }

      // URL or Route object
      this._pendingRoute = null;
      this.push(tc__default["default"].isString(redirect) ? redirect : redirect, onComplete, onAbort);
    }

    /**
     * Resolve each navigation guard on the given index
     * It executes the navigation guard function, chained by calling of
     * the next function.
     * @param {number} index Index of the navigation guard, defaults to 0.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
  }, {
    key: "resolveNavigationGuard",
    value: function resolveNavigationGuard() {
      var _this6 = this;
      var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var onComplete = arguments.length > 1 ? arguments[1] : undefined;
      var onAbort = arguments.length > 2 ? arguments[2] : undefined;
      // There are no other guards
      // finish the navigation change
      if (index >= this._navigationGuards.length) {
        this.finishNavigationChange(onComplete, onAbort);
        return;
      }

      // Abort the pending route
      var abort = function abort() {
        var err = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        _this6._pendingRoute = null;
        if (onAbort) {
          onAbort();
        }
        if (err != null) {
          _this6.notifyOnError(new Error("navigation guard error, ".concat(err.toString())));
        }
        // Revert history if needed
        if (_this6._currentRoute != null && historyFullURL(_this6._history.location) != _this6._currentRoute.fullPath) {
          _this6._history.push(_this6._currentRoute.fullPath);
        }
      };

      // Execute the navigation guard and wait for the next callback
      this._navigationGuards[index].guard(this._currentRoute, this._pendingRoute, function (next) {
        // Continue to next guard
        if (next == undefined) {
          _this6.resolveNavigationGuard(++index, onComplete, onAbort);
          // Cancel the route change
        } else if (next === false) {
          abort();
          // Error
        } else if (tc__default["default"].isError(next)) {
          abort(next);
          // Go to different route
        } else if (tc__default["default"].isString(next) || tc__default["default"].isObject(next)) {
          _this6._pendingRoute = null;
          _this6.push(next, onComplete, onAbort);
          // Unexpected next
        } else {
          abort(new Error("unexpected next(val) value."));
        }
      });
    }

    /**
     * Notify all onError listeners
     * @param {Error} error
     */
  }, {
    key: "notifyOnError",
    value: function notifyOnError(error) {
      var _iterator = _createForOfIteratorHelper(this._listeners.onError.values()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var callback = _step.value;
          callback(error);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    /**
     * Notify all onBeforeNavigation listeners
     * @param {Route} from Current route.
     * @param {Route} to Resolved route.
     */
  }, {
    key: "notifyOnBeforeNavigation",
    value: function notifyOnBeforeNavigation(from, to) {
      if (this._lastCommandIsBack) {
        this._lastCommandIsBack = false;
        return;
      }
      var _iterator2 = _createForOfIteratorHelper(this._listeners.onBeforeNavigation.values()),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var callback = _step2.value;
          callback(from, to);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    /**
     * Notify all onBeforeNavigationBack listeners
     * @param {Route} from Current route.
     * @param {Route} to Resolved route.
     */
  }, {
    key: "notifyOnBeforeNavigationBack",
    value: function notifyOnBeforeNavigationBack() {
      var _iterator3 = _createForOfIteratorHelper(this._listeners.onBeforeNavigationBack.values()),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var callback = _step3.value;
          callback(this._currentRoute, {});
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }

    /**
     * Notify all onNavigationChanged listeners
     * @param {Route} from Current route.
     * @param {Route} to Resolved route.
     */
  }, {
    key: "notifyOnNavigationChanged",
    value: function notifyOnNavigationChanged(from, to) {
      var _iterator4 = _createForOfIteratorHelper(this._listeners.onNavigationChanged.values()),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var callback = _step4.value;
          callback(from, to);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }

    /**
     * Update the current route and update the navigation history
     * to complete the route change.
     * @param {function?} onComplete On complete callback.
     * @param {function?} onAbort On abort callback.
     */
  }, {
    key: "finishNavigationChange",
    value: function finishNavigationChange(onComplete, onAbort) {
      var _this7 = this;
      if (this._pendingRoute == null) {
        throw new Error('navigation cannot be finished, missing pending route');
      }
      var asyncPending = [];
      var _iterator5 = _createForOfIteratorHelper(this._pendingRoute.matched),
        _step5;
      try {
        var _loop = function _loop() {
          var r = _step5.value;
          if (r.async == false) {
            return 1; // continue
          }
          if (_this7._asyncViews.has(r.id) == false) {
            asyncPending.push(new Promise(function (resolve, reject) {
              r.component.then(function (m) {
                return resolve({
                  id: r.id,
                  component: m["default"]
                });
              })["catch"](function (e) {
                return reject(e);
              });
            }));
          }
        };
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          if (_loop()) continue;
        }

        // After all components are resolved.
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      var afterResolved = function afterResolved() {
        if (_this7._pendingRoute == null) {
          throw new Error('navigation cannot be finished, missing pending route');
        }
        // Get the resolved components for async views
        var _iterator6 = _createForOfIteratorHelper(_this7._pendingRoute.matched),
          _step6;
        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            var r = _step6.value;
            if (r.async == false) {
              continue;
            }
            r.component = _this7._asyncViews.get(r.id);
          }

          // notify all listeners and update the history
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }
        _this7.notifyOnNavigationChanged(Object.freeze(cloneRoute(_this7._currentRoute)), Object.freeze(cloneRoute(_this7._pendingRoute)));
        _this7._currentRoute = cloneRoute(_this7._pendingRoute);
        _this7._pendingRoute = null;

        // Resolve history update if needed
        if (historyFullURL(_this7._history.location) != _this7._currentRoute.fullPath) {
          // Push
          if (_this7._currentRoute.action == HISTORY_ACTION.PUSH) {
            _this7._history.push(_this7._currentRoute.fullPath);
            // this._historyScroll.
            // Replace
          } else if (_this7._currentRoute.action == HISTORY_ACTION.REPLACE) {
            _this7._history.replace(_this7._currentRoute.fullPath);
          }
        }
        if (onComplete != null) {
          onComplete();
        }
      };

      // Resolve lazy loaded async components
      if (asyncPending.length > 0) {
        Promise.all(asyncPending).then(function (views) {
          var _iterator7 = _createForOfIteratorHelper(views),
            _step7;
          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var v = _step7.value;
              var view = v;
              _this7._asyncViews.set(view.id, view.component);
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
          afterResolved();
        })["catch"](function (e) {
          _this7.notifyOnError(new Error("failed to load async error, ".concat(e.toString())));
          if (onAbort != null) {
            onAbort();
          }
        });
        // No pending async components
      } else {
        afterResolved();
      }
    }

    /**
     * Remove navigation guard.
     * @param {symbol} key Navigation guard key.
     */
  }, {
    key: "removeNavigationGuard",
    value: function removeNavigationGuard(key) {
      for (var i = 0; i < this._navigationGuards.length; i++) {
        if (this._navigationGuards[i].key === key) {
          this._navigationGuards.splice(i, 1);
          break;
        }
      }
    }
  }]);
}();

/**
 * Svelte Router module
 * @module svelte-router
 */

/**
 * Router store.
 * Svelte readable store of type [[Router]].
 */
exports.router = void 0;

/**
 * Create a router in read-only store.
 * Default module export.
 * @param {RouterConfig} opts Router constructor options.
 * @return {object} Svelte readable store of type [[Router]].
 */
var createRouter = function createRouter(opts) {
  exports.router = store.readable(new Router(opts));
  return exports.router;
};

exports.HASH_TYPE = HASH_TYPE;
exports.ROUTER_MODE = HISTORY_MODE;
exports["default"] = createRouter;
exports.trimPrefix = trimPrefix;
exports.urlMatch = urlMatch;
exports.urlPrefix = urlPrefix;
