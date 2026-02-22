<template>
  <GenericCrudView
    title="Vendor"
    :headers="headers"
    :fields="fields"
    :service="vendorService"
  />
</template>

<script setup lang="ts">
import GenericCrudView from '@/components/GenericCrudView.vue'
import { vendorService } from '@/services/vendor.service'
import type { CrudField } from '@/composables/useCrudView'

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
]

const fields: CrudField[] = [
  { key: 'name', label: 'Name', rules: [(v: unknown) => !!v || 'Name is required'] },
]
</script>
