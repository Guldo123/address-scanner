const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface Address {
  id: string
  address?: string
  full_text?: string
  salutation?: string
  first_name?: string
  last_name?: string
  company?: string
  street_name?: string
  street_number?: string
  postal_code?: string
  place?: string
  image_data?: string
  created_at: string
  updated_at: string
}

export interface SearchParams {
  company?: string
  first_name?: string
  last_name?: string
  place?: string
}

export interface AddressInput {
  full_text: string
  salutation?: string
  first_name?: string
  last_name?: string
  company?: string
  street_name?: string
  street_number?: string
  postal_code?: string
  place?: string
  image_data?: string
}

export async function searchAddresses(params: SearchParams): Promise<Address[]> {
  const response = await fetch(`/app/py/bg_plugins/address_scanner/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to search addresses')
  }

  const data = await response.json()
  return data || []
}

export async function addAddress(address: AddressInput): Promise<Address> {
  const response = await fetch(`/app/py/bg_plugins/address_scanner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(address),
  })

  if (!response.ok) {
    throw new Error('Failed to add address')
  }

  const data = await response.json()
  return data.address
}

export async function updateAddress(id: string, address: AddressInput): Promise<Address> {
  const response = await fetch(`/app/py/bg_plugins/address_scanner/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(address),
  })

  if (!response.ok) {
    throw new Error('Failed to update address')
  }

  const data = await response.json()
  return data.address
}
