import Tesseract from 'tesseract.js'

export interface ParsedAddress {
  fullText: string
  salutation?: string
  first_name?: string
  last_name?: string
  street_name?: string
  street_number?: string
  postal_code?: string
  place?: string
}

export async function recognizeAddress(imageFile: File | Blob): Promise<ParsedAddress> {
  try {
    const worker = await Tesseract.createWorker('eng')

    const result = await worker.recognize(imageFile)
    const text = result.data.text

    await worker.terminate()

    return parseAddress(text)
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Failed to recognize address from image')
  }
}

function parseAddress(text: string): ParsedAddress {
  const lines = text.split('\n').filter(line => line.trim().length > 0)

  const parsed: ParsedAddress = {
    fullText: lines.join(', ')
  }

  if (lines.length === 0) {
    return { fullText: 'No address found' }
  }

  const salutations = ['Herr', 'Frau', 'Mr', 'Mrs', 'Ms', 'Dr']

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!parsed.salutation && salutations.some(sal => line.includes(sal))) {
      const salutation = salutations.find(sal => line.includes(sal))
      parsed.salutation = salutation

      const nameMatch = line.replace(salutation!, '').trim()
      const nameParts = nameMatch.split(/\s+/)
      if (nameParts.length >= 1) {
        parsed.first_name = nameParts[0]
        if (nameParts.length >= 2) {
          parsed.last_name = nameParts.slice(1).join(' ')
        }
      }
      continue
    }

    if (!parsed.first_name && !parsed.last_name && i === 0 && !line.match(/\d/)) {
      const nameParts = line.split(/\s+/)
      if (nameParts.length >= 1) {
        parsed.first_name = nameParts[0]
        if (nameParts.length >= 2) {
          parsed.last_name = nameParts.slice(1).join(' ')
        }
      }
      continue
    }

    const streetMatch = line.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/)
    if (streetMatch && !parsed.street_name) {
      parsed.street_name = streetMatch[1].trim()
      parsed.street_number = streetMatch[2].trim()
      continue
    }

    const postalMatch = line.match(/^(\d{4,5})\s+(.+)$/)
    if (postalMatch && !parsed.postal_code) {
      parsed.postal_code = postalMatch[1]
      parsed.place = postalMatch[2].trim()
      continue
    }
  }

  return parsed
}
