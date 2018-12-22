import { remote } from 'electron'
import { getRandomNumber, isPDF, isInPage } from './util.js'
import { getEvents, on, off, EVENT } from './event.js'

const handleReady = Symbol('handleReady')
const handleStop = Symbol('handleStop')
const handleFail = Symbol('handleFail')
const handleDestroy = Symbol('handleDestroy')

class EpdfView {
  constructor (url = '', containerId = '', options = {}) {
    this.containerId = containerId
    this.container = document.getElementById(containerId)
    this.url = typeof url === 'string' ? url : ''
    this.isValidURL = false
    this.options = typeof options === 'object' ? options : {}
    this.webview = null
    this.webContents = null
    this.status = {}
    clearStatus.call(this)
    creatHandler.call(this)
    load.call(this)
  }
  hasLoaded () {
    if (this.webview && typeof this.webview.isLoading === 'function') {
      return !this.webview.isLoading()
    } else {
      return false
    }
  }
  reload () {
    if (this.webview && isInPage(this.webview) && this.hasLoaded() && typeof this.webview.reload === 'function') {
      clearStatus.call(this)
      this.webview.reload()
    }
    return this
  }
  loadURL () {
    if (this.webview && typeof this.webview.loadURL === 'function') {
      clearStatus.call(this)
      this.webview.loadURL()
    }
    return this
  }
  destroy () {
    if (this.webview && this.status.Loaded && !this.status.destroyed) {
      unbind.call(this)
      process.nextTick(() => {
        this.webContents = null
        this.webview = null
        this.container = null
      })
      this.status.destroyed = true
    }
  }
  open (newUrl = '', options = {}) {
    checkNewUrl.call(this, newUrl)
      .then((url) => {
        console.log('extendOpts(options): ', extendOpts(options))

        const BrowserWindow = remote.BrowserWindow
        let win = new BrowserWindow(extendOpts(options))
        win.loadURL(url)
        win.show()
      })
      .catch((err) => {
        console.error('[EpdfView] open: ', err)
      })
  }
}

function load () {
  isPDF(this.url)
    .then((r) => {
      if (r) {
        this.isValidURL = true
        render.call(this)
      } else {
        console.error('[EpdfView] URL is invalid: ')
      }
    })
    .catch((err) => {
      console.error('[EpdfView] URL is invalid: ', err)
    })
}

function render () {
  if (this.container) {
    this.container.style['position'] = 'relative'
    let webview = document.createElement('webview')
    webview.style['position'] = 'absolute'
    webview.setAttribute('plugins', 'on')
    webview.style['height'] = '100%'
    webview.style['width'] = '100%'
    webview.style['top'] = '0px'
    webview.style['left'] = '0px'
    webview.id = `webview-${getRandomNumber()}`
    webview.src = this.url
    this.webview = webview

    bind.call(this)
    this.container.appendChild(webview)
  } else {
    console.log(`The container(${this.containerId}) is invalid !`)
  }
}

function creatHandler () {
  this[handleReady] = (function () {
    this.status.domReady = true
    handleWebContents.call(this)
  }).bind(this)

  this[handleStop] = (function () {
    this.status.Loaded = true
  }).bind(this)

  this[handleFail] = (function (err) {
    this.status.fail = true
    err ? this.status.error = err : ''
  }).bind(this)

  this[handleDestroy] = (function () {
    this.destroy()
  }).bind(this)
}

function handleWebContents () {
  if (this.webview && typeof this.webview.getWebContents === 'function') {
    this.webContents = this.webview.getWebContents()
    this.webContents.on('destroyed', this[handleDestroy])
  }
}

function clearStatus () {
  this.status.error = null
  this.status.domReady = false
  this.status.Loaded = false
  this.status.fail = false
  this.status.destroyed = false
}

function bind () {
  let eventNames = getEvents(this.options)
  eventNames.forEach((name) => {
    on(this.webview, name, this.options[name])
  })

  on(this.webview, EVENT.DOM_READY, this[handleReady])
  on(this.webview, EVENT.STOP_LOAD, this[handleStop])
  on(this.webview, EVENT.FAIL_LOAD, this[handleFail])
}

function unbind () {
  let eventNames = getEvents(this.options)
  eventNames.forEach((name) => {
    off(this.webview, name, this.options[name])
  })

  off(this.webview, EVENT.DOM_READY, this[handleReady])
  off(this.webview, EVENT.STOP_LOAD, this[handleStop])
  off(this.webview, EVENT.FAIL_LOAD, this[handleFail])
}

function checkNewUrl (newUrl) {
  return new Promise ((resolve, reject) => {
    if (newUrl) {
      isPDF(newUrl)
        .then((r) => {
          if (r) {
            return resolve(newUrl)
          } else {
            return reject(new Error('[EpdfView] checkNewUrl(0001): in need of a valid URL !'))
          }
        })
        .catch((err) => {
          console.error(err)
          return reject(new Error('[EpdfView] checkNewUrl(0002): in need of a valid URL !'))
        })
    } else {
      if (this.isValidURL) {
        return resolve(this.url)
      } else {
        return reject(new Error('[EpdfView] checkNewUrl(0003): in need of a valid URL !'))
      }
    }
  })
}

function extendOpts (opts) {
  const targetLeve1 = {
    show: false,
    center: true,
    autoHideMenuBar: true,
    title: 'PDF-View',
  }
  const targetLeve2 = {
    webPreferences: {
      nodeIntegration: false,
      plugins: true
    }
  }
  if (!opts || typeof opts !== 'object') {
    return Object.assign(targetLeve1, targetLeve2)
  }
  Object.assign(opts, targetLeve1)
  if (typeof opts.webPreferences === 'object' && opts.webPreferences) {
    opts.webPreferences.nodeIntegration = false
    opts.webPreferences.plugins = true
  } else {
    Object.assign(opts, targetLeve2)
  }
  return opts
}

export {
  EpdfView
}


