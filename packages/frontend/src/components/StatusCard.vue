<script setup>
import { onMounted } from 'vue'
import { useStatus } from '../composables/useStatus.js'

const { status, loading, error, refresh } = useStatus()

onMounted(refresh)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-semibold tracking-wide">Estado del Sistema</h2>
      <button class="btn btn-sm btn-outline btn-primary" :disabled="loading" @click="refresh">
        <span v-if="loading" class="loading loading-spinner loading-xs"></span>
        <span v-else>↻ Actualizar</span>
      </button>
    </div>

    <div v-if="loading && !status" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="status">
      <div v-if="!status.clamavInstalled" class="alert alert-error mb-6 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <div>
          <p class="font-semibold">ClamAV no encontrado</p>
          <p class="text-sm opacity-80">{{ status.error }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Versión ClamAV -->
        <div class="stat bg-base-200 rounded-xl border border-base-300 shadow">
          <div class="stat-figure text-primary opacity-40">
            <!-- lucide: shield -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div class="stat-title text-xs uppercase tracking-wider opacity-60">Versión ClamAV</div>
          <div class="stat-value text-primary text-2xl mt-1">{{ status.version || '—' }}</div>
          <div class="stat-desc mt-1">
            <span v-if="status.clamavInstalled" class="text-success font-medium">● Instalado</span>
            <span v-else class="text-error font-medium">● No encontrado</span>
          </div>
        </div>

        <!-- Versión BD -->
        <div class="stat bg-base-200 rounded-xl border border-base-300 shadow">
          <div class="stat-figure text-primary opacity-40">
            <!-- lucide: database -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path stroke-linecap="round" d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
              <path stroke-linecap="round" d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
            </svg>
          </div>
          <div class="stat-title text-xs uppercase tracking-wider opacity-60">Versión de BD</div>
          <div class="stat-value text-primary text-2xl mt-1">
            {{ status.dbVersion ? `v${status.dbVersion}` : '—' }}
          </div>
          <div class="stat-desc mt-1 opacity-60">Firmas de virus</div>
        </div>

        <!-- Última actualización -->
        <div class="stat bg-base-200 rounded-xl border border-base-300 shadow">
          <div class="stat-figure opacity-25">
            <!-- lucide: calendar-clock -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M8 2v3M16 2v3M3 8h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
              <circle cx="16" cy="16" r="4" fill="none" />
              <path stroke-linecap="round" d="M16 14.5V16l1 1" />
            </svg>
          </div>
          <div class="stat-title text-xs uppercase tracking-wider opacity-60">Última Actualización</div>
          <div class="stat-value text-base text-base-content/80 mt-1 leading-snug">
            {{ status.dbDate ? status.dbDate.split(' ').slice(0, 4).join(' ') : '—' }}
          </div>
          <div class="stat-desc mt-1 opacity-60">Fecha de base de datos</div>
        </div>
      </div>

      <!-- Herramientas -->
      <div class="card bg-base-200 border border-base-300">
        <div class="card-body p-4">
          <p class="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-3">Herramientas detectadas
          </p>
          <div class="flex flex-wrap gap-2">
            <span v-for="tool in ['clamscan', 'freshclam', 'clamdscan', 'clamd']" :key="tool"
              class="badge badge-outline font-mono" :class="status.tools?.[tool] ? 'badge-success' : 'opacity-40'">
              <span v-if="status.tools?.[tool]" class="mr-1 text-success">●</span>
              <span v-else class="mr-1 opacity-50">○</span>
              {{ tool }}
            </span>
          </div>
          <p class="text-xs text-base-content/30 mt-3">
            Las herramientas deben estar en el PATH del sistema (C:\Program Files\ClamAV\)
          </p>
        </div>
      </div>
    </template>

    <div v-if="error" class="alert alert-error mt-4">
      <span>{{ error }}</span>
    </div>
  </div>
</template>
