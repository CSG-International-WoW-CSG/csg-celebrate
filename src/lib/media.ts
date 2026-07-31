/** Client-side image compression before Storage upload. */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Image compression failed'))
      },
      'image/jpeg',
      quality,
    )
  })
}

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function validateVideo(file: File, maxSeconds = 60): Promise<void> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Not a video file')
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error('Video must be under 40 MB')
  }

  const url = URL.createObjectURL(file)
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => resolve(video.duration)
      video.onerror = () => reject(new Error('Could not read video'))
      video.src = url
    })
    if (duration > maxSeconds + 0.5) {
      throw new Error(`Video must be ${maxSeconds}s or shorter`)
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
