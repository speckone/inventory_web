import { defineStore } from 'pinia'

interface SnackbarState {
  show: boolean
  text: string
  color: string
  timeout: number
}

export const useSnackbarStore = defineStore('snackbar', {
  state: (): SnackbarState => ({
    show: false,
    text: 'Message',
    color: 'success',
    timeout: 2000,
  }),

  actions: {
    showSnackbar(options: Partial<SnackbarState>) {
      this.show = options.show ?? true
      this.text = options.text ?? 'Message'
      this.color = options.color ?? 'success'
      this.timeout = options.timeout ?? 2000
    },

    hide() {
      this.show = false
    },
  },
})
