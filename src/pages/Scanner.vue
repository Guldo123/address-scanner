<template>
  <div class="scanner-container">
    <div class="header">
      <h1>Borm Live address scanner</h1>
      <router-link to="/history" class="history-btn">
        <Clock :size="20" />
        <span>History</span>
      </router-link>
    </div>

    <div class="content">
      <div v-if="!imageSelected" class="upload-section">
        <div class="upload-area" @click="triggerFileInput">
          <Camera :size="48" />
          <p>Tap to capture or upload image</p>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            capture="environment"
            @change="handleImageUpload"
            style="display: none"
          />
        </div>
      </div>

      <div v-else class="preview-section">
        <div class="preview-image">
          <img :src="previewUrl" alt="Preview" />
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Recognizing address...</p>
        </div>

        <div v-else-if="parsedAddress" class="result-section">
          <div class="address-card">
            <p class="label">Recognized Address:</p>
            <p class="address-text">{{ parsedAddress.fullText }}</p>

            <div v-if="hasStructuredData" class="parsed-fields-card">
              <p class="label">Parsed Fields:</p>
              <div class="fields-grid">
                <div v-if="parsedAddress.salutation" class="field-item">
                  <span class="field-label">Salutation</span>
                  <span class="field-value">{{ parsedAddress.salutation }}</span>
                </div>
                <div v-if="parsedAddress.first_name" class="field-item">
                  <span class="field-label">First Name</span>
                  <span class="field-value">{{ parsedAddress.first_name }}</span>
                </div>
                <div v-if="parsedAddress.last_name" class="field-item">
                  <span class="field-label">Last Name</span>
                  <span class="field-value">{{ parsedAddress.last_name }}</span>
                </div>
                <div v-if="parsedAddress.company" class="field-item">
                  <span class="field-label">Company</span>
                  <span class="field-value">{{ parsedAddress.company }}</span>
                </div>
                <div v-if="parsedAddress.street_name" class="field-item">
                  <span class="field-label">Street</span>
                  <span class="field-value">{{ parsedAddress.street_name }} {{ parsedAddress.street_number }}</span>
                </div>
                <div v-if="parsedAddress.postal_code" class="field-item">
                  <span class="field-label">Postal Code</span>
                  <span class="field-value">{{ parsedAddress.postal_code }}</span>
                </div>
                <div v-if="parsedAddress.place" class="field-item">
                  <span class="field-label">City</span>
                  <span class="field-value">{{ parsedAddress.place }}</span>
                </div>
              </div>
            </div>

            <div v-if="showDuplicates" class="duplicates-section">
              <p class="label">Similar addresses found ({{ duplicates.length }}):</p>
              <p class="info-text">Select an address to update it, or create a new one:</p>
              <div class="duplicates-list">
                <div
                  v-for="duplicate in duplicates"
                  :key="duplicate.id"
                  class="duplicate-card"
                  :class="{ selected: selectedDuplicate === duplicate.id }"
                  @click="selectDuplicate(duplicate.id)"
                >
                  <div class="duplicate-content">
                    <p class="duplicate-text">{{ duplicate.address || duplicate.full_text }}</p>
                    <div v-if="duplicate.company || duplicate.last_name || duplicate.place" class="duplicate-details">
                      <span v-if="duplicate.company">{{ duplicate.company }}</span>
                      <span v-if="duplicate.last_name">{{ duplicate.last_name }}</span>
                      <span v-if="duplicate.place">{{ duplicate.place }}</span>
                    </div>
                  </div>
                  <div v-if="selectedDuplicate === duplicate.id" class="selected-indicator">
                    <CheckCircle :size="20" />
                  </div>
                </div>
              </div>
              <button @click="createNew" class="create-new-btn">
                Create New Address Instead
              </button>
            </div>

            <textarea
              v-model="addressInput"
              placeholder="Edit address if needed..."
              class="address-input"
            ></textarea>
          </div>

          <div v-if="saveSuccess" class="success-message">
            <CheckCircle :size="24" />
            <span>Address saved successfully!</span>
          </div>

          <div v-if="error" class="error-message">
            <AlertCircle :size="24" />
            <span>{{ error }}</span>
          </div>

          <div class="button-group">
            <button @click="saveAddress" class="save-btn" :disabled="loading">
              {{ selectedDuplicate ? 'Update Address' : 'Save Address' }}
            </button>
            <button @click="resetScanner" class="cancel-btn">
              Scan Again
            </button>
          </div>
        </div>

        <div v-else-if="error" class="error-section">
          <AlertCircle :size="48" />
          <p>{{ error }}</p>
          <button @click="resetScanner" class="cancel-btn">
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera, Clock, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { recognizeAddress, type ParsedAddress } from '@/lib/ocr'
import { searchAddresses, addAddress, updateAddress, type Address } from '@/lib/api'

const fileInput = ref<HTMLInputElement>()
const imageSelected = ref(false)
const previewUrl = ref('')
const parsedAddress = ref<ParsedAddress | null>(null)
const addressInput = ref('')
const loading = ref(false)
const searching = ref(false)
const error = ref('')
const saveSuccess = ref(false)
const duplicates = ref<Address[]>([])
const selectedDuplicate = ref<string | null>(null)
const showDuplicates = ref(false)
let currentFile: File | null = null

