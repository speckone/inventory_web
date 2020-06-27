<template>
    <div>
        <v-card-text>
            <v-form @submit.prevent="handleSubmit">
                <v-text-field
                        v-model="username"
                        label="Login"
                        name="login"
                        prepend-icon="mdi-account"
                        type="text"
                ></v-text-field>
                <v-text-field
                        v-model="password"
                        id="password"
                        label="Password"
                        name="password"
                        prepend-icon="mdi-lock"
                        type="password"
                ></v-text-field>
            </v-form>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" :disabled="loggingIn" @click="handleSubmit" :loading="loggingIn">Login</v-btn>
            </v-card-actions>
        </v-card-text>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                username: '',
                password: '',
                submitted: false
            }
        },
        computed: {
            loggingIn() {
                return this.$store.state.authentication.status.loggingIn;
            }
        },
        created() {
            // reset login status
            this.$store.dispatch('authentication/logout');
        },
        methods: {
            handleSubmit() {
                this.submitted = true;
                const {username, password} = this;
                const {dispatch} = this.$store;
                if (username && password) {
                    dispatch('authentication/login', {username, password});
                }
            }
        }
    };
</script>