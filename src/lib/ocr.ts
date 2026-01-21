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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.')
    }

    const base64Image = await convertToBase64(imageFile)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please extract the address information from this image and return it in the following JSON format:
{
  "fullText": "complete address as single line",
  "salutation": "title like Herr, Frau, Mr, Mrs, Dr, etc. or null",
  "first_name": "first name or null",
  "last_name": "last name or null",
  "street_name": "street name without number or null",
  "street_number": "street number or null",
  "postal_code": "postal/zip code or null",
  "place": "city/place name or null"
}

Return ONLY the JSON object, no additional text or explanation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${errorData.error?.message ? ' - ' + errorData.error.message : ''}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI API')
    }

    const parsed = JSON.parse(content.trim()) as ParsedAddress

    if (!parsed.fullText) {
      return { fullText: 'No address found' }
    }

    return parsed
  } catch (error) {
    console.error('OCR Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to recognize address from image')
  }
}

async function convertToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}
