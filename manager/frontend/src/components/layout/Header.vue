<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { setLocale, getLocale } from '@/i18n'
import { modStoreApi } from '@/api/management'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const currentLocale = ref(getLocale())
const webMapInstalled = ref(false)

function toggleLocale() {
  const newLocale = currentLocale.value === 'de' ? 'en' : 'de'
  setLocale(newLocale)
  currentLocale.value = newLocale
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function openWebMap() {
  // Navigate to the embedded web map page
  router.push('/webmap')
}

async function checkWebMapStatus() {
  try {
    const result = await modStoreApi.getAvailable()
    const webMap = result.mods.find(m => m.id === 'easywebmap')
    if (webMap && webMap.installed) {
      webMapInstalled.value = true
    }
  } catch (e) {
    // Silently fail - just don't show the button
  }
}

onMounted(() => {
  checkWebMapStatus()
})
</script>

<template>
  <!-- Demo Mode Banner -->
  <div v-if="authStore.isDemo" class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-6 py-2">
    <div class="flex items-center justify-center gap-3 text-sm">
      <span class="px-2 py-0.5 bg-amber-500 text-black font-bold rounded text-xs">{{ t('auth.demoBadge') }}</span>
      <span class="text-amber-200">{{ t('auth.demoModeActive') }}</span>
      <a
        href="https://github.com/KyuubiDDragon/KyuubiSoft-Hytale-Panel"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 px-2 py-0.5 bg-dark-100 hover:bg-dark-50 rounded text-amber-300 hover:text-amber-200 transition-colors"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        GitHub
      </a>
    </div>
  </div>

  <header class="h-16 bg-dark-200 border-b border-dark-50/50 flex items-center justify-between px-6">
    <!-- Left: Page Title (handled by route) -->
    <div>
      <!-- Placeholder for breadcrumbs or page title -->
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
      <!-- Web Map Button (only when EasyWebMap is installed) -->
      <button
        v-if="webMapInstalled"
        @click="openWebMap"
        class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-hytale-orange transition-colors rounded-lg hover:bg-dark-50"
        :title="t('header.openMap')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </button>

      <!-- Language Toggle -->
      <button
        @click="toggleLocale"
        class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-50"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span class="uppercase font-medium">{{ currentLocale }}</span>
      </button>

      <!-- User Menu -->
      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-50"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="authStore.isDemo ? 'bg-amber-500/20' : 'bg-hytale-orange/20'">
            <span :class="authStore.isDemo ? 'text-amber-500' : 'text-hytale-orange'" class="font-medium">
              {{ authStore.isDemo ? 'D' : (authStore.username?.charAt(0).toUpperCase() || 'U') }}
            </span>
          </div>
          <span>{{ authStore.username }}</span>
          <span v-if="authStore.isDemo" class="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded font-medium">DEMO</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown -->
        <div
          v-if="showUserMenu"
          class="absolute right-0 mt-2 w-48 bg-dark-100 border border-dark-50 rounded-lg shadow-lg py-1 z-50"
        >
          <button
            @click="logout"
            class="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-dark-50 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ t('auth.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Click outside to close menu -->
  <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false" />
</template>
