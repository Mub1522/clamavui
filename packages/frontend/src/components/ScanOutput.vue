<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  events:      { type: Array,  default: () => [] },
  isStreaming: { type: Boolean, default: false },
  summary:     { type: Object,  default: null }
})

const terminalRef = ref(null)
const fileCount = computed(() => props.events.filter(e => e.type === 'file').length)

watch(
  () => props.events.length,
  async () => {
    await nextTick()
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  }
)
</script>

<template>
  <div v-if="events.length > 0 || isStreaming" class="card bg-base-200 border border-base-300 mt-4">
    <div class="card-body p-4">

      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-base-content/70">Salida del escaneo</span>
        <div class="flex items-center gap-3">
          <span v-if="isStreaming" class="loading loading-dots loading-xs text-primary"></span>
          <span class="badge badge-ghost badge-sm font-mono">{{ fileCount }} archivos</span>
        </div>
      </div>

      <!-- Terminal -->
      <div
        ref="terminalRef"
        class="bg-black/60 border border-base-300 rounded-lg p-3 font-mono text-xs h-60 overflow-y-auto leading-relaxed"
      >
        <div v-for="(evt, i) in events" :key="i" class="whitespace-pre-wrap break-all">
          <template v-if="evt.type === 'file'">
            <span v-if="evt.status === 'ok'" class="text-base-content/35">
              {{ evt.path }}: <span class="text-success/70">OK</span>
            </span>
            <span v-else-if="evt.status === 'infected'" class="text-error font-bold">
              ⚠ {{ evt.path }}: <span class="text-error">{{ evt.threat }} FOUND</span>
            </span>
          </template>
          <span v-else-if="evt.type === 'stderr'" class="text-warning/80">{{ evt.text }}</span>
          <span v-else-if="evt.type === 'error'" class="text-error">✗ {{ evt.message }}</span>
        </div>
        <span v-if="isStreaming && !summary" class="text-primary/60 animate-pulse">▌</span>
      </div>

      <!-- Summary block -->
      <div v-if="summary" class="mt-3 border border-base-content/10 rounded-lg overflow-hidden">
        <div class="bg-base-300 px-4 py-2 text-xs text-base-content/50 font-mono tracking-widest uppercase">
          ─── Resumen del escaneo ───
        </div>
        <div class="p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-3xl font-bold text-base-content">{{ summary.scanned }}</div>
            <div class="text-xs text-base-content/40 mt-1">Escaneados</div>
          </div>
          <div>
            <div
              class="text-3xl font-bold"
              :class="summary.infected > 0 ? 'text-error' : 'text-success'"
            >{{ summary.infected }}</div>
            <div class="text-xs text-base-content/40 mt-1">Infectados</div>
          </div>
          <div>
            <div class="text-base font-medium text-base-content/60 mt-2">{{ summary.time || '—' }}</div>
            <div class="text-xs text-base-content/40 mt-1">Duración</div>
          </div>
        </div>
        <div class="px-4 pb-4 text-center">
          <div v-if="summary.infected === 0" class="badge badge-success badge-lg gap-1 px-4">
            ✓ Sin amenazas detectadas
          </div>
          <div v-else class="badge badge-error badge-lg gap-1 px-4">
            ⚠ {{ summary.infected }} amenaza(s) encontrada(s)
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
