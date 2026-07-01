<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['select', 'close'])

const currentPath = ref(null)
const entries = ref([])
const parentPath = ref(null)
const loading = ref(false)
const error = ref('')

async function browse(path) {
  loading.value = true
  error.value = ''
  try {
    const url = path ? `/api/browse?path=${encodeURIComponent(path)}` : '/api/browse'
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok) { error.value = data.error; return }
    currentPath.value = data.path
    parentPath.value = data.parent
    entries.value = data.entries
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Load drives on open
browse(null)

function select(entry) {
  if (entry.type === 'dir' || entry.type === 'drive') {
    browse(entry.path)
  }
}

function confirm() {
  if (currentPath.value) emit('select', currentPath.value)
}

function selectEntry(entry) {
  emit('select', entry.path)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
    <div class="bg-base-200 border border-base-300 rounded-xl shadow-2xl w-full max-w-lg flex flex-col" style="max-height: 80vh">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
        <h3 class="font-semibold text-sm">Seleccionar carpeta o archivo</h3>
        <button class="btn btn-ghost btn-xs btn-circle" @click="$emit('close')">✕</button>
      </div>

      <!-- Breadcrumb path -->
      <div class="px-4 py-2 border-b border-base-300 shrink-0 min-h-[36px]">
        <div v-if="currentPath" class="flex items-center gap-1 flex-wrap">
          <!-- Back button -->
          <button
            v-if="parentPath !== undefined"
            class="btn btn-ghost btn-xs gap-1 font-mono text-xs"
            :disabled="!parentPath && currentPath !== null"
            @click="browse(parentPath)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Atrás
          </button>
          <span class="font-mono text-xs text-base-content/60 truncate">{{ currentPath }}</span>
        </div>
        <span v-else class="text-xs text-base-content/40">Unidades del sistema</span>
      </div>

      <!-- Entries list -->
      <div class="overflow-y-auto flex-1 px-2 py-1">
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
        <div v-else-if="error" class="alert alert-error text-xs m-2">{{ error }}</div>
        <div v-else-if="entries.length === 0" class="text-center text-xs text-base-content/30 py-8">
          Carpeta vacía
        </div>
        <div v-else>
          <button
            v-for="entry in entries"
            :key="entry.path"
            class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-base-300 transition-colors text-left group"
            @click="select(entry)"
          >
            <!-- Folder icon -->
            <svg v-if="entry.type === 'dir' || entry.type === 'drive'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-warning/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
            </svg>
            <!-- File icon -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>

            <span class="flex-1 font-mono text-xs truncate">{{ entry.name }}</span>

            <!-- Select file directly -->
            <button
              v-if="entry.type === 'file'"
              class="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100 shrink-0"
              @click.stop="selectEntry(entry)"
            >
              Seleccionar
            </button>
            <!-- Arrow for dirs -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-2 px-4 py-3 border-t border-base-300 shrink-0">
        <span class="text-xs text-base-content/40 font-mono truncate flex-1">
          {{ currentPath || 'Ninguna carpeta seleccionada' }}
        </span>
        <div class="flex gap-2 shrink-0">
          <button class="btn btn-sm btn-ghost" @click="$emit('close')">Cancelar</button>
          <button
            class="btn btn-sm btn-primary"
            :disabled="!currentPath"
            @click="confirm"
          >
            Seleccionar esta carpeta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
