<script setup>
import { ref, onMounted } from 'vue'

const logs = ref([])
const loading = ref(false)
const fetchError = ref('')
const expandedId = ref(null)

async function fetchLogs() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch('/api/logs')
    const data = await res.json()
    logs.value = data.logs
  } catch (e) {
    fetchError.value = e.message
  } finally {
    loading.value = false
  }
}

async function deleteLog(id) {
  await fetch(`/api/logs/${id}`, { method: 'DELETE' })
  logs.value = logs.value.filter(l => l.id !== id)
}

async function clearAll() {
  if (!confirm('¿Eliminar todo el historial de escaneos? Esta acción no se puede deshacer.')) return
  await fetch('/api/logs/all', { method: 'DELETE' })
  logs.value = []
  expandedId.value = null
}

function toggleExpand(log) {
  if (log.type !== 'scan' || !log.infectedPaths?.length) return
  expandedId.value = expandedId.value === log.id ? null : log.id
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const STATUS_CLASSES = {
  clean:    'badge-success',
  infected: 'badge-error',
  error:    'badge-warning',
  success:  'badge-success'
}

function statusClass(s) {
  return STATUS_CLASSES[s] || 'badge-ghost'
}

function statusLabel(log) {
  if (log.type === 'update') return log.status === 'success' ? 'Actualizado' : 'Error'
  const map = { clean: 'Limpio', infected: 'Infectado', error: 'Error' }
  return map[log.status] || log.status
}

onMounted(fetchLogs)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold tracking-wide">Historial de Escaneos</h2>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-ghost border border-base-300" :disabled="loading" @click="fetchLogs">
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <span v-else>↻</span>
        </button>
        <button
          v-if="logs.length > 0"
          class="btn btn-sm btn-outline btn-error"
          @click="clearAll"
        >
          Limpiar todo
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && logs.length === 0" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && logs.length === 0" class="text-center py-20 text-base-content/30">
      <div class="text-5xl mb-4 opacity-20">☰</div>
      <p class="text-lg font-light">Sin historial aún</p>
      <p class="text-sm mt-1 opacity-70">Los escaneos y actualizaciones aparecerán aquí</p>
    </div>

    <!-- Log list -->
    <div v-else class="space-y-2">
      <div
        v-for="log in logs"
        :key="log.id"
        class="card bg-base-200 border transition-all"
        :class="[
          log.type === 'scan' && log.infectedPaths?.length ? 'cursor-pointer hover:border-primary/40' : '',
          expandedId === log.id ? 'border-primary/30' : 'border-base-300'
        ]"
        @click="toggleExpand(log)"
      >
        <div class="card-body p-3">
          <!-- Main row -->
          <div class="flex items-center gap-3">
            <!-- Type icon -->
            <span class="text-base-content/30 text-lg shrink-0">
              {{ log.type === 'scan' ? '⬡' : '↻' }}
            </span>

            <!-- Path / label -->
            <div class="flex-1 min-w-0">
              <span class="font-mono text-sm text-base-content/80 truncate block">
                {{ log.type === 'scan' ? log.path : 'freshclam (actualización BD)' }}
              </span>
              <!-- Scan sub-info -->
              <div v-if="log.type === 'scan'" class="flex gap-3 text-xs text-base-content/40 mt-0.5">
                <span>{{ log.scannedFiles ?? 0 }} escaneados</span>
                <span :class="log.infectedCount > 0 ? 'text-error font-semibold' : ''">
                  {{ log.infectedCount ?? 0 }} infectados
                </span>
                <span v-if="log.duration">{{ log.duration }}</span>
              </div>
            </div>

            <!-- Right side: badge + date + delete -->
            <div class="flex items-center gap-2 shrink-0">
              <span :class="`badge badge-sm ${statusClass(log.status)}`">
                {{ statusLabel(log) }}
              </span>
              <span class="text-xs text-base-content/30 hidden sm:block">
                {{ formatDate(log.startedAt) }}
              </span>
              <button
                class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                @click.stop="deleteLog(log.id)"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Expanded infected files -->
          <div
            v-if="expandedId === log.id && log.infectedPaths?.length"
            class="mt-2 border-t border-base-300 pt-2"
          >
            <p class="text-xs text-base-content/40 font-semibold uppercase tracking-wider mb-2">
              Archivos infectados
            </p>
            <div
              v-for="inf in log.infectedPaths"
              :key="inf.path"
              class="flex items-start gap-2 py-1 font-mono text-xs text-error"
            >
              <span class="shrink-0 mt-0.5">⚠</span>
              <div>
                <span class="break-all">{{ inf.path }}</span>
                <span class="text-error/60 ml-2">— {{ inf.threat }}</span>
              </div>
            </div>
          </div>

          <!-- Expand hint -->
          <div
            v-if="log.type === 'scan' && log.infectedPaths?.length && expandedId !== log.id"
            class="text-xs text-primary/50 mt-1 text-right"
          >
            ▼ {{ log.infectedPaths.length }} archivo(s) infectado(s) — click para ver
          </div>
        </div>
      </div>
    </div>

    <div v-if="fetchError" class="alert alert-error mt-4">
      <span>{{ fetchError }}</span>
    </div>
  </div>
</template>
