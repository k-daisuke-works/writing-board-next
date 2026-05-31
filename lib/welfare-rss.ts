export type RssItem = {
  title: string
  url: string
  publishedAt: Date | null
}

export type RssSource = {
  name: string
  feedUrl: string
}

export const WELFARE_SOURCES: RssSource[] = [
  {
    name: '福祉新聞Web',
    feedUrl: 'https://fukushishimbun.com/feed',
  },
  {
    name: '介護ニュースJoint',
    feedUrl: 'https://www.joint-kaigo.com/rss',
  },
  {
    name: 'かいごナビ',
    feedUrl: 'https://www.kaigonavi.net/feed',
  },
]

function extractCdata(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const textRe  = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i')
  const m = cdataRe.exec(xml) ?? textRe.exec(xml)
  return (m?.[1] ?? '').trim()
}

export function parseRss(xml: string, maxItems = 30): RssItem[] {
  const items: RssItem[] = []
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(xml)) !== null && items.length < maxItems) {
    const block = m[1]

    const title = extractCdata(block, 'title')

    // <link> can be plain text or have a CDATA wrapper
    let url = extractCdata(block, 'link')
    // Atom-style <link href="..."/>
    if (!url) {
      const href = /<link[^>]+href="([^"]+)"/.exec(block)
      url = href?.[1] ?? ''
    }

    const pubDateStr = extractCdata(block, 'pubDate') || extractCdata(block, 'dc:date')
    const publishedAt = pubDateStr ? new Date(pubDateStr) : null

    if (title && url) {
      items.push({ title, url, publishedAt })
    }
  }

  return items
}

export async function fetchRssSource(source: RssSource): Promise<RssItem[]> {
  try {
    const res = await fetch(source.feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; welfare-board/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRss(xml)
  } catch {
    return []
  }
}
