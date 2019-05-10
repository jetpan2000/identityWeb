import http from 'odiss-http-client';

const resourceUrl = '/api/ap/roles';

export function getAll() {
    return http.get(resourceUrl).then(response => response.data);
}