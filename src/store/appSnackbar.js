// initial state
const state = {
  snackbar: {
    show: false,
    text: 'Message',
    color: 'success',
    timeout: 2000
  }
}

// getters
const getters = {
    getSnackbar: (state) => {
        return state.snackbar
    }
};

// actions
const actions = {
  setSnackbar ({ commit }, snackbar) {
      commit('setSnackbar', snackbar)
  }
};

// mutations
const mutations = {
  setSnackbar (state, snackbar) {
    state.snackbar = snackbar
  },
};

export const appSnackbar = {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}