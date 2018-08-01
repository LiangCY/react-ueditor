import PropTypes from 'prop-types'
import React from 'react'
import UploadModal from './UploadModal'

const uploadAudio = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACBUlEQVRYR+1VwXHbMBC8' +
  'qyBxBXI6cCqwUkEOFUSuIHYFliuwUoGVCrAdWOlA6UCuIOpgPashNRQIOtJkHH2ID2eIA25vD7vndublZ85vI4CRgZGBkxmIiI9mdm9mMzNb' +
  'AHgYknJEzM3sA4C7oZiTAEREmNmTuwvEi5lNSH4GsK4liIiFu38nuQRwU4s5CkBTtRILwAvJWzPbuvszyS8AVhFxZWbXAH50E0XE0t2/kbwB' +
  'sCxBVAFExKW7TxRMUhfPVTVJXT4HsI2IaQHg1t0fFQNAAPcrpbQhqVZc/BWAaHb3XASq6pkqbf+XAPQ/pQQz+9qy0omdufsTyQRAMfvVYyCl' +
  'pCSXLc1N5FpVF9QeMKA9tcrd/5D8CUCPdLc6/3vsDAGwnPP0rUFVY6BhYUVyAuBT0QYVsC7vfQ8AuzbknA/ubpjtFfYeANTCq5yzpNp9iJLq' +
  '9n8wIKpXOWdJtguA5dvQZpUB9dDdd1pXEMnfRz5CyfW+1HyrrJoX9ADUZEhyY2YykkEZds79KmnuyPOiLGTIiNQ/GZCWTGkhTyep78OAEck/' +
  'Zo1f7CXbUUtPgtUW1KTX6Fg2KpPR5fL1AyseONfODhnZtKz+aAAdQ1GVYkFDaOPuMqzBYdRITxZeTX4ygNbVmtkgujWONXKrqxliVqu8PXDU' +
  'NHzLEf91bwQwMjAycHYGXgGLbI8w70amwwAAAABJRU5ErkJggg=='

class ReactUeditor extends React.Component {
  constructor(props) {
    super()
    this.content = props.value || '' // 存储编辑器的实时数据，用于传递给父组件
    this.ueditor = null
    this.isContentChangedByWillReceiveProps = false
    this.tempfileInput = null
    this.containerID = 'reactueditor' + Math.random().toString(36)
    this.fileInputID = 'fileinput' + Math.random().toString(36)
  }

  state = {
    videoModalVisible: false,
    audioModalVisible: false,
    videoSource: '',
    audioSource: '',
  }

  static propTypes = {
    value: PropTypes.string,
    ueditorPath: PropTypes.string.isRequired,
    plugins: PropTypes.array,
    onChange: PropTypes.func,
    uploadImage: PropTypes.func,
    getRef: PropTypes.func,
  }

  componentDidMount() {
    let {ueditorPath} = this.props
    if (!window.UE && !window.UE_LOADING_PROMISE) {
      window.UE_LOADING_PROMISE = this.createScript(ueditorPath + '/ueditor.config.js')
        .then(() => this.createScript(ueditorPath + '/ueditor.all.js'))
    }
    window.UE_LOADING_PROMISE.then(() => {
      this.tempfileInput = document.getElementById(this.fileInputID)
      this.initEditor()
    })
  }

