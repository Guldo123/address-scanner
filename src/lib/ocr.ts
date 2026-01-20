import Tesseract from 'tesseract.js'

export async function recognizeAddress(imageFile: File | Blob): Promise<string> {
  try {
    const worker = await Tesseract.createWorker('eng')

    const result = await worker.recognize(imageFile)
    const text = result.data.text

    await worker.terminate()

    return extractAddress(text)
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Failed to recognize address from image')
  }
}

function extractAddress(text: string): string {
  const lines = text.split('\n').filter(line => line.trim().length > 0)

  let address = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 5) {
      address += (address ? ', ' : '') + trimmed
    }
  }

  return address || 'No address found'
}
