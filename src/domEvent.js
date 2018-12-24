export const EVENT = {
  START_LOAD: 'did-start-loading',
  LOAD_COMMIT: 'load-commit',
  DOM_READY: 'dom-ready',
  FRAME_FINISH: 'did-frame-finish-load',
  FINISH_LOAD: 'did-finish-load',
  STOP_LOAD: 'did-stop-loading',
  FAIL_LOAD: 'did-fail-load',
  CLOSE: 'close',
  DESTROYED :'destroyed'
}

const eventList = Object.keys(EVENT).map((key) => {
  return EVENT[key]
})

export const getEvents = (options = {}) => {
  return Object.keys(options).filter((key) => {
    return eventList.includes(key) && typeof options[key] === 'function'
  })
}

export const on = (() => {
  if (document && document.addEventListener) {
    return (element, event, handler) => {
      if (element && event && handler) {
        element.addEventListener(event, handler, false)
      }
    }
  } else if (document && document.attachEvent) {
    return (element, event, handler) => {
      if (element && event && handler) {
        element.attachEvent(`on${event}`, handler)
      }
    }
  } else {
    return () => {}
  }
})()

export const off = (() => {
  if (document && document.removeEventListener) {
    return (element, event, handler) => {
      if (element && event && handler) {
        element.removeEventListener(event, handler, false)
      }
    }
  } else if (document && document.detachEvent) {
    return (element, event, handler) => {
      if (element && event && handler) {
        element.detachEvent(`on${event}`, handler)
      }
    }
  } else {
    return () => {}
  }
})()

export const once = (element, event, fn) => {
  let listener = function () {
    if (typeof fn === 'function') {
      fn.apply(this, arguments)
    }
    off(element, event, listener)
  }
  on(element, event, listener)
}


