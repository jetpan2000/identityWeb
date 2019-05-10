import http from 'odiss-http-client';

const resourceUrl = '/api/ap/users';

export function get(id) {
    return http.get(`${resourceUrl}/${id}`).then(response => response.data);
}

export function save(data) {
    return http.post(resourceUrl, data);
}