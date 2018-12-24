export const downloadURL = (win, url, options, cb = () => {}) => {
  const session = win.webContents.session

  const listener = (event, item, webContents) => {
    if (typeof options.onStarted === 'function') {
			options.onStarted(item)
    }

    item.once('done', (event, state) => {
      session.removeListener('will-download', listener)
      if (state === 'completed') {
        cb(null, item)
      } else if (state === 'cancelled') {
        if (typeof options.onCancel === 'function') {
					options.onCancel(item)
				}
      } else if (state === 'interrupted') {
        cb(new Error('download interrupted'))
      }
    })
  }

  session.on('will-download', listener)
  win.webContents.downloadURL(url)
}