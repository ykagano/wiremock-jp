<template>
  <div class="request-log">
    <div class="page-header">
      <h2>{{ t('requests.title') }}</h2>
      <div class="header-actions">
        <el-select
          v-model="selectedInstanceId"
          :placeholder="t('requests.selectInstance')"
          style="width: 200px; margin-right: 12px;"
          @change="onInstanceChange"
        >
          <el-option
            v-for="instance in wiremockInstances"
            :key="instance.id"
            :label="instance.name"
            :value="instance.id"
          />
        </el-select>
        <el-button @click="fetchRequests" :loading="loading" :disabled="!selectedInstanceId">
          <el-icon><Refresh /></el-icon>
          {{ t('requests.refresh') }}
        </el-button>
        <el-button type="danger" plain @click="confirmClear" :disabled="!selectedInstanceId">
          <el-icon><Delete /></el-icon>
          {{ t('requests.clear') }}
        </el-button>
      </div>
    </div>

    <el-empty v-if="wiremockInstances.length === 0" :description="t('requests.noInstances')" />

    <el-empty v-else-if="!selectedInstanceId" :description="t('requests.selectInstance')" />

    <el-tabs v-else v-model="activeTab">
      <el-tab-pane :label="t('requests.all')" name="all">
        <RequestTable :requests="requests" />
      </el-tab-pane>
      <el-tab-pane :label="t('requests.matched')" name="matched">
        <RequestTable :requests="matchedRequests" />
      </el-tab-pane>
      <el-tab-pane :label="t('requests.unmatched')" name="unmatched">
        <RequestTable :requests="unmatchedOnlyRequests" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useRequestStore } from '@/stores/request'
import { useProjectStore } from '@/stores/project'
import { ElMessage, ElMessageBox } from 'element-plus'
import RequestTable from '@/components/request/RequestTable.vue'

const { t } = useI18n()
const requestStore = useRequestStore()
const projectStore = useProjectStore()
const { requests, unmatchedRequests, loading } = storeToRefs(requestStore)
const { wiremockInstances } = storeToRefs(projectStore)

const activeTab = ref('all')
const selectedInstanceId = ref<string | null>(null)

const matchedRequests = computed(() => {
  return requests.value.filter(r => r.wasMatched)
})

const unmatchedOnlyRequests = computed(() => {
  return unmatchedRequests.value
})

function onInstanceChange(instanceId: string) {
  requestStore.setCurrentInstance(instanceId)
  if (instanceId) {
    fetchRequests()
  }
}

async function fetchRequests() {
  await Promise.all([
    requestStore.fetchRequests(),
    requestStore.fetchUnmatchedRequests()
  ])
}

function confirmClear() {
  ElMessageBox.confirm(
    t('requests.confirmClear'),
    t('common.confirm'),
    {
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.no'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      await requestStore.resetRequests()
      ElMessage.success(t('common.success'))
    } catch (error) {
      console.error('Failed to clear requests:', error)
    }
  }).catch(() => {
    // キャンセル
  })
}

// 初期化時にインスタンスを取得して最初のインスタンスを選択
onMounted(async () => {
  // 現在のプロジェクトが設定されている場合は常に最新のインスタンスを取得
  if (projectStore.currentProjectId) {
    await projectStore.fetchWiremockInstances(projectStore.currentProjectId)
  }

  if (wiremockInstances.value.length > 0) {
    selectedInstanceId.value = wiremockInstances.value[0].id
    onInstanceChange(selectedInstanceId.value)
  }
})

// インスタンスリストが変わったら再チェック
watch(wiremockInstances, (instances) => {
  if (instances.length > 0 && !selectedInstanceId.value) {
    selectedInstanceId.value = instances[0].id
    onInstanceChange(selectedInstanceId.value)
  } else if (instances.length === 0) {
    selectedInstanceId.value = null
    requestStore.setCurrentInstance(null)
  }
})
</script>

<style scoped>
.request-log {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
