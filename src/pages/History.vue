<template>
  <div class="history-container">
    <div class="header">
      <router-link to="/" class="back-btn">
        <ArrowLeft :size="24" />
      </router-link>
      <h1>Borm Live History</h1>
      <div style="width: 40px;"></div>
    </div>

    <div class="content">
      <div v-if="!isConfigured" class="error-state">
        <AlertCircle :size="48" />
        <h2 style="margin: 16px 0; font-size: 24px;">Configuration Required</h2>
        <p style="max-width: 500px; text-align: center; line-height: 1.6; margin-bottom: 16px;">
          Please create a <code style="background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px;">.env</code> file with your Supabase credentials to use this app.
        </p>
        <p style="max-width: 500px; text-align: center; line-height: 1.6;">
          See <code style="background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px;">README.md</code> for setup instructions.
        </p>
      </div>

      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading addresses...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <AlertCircle :size="48" />
        <p>{{ error }}</p>
        <button @click="loadAddresses" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="addresses.length === 0" class="empty-state">
        <Inbox :size="64" />
        <p>No addresses scanned yet</p>
        <router-link to="/" class="scan-btn">
          <Camera :size="20" />
          <span>Start Scanning</span>
        </router-link>
      </div>

      <div v-else class="addresses-list">
        <div v-for="address in addresses" :key="address.id" class="address-item">
          <div v-if="address.image_data" class="address-thumbnail">
            <img :src="address.image_data" alt="Address thumbnail" />
          </div>
          <div class="address-info">
            <p class="address-text">{{ address.address }}</p>
            <div v-if="hasStructuredData(address)" class="structured-data">
              <span v-if="address.salutation" class="data-pill">{{ address.salutation }}</span>
              <span v-if="address.first_name" class="data-pill">{{ address.first_name }}</span>
              <span v-if="address.last_name" class="data-pill">{{ address.last_name }}</span>
              <span v-if="address.street_name" class="data-pill">{{ address.street_name }} {{ address.street_number }}</span>
              <span v-if="address.postal_code" class="data-pill">{{ address.postal_code }}</span>
              <span v-if="address.place" class="data-pill">{{ address.place }}</span>
            </div>
            <span class="address-date">{{ formatDate(address.created_at) }}</span>
          </div>
          <button @click="deleteAddress(address.id)" class="delete-btn">
            <Trash2 :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, AlertCircle, Inbox, Camera, Trash2 } from 'lucide-vue-next'
import { supabase, supabaseConfigured, type Address } from '@/lib/supabase'

const isConfigured = supabaseConfigured
const addresses = ref<Address[]>([])
const loading = ref(true)
const error = ref('')

const loadAddresses = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    addresses.value = data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load addresses'
  } finally {
    loading.value = false
  }
}

const deleteAddress = async (id: string) => {
  if (!confirm('Are you sure you want to delete this address?')) return

  try {
    const { error: deleteError } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    addresses.value = addresses.value.filter((addr: Address) => addr.id !== id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete address'
  }
}

const hasStructuredData = (address: Address): boolean => {
  return !!(
    address.salutation ||
    address.first_name ||
    address.last_name ||
    address.street_name ||
    address.street_number ||
    address.postal_code ||
    address.place
  )
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return 'Today'
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

onMounted(() => {
  if (isConfigured) {
    loadAddresses()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.history-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #5BB4E8 0%, #3E9BD5 100%);
  color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state p {
  font-size: 18px;
  margin: 0;
}

.scan-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #10b981;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.scan-btn:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.addresses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.address-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.address-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.address-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.address-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.address-info {
  flex: 1;
  min-width: 0;
}

.address-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.structured-data {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.data-pill {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.address-date {
  font-size: 14px;
  opacity: 0.7;
}

.delete-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.1);
}

@media (max-width: 640px) {
  .header {
    padding: 16px;
  }

  .header h1 {
    font-size: 20px;
  }

  .content {
    padding: 16px;
  }

  .address-item {
    padding: 12px;
  }

  .address-thumbnail {
    width: 50px;
    height: 50px;
  }

  .address-text {
    font-size: 14px;
  }
}
</style>
