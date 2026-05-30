declare module 'word-extractor' {
  type ExtractedDocument = {
    getBody: () => string
    getFootnotes: () => string
    getEndnotes: () => string
  }

  class WordExtractor {
    extract(input: string | Buffer): Promise<ExtractedDocument>
  }

  export = WordExtractor
}
