import http from 'odiss-http-client';

const resourceUrl = '/api/documents';

export function getById(documentId) {
    return http.get(`${resourceUrl}/${documentId}`).then(response => response.data);
}

export function update(document) {
    return http.put(resourceUrl, document);
}

export function setToPendingApproval(documentId) {
    return http.post(`${resourceUrl}/${documentId}/setToPendingApproval`);
}

export function approve(documentId) {
    return http.post(`${resourceUrl}/${documentId}/approve`);
}

export function submitForApproval(documentId) {
    return http.post(`${resourceUrl}/${documentId}/submitForApproval`);
}

export function reject(documentId) {
    return http.post(`${resourceUrl}/${documentId}/reject`);
}

export function archive(documentId) {
    return http.post(`${resourceUrl}/${documentId}/archive`);
}

export function setToOnHold(documentId) {
    return http.post(`${resourceUrl}/${documentId}/setToOnHold`);
}

export function revertRejection(documentId) {
    return http.post(`${resourceUrl}/${documentId}/revertRejection`);
}

export function getHistory(documentId) {
    return http.get(`${resourceUrl}/${documentId}/history`).then(response => response.data);
}

export function getDocumentStatusSummary() {
    return http.get(`${resourceUrl}/DocumentStatusSummary`).then(response => response.data)
}

export function getExceptionCount() {
    return http.get(`${resourceUrl}/exceptionCount`).then(response => response.data)
}

export function forwardToOtherPlant(documentId, plantId) {
    return http.post(`${resourceUrl}/${documentId}/forwardToOtherPlant/${plantId}`);
}

export function resubmit(documentId) {
    return http.post(`${resourceUrl}/${documentId}/resubmit`).then(response => response.data);
}

export function getAllowedActions(documentId) {
    return http.get(`${resourceUrl}/${documentId}/AvailableActions`).then(response => response.data);
}

/**
 * Upload Document to the server
 * @param {Object} document 
 * @param {File} file 
 */
export function uploadDocument(document, file) {
    var formData = new FormData();
    formData.append('file', file);
    formData.append('documentData', JSON.stringify(document));

    return http.post(`${resourceUrl}/submit`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export function uploadSupportingDocument(documentId, description, file) {
    var formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    return http.post(`${resourceUrl}/${documentId}/uploadSupportingDocument`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}