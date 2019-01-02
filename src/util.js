import fs from 'fs'
import process from 'process'

let url = {}
if (typeof require('url') === 'object' && typeof require('url').fileURLToPath === 'function') {
  url = require('url')
} else {
  url.fileURLToPath = (urlStr) => {
    if (typeof urlStr !== 'string' || !(/^file:\/\//i).test(urlStr)) throw new Error('In need of a file url string') 
    try {
      if ((/^file:\/\/\/[c-z]:/i).test(urlStr) && process.platform === 'win32') {
        return urlStr.replace(/^file:\/\/\//i, '')
      } else {
        return urlStr.replace(/^file:\/\//i, '')
      }
    } catch (err) {
      throw err
    }
  }
}

export const getRandomNumber = () => {
  return new Date().getTime() + parseInt(Math.random() * 1000000)
}

export const isPDF = (pUrl) => {
  return new Promise((resolve, reject) => {
    try {
        if ((/^(https|http):\/\//i).test(pUrl)) {
          resolve(true)
        } else if ((/^file:\/\//i).test(pUrl)) {
          let fileUrl = url.fileURLToPath(pUrl)
          readChunk(fileUrl, 0, 200)
            .then((data) => {
              return resolve(isTypePDF(data))
            })
            .catch((err) => {
              return reject(err)
            })
        } else if ((/\.pdf$/i).test(pUrl)) {
          readChunk(pUrl, 0, 200)
            .then((data) => {
              return resolve(isTypePDF(data))
            })
            .catch((err) => {
              return reject(err)
            })
        } else {
          resolve(false)
        }
    } catch (err) {
      reject(err)
    }
  })
}

const readChunk = (filePath = '', position = 0, length = 0) => {
  return new Promise((resolve, reject) => {
    fs.open(filePath, 'r', (err, fd) => {
      if (err) {
        return reject(err)
      }
      let buf = Buffer.alloc(length)
      fs.read(fd, buf, 0, length, position, (err, bytesRead) => {
        if (err) {
          fs.close(fd, () => {})
          return reject(err)
        }
        fs.close(fd, () => {})
        if (bytesRead < length) {
          buf = buf.slice(0, bytesRead)
        }
        return resolve(buf)
      })
    })
  })
}

const isTypePDF = (buf) => {
  if (!buf || !(buf.length >= 4)) {
    return false
  }
  let pdfHeader = [0x25, 0x50, 0x44, 0x46]
  for (let i = 0; i < 4; i++) {
    if (buf[i] !== pdfHeader[i]) {
      return false
    }
  }
  return true
}

const isTypeNode = (node) => {
  if (typeof node === 'object' &&
    typeof node.nodeName === 'string' &&
    typeof node.nodeType === 'number') {
    return true
  }
  return false
}

export const isInPage = (node) => {
  return isTypeNode(node) ? ((node === document.body) ? false : document.body.contains(node)) : false
}

export const waitingAsync = (step, timeout = 0, check = () => {}) => {
  return new Promise((resolve, reject) => {
    let stepTime = typeof step === 'number' && step > 0 ? step : 10
    let cnt = 0
    let totalCnt = Number(timeout) / stepTime
    let timer = setInterval(() => {
          cnt++
          if (check()) {
            clearInterval(timer)
            return resolve(cnt * stepTime)
          }
          if (cnt > totalCnt) {
            clearInterval(timer)
            return reject(new Error('timeout'))
          }
    }, stepTime)
  })
}