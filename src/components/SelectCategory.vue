<template>
    <v-autocomplete
            id="category_id"
            :items="categories"
            item-text="name"
            item-value="id"
            label="Category"
            v-model="selection"
            :rules="[v => !!v || 'Category is required']"
            dense
    />
</template>

<script>
    export default {
        name: "SelectCategory",
        props: {
            selected_id: Number,
        },
        data: () => ({
            categories: [],
        }),
        mounted() {
            this.getCategoryData();
        },
        methods: {
            getCategoryData: function (path = '/api/v1/category') {
                let options = this.categories;
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(function (response) {
                        response.data.forEach(category => {
                            options.push(category)
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