  /**
   * 这里存在两种情况会改变编辑器的内容：
   * 1. 父组件初始化传递的 value。父组件 value 的获取是异步的，因此会触发一次 componentWillReceiveProps，这种情况不需要将更新再通知父组件
   * 2. 用户对编辑器进行编辑
   */
  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps && this.props.value !== nextProps.value) {
      this.isContentChangedByWillReceiveProps = true
      this.content = nextProps.value
      if (this.ueditor) {
        this.ueditor.ready(() => {
          this.ueditor.setContent(nextProps.value)
        })
      }
    }
  }

  componentWillUnmount() {
    if (this.ueditor) {
      this.ueditor.destroy()
    }
  }

  createScript = url => {
    let scriptTags = window.document.querySelectorAll('script')
    let len = scriptTags.length
    let i = 0
    let _url = location.origin + url
    return new Promise((resolve, reject) => {
      for (i = 0; i < len; i++) {
        let src = scriptTags[i].src
        if (src && src === _url) {
          scriptTags[i].parentElement.removeChild(scriptTags[i])
        }
      }

      let node = document.createElement('script')
      node.src = url
      node.onload = resolve
      node.onerror = reject
      document.body.appendChild(node)
    })
  }

  initEditor = () => {
    const {config, plugins, onChange, value, getRef} = this.props
    this.ueditor = config ? window.UE.getEditor(this.containerID, config) : window.UE.getEditor(this.containerID)
    this.ueditor._react_ref = this
    if (plugins && plugins instanceof Array && plugins.length > 0) {
      if (plugins.indexOf('uploadImage') !== -1) this.registerImageUpload()
      if (plugins.indexOf('uploadVideo') !== -1) this.registerUploadVideo()
      if (plugins.indexOf('uploadAudio') !== -1) this.registerUploadAudio()
    }
    getRef && getRef(this.ueditor)
    this.ueditor.ready(() => {
      this.ueditor.addListener('contentChange', () => {
        // 由 componentWillReceiveProps 导致的 contentChange 不需要通知父组件
        if (this.isContentChangedByWillReceiveProps) {
          this.isContentChangedByWillReceiveProps = false
        } else {
          this.content = this.ueditor.getContent()
          if (onChange) {
            onChange(this.ueditor.getContent())
          }
        }
      })
      this.ueditor.addListener('pasteImage', (type, file) => {
        this.uploadImage(file)
      })

      if (this.isContentChangedByWillReceiveProps) {
        this.isContentChangedByWillReceiveProps = false
        this.ueditor.setContent(this.content)
      } else {
        this.ueditor.setContent(value)
      }
    })
  }

  registerImageUpload = () => {
    window.UE.registerUI('imageUpload', (editor, uiName) => {
      return new window.UE.ui.Button({
        name: uiName,
        title: '上传图片',
        cssRules: 'background-position: -726px -77px;',
        onclick: () => {
          editor._react_ref.tempfileInput.click()
        },
      })
    })
  }

  registerUploadVideo = () => {
    window.UE.registerUI('videoUpload', (editor, uiName) => {
      return new window.UE.ui.Button({
        name: uiName,
        title: '上传视频',
        cssRules: 'background-position: -320px -20px;',
        onclick: () => {
          editor._react_ref.setState({videoModalVisible: true})
        },
      })
    })
  }

  registerUploadAudio = () => {
    window.UE.registerUI('audioUpload', (editor, uiName) => {
      return new window.UE.ui.Button({
        name: uiName,
        title: '上传音频',
        cssRules: 'background: url(' + uploadAudio + ') !important; background-size: 20px 20px !important;',
        onclick: () => {
          editor._react_ref.setState({audioModalVisible: true})
        },
      })
    })
  }

  handleFileChange = e => {
    const file = e.target.files[0]
    if (!file || !/image/i.test(file.type)) return
    this.uploadImage(file)
  }

  uploadImage = file => {
    let {uploadImage} = this.props
    if (uploadImage) {
      let promise = uploadImage(file)
      if (!!promise && {}.toString.call(promise.then) === '[object Function]') {
        promise.then(imageUrl => {
          this.insertImage(imageUrl)
        })
      }
    }
    this.tempfileInput.value = ''
  }

  insertImage = imageUrl => {
    if (this.ueditor) {
      this.ueditor.focus()
      this.ueditor.execCommand('inserthtml', '<img src="' + imageUrl + '" />')
    }
  }

  insert = html => {
    if (this.ueditor) {
      this.ueditor.execCommand('insertparagraph')
      this.ueditor.execCommand('inserthtml', html, true)
      this.ueditor.execCommand('insertparagraph')
      this.ueditor.execCommand('insertparagraph')
    }
  }

  closeModal = type => {
    switch (type) {
    case 'video':
      this.setState({videoModalVisible: false})
      break
    case 'audio':
      this.setState({audioModalVisible: false})
      break
    }
  }

  render() {
    let {videoModalVisible, audioModalVisible} = this.state
    let {uploadVideo, uploadAudio, progress} = this.props
    return (
      <div>
        <script id={this.containerID} type='text/plain' />
        <input
          type='file'
          id={this.fileInputID}
          onChange={this.handleFileChange}
          style={{visibility: 'hidden'}} />
        <UploadModal
          type='video'
          title='上传视频'
          visible={videoModalVisible}
          closeModal={() => this.closeModal('video')}
          insert={this.insert}
          upload={uploadVideo}
          progress={progress} />
        <UploadModal
          type='audio'
          title='上传音频'
          visible={audioModalVisible}
          closeModal={() => this.closeModal('audio')}
          insert={this.insert}
          upload={uploadAudio}
          progress={progress} />
      </div>
    )
  }
}

export default ReactUeditor
