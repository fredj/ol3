/**
 * Polyfill for window.requestIdleCallback().
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 *
 * @param {function} cb Callback function.
 * @return  {number} Handle id.
 */
export const requestIdleCallback = (window.requestIdleCallback !== undefined) ? window.requestIdleCallback : function(cb) {
  const start = Date.now();
  return setTimeout(function() {
    cb({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, 50 - (Date.now() - start));
      }
    });
  }, 1);
};


/**
 * Polyfill for window.cancelIdleCallback().
 * See https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback
 *
 * @param {number} id Handle id.
 */
export const cancelIdleCallback = (window.cancelIdleCallback !== undefined) ? window.cancelIdleCallback : function(id) {
  clearTimeout(id);
};


/**
 * @private
 * @param {Function} task Task.
 * @return {Function} Runner function.
*/
export function backgroundTaskRunner(task) {
  let handle = undefined;
  return function(var_args) {
    if (handle) {
      console.log('already ', handle);
    } else {
      const taskArguments = arguments;
      handle = requestIdleCallback(function(deadline) {
        if (deadline.timeRemaining() > 0) {
          console.log('running ', handle);
          task.apply(null, taskArguments);
        } else {
          console.log('no time', handle);
        }
        handle = undefined;
      });
      console.log('scheduled', handle);
    }
  };
}
