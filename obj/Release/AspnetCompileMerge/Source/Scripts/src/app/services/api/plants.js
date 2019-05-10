import http from 'odiss-http-client';

const resourceUrl = '/api/plantsGrid';

export function getAll() {
    return http.get(resourceUrl).then(response => response.data);
}

export function getGLAccountNumbers(plantId) {
    return http.get(`${resourceUrl}/${plantId}/GLAccountNumbers`).then(response => response.data);
}

export function validateGlAccountNumber(accountNumber, plantId) {
    return http.get(`${resourceUrl}/${plantId}/ValidateGlAccountNumber/${accountNumber}`).then(response => response.data)
}