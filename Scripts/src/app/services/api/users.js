import http from 'odiss-http-client';

export function hasPermission(permission) {
    return http.get('/api/users/hasPermission/' + permission).then(results => results.data);
}

export function canEditDocument(documentId) {
    return http.get('/api/users/canEditDocument/' + documentId).then(results => results.data);
}