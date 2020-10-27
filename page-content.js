import { h, executeJs } from './util.js'

customElements.define('page-content', class extends HTMLElement {
  constructor() {
    super()
    this.render()
  }

  setLoading (state) {
    if (state) this.classList.add('loading')
    else this.classList.remove('loading')
  }

  async renderDirectory () {
    this.classList.add('directory')

    var listingDiv = h('div', {class: 'listing'})
    var entries = await beaker.hyperdrive.readdir(location.pathname, {includeStats: true})
    entries = entries.filter(entry => !entry.name.startsWith('.'))
    entries.forEach(entry => {
      entry.title = entry.stat.metadata.title || entry.name
    })

    const byTitle = (a, b) => {
      return a.title.localeCompare(b.title)
    }
    const byDate = (a, b) => {
      return b.stat.ctime - a.stat.ctime
    }

    const renderEntry = entry => {
      if (entry.stat.isFile()) {
        listingDiv.append(h('div', {class: 'entry file'},
          h('div', h('a', {href: entry.name, title: entry.title}, entry.title)),
          entry.stat.metadata.description ? h('div', entry.stat.metadata.description) : '',
          h('div', h('small', entry.stat.ctime.toLocaleString('default', {dateStyle: 'medium'})))
        ))
      } else {
        listingDiv.append(h('div', {class: 'entry directory'},
          h('div', h('a', {href: entry.name + '/', title: entry.title}, entry.title)),
          h('div', h('small', 'Directory'))
        ))
      }
    }

    entries.filter(entry => entry.stat.isDirectory()).sort(byTitle).forEach(renderEntry)
    entries.filter(entry => !entry.stat.isDirectory()).sort(byDate).forEach(renderEntry)
    this.append(listingDiv)

    var readmeFile = entries.find(entry => entry.stat.isFile() && /^readme.(txt|md)$/.test(entry.name))
    if (readmeFile) {
      let readmeContent = await beaker.hyperdrive.readFile(location.pathname + readmeFile.name)
      let readmeDiv = h('div', {class: 'readme'})
      if (readmeFile.name.endsWith('.md')) {
        readmeDiv.innerHTML = beaker.markdown.toHTML(readmeContent)
      } else {
        readmeDiv.append(h('pre', readmeContent))
      }
      this.append(readmeDiv)
    }
  }

  async render() {
    let st
    let pathname = location.pathname
    this.setLoading(true)

    if (pathname.endsWith('/')) {
      if (st = await safeStat(pathname + 'index.html')) {
        pathname += 'index.html'
      } else if (st = await safeStat(pathname + 'index.md')) {
        pathname += 'index.md'
      } else if (st = await safeStat(pathname)) {
        this.setLoading(false)
        this.renderDirectory()
        return
      }
    } else {
      st = await safeStat(pathname)
    }

    this.classList.add('page')

    if (!st) {
      // 404
      this.append(h('div',
        h('h2', `404 Not Found`),
        h('p', `The content you are looking for at this path is not longer here or has never been here.`),
        h('p', 'Please contact me if this is not what you were expecting.')
      ))
      this.setLoading(false)
      return
    }

    // embed content
    if (pathname === '/.ui/ui.html') {
      this.append(h('div', 'This is the .ui file. Aborting render to avoid recursion.'))
      this.setLoading(false)
    } else if (/\.(png|jpe?g|gif|svg|webp)$/i.test(pathname)) {
      this.append(h('img', { src: pathname, title: pathname, alt: pathname }))
      this.setLoading(false)
    } else if (/\.(mp4|webm|mov)/i.test(pathname)) {
      this.append(h('video', { controls: true }, h('source', { src: pathname })))
      this.setLoading(false)
    } else if (/\.(mp3|ogg)/i.test(pathname)) {
      this.append(h('audio', { controls: true }, h('source', { src: pathname })))
      this.setLoading(false)
    } else if (/\.(pdf|doc|zip|docx|rar)/i.test(pathname)) {
      let filename = pathname.split('/').slice(-1)[0]
      this.append(h('a', { href: pathname, download: filename, title: `Download ${filename}` }, pathname))
      this.setLoading(false)
    } else if (/\.(goto)/i.test(pathname)) {
      if (st.metadata.href) {
        this.append(h('p', 'Redirecting to ', h('a', {href: st.metadata.href}, st.metadata.href), ' in 3 seconds...'))
        setTimeout(() => {
          window.location = st.metadata.href
        }, 3e3)
      }
    } else {
      let content = await beaker.hyperdrive.readFile(pathname)
      if (/\.(md|html)/i.test(pathname)) {
        if (pathname.endsWith('.md')) {
          content = beaker.markdown.toHTML(content)
        }
        this.innerHTML = content
        this.setLoading(false)
        executeJs(this)
      } else {
        this.append(h('pre', content))
        this.setLoading(false)
      }
    }
  }
})

function safeStat (path) {
  return beaker.hyperdrive.stat(path).catch(e => undefined)
}