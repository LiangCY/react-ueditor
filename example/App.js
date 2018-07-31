import React from 'react'
import ReactUeditor from '../src'
import Viewer from '../src/Viewer'

class App extends React.Component {
  constructor() {
    super()
    this.editorResult = '<h1>Hello World!</h1>'
    this.ueditor = null
  }

  state = {
    progress: -1,
    content: '',
  }

  uploadImage = e => {
    if (!e.target.files) return
    return new Promise(function(resolve, reject) {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.readAsDataURL(e.target.files[0])
    })
  }

  uploadVideo = e => {
    let _this = this
    return new Promise(function(resolve, reject) {
      let i = 0
      let instance = setInterval(() => {
        if (i !== 100) {
          _this.setState({progress: ++i})
        }
      }, 50)
      setTimeout(() => {
        resolve('https://cloud-minapp-1131.cloud.ifanrusercontent.com/1eBb1SeNlayvGEKT.mp4')
        _this.setState({progress: -1})
        clearInterval(instance)
      }, 5100)
    })
  }

  uploadAudio = e => {
    return new Promise(function(resolve, reject) {
      // resolve('https://cloud-minapp-1131.cloud.ifanrusercontent.com/1eEUtZNsjiOiHbWW.mp3')
      reject(new Error('error'))
    })
  }

  updateEditorContent = content => {
    this.editorResult = content
  }

  getUeditor = ref => {
    this.ueditor = ref
  }

  getUeditorContent = ref => {
    this.setState({
      content: this.ueditor.getContent(),
    })
  }

  render() {
    let {content, progress} = this.state
    return (
      <div>
        <ReactUeditor
          getRef={this.getUeditor}
          ueditorPath='../vendor/ueditor'
          config={{zIndex: 100}}
          plugins={['uploadImage']}
          uploadImage={this.uploadImage}
          progress={progress}
          multipleImagesUpload={false}
          value={this.editorResult}
          onChange={this.updateEditorContent}
        />
        <button onClick={this.getUeditorContent}>获取内容</button>
        <p>{content}</p>
        <Viewer ueditorPath='../vendor/ueditor' content={content} />
      </div>
    )
  }
}

export default App
