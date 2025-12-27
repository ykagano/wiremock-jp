import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stubApi, wiremockInstanceApi, type Stub, type CreateStubInput, type UpdateStubInput } from '@/services/api'
import { useProjectStore } from './project'
import { ElMessage } from 'element-plus'
import type { Mapping } from '@/types/wiremock'

export const useMappingStore = defineStore('mapping', () => {
  const stubs = ref<Stub[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 後方互換性のためにmappingsを公開（stubのmappingフィールドから生成）
  const mappings = ref<Mapping[]>([])

  // スタブ一覧取得
  async function fetchMappings() {
    const projectStore = useProjectStore()
    if (!projectStore.currentProjectId) {
      error.value = 'プロジェクトが選択されていません'
      return
    }

    loading.value = true
    error.value = null

    try {
      stubs.value = await stubApi.list(projectStore.currentProjectId)
      // mappingsをstubsから生成（後方互換性のため）
      mappings.value = stubs.value.map(s => ({
        ...s.mapping as Mapping,
        id: s.id
      }))
    } catch (e: any) {
      error.value = e.message || 'スタブの取得に失敗しました'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // スタブ作成
  async function createMapping(mapping: Mapping): Promise<Stub | null> {
    const projectStore = useProjectStore()
    if (!projectStore.currentProjectId) return null

    loading.value = true
    try {
      const input: CreateStubInput = {
        projectId: projectStore.currentProjectId,
        name: mapping.name,
        mapping: mapping as Record<string, unknown>
      }
      const created = await stubApi.create(input)
      stubs.value.push(created)
      mappings.value.push({ ...mapping, id: created.id })
      ElMessage.success('スタブを作成しました')
      return created
    } catch (e: any) {
      error.value = e.message || 'スタブの作成に失敗しました'
      ElMessage.error(error.value)
      throw e
    } finally {
      loading.value = false
    }
  }

  // スタブ更新
  async function updateMapping(id: string, mapping: Mapping): Promise<Stub | null> {
    loading.value = true
    try {
      const input: UpdateStubInput = {
        name: mapping.name,
        mapping: mapping as Record<string, unknown>
      }
      const updated = await stubApi.update(id, input)
      const index = stubs.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stubs.value[index] = updated
        mappings.value[index] = { ...mapping, id: updated.id }
      }
      ElMessage.success('スタブを更新しました')
      return updated
    } catch (e: any) {
      error.value = e.message || 'スタブの更新に失敗しました'
      ElMessage.error(error.value)
      throw e
    } finally {
      loading.value = false
    }
  }

  // スタブ削除
  async function deleteMapping(id: string): Promise<boolean> {
    loading.value = true
    try {
      await stubApi.delete(id)
      stubs.value = stubs.value.filter(s => s.id !== id)
      mappings.value = mappings.value.filter(m => m.id !== id)
      ElMessage.success('スタブを削除しました')
      return true
    } catch (e: any) {
      error.value = e.message || 'スタブの削除に失敗しました'
      ElMessage.error(error.value)
      throw e
    } finally {
      loading.value = false
    }
  }

  // WireMockに同期
  async function syncToWiremock(stubId: string, instanceId: string): Promise<boolean> {
    loading.value = true
    try {
      await stubApi.sync(stubId, instanceId)
      ElMessage.success('WireMockに同期しました')
      return true
    } catch (e: any) {
      ElMessage.error(e.message || 'WireMockへの同期に失敗しました')
      return false
    } finally {
      loading.value = false
    }
  }

  // 全スタブをWireMockに同期
  async function syncAllToWiremock(instanceId: string): Promise<{ success: number; failed: number } | null> {
    const projectStore = useProjectStore()
    if (!projectStore.currentProjectId) return null

    loading.value = true
    try {
      const result = await stubApi.syncAll(projectStore.currentProjectId, instanceId)
      if (result.failed === 0) {
        ElMessage.success(`${result.success}件のスタブをWireMockに同期しました`)
      } else {
        ElMessage.warning(`成功: ${result.success}件, 失敗: ${result.failed}件`)
      }
      return result
    } catch (e: any) {
      ElMessage.error(e.message || 'WireMockへの同期に失敗しました')
      return null
    } finally {
      loading.value = false
    }
  }

  function clearMappings() {
    stubs.value = []
    mappings.value = []
  }

  // スタブを取得（IDで）
  function getStubById(id: string): Stub | undefined {
    return stubs.value.find(s => s.id === id)
  }

  // WireMockインスタンスのマッピングをリセット
  async function resetMappings(): Promise<boolean> {
    const projectStore = useProjectStore()
    if (!projectStore.currentProjectId) {
      ElMessage.warning('プロジェクトが選択されていません')
      return false
    }

    // インスタンスがロードされていなければロードする
    if (projectStore.wiremockInstances.length === 0) {
      await projectStore.fetchWiremockInstances(projectStore.currentProjectId)
    }

    if (projectStore.wiremockInstances.length === 0) {
      ElMessage.warning('WireMockインスタンスがありません')
      return false
    }

    loading.value = true
    let successCount = 0
    let failCount = 0

    try {
      for (const instance of projectStore.wiremockInstances) {
        if (!instance.isActive) continue
        try {
          await wiremockInstanceApi.reset(instance.id)
          successCount++
        } catch {
          failCount++
        }
      }

      if (failCount === 0) {
        ElMessage.success('すべてのマッピングをリセットしました')
      } else {
        ElMessage.warning(`成功: ${successCount}件, 失敗: ${failCount}件`)
      }
      return failCount === 0
    } catch (e: any) {
      error.value = e.message || 'マッピングのリセットに失敗しました'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    stubs,
    mappings,
    loading,
    error,
    fetchMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    syncToWiremock,
    syncAllToWiremock,
    clearMappings,
    getStubById,
    resetMappings
  }
})