const hasStructuredData = computed(() => {
  return !!(
    parsedAddress.value?.salutation ||
    parsedAddress.value?.first_name ||
    parsedAddress.value?.last_name ||
    parsedAddress.value?.company ||
    parsedAddress.value?.street_name ||
    parsedAddress.value?.street_number ||
    parsedAddress.value?.postal_code ||
    parsedAddress.value?.place
  )
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  currentFile = file
  imageSelected.value = true
  error.value = ''
  parsedAddress.value = null
  addressInput.value = ''
  saveSuccess.value = false

  const reader = new FileReader()
  reader.onload = async (e) => {
    previewUrl.value = e.target?.result as string
    await extractAddress()
  }
  reader.readAsDataURL(file)
}

const extractAddress = async () => {
  if (!currentFile) return

  loading.value = true
  error.value = ''

  try {
    const result = await recognizeAddress(currentFile)
    parsedAddress.value = result
    addressInput.value = result.fullText

    await checkDuplicates()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to recognize address'
  } finally {
    loading.value = false
  }
}

const checkDuplicates = async () => {
  if (!parsedAddress.value) return

  searching.value = true
  duplicates.value = []
  selectedDuplicate.value = null
  showDuplicates.value = false

  try {
    const searchParams = {
      company: parsedAddress.value.company,
      last_name: parsedAddress.value.last_name,
      place: parsedAddress.value.place,
    }

    const results = await searchAddresses(searchParams)
    duplicates.value = results

    if (results.length > 0) {
      showDuplicates.value = true
    }
  } catch (err) {
    console.error('Error checking duplicates:', err)
  } finally {
    searching.value = false
  }
}

const saveAddress = async () => {
  if (!addressInput.value.trim()) {
    error.value = 'Please enter an address'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const addressData = {
      full_text: addressInput.value,
      salutation: parsedAddress.value?.salutation,
      first_name: parsedAddress.value?.first_name,
      last_name: parsedAddress.value?.last_name,
      company: parsedAddress.value?.company,
      street_name: parsedAddress.value?.street_name,
      street_number: parsedAddress.value?.street_number,
      postal_code: parsedAddress.value?.postal_code,
      place: parsedAddress.value?.place,
      image_data: previewUrl.value,
    }

    if (selectedDuplicate.value) {
      await updateAddress(selectedDuplicate.value, addressData)
    } else {
      await addAddress(addressData)
    }

    saveSuccess.value = true
    setTimeout(() => {
      resetScanner()
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save address'
  } finally {
    loading.value = false
  }
}

const selectDuplicate = (id: string) => {
  selectedDuplicate.value = id
}

const createNew = () => {
  selectedDuplicate.value = null
  showDuplicates.value = false
}

const resetScanner = () => {
  imageSelected.value = false
  previewUrl.value = ''
  parsedAddress.value = null
  addressInput.value = ''
  error.value = ''
  saveSuccess.value = false
  duplicates.value = []
  selectedDuplicate.value = null
  showDuplicates.value = false
  searching.value = false
  currentFile = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    linear-gradient(135deg, rgba(91, 180, 232, 0.85) 0%, rgba(62, 155, 213, 0.9) 100%),
    url('https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920') center/cover no-repeat;
  color: white;
  position: relative;
}

.scanner-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  position: relative;
  z-index: 1;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.history-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  padding: 10px 20px;
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.history-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.upload-section {
  width: 100%;
  max-width: 500px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 3px dashed rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-4px);
}

.upload-area p {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.preview-section {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-image {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-image img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 400px;
  object-fit: cover;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
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

.loading-state p {
  font-size: 16px;
  margin: 0;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.address-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.label {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  opacity: 0.9;
}

.address-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.address-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s ease;
}

.address-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.address-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.success-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(16, 185, 129, 0.2);
  border: 2px solid rgba(16, 185, 129, 0.5);
  border-radius: 8px;
  padding: 12px;
  color: #86efac;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  padding: 12px;
  color: #fca5a5;
  font-weight: 500;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
}

.error-section p {
  font-size: 16px;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.save-btn {
  background: #10b981;
  color: white;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.parsed-fields-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.duplicates-section {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.5);
  border-radius: 12px;
}

.info-text {
  font-size: 13px;
  margin: 8px 0 16px 0;
  opacity: 0.9;
}

.duplicates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.duplicate-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.duplicate-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateX(4px);
}

.duplicate-card.selected {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.6);
}

.duplicate-content {
  flex: 1;
}

.duplicate-text {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.duplicate-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.duplicate-details span {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-weight: 500;
}

.selected-indicator {
  color: #86efac;
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.create-new-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-new-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .header {
    padding: 20px 16px;
  }

  .header h1 {
    font-size: 22px;
  }

  .history-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .upload-area {
    padding: 40px 20px;
  }

  .content {
    padding: 16px;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
