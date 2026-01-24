import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Demo Mode Store
 *
 * Tracks whether the panel is running in demo mode.
 * In demo mode, all data is simulated and no real server is required.
 */
export const useDemoStore = defineStore('demo', () => {
  const isDemoMode = ref(false)
  const demoMessage = ref<string | null>(null)
  const checked = ref(false)

  async function checkDemoMode() {
    // Only check once
    if (checked.value) return isDemoMode.value

    try {
      const response = await fetch('/api/server/demo')
      if (response.ok) {
        const data = await response.json()
        isDemoMode.value = data.demoMode || false
        demoMessage.value = data.message || null
      }
    } catch {
      // If we can't reach the API, assume not in demo mode
      isDemoMode.value = false
    }

    checked.value = true
    return isDemoMode.value
  }

  return {
    isDemoMode,
    demoMessage,
    checked,
    checkDemoMode,
  }
})
