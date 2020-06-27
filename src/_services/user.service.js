
export const userService = {
    login,
    logout,
    refresh
};

function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: new Headers(),
        body: JSON.stringify({ "username": username, "password": password })
    };
    requestOptions.headers.append('Content-Type', 'application/json')
    return fetch(process.env.VUE_APP_BASE_URL + '/auth/login', requestOptions)
        .then(handleResponse)
        .then(user => {
            console.log(user)
            // login successful if there's a jwt token in the response
            if (user.access_token) {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                user.name = username
                localStorage.setItem('user', JSON.stringify(user));
            }

            return user;
        });
}

function refresh() {
    let user = JSON.parse(localStorage.getItem('user'));
    const requestOptions = {
        method: 'POST',
        headers: new Headers(),
    };
    requestOptions.headers.append('Authorization', 'Bearer ' + user.refresh_token)
    return fetch(process.env.VUE_APP_BASE_URL + '/auth/refresh', requestOptions)
        .then(handleResponse)
        .then(refresh_response => {
            // login successful if there's a jwt token in the response
            if (refresh_response.access_token) {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                user.access_token = refresh_response.access_token
                localStorage.setItem('user', JSON.stringify(user));
                console.log('Token updated')
            }

            return user;
        });

}
function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}