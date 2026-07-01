<script setup>
defineProps({ activeTab: String })
defineEmits(['tab-change'])

const tabs = [
  { id: 'status',  label: 'Estado'       },
  { id: 'scan',    label: 'Escanear'     },
  { id: 'update',  label: 'Actualizar BD' },
  { id: 'logs',    label: 'Historial'    }
]
</script>

<template>
  <header class="bg-base-200 border-b border-base-300 shadow-lg">
    <div class="container mx-auto px-4 max-w-5xl">
      <!-- Logo + title row -->
      <div class="flex items-center gap-3 py-3 border-b border-base-300/50">
        <img src="/logo.png" alt="ClamAV" class="h-8 w-8 object-contain" />
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold tracking-widest text-primary uppercase">ClamAV</h1>
          <span class="text-xs text-base-content/40 font-light tracking-wider">Antivirus UI</span>
        </div>
        <div class="ml-auto">
          <span class="badge badge-outline badge-primary text-xs">v1.0</span>
        </div>
      </div>

      <!-- Tabs row -->
      <div class="flex">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px"
          :class="activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-base-content/50 hover:text-base-content/80 hover:border-base-content/20'"
          @click="$emit('tab-change', tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </header>
</template>
