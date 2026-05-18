<script setup>
import { defineAsyncComponent } from 'vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import ProgressBar from 'primevue/progressbar';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Components
import TerminTable from './components/TerminTable.vue';
import TerminForm from './components/TerminForm.vue';
const TerminActions = defineAsyncComponent(() => import('./components/TerminActions.vue'));
const GroupManager = defineAsyncComponent(() => import('./components/GroupManager.vue'));

// Composables
import { useTermine } from './composables/useTermine';

const toast = useToast();
const confirm = useConfirm();

const commitHash = import.meta.env.VITE_APP_COMMIT_HASH || 'dev';
const buildTime = import.meta.env.VITE_APP_BUILD_TIME || new Date().toISOString();
const shortHash = commitHash.slice(0, 7);

const {
  data,
  sortedTermine,
  gruppeOptions,
  newTermin,
  jsonOutput,
  validationErrors,
  isLoading,
  addTermin,
  deleteTermin,
  discardLocalData,
  showJson,
  downloadJson,
  downloadIcal,
  downloadAllIcal,
  syncFromGCal
} = useTermine(toast, confirm);
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <div v-if="isLoading" class="fixed top-0 left-0 w-full z-50">
    <ProgressBar mode="indeterminate" style="height: 4px" />
  </div>
  
  <div class="p-4 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900 font-sans">
    <h1 class="text-3xl font-black text-red-600 tracking-tight mb-6 flex items-center gap-2 border-b-2 border-slate-200 pb-2 uppercase">
      <i class="pi pi-bolt"></i> Termin-Erfassungsmaske
    </h1>

    <Tabs value="0">
      <TabList class="mb-6">
        <Tab value="0" class="flex items-center gap-2"><i class="pi pi-calendar"></i> Termine</Tab>
        <Tab value="1" class="flex items-center gap-2"><i class="pi pi-users"></i> Mannschaft</Tab>
        <Tab value="2" class="flex items-center gap-2"><i class="pi pi-database"></i> Export/Import</Tab>
      </TabList>
      <TabPanels class="!p-0 !bg-transparent">
        <TabPanel value="0">
          <TerminTable 
            :termine="sortedTermine" 
            :gruppe-options="gruppeOptions" 
            @delete-termin="deleteTermin" 
            @discard-local-data="discardLocalData"
            @export-ical="downloadIcal"
          />
          <TerminForm 
            :new-termin="newTermin" 
            :validation-errors="validationErrors" 
            :gruppe-options="gruppeOptions" 
            @add-termin="addTermin" 
          />
        </TabPanel>
        <TabPanel value="1">
          <GroupManager :gruppen="data.Gruppen" />
        </TabPanel>
        <TabPanel value="2">
          <TerminActions 
            :stand="data.stand" 
            :json-output="jsonOutput" 
            :defaults="data"
            @show-json="showJson" 
            @download-json="downloadJson" 
            @download-ical="downloadAllIcal"
            @sync-gcal="syncFromGCal"
            @close-preview="jsonOutput = ''" 
          />        
        </TabPanel>
      </TabPanels>
    </Tabs>

    <footer class="mt-12 pt-6 border-t border-slate-200 text-slate-400 text-xs flex flex-wrap justify-between items-center gap-y-2">
      <div>&copy; 2026 FFW Tool</div>
      <div class="flex gap-4">
        <span v-if="commitHash !== 'dev'">Revision: <span class="font-mono">{{ shortHash }}</span></span>
        <span>Built: {{ new Date(buildTime).toLocaleString('de-DE') }}</span>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global styles or theme overrides if needed */
.p-datepicker {
    font-family: 'Inter', sans-serif;
}
</style>
