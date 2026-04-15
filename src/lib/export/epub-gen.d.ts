declare module 'epub-gen' {
  interface EPubOptions {
    title?: string
    author?: string
    publisher?: string
    description?: string
    lang?: string
    content?: Array<{
      title?: string
      data: string
    }>
    toc?: Array<{
      id?: string
      title?: string
      data: string
    }>
    contentCSS?: string
    outputPath?: boolean | string
    [key: string]: unknown
  }

  class EPub {
    constructor(options: EPubOptions)
    promise: Promise<Buffer>
  }

  export default EPub
}
