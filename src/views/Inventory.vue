<template>
    <div>
        <v-data-table
                :headers="headers"
                :items="items"
                item-key="product"
                group-by="category"
                :sort-by="id"
                :search="search_product"
                fixed-header
        >
            <template v-slot:top>
                <v-toolbar flat color="white">
                    <v-toolbar-title>Inventory</v-toolbar-title>
                    <v-divider class="mx-4" inset vertical/>
                    <v-text-field
                            v-model="search_product"
                            append-icon="mdi-magnify"
                            label="Search"
                    ></v-text-field>
                    <v-spacer/>
                    <v-select
                            :items="categories"
                            label="Category"
                            v-model="search_category"
                            clearable
                    ></v-select>
                </v-toolbar>
            </template>
            <template v-slot:item.cost="{ item }">
                {{ item.cost | currency }}
            </template>

            <template v-slot:footer>
                <v-toolbar flat color="white">
                    <v-spacer/>
                    <v-dialog class="mx-auto" max-width="500" v-model="dialog" @click:outside="close">
                        <v-card>
                            <v-form lazy-validation v-model="valid" ref="form">

                                <v-card-title>
                                    <span class="headline">{{ formTitle }}</span>
                                </v-card-title>
                                <SelectProduct :selected_id.sync="current_product_id"/>

                                <v-card-text>
                                    <v-container>
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                        label="Quantity"
                                                        v-model.number="current_quantity"
                                                        :rules="[v => !!v || 'Quantity is required']"
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
                                                        label="Capacity"
                                                        v-model.number="current_capacity"
                                                        :rules="[v => !!v || 'Capacity is required']"
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
                                                        label="Reorder Level"
                                                        v-model.number="current_reorder_level"
                                                        :rules="[v => !!v || 'Reorder Level is required']"
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-card-text>

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
                    <v-btn color="primary" dark class="mb-2" @click="createOrder">Create Order</v-btn>

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
            <template v-slot:group.header="{ group, headers }">
                <th :colspan="headers.length">
                    {{ group }}
                </th>
            </template>
            <template v-slot:item.quantity="props">
                <v-edit-dialog
                        :return-value="props.item.quantity"
                        large
                        persistent
                        @save="updateItemQuantity(props.item)"
                        @cancel="close"
                        @close="close"
                >
                    <div>{{ props.item.quantity }}</div>
                    <template v-slot:input>
                        <div class="mt-4 title">Update Quantity</div>
                    </template>
                    <template v-slot:input>
                        <v-text-field
                                v-model.number="props.item.quantity"
                                :rules="[v => !!v || 'Quantity is required']"
                                label="Edit"
                                single-line
                                autofocus
                        ></v-text-field>
                    </template>
                </v-edit-dialog>
            </template>

        </v-data-table>
    </div>
</template>

