import { ref, type Ref } from 'vue'
import type { PaginatedResponse } from '@/types/models'

export function usePagination<T>(
  fetchFn: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
) {
  const items: Ref<T[]> = ref([]) as Ref<T[]>
  const totalItems = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const perPage = ref(25)

  async function fetchData() {
    loading.value = true
    try {
      const response = await fetchFn(page.value, perPage.value)
      items.value = response.results
      totalItems.value = response.total
    } finally {
      loading.value = false
    }
  }

  function onOptionsUpdate(options: { page: number; itemsPerPage: number }) {
    page.value = options.page
    perPage.value = options.itemsPerPage
    fetchData()
  }

  function refresh() {
    fetchData()
  }

  return {
    items,
    totalItems,
    loading,
    page,
    perPage,
    onOptionsUpdate,
    refresh,
  }
}
