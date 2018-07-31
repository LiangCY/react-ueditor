import PropTypes from 'prop-types'
import React from 'react'

class Viewer extends React.Component {
  constructor(props) {
    super()
    this.content = props.value || '' // 存储编辑器的实时数据，用于传递给父组件
    this.containerID = 'ueditor-viewer-' + Math.random().toString(36)
  }

  static propTypes = {
    content: PropTypes.string,
    ueditorPath: PropTypes.string.isRequired,
  }

  componentDidMount() {
    const {ueditorPath} = this.props
    this.createScript(ueditorPath + '/ueditor.parse.js')
      .then(() => window.uParse('.ueditor-viewer', {rootPath: ueditorPath}))
  }

  componentDidUpdate(prevProps) {
    const {content, ueditorPath} = this.props
    if (prevProps.content !== content) {
      window.uParse('.ueditor-viewer', {rootPath: ueditorPath})
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

  render() {
    const {content} = this.props
    return (
      <div id={this.containerID} className='ueditor-viewer' dangerouslySetInnerHTML={{__html: content}} />
    )
  }
}

export default Viewer
