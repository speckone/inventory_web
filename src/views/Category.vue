<template>
  <GenericCrudView
    title="Category"
    :headers="headers"
    :fields="fields"
    :service="categoryService"
  />
</template>

<script setup lang="ts">
import GenericCrudView from '@/components/GenericCrudView.vue'
import { categoryService } from '@/services/category.service'
import type { CrudField } from '@/composables/useCrudView'

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
]

const fields: CrudField[] = [
  { key: 'name', label: 'Name', rules: [(v: unknown) => !!v || 'Name is required'] },
]
</script>
