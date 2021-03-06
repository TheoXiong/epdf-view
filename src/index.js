import { getRandomNumber, isPDF, isInPage, waitingAsync } from './util.js'
import { getEvents, on, off, EVENT } from './domEvent.js'

const handleReady = Symbol('handleReady')
const handleStop = Symbol('handleStop')
const handleFail = Symbol('handleFail')
const handleDestroy = Symbol('handleDestroy')
const handleCallback = Symbol('handleCallback')

class EpdfView {
  constructor (url = '', containerId = '', options = {}, cb = () => {}) {
    this.containerId = containerId
    this.container = document.getElementById(containerId)
    this.url = typeof url === 'string' ? url : ''
    this.isValidURL = false
    this.options = typeof options === 'object' ? options : {}
    this[handleCallback] = cb
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
    return new Promise((resolve, reject) => {
      if (this.webview && isInPage(this.webview) && this.hasLoaded() && typeof this.webview.reload === 'function') {
        clearStatus.call(this)
        this.webview.reload()
        waitingAsync(50, 30 * 1000, () => { return this.status.domReady })
          .then((cost) => {
            resolve(cost)
          })
          .catch((err) => {
            reject(err)
          })
      } else {
        reject(new Error('Can not reload in current status.'))
      }
    })
  }
  loadURL (newUrl = '', isUpdate = false) {
    return new Promise((resolve, reject) => {
      if (this.webview && isInPage(this.webview) && this.hasLoaded() && typeof this.webview.loadURL === 'function') {
        checkNewUrl.call(this, newUrl)
          .then((url) => {
            isUpdate ? this.url = url: ''
            clearStatus.call(this)
            this.webview.loadURL(url)
            waitingAsync(50, 30 * 1000, () => { return this.status.domReady })
              .then((cost) => {
                resolve(cost)
              })
              .catch((err) => {
                reject(err)
              })
          })
          .catch((err) => {
            return reject(err)
          })
      } else {
        reject(new Error('Can not loadURL in current status.'))
      }
    })
    
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
  open (BrowserWindow, newUrl = '', options = {}) {
    return new Promise((resolve, reject) => {
      if (!(BrowserWindow && typeof BrowserWindow === 'function' && typeof BrowserWindow.getFocusedWindow === 'function')) {
        return reject(new Error('In need of a valid BrowserWindow'))
      }
      checkNewUrl.call(this, newUrl)
        .then((url) => {
          let win = new BrowserWindow(extendOpts(options))
          win.loadURL(url)
          win.on('close', () => {
            win = null
          })
          win.once('ready-to-show', () => {
            win.show()
            resolve(url)
          })
        })
        .catch((err) => {
          return reject(err)
        })
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
        console.error(`[EpdfView] The URL(${this.url}) is invalid: `)
        this[handleCallback](new Error(`The URL(${this.url}) is invalid`))
      }
    })
    .catch((err) => {
      console.error(`[EpdfView] The URL(${this.url}) is invalid: `, err)
      this[handleCallback](err)
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
    this[handleCallback](null, 'Successed to creat webview')
  } else {
    console.log(`The container(${this.containerId}) is invalid !`)
    this[handleCallback](new Error(`The container(${this.containerId}) is invalid !`))
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
  if (this.webview && typeof this.webview.getWebContents === 'function' && !this.webContents ) {
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
          console.error('err:', err)
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
      plugins: true,
      devTools: false
    }
  }
  if (!opts || typeof opts !== 'object') {
    return Object.assign(targetLeve1, targetLeve2)
  }
  Object.assign(opts, targetLeve1)
  if (typeof opts.webPreferences === 'object' && opts.webPreferences) {
    Object.keys(targetLeve2.webPreferences).forEach((key) => {
      opts.webPreferences[key] = targetLeve2.webPreferences[key]
    })
  } else {
    Object.assign(opts, targetLeve2)
  }
  return opts
}

export {
  EpdfView
}


