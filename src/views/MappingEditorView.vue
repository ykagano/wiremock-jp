<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const mappingId = route.params.id as string | undefined
const isNew = !mappingId
</script>

<template>
  <div class="mapping-editor-view">
    <h1>{{ isNew ? '新規スタブ作成' : 'スタブ編集' }}</h1>
    <p>準備中...</p>
    <p v-if="!isNew">編集対象ID: {{ mappingId }}</p>
  </div>
</template>

<style scoped>
.mapping-editor-view {
  padding: 20px;
}
</style>
