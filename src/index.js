import { getRandomNumber, isPDF } from './util.js'
import { getEvents, on, off, once, EVENT } from './event.js'

class EpdfView {
  constructor (containerId = '', url = '', options = {}) {
    this.containerId = containerId
    this.container = document.getElementById(containerId)
    // 
    this.url = typeof url === 'string' ? url : ''
    this.options = typeof options === 'object' ? options : {}
    this.webview = null
    // this.hasLoaded = false
    this.error = null
    this.load()
  }
  load () {
    isPDF(this.url)
      .then((r) => {
        if (r) {
          this.render()
        } else {
          console.error('[EpdfView] URL is invalid: ')
        }
      })
      .catch((err) => {
        console.error('[EpdfView] URL is invalid: ', err)
      })
  }
  render () {
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

      this.bind()
      this.container.appendChild(webview)
    } else {
      console.log(`The container(${this.containerId}) is invalid !`)
    }
  }
  bind () {
    let eventNames = getEvents(this.options)
    eventNames.forEach((name) => {
      on(this.webview, name, this.options[name])
    })

    self = this
    // on(this.webview, EVENT.STOP_LOAD, () => {
    //   // self.hasLoaded = !self.webview.isLoading()
    //   console.log('[EpdfView] load complete')
    // })
    // on(this.webview, EVENT.FAIL_LOAD, (err) => {
    //   // self.error = err
    //   console.error('[EpdfView] Failed to load: ', err)
    // })
    once(this.webview, EVENT.DESTROYED, () => {
      self.destroy()
    })
  }
  unbind () {
    let eventNames = getEvents(this.options)
    eventNames.forEach((name) => {
      off(this.webview, name, this.options[name])
    })
  }
  hasLoaded () {
    if (this.webview && typeof this.webview.isLoading === 'function') {
      return !this.webview.isLoading()
    } else {
      return false
    }
  }
  reload () {
    if (this.webview && this.hasLoaded() && typeof this.webview.reload === 'function') {
      // this.clear()
      this.webview.reload()
    }
  }
  loadURL () {
    if (this.webview && typeof this.webview.loadURL === 'function') {
      // this.clear()
      this.webview.loadURL()
    }
  }
  clear () {
    // this.hasLoaded = false
    // this.error = null
  }
  destroy () {
    this.unbind()
  }
}

export {
  EpdfView
}


