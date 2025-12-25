import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoggedRequest } from '@/types/wiremock'
import { wiremockInstanceApi } from '@/services/api'
import { ElMessage } from 'element-plus'

export const useRequestStore = defineStore('request', () => {
  const requests = ref<LoggedRequest[]>([])
  const unmatchedRequests = ref<LoggedRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentInstanceId = ref<string | null>(null)

  function setCurrentInstance(instanceId: string | null) {
    currentInstanceId.value = instanceId
    // インスタンスが変わったらリクエストをクリア
    if (!instanceId) {
      requests.value = []
      unmatchedRequests.value = []
    }
  }

  async function fetchRequests() {
    if (!currentInstanceId.value) return

    loading.value = true
    error.value = null

    try {
      const response = await wiremockInstanceApi.getRequests(currentInstanceId.value)
      requests.value = response?.requests || []
    } catch (e: any) {
      error.value = e.message || 'リクエストログの取得に失敗しました'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function fetchUnmatchedRequests() {
    if (!currentInstanceId.value) return

    loading.value = true
    try {
      const response = await wiremockInstanceApi.getUnmatchedRequests(currentInstanceId.value)
      unmatchedRequests.value = response.requests || []
    } catch (e: any) {
      error.value = e.message || 'マッチしなかったリクエストの取得に失敗しました'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function resetRequests() {
    if (!currentInstanceId.value) return

    loading.value = true
    try {
      await wiremockInstanceApi.clearRequests(currentInstanceId.value)
      requests.value = []
      unmatchedRequests.value = []
      ElMessage.success('リクエストログをクリアしました')
    } catch (e: any) {
      error.value = e.message || 'リクエストログのクリアに失敗しました'
      ElMessage.error(error.value)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    requests,
    unmatchedRequests,
    loading,
    error,
    currentInstanceId,
    setCurrentInstance,
    fetchRequests,
    fetchUnmatchedRequests,
    resetRequests
  }
})
