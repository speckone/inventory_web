<template>
    <v-autocomplete
            id="vendor_id"
            :items="vendors"
            item-text="name"
            item-value="id"
            label="Vendor"
            v-model="selection"
            :rules="[v => !!v || 'Item is required']"
            dense
    />
</template>

<script>
    export default {
        name: "SelectVendor",
        props: {
            selected_id: Number,
        },
        data: () => ({
            vendors: [],
        }),
        mounted() {
            this.getVendorData();
        },
        methods: {
            getVendorData: function (path = '/api/v1/vendor') {
                let options = this.vendors;
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(function (response) {
                        response.data.forEach(vendor => {
                            options.push(vendor)
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