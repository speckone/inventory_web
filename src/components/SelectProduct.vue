<template>
    <v-autocomplete
            id="product_id"
            :items="products"
            item-text="name"
            item-value="id"
            label="Product"
            v-model="selection"
            :rules="[v => !!v || 'Product is required']"
            dense
    />
</template>

<script>
    export default {
        name: "SelectProduct",
        props: {
            selected_id: Number,
        },
        data: () => ({
            products: [],
        }),
        mounted() {
            this.getProductData();
        },
        methods: {
            getProductData: function (path = '/api/v1/product') {
                let options = this.products;
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(function (response) {
                        response.data.forEach(product => {
                            options.push(product)
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