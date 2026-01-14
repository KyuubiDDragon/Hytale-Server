<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from '@/components/ui/Card.vue'
import { modsApi, pluginsApi, type ModInfo } from '@/api/management'

const { t } = useI18n()

type TabType = 'mods' | 'plugins'

const activeTab = ref<TabType>('mods')
const mods = ref<ModInfo[]>([])
const plugins = ref<ModInfo[]>([])
const modsPath = ref('')
const pluginsPath = ref('')
const loading = ref(true)
const error = ref('')

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [modsData, pluginsData] = await Promise.all([
      modsApi.get(),
      pluginsApi.get(),
    ])
    mods.value = modsData.mods
    modsPath.value = modsData.path
    plugins.value = pluginsData.plugins
    pluginsPath.value = pluginsData.path
  } catch (e) {
    error.value = t('errors.connectionFailed')
  } finally {
    loading.value = false
  }
}

async function toggleMod(mod: ModInfo) {
  try {
    await modsApi.toggle(mod.filename)
    await loadData()
  } catch (e) {
    error.value = t('errors.serverError')
  }
}

async function togglePlugin(plugin: ModInfo) {
  try {
    await pluginsApi.toggle(plugin.filename)
    await loadData()
  } catch (e) {
    error.value = t('errors.serverError')
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

const currentItems = computed(() => activeTab.value === 'mods' ? mods.value : plugins.value)
const currentPath = computed(() => activeTab.value === 'mods' ? modsPath.value : pluginsPath.value)
const enabledCount = computed(() => currentItems.value.filter(i => i.enabled).length)

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">{{ t('mods.title') }}</h1>
        <p class="text-gray-400 mt-1">{{ t('mods.subtitle') }}</p>
      </div>
      <button
        @click="loadData"
        class="text-gray-400 hover:text-white transition-colors"
        :class="{ 'animate-spin': loading }"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
      <p class="text-status-error">{{ error }}</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2">
      <button
        @click="activeTab = 'mods'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
          activeTab === 'mods'
            ? 'bg-hytale-orange text-dark'
            : 'bg-dark-100 text-gray-400 hover:text-white'
        ]"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        {{ t('mods.mods') }} ({{ mods.length }})
      </button>
      <button
        @click="activeTab = 'plugins'"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
          activeTab === 'plugins'
            ? 'bg-purple-500 text-white'
            : 'bg-dark-100 text-gray-400 hover:text-white'
        ]"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
        </svg>
        {{ t('mods.plugins') }} ({{ plugins.length }})
      </button>
    </div>

    <!-- Info Card -->
    <Card>
      <div class="flex items-start gap-4">
        <div class="p-3 bg-hytale-orange/20 rounded-lg">
          <svg class="w-6 h-6 text-hytale-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-white">{{ enabledCount }} {{ t('mods.active') }}</h3>
          <p class="text-sm text-gray-400 mt-1">{{ t('mods.path') }}: <code class="text-xs bg-dark-100 px-2 py-0.5 rounded">{{ currentPath }}</code></p>
          <p class="text-sm text-gray-500 mt-2">{{ t('mods.restartNote') }}</p>
        </div>
      </div>
    </Card>

    <!-- Items List -->
    <Card :title="activeTab === 'mods' ? t('mods.mods') : t('mods.plugins')" :padding="false">
      <div v-if="loading" class="text-center text-gray-500 p-8">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="currentItems.length === 0" class="text-center text-gray-500 p-8">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        {{ activeTab === 'mods' ? t('mods.noMods') : t('mods.noPlugins') }}
      </div>

      <div v-else class="divide-y divide-dark-50/30">
        <div
          v-for="item in currentItems"
          :key="item.filename"
          class="flex items-center justify-between p-4 hover:bg-dark-50/20 transition-colors"
        >
          <div class="flex items-center gap-4">
            <!-- Icon -->
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center',
                item.enabled
                  ? (activeTab === 'mods' ? 'bg-hytale-orange/20' : 'bg-purple-500/20')
                  : 'bg-gray-600/20'
              ]"
            >
              <svg
                class="w-6 h-6"
                :class="item.enabled ? (activeTab === 'mods' ? 'text-hytale-orange' : 'text-purple-400') : 'text-gray-500'"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path v-if="activeTab === 'mods'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- Info -->
            <div>
              <p :class="['font-medium', item.enabled ? 'text-white' : 'text-gray-500']">{{ item.name }}</p>
              <div class="flex items-center gap-3 text-sm text-gray-500">
                <span>{{ formatSize(item.size) }}</span>
                <span>{{ formatDate(item.lastModified) }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs',
                    item.enabled ? 'bg-status-success/20 text-status-success' : 'bg-gray-600/20 text-gray-500'
                  ]"
                >
                  {{ item.enabled ? t('mods.enabled') : t('mods.disabled') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Toggle Button -->
          <button
            @click="activeTab === 'mods' ? toggleMod(item) : togglePlugin(item)"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              item.enabled ? (activeTab === 'mods' ? 'bg-hytale-orange' : 'bg-purple-500') : 'bg-dark-50'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                item.enabled ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
      </div>
    </Card>
  </div>
</template>
