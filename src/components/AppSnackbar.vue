<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    right
    top
  >
    {{ snackbar.text }}
    <v-btn
      fab
      small
      text
      @click="snackbar.show = false"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-snackbar>
</template>

<script>
  export default {
    data: () => ({}),
    computed: {
        snackbar() {
            return this.$store.getters['appSnackbar/getSnackbar']
        },
    }
  }
</script>
