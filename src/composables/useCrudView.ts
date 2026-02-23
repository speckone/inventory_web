import { ref, computed, type Ref } from 'vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useSnackbarStore } from '@/stores/snackbar'
import type { PaginatedResponse } from '@/types/models'

export interface CrudService<T> {
  getAll(): Promise<T[]>
  getPage?(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<T>>
  create(data: Partial<T>): Promise<T>
  update(id: number, data: Partial<T>): Promise<T>
  delete(id: number): Promise<void>
}

export interface CrudField {
  key: string
  label: string
  rules?: ((v: unknown) => true | string)[]
}

export function useCrudView<T extends { id: number; name?: string }>(
  service: CrudService<T>,
  entityName: string,
  fields: CrudField[],
) {
  const { confirm } = useConfirmDialog()
  const snackbarStore = useSnackbarStore()

  const items: Ref<T[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dialog = ref(false)
  const valid = ref(false)
  const currentItemId = ref(-1)
  const formRef = ref()
  const search = ref('')

  // Build default form data from fields
  function buildDefaultItem(): Record<string, string> {
    const obj: Record<string, string> = {}
    for (const field of fields) {
      obj[field.key] = ''
    }
    return obj
  }

  const currentItem = ref<Record<string, unknown>>(buildDefaultItem())

  const formTitle = computed(() =>
    currentItemId.value === -1 ? `New ${entityName}` : `Edit ${entityName}`,
  )

  const isEditing = computed(() => currentItemId.value > -1)

  async function loadAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await service.getAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load data'
      error.value = msg
      snackbarStore.showSnackbar({ text: msg, color: 'error' })
    } finally {
      loading.value = false
    }
  }

  function editItem(item: T) {
    currentItem.value = { ...item }
    currentItemId.value = item.id
    dialog.value = true
  }

  async function removeItem(item: T) {
    const displayName = (item as Record<string, unknown>).name ?? `#${item.id}`
    const confirmed = await confirm(`Delete ${entityName}: ${displayName}?`, {
      icon: 'mdi-alert',
    })
    if (confirmed) {
      try {
        await service.delete(item.id)
        snackbarStore.showSnackbar({ text: `${entityName} deleted`, color: 'success' })
        await loadAll()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to delete'
        snackbarStore.showSnackbar({ text: msg, color: 'error' })
      }
    }
  }

  function close() {
    dialog.value = false
    formRef.value?.reset()
    currentItemId.value = -1
    currentItem.value = buildDefaultItem()
  }

  async function save() {
    const { valid: isValid } = await formRef.value?.validate()
    if (!isValid) return

    // Build payload from fields
    const payload: Record<string, unknown> = {}
    for (const field of fields) {
      payload[field.key] = currentItem.value[field.key]
    }

    try {
      if (isEditing.value) {
        await service.update(currentItemId.value, payload as Partial<T>)
      } else {
        await service.create(payload as Partial<T>)
      }
      snackbarStore.showSnackbar({ text: `${entityName} saved`, color: 'success' })
      await loadAll()
      setTimeout(() => close(), 300)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      snackbarStore.showSnackbar({ text: msg, color: 'error' })
    }
  }

  return {
    items,
    loading,
    error,
    dialog,
    valid,
    currentItemId,
    currentItem,
    formRef,
    formTitle,
    isEditing,
    search,
    loadAll,
    editItem,
    removeItem,
    close,
    save,
  }
}
