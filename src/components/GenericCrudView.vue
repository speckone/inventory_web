<template>
  <v-card class="ma-4">
    <v-data-table
      :headers="allHeaders"
      :items="items"
      :search="search"
      :loading="loading"
      :items-per-page-options="[10, 25, 50, { value: -1, title: 'All' }]"
    >
      <template #top>
        <v-toolbar flat color="surface">
          <v-toolbar-title>{{ title }}</v-toolbar-title>
          <v-divider class="mx-4" inset vertical />
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            density="compact"
            class="mr-4"
            style="max-width: 300px"
          />
          <v-spacer />
          <v-btn color="primary" class="mb-2" @click="dialog = true">New {{ title }}</v-btn>
        </v-toolbar>
        <v-progress-linear v-if="loading" indeterminate color="primary" />
      </template>

      <template #item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" @click="removeItem(item)">mdi-delete</v-icon>
      </template>

      <!-- Pass through any extra slots from parent -->
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="500" @click:outside="close">
      <v-card>
        <v-form v-model="valid" ref="formRef">
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col v-for="field in fields" :key="field.key" cols="12">
                  <slot :name="`field.${field.key}`" :item="currentItem" :field="field">
                    <v-text-field
                      v-model="currentItem[field.key]"
                      :label="field.label"
                      :rules="field.rules || []"
                    />
                  </slot>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="close">Cancel</v-btn>
            <v-btn color="primary" variant="text" @click="save">Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCrudView, type CrudService, type CrudField } from '@/composables/useCrudView'

interface Props {
  title: string
  headers: { title: string; key: string; sortable?: boolean }[]
  fields: CrudField[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: CrudService<any>
}

const props = defineProps<Props>()

const actionsHeader = { title: 'Actions', key: 'actions', sortable: false }
const allHeaders = [...props.headers, actionsHeader]

const {
  items,
  loading,
  dialog,
  valid,
  currentItem,
  formRef,
  formTitle,
  search,
  editItem,
  removeItem,
  close,
  save,
  loadAll,
} = useCrudView(props.service, props.title, props.fields)

onMounted(() => {
  loadAll()
})
</script>
