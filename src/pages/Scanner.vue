<template>
  <div class="scanner-container">
    <div class="header">
      <h1>Address Scanner</h1>
      <router-link to="/history" class="history-btn">
        <Clock :size="24" />
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

        <div v-else-if="recognizedAddress" class="result-section">
          <div class="address-card">
            <p class="label">Recognized Address:</p>
            <p class="address-text">{{ recognizedAddress }}</p>
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
            <button @click="saveAddress" class="save-btn">
              Save Address
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
import { ref } from 'vue'
import { Camera, Clock, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { recognizeAddress } from '@/lib/ocr'
import { supabase } from '@/lib/supabase'

const fileInput = ref<HTMLInputElement>()
const imageSelected = ref(false)
const previewUrl = ref('')
const recognizedAddress = ref('')
const addressInput = ref('')
const loading = ref(false)
const error = ref('')
const saveSuccess = ref(false)
let currentFile: File | null = null

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
  recognizedAddress.value = ''
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
    const address = await recognizeAddress(currentFile)
    recognizedAddress.value = address
    addressInput.value = address
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to recognize address'
  } finally {
    loading.value = false
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
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id || null

    const { error: insertError } = await supabase
      .from('addresses')
      .insert({
        address: addressInput.value,
        user_id: userId,
        image_data: previewUrl.value
      })

    if (insertError) throw insertError

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

const resetScanner = () => {
  imageSelected.value = false
  previewUrl.value = ''
  recognizedAddress.value = ''
  addressInput.value = ''
  error.value = ''
  saveSuccess.value = false
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.history-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.history-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
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

.save-btn:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
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

@media (max-width: 640px) {
  .header {
    padding: 16px;
  }

  .header h1 {
    font-size: 20px;
  }

  .upload-area {
    padding: 40px 20px;
  }

  .content {
    padding: 16px;
  }
}
</style>
