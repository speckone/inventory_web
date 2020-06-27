<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" app>
            <v-list dense>
                <v-list-item v-for="(item, i) in sidebar" :key="i"
                             @click="item.router != null ? visitRoute(item.router) : visitUrl(item.link)">
                    <v-list-item-action>
                        <v-icon>{{ item.avatar }}</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app color="indigo" dark>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"/>
            <v-toolbar-title v-text="title"/>
            <v-spacer></v-spacer>
            <v-menu left v-if="loggedIn">
                <template v-slot:activator="{ on }">
                    <v-avatar color="indigo" v-on="on">
                        <v-icon dark>mdi-account-circle</v-icon>
                    </v-avatar>
                    {{ userName }}
                </template>

                <v-list>
                    <v-list-item @click="logout">
                        <v-list-item-title>Logout</v-list-item-title>
                        <v-list-item-icon>
                            <v-icon>mdi-export</v-icon>
                        </v-list-item-icon>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-app-bar>

        <v-main>
            <router-view/>
        </v-main>
        <AppSnackbar/>
    </v-app>
</template>

<script>
    import AppSnackbar from "./components/AppSnackbar";

    export default {
        name: 'App',
        components: {
            AppSnackbar,
        },
        data: () => ({
          drawer: false,
          valid: false,
          title: "Esso Inventory",
          sidebar: [
                {
                    title: 'Inventory',
                    avatar: 'mdi-home',
                    router: '/'
                },
                {
                    title: 'Orders',
                    avatar: 'mdi-cart-arrow-down',
                    router: 'orders'
                },
                {
                    title: 'Products',
                    avatar: 'mdi-archive-arrow-down',
                    router: 'products'
                },
                {
                    title: 'Vendors',
                    avatar: 'mdi-store',
                    router: 'vendors'
                },
                {
                    title: 'Units',
                    avatar: 'mdi-beaker',
                    router: 'units'
                },
                {
                    title: 'About',
                    avatar: 'mdi-information',
                    router: 'about'
                },
            ],
        }),
        computed: {
            loggedIn() {
                return this.$store.state.authentication.status.loggedIn;
            },
            userName() {
                if (this.$store.state.authentication.user){
                    return this.$store.state.authentication.user.name;
                } else {
                    return null
                }
            },
        },
        methods: {
            visitUrl(u) {
                window.open(u)
            },
            visitRoute(r) {
                this.$router.push(r)
            },
            logout() {
              this.$store.dispatch('authentication/logout')
              this.$router.push('/login')
            },
        },
    };
</script>
