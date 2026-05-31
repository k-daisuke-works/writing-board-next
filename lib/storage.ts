export function getPublicMediaUrl(bucket: 'images' | 'videos', path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
