<script setup>
import { ref, provide, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import StatusCard from './components/StatusCard.vue'
import ScanPanel from './components/ScanPanel.vue'
import UpdatePanel from './components/UpdatePanel.vue'
import LogsPanel from './components/LogsPanel.vue'

const activeTab = ref('status')
const logsKey = ref(0)

// Browser notifications setup — provided to all child components
function notify(title, body, icon = '/logo.png') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon })
  }
}
provide('notifier', { notify })

onMounted(async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
})

function onScanComplete() {
  logsKey.value++
}
</script>

<template>
  <div class="min-h-screen bg-base-100 flex flex-col">
    <AppHeader :active-tab="activeTab" @tab-change="tab => activeTab = tab" />

    <main class="flex-1 container mx-auto px-4 py-6 max-w-5xl w-full">
      <StatusCard v-show="activeTab === 'status'" />
      <ScanPanel v-show="activeTab === 'scan'" @scan-complete="onScanComplete" />
      <UpdatePanel v-show="activeTab === 'update'" />
      <LogsPanel v-show="activeTab === 'logs'" :key="logsKey" />
    </main>

    <footer class="py-2 text-center text-xs text-base-content/30 border-t border-base-300">
      ClamAV UI · http://localhost:47219
    </footer>
  </div>
</template>
