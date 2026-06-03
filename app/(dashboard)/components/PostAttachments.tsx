import { getPublicMediaUrl } from '@/lib/storage'
import { Paperclip } from 'lucide-react'
import type { PostAttachment, WritingData } from '@/types/database'

type Props = {
  post: Pick<WritingData, 'image_url' | 'video_url' | 'pdf_url'>
  attachments?: PostAttachment[]
}

export default function PostAttachments({ post, attachments = [] }: Props) {
  const attachImgs = attachments.filter(a => a.file_type === 'image').map(a => a.url)
  const imgUrls = attachImgs.length > 0 ? attachImgs : (post.image_url ? [post.image_url] : [])

  const attachVids = attachments.filter(a => a.file_type === 'video').map(a => a.url)
  const vidUrls = attachVids.length > 0 ? attachVids : (post.video_url ? [post.video_url] : [])

  const attachPdfs = attachments.filter(a => a.file_type === 'pdf').map(a => a.url)
  const pdfUrls = attachPdfs.length > 0 ? attachPdfs : (post.pdf_url ? [post.pdf_url] : [])

  if (imgUrls.length === 0 && vidUrls.length === 0 && pdfUrls.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      {imgUrls.length > 0 && (
        <div className={imgUrls.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}>
          {imgUrls.map((url, i) => (
            <img key={i}
              src={getPublicMediaUrl('images', url)} alt=""
              className={`rounded-lg border border-gray-100 object-cover w-full ${imgUrls.length === 1 ? 'max-w-xs' : 'h-28'}`}
            />
          ))}
        </div>
      )}
      {vidUrls.map((url, i) => (
        <video key={i} src={getPublicMediaUrl('videos', url)} controls
          className="rounded-lg max-w-xs w-full" />
      ))}
      {pdfUrls.length > 0 && (
        <div className="flex flex-col gap-1">
          {pdfUrls.map((url, i) => (
            <a key={i}
              href={`/api/pdf?path=${encodeURIComponent(url)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {pdfUrls.length > 1 ? `PDF ${i + 1}` : 'PDF'}を開く
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
