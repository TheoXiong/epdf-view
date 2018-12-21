import fs from 'fs'

export const getRandomNumber = () => {
  return new Date().getTime() + parseInt(Math.random() * 1000000)
}

export const isPDF = (url) => {
  return new Promise((resolve, reject) => {
    try {
      debugger
        if ((/^(https|http):\/\//i).test(url)) {
          resolve(true)
        } else if ((/^file:\/\//i).test(url)) {
        let fileUrl = new URL(url)
        readChunk(fileUrl, 0, 200)
        .then((data) => {
          return resolve(isTypePDF(data))
        })
        .catch((err) => {
          return reject(error)
        })
      } else if ((/\.pdf$/i).test(url)) {
        readChunk(url, 0, 200)
        .then((data) => {
          return resolve(isTypePDF(data))
        })
        .catch((err) => {
          return reject(error)
        })
      }
      resolve(true)
    } catch (error) {
      reject(error)
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