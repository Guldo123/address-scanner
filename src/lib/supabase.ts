import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. See README.md for setup instructions.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
