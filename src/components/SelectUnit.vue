<template>
    <v-autocomplete
            id="unit_id"
            :items="units"
            item-text="name"
            item-value="id"
            label="Unit"
            v-model="selection"
            :rules="[v => !!v || 'Unit is required']"
            dense
    />
</template>

<script>
    export default {
        name: "SelectUnit",
        props: {
            selected_id: Number,
        },
        data: () => ({
            units: [],
        }),
        mounted() {
            this.getUnitData();
        },
        methods: {
            getUnitData: function (path = '/api/v1/unit') {
                let options = this.units;
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(function (response) {
                        response.data.forEach(unit => {
                            options.push(unit)
                        });
                    })
                    .catch(function (error) {
                        // eslint-disable-next-line no-console
                        alert(error);
                    });
            },
        },
        computed: {
            selection: {
                get: function () {
                    return this.selected_id;
                },
                set: function (new_value) {
                    this.$emit('update:selected_id', new_value)
                }
            }
        }
    }
</script>

<style scoped>

</style>