<template>
  <v-autocomplete
    v-model="selection"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    :label="label"
    :rules="rules"
    density="compact"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    label: string
    loadItems: () => Promise<unknown[]>
    itemTitle?: string
    itemValue?: string
    rules?: Array<(v: unknown) => boolean | string>
  }>(),
  {
    itemTitle: 'name',
    itemValue: 'id',
    rules: () => [],
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const items = ref<unknown[]>([])

const selection = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as number | null),
})

onMounted(async () => {
  try {
    items.value = await props.loadItems()
  } catch (error) {
    console.error(`Failed to load ${props.label} data:`, error)
  }
})
</script>
