"use strict";

import Vue from 'vue';
import axios from "axios";

const _axios = axios.create();


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    console.log(error, token)
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    })

    failedQueue = [];
}


_axios.interceptors.request.use(
    function (config) {
        let user = JSON.parse(localStorage.getItem('user'));
        if (user && user.access_token) {
            config['headers'] = {'Authorization': 'Bearer ' + user.access_token}
        }
        return config;
    },
    function (error) {
        // Do something with request error
        return Promise.reject(error);
    }
);

// Add a response interceptor
_axios.interceptors.response.use(
    function (response) {
        // Do something with response data
        return response;
    },
    function (error) {
        const originalRequest = error.config;
        console.log(error.response)
        if (error.response.status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
            console.log("Token expired")

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({resolve, reject})
                }).then(token => {
                    console.log('token: ', token)
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                })
            }

            originalRequest._retry = true;
            isRefreshing = true;

            let user = JSON.parse(localStorage.getItem('user'));
            return new Promise(function (resolve, reject) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + user.refresh_token;
                axios.post(process.env.VUE_APP_BASE_URL + '/auth/refresh')
                    .then(({data}) => {
                        user.access_token = data.access_token
                        localStorage.setItem('user', JSON.stringify(user));
                        console.log("Token updated")
                        axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token;
                        originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
                        processQueue(null, data.access_token);
                        resolve(axios(originalRequest));
                    })
                    .catch((err) => {
                        processQueue(err, null);
                        reject(err);
                    })
                    .then(() => {
                        isRefreshing = false
                    })
            })
        }
        if (error.status === 401 && originalRequest && originalRequest.__isRetryRequest) {
            this.$store.dispatch('authentication/logout')
        }
        return Promise.reject(error);
    }
);

Plugin.install = function (Vue) {
    Vue.axios = _axios;
    window.axios = _axios;
    Object.defineProperties(Vue.prototype, {
        axios: {
            get() {
                return _axios;
            }
        },
        $axios: {
            get() {
                return _axios;
            }
        },
    });
};

Vue.use(Plugin)

export default Plugin;
