<template>
    <div>
        <v-data-table
                :headers="headers"
                :items="items"
                item-key="id"
                group-by="order_id"
                group-desc
                dense
        >
            <template v-slot:top>
                <v-toolbar flat color="white">
                    <v-toolbar-title>Orders</v-toolbar-title>
                    <v-divider class="mx-4" inset vertical/>
                    <v-spacer/>

                </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-tooltip left v-if="isNew(item.order_id)">
                    <template v-slot:activator="{ on }">
                        <v-icon small @click="deleteItem(item)" v-on="on">
                            mdi-delete
                        </v-icon>
                    </template>
                    <span>Remove item from order</span>
                </v-tooltip>

            </template>
            <template v-slot:group.header="{ group, headers }">
                <th :colspan="headers.length">
                    {{ getOrderStatus(group) }} Order: {{ group }} - {{ getOrderDate(group) }}
                </th>
            </template>
            <template v-slot:group.summary="{ group, headers }">
                <td :colspan="headers.length">
                    <v-tooltip right v-if="isNew(group)">
                        <template v-slot:activator="{ on }">
                            <v-icon small @click="submitOrder(group)" v-on="on">mdi-send</v-icon>
                        </template>
                        <span>Submit order</span>
                    </v-tooltip>
                    <v-tooltip left v-if="isSubmitted(group)">
                        <template v-slot:activator="{ on }">
                            <v-icon small @click="receiveOrder(group)" v-on="on">mdi-check-circle</v-icon>
                        </template>
                        <span>Mark order as received</span>
                    </v-tooltip>
                    <v-divider
                            v-if="isNew(group)"
                            class="mx-8"
                            inset
                            vertical
                    ></v-divider>
                    <v-tooltip v-if="isNew(group)" right>
                        <template v-slot:activator="{ on }">
                            <v-icon small @click="deleteOrder(group)" v-on="on">mdi-delete</v-icon>
                        </template>
                        <span>Delete Order</span>
                    </v-tooltip>
                </td>
            </template>

        </v-data-table>
    </div>
</template>

<script>

    export default {
        name: "Order",
        data: () => ({
            product_data: null,
            order_data: null,
            order_item_data: null,
            unit_data: null,
            headers: [
                {text: 'ID', value: 'id'},
                {text: 'Quantity', value: 'quantity'},
                {text: 'Product', value: 'product'},
                {text: 'Actions', value: 'actions', sortable: false},
            ],
            pagination: {},
            dialog: false,
            valid: false,
            snackbar: false,
        }),
        computed: {
            items() {
                if (this.order_item_data && this.product_data && this.unit_data) {
                    return this.order_item_data.map(order_item => {
                        const orderProduct = this.product_data.find(product => product.id == order_item.product_id)
                        const productUnit = this.unit_data.find(unit => unit.id == orderProduct.unit_id)
                        order_item.product = orderProduct.name;
                        order_item.unit = productUnit.name;
                        return order_item
                    })
                } else {
                    return []
                }
            }
        },
        mounted() {
            this.getOrderData();
            this.getProductData();
            this.getOrderItemData();
            this.getUnitData();
        },
        methods: {
            getOrderDate: function (order_id) {
                const current_order = this.order_data.find(order => order.id == order_id)
                return new Date(current_order.date).toLocaleString()
            },
            getOrderStatus: function (order_id) {
                const current_order = this.order_data.find(order => order.id == order_id)
                return current_order.status
            },
            isNew: function (order_id) {
                const current_order = this.order_data.find(order => order.id == order_id)
                return current_order.status === 'New';
            },
            isSubmitted: function (order_id) {
                const current_order = this.order_data.find(order => order.id == order_id)
                return current_order.status === 'Submitted';
            },
            getProductData: function (path = '/api/v1/product') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.product_data = response.data))
            },
            getOrderData: function (path = '/api/v1/order') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.order_data = response.data))
            },
            getOrderItemData: function (path = '/api/v1/orderitem') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.order_item_data = response.data))
            },
            getUnitData: function (path = '/api/v1/unit') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.unit_data = response.data))
            },
            submitOrder: function (order, path = '/api/v1/order') {
                let body = {"status": "Submitted"};
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + order, body)
                    .then(() => {
                        this.getOrderData();
                        let snackbar = {
                            show: true,
                            text: "Order submitted",
                            color: 'success',
                            timeout: 2000
                        };
                        this.$store.dispatch('appSnackbar/setSnackbar', snackbar);
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            receiveOrder: function (order, path = '/api/v1/order') {
                let body = {"status": "Received"};
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + order, body)
                    .then(() => {
                        this.getOrderData();
                        let snackbar = {
                            show: true,
                            text: "Order received",
                            color: 'success',
                            timeout: 2000
                        };
                        this.$store.dispatch('appSnackbar/setSnackbar', snackbar);
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            deleteItem: function (order_item, path = '/api/v1/orderitem') {
                this.$confirm('Delete Order Item: ' + order_item.product + '?', {icon: 'mdi-alert'}).then(
                    confirmed => {
                        if (confirmed) {
                            this.axios.delete(process.env.VUE_APP_BASE_URL + path + '/' + order_item.id)
                                .then(() => {
                                    this.getOrderItemData();
                                })
                                .catch(error => {
                                    alert(error);
                                });
                        }
                    }
                )
            },
            deleteOrder: function (order_id, path = '/api/v1/order') {
                this.$confirm('Delete Order: ' + order_id + '?', {icon: 'mdi-alert'}).then(
                    confirmed => {
                        if (confirmed) {
                            this.axios.delete(process.env.VUE_APP_BASE_URL + path + '/' + order_id)
                                .then(() => {
                                    this.getOrderItemData();
                                    this.getOrderData();
                                })
                                .catch(error => {
                                    alert(error);
                                });
                        }
                    }
                )
            },

        }
    }
</script>

<style scoped>

</style>