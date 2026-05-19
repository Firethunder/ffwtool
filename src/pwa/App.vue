<script setup>
import { ref, onMounted } from 'vue'
import Dashboard from './components/Dashboard.vue'
import TerminList from './components/TerminList.vue'
import CalendarSync from './components/CalendarSync.vue'

const appointments = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/ffwtool/termine.json')
    if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok')
    const data = await response.json()
    // Extract the 'termine' array from the wrapper object
    appointments.value = data.termine || []
  } catch (err) {
    console.error('Fehler beim Laden der Termine:', err)
    error.value = 'Fehler beim Laden der Termine. Bitte prüfe deine Internetverbindung.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-xl mx-auto p-4 pb-20">
      <header class="mb-8 pt-4">
        <h1 class="text-xl font-black text-red-600 tracking-tight leading-tight uppercase">
          FFW Rosenfeld<br/>
          <span class="text-slate-800 text-sm">Abt. Brittheim</span>
        </h1>
      </header>

      <main>
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
          <div class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Lade Termine...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
          <p class="text-red-600 font-medium mb-4">{{ error }}</p>
          <button @click="() => location.reload()" class="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-md">
            Erneut versuchen
          </button>
        </div>

        <div v-else>
          <Dashboard :appointments="appointments" />
          <TerminList :appointments="appointments" />
          <CalendarSync />
        </div>
      </main>

      <footer class="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        Copyright Robert Edelmann &copy; 2026
      </footer>
    </div>
  </div>
</template>

<style>
body {
  -webkit-tap-highlight-color: transparent;
}
</style>
