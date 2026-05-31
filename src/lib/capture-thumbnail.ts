// Captures a thumbnail from the Sandpack preview iframe using html2canvas
// Uploads to Supabase Storage and saves URL to project
// Cost: $0 - runs entirely in the browser

export async function captureThumbnail(
  iframeEl: HTMLIFrameElement,
  projectId: string
): Promise<string | null> {
  try {
    // Dynamically import html2canvas to keep bundle size down
    const { default: html2canvas } = await import('html2canvas')

    // Capture the iframe content
    const canvas = await html2canvas(iframeEl, {
      width: 1280,
      height: 720,
      scale: 0.5, // 640x360 thumbnail — small, fast
      useCORS: true,
      allowTaint: true,
      logging: false,
    })

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/jpeg', 0.8)
    })

    // Upload to Supabase Storage
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const path = `thumbnails/${projectId}.jpg`
    const { error } = await supabase.storage
      .from('project-thumbnails')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

    if (error) throw error

    // Get public URL
    const { data } = supabase.storage.from('project-thumbnails').getPublicUrl(path)
    const url = data.publicUrl

    // Save to project record
    await supabase.from('projects').update({ thumbnail_url: url }).eq('id', projectId)

    return url
  } catch (err) {
    console.error('Thumbnail capture failed:', err)
    return null
  }
}
