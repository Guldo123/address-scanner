export interface ParsedAddressFields {
  salutation: string | null
  first_name: string | null
  last_name: string | null
  street_name: string | null
  street_number: string | null
  postal_code: string | null
  place: string | null
}

export interface Address {
  id: string
  address: string
  created_at: string
  image_data?: string
  salutation?: string | null
  first_name?: string | null
  last_name?: string | null
  street_name?: string | null
  street_number?: string | null
  postal_code?: string | null
  place?: string | null
}

const STORAGE_KEY = 'address_scanner_history'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const storage = {
  getAddresses(): Address[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading addresses:', error)
      return []
    }
  },

  saveAddress(address: Omit<Address, 'id' | 'created_at'>): Address {
    const addresses = this.getAddresses()
    const newAddress: Address = {
      ...address,
      id: generateId(),
      created_at: new Date().toISOString()
    }

    addresses.unshift(newAddress)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))

    return newAddress
  },

  deleteAddress(id: string): boolean {
    try {
      const addresses = this.getAddresses()
      const filtered = addresses.filter(addr => addr.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Error deleting address:', error)
      return false
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
  }
}
