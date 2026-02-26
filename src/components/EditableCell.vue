<template>
  <div>
    <div v-if="!editing" class="editable-cell" @click="startEdit">
      {{ displayValue }}
    </div>
    <div v-else class="editable-cell-input">
      <div class="mt-2 text-subtitle-2">{{ label }}</div>
      <v-text-field
        v-model.number="localValue"
        :rules="rules"
        density="compact"
        variant="underlined"
        single-line
        autofocus
        @keyup.enter="save"
        @keyup.escape="cancel"
      />
      <div class="d-flex justify-end">
        <v-btn size="default" variant="text" @click="cancel">Cancel</v-btn>
        <v-btn size="default" variant="text" color="primary" @click="save">Save</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    rules?: Array<(v: unknown) => boolean | string>
  }>(),
  {
    label: 'Edit',
    rules: () => [],
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  save: [value: number]
}>()

const editing = ref(false)
const localValue = ref(props.modelValue)
const displayValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val
    displayValue.value = val
  }
)

function startEdit() {
  localValue.value = props.modelValue
  editing.value = true
}

function save() {
  displayValue.value = localValue.value
  editing.value = false
  emit('update:modelValue', localValue.value)
  emit('save', localValue.value)
}

function cancel() {
  editing.value = false
  localValue.value = props.modelValue
}
</script>

<style scoped>
.editable-cell {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  min-height: 40px;
  display: flex;
  align-items: center;
}
.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
