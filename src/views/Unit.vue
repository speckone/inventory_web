<template>
    <div>
        <v-data-table
                :headers="headers"
                :items="items"
        >
            <template v-slot:top>
                <v-toolbar flat color="white">
                    <v-toolbar-title>Units</v-toolbar-title>
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
                            <v-btn color="primary" dark class="mb-2" v-on="on">New Unit</v-btn>
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
                                                        v-model="current_unit_name"
                                                        :rules="[v => !!v || 'Name is required']"
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
                </v-toolbar>
            </template>

        </v-data-table>
    </div>
</template>

<script>
    export default {
        name: "Unit",
        data: () => ({
            unit_data: null,
            headers: [
                {text: 'ID', value: 'id'},
                {text: 'Name', value: 'name'},
                {text: 'Actions', value: 'actions', sortable: false},
            ],
            dialog: false,
            current_unit: {'name': null},
            valid: false,
            snackbar: false,
        }),
        computed: {
            formTitle() {
                return this.current_site_id === -1 ? 'New Unit' : 'Edit Unit'
            },
            current_unit_name: {
                get: function () {
                    if (this.current_unit) {
                        return this.current_unit.name
                    } else {
                        return null
                    }
                },
                set: function (new_value) {
                    this.current_unit.name = new_value
                }
            },
            unit_body() {
                return {
                    "name": this.current_unit_name
                }
            },
            items() {
                if (this.unit_data) {
                    return this.unit_data
                } else {
                    return []
                }
            }
        },
        mounted() {
            this.getUnitData();
        },
        methods: {
            getUnitData: function (path = '/api/v1/unit') {
                this.axios.get(process.env.VUE_APP_BASE_URL + path)
                    .then(response => (this.unit_data = response.data))
            },
            updateItem: function (path = '/api/v1/unit') {
                this.axios.put(process.env.VUE_APP_BASE_URL + path + '/' + this.current_unit_id, this.unit_body)
                    .then(() => {
                        this.getUnitData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            addItem: function (path = '/api/v1/unit') {
                this.axios.post(process.env.VUE_APP_BASE_URL + path, this.unit_body)
                    .then(() => {
                        this.getUnitData();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            },
            deleteItem: function (unit, path = '/api/v1/unit') {
                this.$confirm('Delete Unit: ' + unit.name + '?', {icon: 'mdi-alert'}).then(
                    confirmed => {
                        if (confirmed) {
                            this.axios.delete(process.env.VUE_APP_BASE_URL + path + '/' + unit.id)
                                .then(() => {
                                    this.getUnitData();
                                })
                                .catch(error => {
                                    alert(error);
                                });
                        }
                    }
                )

            },

            editItem(item) {
                this.current_unit = Object.assign({}, item);
                this.current_unit_id = item.id;
                this.dialog = true;
            },
            close() {
                this.dialog = false;
                this.$refs.form.reset();
                this.current_unit_id = -1;
                this.current_unit = {'name': null}
            },
            save() {
                if (this.$refs.form.validate()) {
                    if (this.current_unit_id > -1) {
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