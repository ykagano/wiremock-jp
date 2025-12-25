import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectApi, wiremockInstanceApi, type Project, type WiremockInstance, type CreateProjectInput, type UpdateProjectInput, type CreateWiremockInstanceInput } from '@/services/api'
import { ElMessage } from 'element-plus'

const CURRENT_PROJECT_KEY = 'wiremock-jp-current-project'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)
  const wiremockInstances = ref<WiremockInstance[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  // プロジェクト一覧取得
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await projectApi.list()
    } catch (e: any) {
      error.value = e.message || 'プロジェクトの取得に失敗しました'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // プロジェクト作成
  async function addProject(input: CreateProjectInput): Promise<Project | null> {
    loading.value = true
    try {
      const project = await projectApi.create(input)
      projects.value.push(project)
      ElMessage.success('プロジェクトを作成しました')
      return project
    } catch (e: any) {
      ElMessage.error(e.message || 'プロジェクトの作成に失敗しました')
      return null
    } finally {
      loading.value = false
    }
  }

  // プロジェクト更新
  async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    loading.value = true
    try {
      const updated = await projectApi.update(id, input)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updated
      }
      ElMessage.success('プロジェクトを更新しました')
      return updated
    } catch (e: any) {
      ElMessage.error(e.message || 'プロジェクトの更新に失敗しました')
      return null
    } finally {
      loading.value = false
    }
  }

  // プロジェクト削除
  async function deleteProject(id: string): Promise<boolean> {
    loading.value = true
    try {
      await projectApi.delete(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProjectId.value === id) {
        clearCurrentProject()
      }
      ElMessage.success('プロジェクトを削除しました')
      return true
    } catch (e: any) {
      ElMessage.error(e.message || 'プロジェクトの削除に失敗しました')
      return false
    } finally {
      loading.value = false
    }
  }

  // 現在のプロジェクトを設定
  async function setCurrentProject(id: string) {
    currentProjectId.value = id
    localStorage.setItem(CURRENT_PROJECT_KEY, id)

    // WireMockインスタンス一覧を取得
    await fetchWiremockInstances(id)
  }

  // 保存された現在のプロジェクトを復元
  function loadCurrentProject() {
    try {
      const stored = localStorage.getItem(CURRENT_PROJECT_KEY)
      if (stored && projects.value.some(p => p.id === stored)) {
        setCurrentProject(stored)
      }
    } catch (error) {
      console.error('Failed to load current project:', error)
    }
  }

  // 現在のプロジェクトをクリア
  function clearCurrentProject() {
    currentProjectId.value = null
    wiremockInstances.value = []
    localStorage.removeItem(CURRENT_PROJECT_KEY)
  }

  // WireMockインスタンス一覧取得
  async function fetchWiremockInstances(projectId: string) {
    try {
      wiremockInstances.value = await wiremockInstanceApi.list(projectId)
    } catch (e: any) {
      console.error('Failed to fetch WireMock instances:', e)
      wiremockInstances.value = []
    }
  }

  // WireMockインスタンス追加
  async function addWiremockInstance(input: CreateWiremockInstanceInput): Promise<WiremockInstance | null> {
    try {
      const instance = await wiremockInstanceApi.create(input)
      wiremockInstances.value.push(instance)
      ElMessage.success('WireMockインスタンスを追加しました')
      return instance
    } catch (e: any) {
      ElMessage.error(e.message || 'WireMockインスタンスの追加に失敗しました')
      return null
    }
  }

  // WireMockインスタンス削除
  async function deleteWiremockInstance(id: string): Promise<boolean> {
    try {
      await wiremockInstanceApi.delete(id)
      wiremockInstances.value = wiremockInstances.value.filter(i => i.id !== id)
      ElMessage.success('WireMockインスタンスを削除しました')
      return true
    } catch (e: any) {
      ElMessage.error(e.message || 'WireMockインスタンスの削除に失敗しました')
      return false
    }
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    wiremockInstances,
    loading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    loadCurrentProject,
    clearCurrentProject,
    fetchWiremockInstances,
    addWiremockInstance,
    deleteWiremockInstance
  }
})
