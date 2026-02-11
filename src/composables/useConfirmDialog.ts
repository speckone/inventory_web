import { ref } from 'vue'

const isOpen = ref(false)
const title = ref('Warning')
const message = ref('')
const confirmText = ref('Yes')
const icon = ref('mdi-alert')
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirmDialog() {
  function confirm(
    msg: string,
    options?: {
      icon?: string
      buttonTrueText?: string
      title?: string
    }
  ): Promise<boolean> {
    message.value = msg
    icon.value = options?.icon ?? 'mdi-alert'
    confirmText.value = options?.buttonTrueText ?? 'Yes'
    title.value = options?.title ?? 'Warning'
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function handleCancel() {
    isOpen.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return {
    isOpen,
    title,
    message,
    confirmText,
    icon,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