<script>
    import SelectProduct from "../components/SelectProduct";

    export default {
        name: "inventory",
        components: {
            SelectProduct
        },
        data: () => ({
            inventory_data: null,
            product_data: null,
            category_data: null,
            unit_data: null,
            search_category: "",
            search_product: "",
            dialog: false,
            current_inventory: {'product_id': null, 'capacity': null, 'reorder_level': null, 'quantity': null},
            valid: false,
            snackbar: false,
            current_inventory_id: -1
        }),
        filters: {
            currency: function (value) {
                return '$' + parseFloat(value).toFixed(2);
            }
        },
        computed: {
            headers() {
                return [
                    {text: 'ID', value: 'id', groupable: false},
                    {text: 'Product', value: 'product', groupable: false},
                    {text: 'Unit', value: 'unit', groupable: false},
                    {
                        text: 'Category', value: 'category', groupable: true,
                        filter: value => {
                            console.log(value)
                            console.log(value == this.search_category)
                            if (!this.search_category) {
                                return true
                            } else {
                                return value == this.search_category
                            }
                        },
                    },
                    {text: 'Quantity', value: 'quantity', groupable: false},
                    {text: 'Capacity', value: 'capacity', groupable: false},
                    {text: 'Reorder Level', value: 'reorder_level', groupable: false},
                    {text: 'Cost', value: 'cost', groupable: false},
                    {text: 'Needed', value: 'needed_at_store', groupable: false},
                    {text: 'Actions', value: 'actions', sortable: false, groupable: false},
                ]
            },
            formTitle() {
                return this.current_inventory_id === -1 ? 'New Item' : 'Edit Item'
            },
            current_product_id: {
                get: function () {
                    if (this.current_inventory) {
                        return this.current_inventory.product_id
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_inventory.product_id = new_value
                }
            },
            current_quantity: {
                get: function () {
                    if (this.current_inventory) {
                        return this.current_inventory.quantity
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_inventory.quantity = new_value
                }
            },
            current_capacity: {
                get: function () {
                    if (this.current_inventory) {
                        return this.current_inventory.capacity
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_inventory.capacity = new_value
                }
            },
            current_reorder_level: {
                get: function () {
                    if (this.current_inventory) {
                        return this.current_inventory.reorder_level
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_inventory.reorder_level = new_value
                }
            },
            inventory_body() {
                return {
                    "product_id": this.current_product_id,
                    "quantity": this.current_quantity,
                    "capacity": this.current_capacity,
                    "reorder_level": this.current_reorder_level
                }
            },
            items() {
                if (this.inventory_data && this.product_data && this.category_data && this.unit_data) {
                    return this.inventory_data.map(inventory => {
                        const inventoryProduct = this.product_data.find(product => product.id == inventory.product_id)
                        const inventoryCategory = this.category_data.find(category => category.id == inventoryProduct.category_id)
                        const inventoryUnit = this.unit_data.find(unit => unit.id == inventoryProduct.unit_id)
                        inventory.unit = inventoryUnit.name
                        inventory.product = inventoryProduct.name
                        if (inventoryCategory === undefined) {
                            inventory.category = "Null"
                        } else {
                            inventory.category = inventoryCategory.name
                        }
                        return inventory
                    })
                } else {
                    return []
                }
            },
            categories() {
                if (this.category_data) {
                    return this.category_data.map(category => {
                        return category.name
                    })
                } else {
                    return []
                }
            }
        },
        mounted() {
            this.getUnitData();
            this.getProductData();
            this.getinventoryData();
            this.getCategoryData();
        },
        methods: {
            getinventoryData: function (path = '/api/v1/inventory') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.inventory_data = response.data))
            },
            getProductData: function (path = '/api/v1/product') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.product_data = response.data))
            },
            getCategoryData: function (path = '/api/v1/category') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.category_data = response.data))
            },
            getUnitData: function (path = '/api/v1/unit') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.unit_data = response.data))
            },
            updateItem: function (path = '/api/v1/inventory') {
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + this.current_inventory_id, this.inventory_body)
                    .then(() => {
                        this.getinventoryData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            updateItemQuantity: function (item, path = '/api/v1/inventory') {
                let body = {
                    'quantity': item.quantity
                }
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + item.id, body)
                    .then(() => {
                        this.getinventoryData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            addItem: function (path = '/api/v1/inventory') {
                this.axios.post(process.env.VUE_APP_BASE_URL + path, this.inventory_body)
                    .then(() => {
                        this.getinventoryData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            createOrder: function (order, path = '/api/v1/order') {
                this.$confirm('Completed inventory?', {
                    icon: 'mdi-alert',
                    buttonTrueText: 'Yes! Create my order.'
                }).then(
                    confirmed => {
                        if (confirmed) {
                            let url = process.env.VUE_APP_BASE_URL + path
                            console.log(url)
                            console.log(order)
                            this.axios.post(url)
                                .then(() => {
                                    this.$router.push('/orders')
                                })
                                .catch(function (error) {
                                    alert(error);
                                });
                        }
                    }
                )
            },
            deleteItem: function (inventory, path = '/api/v1/inventory') {
                this.$confirm('Delete inventory: ' + inventory.name + '?', {icon: 'mdi-alert'}).then(
                    confirmed => {
                        if (confirmed) {
                            this.axios.delete(process.env.VUE_APP_BASE_URL + path + '/' + inventory.id)
                                .then(() => {
                                    this.getinventoryData();
                                })
                                .catch(error => {
                                    alert(error);
                                });
                        }
                    }
                )

            },
            editItem(item) {
                this.current_inventory = Object.assign({}, item);
                this.current_inventory_id = item.id;
                this.dialog = true;
            },
            close() {
                this.dialog = false;
                if (this.$refs.form) {
                    this.$refs.form.reset();
                }
                this.current_inventory_id = -1;
                this.current_inventory = {'product_id': null, 'capacity': null, 'reorder_level': null, 'quantity': null}
            },
            save() {
                if (this.$refs.form.validate()) {
                    if (this.current_inventory_id > -1) {
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