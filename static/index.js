const CROP_BORDER_WIDTH = 3

class ScreenShare {
  constructor(previewID, cropID) {
    this.previewEl = document.querySelector(previewID)
    this.cropEl = document.querySelector(cropID)
    this.popup = null
    this.videoWidth = null
    this.popupBarHeight = 0
  }

  start() {
    navigator.mediaDevices
      .getDisplayMedia({
        video: true
      })
      .then(this.gotLocalMediaStream.bind(this))

    setTimeout(this.openPopup.bind(this), 100)
  }

  openPopup() {
    this.popup = open("share.html", "share", "scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=800,height=600,left=100,top=100")
  }

  gotLocalMediaStream(mediaStream) {
    this.previewEl.srcObject = mediaStream
    this.videoWidth = mediaStream.getVideoTracks()[0].getSettings().width
    this.popupBarHeight = this.popup.window.outerHeight - this.popup.window.innerHeight
    const zoom = window.innerWidth / this.videoWidth

    this.cropEl.style.display = "block"
    this.cropEl.style.borderWidth = `${CROP_BORDER_WIDTH}px`
    this.cropEl.style.top = `${100 * zoom}px`
    this.cropEl.style.left = `${100 * zoom}px`
    this.cropEl.style.width = `${1200 * zoom}px`
    this.cropEl.style.height = `${800 * zoom}px`

    this.setResizeEvent()
    this.setMoveEvent()

    // run once
    this.resizePopup()

    this.popup.document.querySelector("#share").srcObject = mediaStream
  }

  setResizeEvent() {
    const self = this
    const cropEl = this.cropEl
    const previewEl = this.previewEl
    const resizers = cropEl.querySelectorAll('.resizer')
    const minimumSize = 100
    let originalWidth = 0
    let originalHeight = 0
    let originalX = 0
    let originalY = 0
    let originalMouseX = 0
    let originalMouseY = 0

    for (let i = 0; i < resizers.length; i++) {
      const currentResizer = resizers[i]
      currentResizer.addEventListener('mousedown', function (e) {
        e.preventDefault()
        e.stopPropagation()

        originalWidth = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('width').replace('px', ''))
        originalHeight = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('height').replace('px', ''))
        originalX = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('left').replace('px', ''))
        originalY = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('top').replace('px', ''))
        originalMouseX = e.pageX
        originalMouseY = e.pageY
        window.addEventListener('mousemove', resize)
        window.addEventListener('mouseup', stopResize)
      })

      function resize(e) {
        let width = originalWidth
        let height = originalHeight
        let top = originalY
        let left = originalX
        const previewWidth = previewEl.getBoundingClientRect().width
        const previewHeight = previewEl.getBoundingClientRect().height

        if (currentResizer.classList.contains('bottom-right')) {
          width = minMax(originalWidth + (e.pageX - originalMouseX), minimumSize, previewWidth - originalX)
          height = minMax(originalHeight + (e.pageY - originalMouseY), minimumSize, previewHeight - originalY)
        }
        else if (currentResizer.classList.contains('bottom-left')) {
          left = minMax(originalX + (e.pageX - originalMouseX), 0, originalX + originalWidth - minimumSize)
          width = minMax(originalWidth - (e.pageX - originalMouseX), minimumSize, originalX + originalWidth)
          height = minMax(originalHeight + (e.pageY - originalMouseY), minimumSize, previewHeight - originalY)
        }
        else if (currentResizer.classList.contains('top-right')) {
          top = minMax(originalY + (e.pageY - originalMouseY), 0, originalY + originalHeight - minimumSize)
          width = minMax(originalWidth + (e.pageX - originalMouseX), minimumSize, previewWidth - originalX)
          height = minMax(originalHeight - (e.pageY - originalMouseY), minimumSize, originalY + originalHeight)
        }
        else {
          left = minMax(originalX + (e.pageX - originalMouseX), 0, originalX + originalWidth - minimumSize)
          top = minMax(originalY + (e.pageY - originalMouseY), 0, originalY + originalHeight - minimumSize)
          width = minMax(originalWidth - (e.pageX - originalMouseX), minimumSize, originalX + originalWidth)
          height = minMax(originalHeight - (e.pageY - originalMouseY), minimumSize, originalY + originalHeight)
        }

        cropEl.style.top = top + 'px'
        cropEl.style.left = left + 'px'
        cropEl.style.width = width + 'px'
        cropEl.style.height = height + 'px'
      }

      function stopResize() {
        window.removeEventListener('mousemove', resize)
        self.resizePopup()
      }
    }
  }

  setMoveEvent() {
    const self = this
    const cropEl = this.cropEl
    const previewEl = this.previewEl

    let originalX = 0
    let originalY = 0
    let originalMouseX = 0
    let originalMouseY = 0

    function mousedown(e) {
      originalX = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('left').replace('px', ''))
      originalY = parseFloat(getComputedStyle(cropEl, null).getPropertyValue('top').replace('px', ''))
      originalMouseX = e.pageX
      originalMouseY = e.pageY

      document.body.addEventListener("mousemove", mousemove, false)
      cropEl.addEventListener("mouseup", mouseup, false)
      document.body.addEventListener("mouseleave", mouseup, false)
    }

    function mousemove(e) {
      e.preventDefault()

      const dx = e.pageX - originalMouseX
      const dy = e.pageY - originalMouseY

      const left = Math.min(Math.max(originalX + dx, 0), previewEl.getBoundingClientRect().width - cropEl.getBoundingClientRect().width)
      const top = Math.min(Math.max(originalY + dy, 0), previewEl.getBoundingClientRect().height - cropEl.getBoundingClientRect().height)
      cropEl.style.left = `${left}px`
      cropEl.style.top = `${top}px`
    }

    function mouseup(e) {
      document.body.removeEventListener("mousemove", mousemove, false)
      cropEl.removeEventListener("mouseup", mouseup, false)

      self.resizePopup()
    }

    this.cropEl.addEventListener("mousedown", mousedown, false)
  }

  resizePopup() {
    const width = this.cropEl.getBoundingClientRect().width
    const height = this.cropEl.getBoundingClientRect().height
    const top = parseFloat(getComputedStyle(this.cropEl, null).getPropertyValue('top').replace('px', ''))
    const left = parseFloat(getComputedStyle(this.cropEl, null).getPropertyValue('left').replace('px', ''))

    const zoom = window.innerWidth / this.videoWidth

    this.popup.resizeTo(width / zoom, height / zoom + this.popupBarHeight)
    this.popup.document.querySelector("#share").style.marginTop = `${-top / zoom}px`
    this.popup.document.querySelector("#share").style.marginLeft = `${-left / zoom}px`
  }
}

function minMax(target, min, max) {
  return Math.min(max, Math.max(min, target))
}

function main() {
  const screenShare = new ScreenShare("#preview", "#crop")

  const elOpen = document.querySelector("#open")

  elOpen.addEventListener("click", function (e) {
    screenShare.start()
  }, false)
}

main()
