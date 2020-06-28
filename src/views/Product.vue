<template>
    <div>
        <v-data-table
                :headers="headers"
                :items="items"
        >
            <template v-slot:top>
                <v-toolbar flat color="white">
                    <v-toolbar-title>Products</v-toolbar-title>
                    <v-divider class="mx-4" inset vertical/>
                    <v-spacer/>

                </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-icon
                        small
                        class="mr-2"
                        @click="editItem(item)"
                >
                    mdi-pencil
                </v-icon>
                <v-icon
                        small
                        @click="deleteItem(item)"
                >
                    mdi-delete
                </v-icon>
            </template>
            <template v-slot:footer>
                <v-toolbar flat color="white">
                    <v-spacer/>
                    <v-dialog class="mx-auto" max-width="500" v-model="dialog" @click:outside="close">
                        <template v-slot:activator="{ on }">
                            <v-btn color="primary" dark class="mb-2" v-on="on">New Product</v-btn>
                        </template>
                        <v-card>
                            <v-form lazy-validation v-model="valid" ref="form">

                                <v-card-title>
                                    <span class="headline">{{ formTitle }}</span>
                                </v-card-title>

                                <v-card-text>
                                    <v-container>
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                        label="Name"
                                                        v-model="current_product_name"
                                                        :rules="[v => !!v || 'Name is required']"
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-card-text>
                                <v-card-text>
                                    <v-container>
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                        label="Unit price"
                                                        v-model.number="current_unit_price"
                                                        :rules="[v => !!v || 'Price is required']"
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-card-text>
                                <SelectCategory :selected_id.sync="current_category_id"/>
                                <SelectUnit :selected_id.sync="current_unit_id"/>
                                <SelectVendor :selected_id.sync="current_vendor_id"/>

                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
                                    <v-btn color="blue darken-1" text @click="save">Save</v-btn>
                                </v-card-actions>
                                <v-snackbar
                                        v-model="snackbar"
                                        :timeout=1500
                                        color="success"
                                >Site updated
                                </v-snackbar>
                            </v-form>
                        </v-card>
                    </v-dialog>

                </v-toolbar>
            </template>

        </v-data-table>
    </div>
</template>

<script>
    import SelectUnit from "../components/SelectUnit";
    import SelectVendor from "../components/SelectVendor";
    import SelectCategory from "../components/SelectCategory";

    export default {
        name: "Product",
        components: {
            SelectUnit,
            SelectVendor,
            SelectCategory
        },
        data: () => ({
            product_data: null,
            unit_data: null,
            vendor_data: null,
            category_data: null,
            headers: [
                {text: 'ID', value: 'id'},
                {text: 'Name', value: 'name'},
                {text: 'Unit', value: 'unit'},
                {text: 'Category', value: 'category'},
                {text: 'Unit Price', value: 'unit_price'},
                {text: 'Vendor', value: 'vendor'},
                {text: 'Actions', value: 'actions', sortable: false},
            ],
            pagination: {},
            dialog: false,
            current_product: {'name': null, 'unit_price': null, 'unit_id': null, 'vendor_id': null},
            valid: false,
            snackbar: false,
            current_product_id: -1
        }),
        computed: {
            formTitle() {
                return this.current_product_id === -1 ? 'New Product' : 'Edit Product'
            },
            current_product_name: {
                get: function () {
                    if (this.current_product) {
                        return this.current_product.name
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_product.name = new_value
                }
            },
            current_unit_price: {
                get: function () {
                    if (this.current_product) {
                        return this.current_product.unit_price
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_product.unit_price = new_value
                }
            },
            current_category_id: {
                get: function () {
                    if (this.current_product) {
                        return this.current_product.category_id
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_product.category_id = new_value
                }
            },
            current_unit_id: {
                get: function () {
                    if (this.current_product) {
                        return this.current_product.unit_id
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_product.unit_id = new_value
                }
            },
            current_vendor_id: {
                get: function () {
                    if (this.current_product) {
                        return this.current_product.vendor_id
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_product.vendor_id = new_value
                }
            },
            product_body() {
                return {
                    "name": this.current_product_name,
                    "unit_price": this.current_unit_price,
                    "unit_id": this.current_unit_id,
                    "vendor_id": this.current_vendor_id,
                    "category_id": this.current_category_id
                }
            },
            items() {
                if (this.product_data && this.unit_data && this.vendor_data && this.category_data) {
                    return this.product_data.map(product => {
                        const productUnit = this.unit_data.find(unit => unit.id == product.unit_id)
                        const productCategory = this.category_data.find(category => category.id == product.category_id)
                        const productVendor = this.vendor_data.find(vendor => vendor.id == product.vendor_id)
                        product.unit = productUnit.name
                        if(productCategory === undefined){
                            product.category = "Null"
                        }
                        else {
                            product.category = productCategory.name
                        }
                        product.vendor = productVendor.name
                        return product
                    })
                } else {
                    return []
                }
            }
        },
        mounted() {
            this.getProductData();
            this.getUnitData();
            this.getVendorData();
            this.getCategoryData();
        },
        methods: {
            getProductData: function (path = '/api/v1/product') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.product_data = response.data))
            },
            getUnitData: function (path = '/api/v1/unit') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.unit_data = response.data))
            },
            getCategoryData: function (path = '/api/v1/category') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.category_data = response.data))
            },
            getVendorData: function (path = '/api/v1/vendor') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.vendor_data = response.data))
            },
            updateItem: function (path = '/api/v1/product') {
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + this.current_product_id, this.product_body)
                    .then(() => {
                        this.getProductData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            addItem: function (path = '/api/v1/product') {
                this.axios.post(process.env.VUE_APP_BASE_URL + path, this.product_body)
                    .then(() => {
                        this.getProductData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            deleteItem: function (product, path = '/api/v1/product') {
                this.$confirm('Delete Product: ' + product.name + '?', {icon: 'mdi-alert'}).then(
                    confirmed => {
                        if (confirmed) {
                            this.axios.delete(process.env.VUE_APP_BASE_URL + path + '/' + product.id)
                                .then(() => {
                                    this.getProductData();
                                })
                                .catch(error => {
                                    alert(error);
                                });
                        }
                    }
                )

            },

            editItem(item) {
                this.current_product = Object.assign({}, item);
                this.current_product_id = item.id;
                this.dialog = true;
            },
            close() {
                this.dialog = false;
                this.$refs.form.reset();
                this.current_product_id = -1;
                this.current_product = {'name': null, 'unit_price': null, 'unit_id': null, 'vendor_id': null}
            },
            save() {
                if (this.$refs.form.validate()) {
                    if (this.current_product_id > -1) {
                        this.updateItem();
                    } else {
                        this.addItem();
                    }
                    setTimeout(() => {
                        this.close()
                    }, 300)
                }
            },
        },

    }
</script>

<style scoped>

</style>