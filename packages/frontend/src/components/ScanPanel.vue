<script setup>
import { ref, inject } from 'vue'
import ScanOutput from './ScanOutput.vue'
import PathPicker from './PathPicker.vue'
import { useSSEStream } from '../composables/useSSEStream.js'

const emit = defineEmits(['scan-complete'])
const notifier = inject('notifier', { notify: () => {} })

const scanPath = ref('')
const showPicker = ref(false)
const infectedOnly = ref(false)
const moveToQuarantine = ref(false)
const quarantinePath = ref('C:\\cuarentena')
const pathError = ref('')

const { events, isStreaming, error, summary, start, stop } = useSSEStream()

function sanitizePath(p) {
  return p.trim().replace(/^"(.*)"$/, '$1').trim()
}

function onPathPaste(e) {
  const text = e.clipboardData.getData('text')
  const clean = sanitizePath(text)
  if (clean !== text) {
    e.preventDefault()
    scanPath.value = clean
  }
}

function validatePathFormat(p) {
  if (!p.trim()) return 'Ingresa una ruta para escanear'
  if (!/^[A-Za-z]:[\\\/]/.test(p.trim())) return 'La ruta debe comenzar con letra de unidad (ej: C:\\)'
  if (/[;&|><^`]/.test(p)) return 'La ruta contiene caracteres no permitidos'
  return ''
}

async function startScan() {
  scanPath.value = sanitizePath(scanPath.value)
  pathError.value = validatePathFormat(scanPath.value)
  if (pathError.value) return

  await start('/api/scan', {
    path: scanPath.value,
    options: {
      infectedOnly: infectedOnly.value,
      moveToQuarantine: moveToQuarantine.value,
      quarantinePath: quarantinePath.value
    }
  })

  if (summary.value !== null) {
    const { scanned, infected } = summary.value
    if (infected > 0) {
      notifier.notify(
        `⚠ ${infected} amenaza(s) encontrada(s)`,
        `${scanned} archivos escaneados en: ${scanPath.value}`
      )
    } else {
      notifier.notify(
        '✓ Escaneo completado',
        `${scanned} archivo(s) escaneados · Sin amenazas detectadas`
      )
    }
    emit('scan-complete')
  } else if (error.value) {
    notifier.notify('✗ Error de escaneo', error.value)
  }
}
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold tracking-wide mb-5">Escanear Archivos y Carpetas</h2>

    <!-- Form card -->
    <div class="card bg-base-200 border border-base-300 shadow mb-4">
      <div class="card-body p-5 gap-4">

        <!-- Path input -->
        <div class="form-control">
          <label class="label pb-1">
            <span class="label-text font-medium text-sm">Ruta a escanear</span>
            <span class="label-text-alt text-base-content/40 text-xs">archivo o carpeta</span>
          </label>
          <div class="join w-full">
            <input
              v-model="scanPath"
              type="text"
              placeholder="C:\Users\USUARIO\Documents"
              class="input input-bordered join-item flex-1 font-mono text-sm bg-base-300"
              :class="{ 'input-error': pathError }"
              :disabled="isStreaming"
              @keyup.enter="startScan"
              @paste="onPathPaste"
            />
            <!-- Browse button -->
            <button
              class="btn join-item btn-outline border-base-content/20 px-3"
              :disabled="isStreaming"
              title="Explorar carpetas"
              @click="showPicker = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
            </button>
            <button
              v-if="!isStreaming"
              class="btn join-item btn-primary min-w-[110px]"
              @click="startScan"
            >
              Escanear
            </button>
            <button
              v-else
              class="btn join-item btn-error min-w-[110px]"
              @click="stop"
            >
              ✕ Detener
            </button>
          </div>
          <label v-if="pathError" class="label pt-1">
            <span class="label-text-alt text-error text-xs">{{ pathError }}</span>
          </label>
        </div>

        <!-- Options -->
        <div class="divider my-0 text-xs text-base-content/30 before:bg-base-300 after:bg-base-300">
          Opciones de escaneo
        </div>
        <div class="flex flex-wrap gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="infectedOnly"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm"
              :disabled="isStreaming"
            />
            <span class="text-sm">Mostrar solo infectados</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="moveToQuarantine"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm"
              :disabled="isStreaming"
            />
            <span class="text-sm">Mover infectados a cuarentena</span>
          </label>
        </div>

        <div v-if="moveToQuarantine" class="form-control">
          <label class="label pb-1">
            <span class="label-text text-sm">Carpeta de cuarentena</span>
          </label>
          <input
            v-model="quarantinePath"
            type="text"
            class="input input-bordered input-sm font-mono text-sm bg-base-300"
            :disabled="isStreaming"
            placeholder="C:\cuarentena"
          />
          <label class="label pt-1">
            <span class="label-text-alt text-base-content/40 text-xs">
              La carpeta debe existir antes de escanear
            </span>
          </label>
        </div>

      </div>
    </div>

    <!-- API/validation error -->
    <div v-if="error && !isStreaming" class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Live output -->
    <ScanOutput :events="events" :is-streaming="isStreaming" :summary="summary" />

    <!-- Path picker modal -->
    <PathPicker
      v-if="showPicker"
      @select="path => { scanPath = path; showPicker = false }"
      @close="showPicker = false"
    />
  </div>
</template>
