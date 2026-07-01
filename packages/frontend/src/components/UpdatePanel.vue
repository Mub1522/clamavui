<script setup>
import { ref, inject, watch, nextTick } from 'vue'
import { useSSEStream } from '../composables/useSSEStream.js'
import { useStatus } from '../composables/useStatus.js'

const notifier = inject('notifier', { notify: () => {} })
const { events, isStreaming, error, start } = useSSEStream()
const { refresh: refreshStatus } = useStatus()

const terminalRef = ref(null)
const finished = ref(false)
const lastExitCode = ref(null)
const lastSignal = ref(null)

watch(
  () => events.value.length,
  async () => {
    await nextTick()
    if (terminalRef.value) terminalRef.value.scrollTop = terminalRef.value.scrollHeight
  }
)

async function runUpdate() {
  finished.value = false
  lastExitCode.value = null

  await start('/api/update', {})

  const doneEvt = events.value.find(e => e.type === 'done')
  if (doneEvt) {
    lastExitCode.value = doneEvt.exitCode
    lastSignal.value = doneEvt.signal ?? null
    finished.value = true
    if (doneEvt.exitCode === 0) {
      notifier.notify('✓ Base de datos actualizada', 'Las firmas de virus se han actualizado correctamente')
      refreshStatus()
    } else {
      notifier.notify('✗ Error al actualizar BD', `freshclam salió con código ${doneEvt.exitCode}`)
    }
  } else if (error.value) {
    finished.value = true
    lastExitCode.value = -1
    notifier.notify('✗ Error al actualizar BD', error.value)
  }
}
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold tracking-wide mb-5">Actualizar Base de Datos</h2>

    <!-- Admin notice -->
    <div class="alert border border-warning/30 bg-warning/10 text-warning-content mb-5">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-warning shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div class="text-sm text-warning">
        <span class="font-semibold">Permisos de Administrador:</span>
        En Windows, <code class="bg-base-300 px-1 rounded text-xs">freshclam</code> necesita permisos de Administrador
        para escribir en la carpeta de base de datos de ClamAV. Si falla con error de permisos,
        ejecuta este servidor o la terminal como Administrador.
      </div>
    </div>

    <!-- Update card -->
    <div class="card bg-base-200 border border-base-300 shadow">
      <div class="card-body p-5">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 class="font-semibold">Firmas de Virus (freshclam)</h3>
            <p class="text-sm text-base-content/50 mt-1">
              Descarga las últimas definiciones desde los servidores de ClamAV
            </p>
          </div>
          <button
            class="btn btn-primary shrink-0"
            :disabled="isStreaming"
            @click="runUpdate"
          >
            <span v-if="isStreaming" class="loading loading-spinner loading-sm"></span>
            <span v-else>↻ Actualizar</span>
          </button>
        </div>

        <!-- Terminal output -->
        <div
          v-if="events.length > 0"
          ref="terminalRef"
          class="bg-black/60 border border-base-300 rounded-lg p-3 font-mono text-xs h-52 overflow-y-auto leading-relaxed"
        >
          <div v-for="(evt, i) in events" :key="i" class="whitespace-pre-wrap break-all">
            <span v-if="evt.type === 'line'" class="text-base-content/70">{{ evt.text }}</span>
            <span v-else-if="evt.type === 'error'" class="text-error">✗ {{ evt.message }}</span>
            <span v-else-if="evt.type === 'connected'" class="text-primary/60">Conectando a freshclam...</span>
          </div>
          <span v-if="isStreaming" class="text-primary/50 animate-pulse">▌</span>
        </div>

        <!-- Result -->
        <div v-if="finished" class="mt-4">
          <div v-if="lastExitCode === 0" class="alert alert-success text-sm">
            ✓ Base de datos actualizada correctamente
          </div>
          <div v-else-if="lastExitCode === null" class="alert alert-warning text-sm">
            <div class="w-full">
              <p class="font-semibold">
                freshclam terminó por señal
                <span v-if="lastSignal" class="font-mono text-xs ml-1">({{ lastSignal }})</span>
              </p>
              <p class="mt-2 text-xs opacity-80 font-semibold uppercase tracking-wide">Soluciones en orden:</p>
              <ol class="list-decimal ml-4 mt-1 space-y-1 text-xs">
                <li>
                  <strong>Detén el servicio freshclam de Windows</strong> antes de actualizar desde aquí:
                  <code class="block bg-black/30 rounded px-2 py-0.5 mt-0.5 font-mono">net stop "ClamAV freshclam" && freshclam --stdout -v</code>
                </li>
                <li>O ejecuta este servidor Node.js como <strong>Administrador</strong> (click derecho → Ejecutar como administrador)</li>
                <li>O deja que el servicio de Windows actualice automáticamente (revisa <code class="font-mono">C:\ProgramData\ClamAV\freshclam.log</code>)</li>
              </ol>
            </div>
          </div>
          <div v-else class="alert alert-error text-sm">
            ✗ Error al actualizar — freshclam salió con código {{ lastExitCode }}
            <span class="text-xs opacity-70 ml-1">(0=ok, 1=error, 2=error config)</span>
          </div>
        </div>

        <div v-if="error && !isStreaming && !finished" class="alert alert-error mt-4 text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
