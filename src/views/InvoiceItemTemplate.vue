<template>
  <GenericCrudView
    title="Invoice Item Template"
    :headers="headers"
    :fields="fields"
    :service="invoiceItemTemplateService"
  />
</template>

<script setup lang="ts">
import GenericCrudView from '@/components/GenericCrudView.vue'
import { invoiceItemTemplateService } from '@/services/invoiceItemTemplate.service'
import type { CrudField } from '@/composables/useCrudView'

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Description', key: 'name' },
  { title: 'Price Per Unit', key: 'price_per_unit' },
  { title: 'Short Code', key: 'short_code' },
]

const fields: CrudField[] = [
  { key: 'name', label: 'Description', rules: [(v: unknown) => !!v || 'Description is required'] },
  { key: 'price_per_unit', label: 'Price Per Unit' },
  { key: 'short_code', label: 'Short Code' },
]
</script>
