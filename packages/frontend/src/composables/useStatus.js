import { ref } from 'vue'

// Module-level state so all components share the same status
const status = ref(null)
const loading = ref(false)
const error = ref(null)

export function useStatus() {
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/status')
      status.value = await res.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { status, loading, error, refresh }
}
