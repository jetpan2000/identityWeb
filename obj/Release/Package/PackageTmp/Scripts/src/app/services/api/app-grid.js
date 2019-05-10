import http from 'odiss-http-client';

const defaultResourceUrl = '/api/app-grid';

function hasCustomAPI() {
    return !!(window.__appData && window.__appData.Custom && window.__appData.Custom.DataGridAPI);
}

function getResourceUrl(appId) {
    return hasCustomAPI() ? window.__appData.Custom.DataGridAPI : `${defaultResourceUrl}/${appId}`;
}

export function getAll(appId) {
    return http.get(getResourceUrl(appId)).then(response => response.data);
}

export function create(data, appId) {
    return http.post(getResourceUrl(appId), data)
}

export function update(data, appId) {
    return http.put(getResourceUrl(appId), data)
}

export function remove(key, appId) {
    var resourceUrl = getResourceUrl(appId);

    if (hasCustomAPI()) {
        return http.delete(`${resourceUrl}/${key}`);
    }
    else {
        return http.delete(`${resourceUrl}?key=${key}`);
    }
}

export function getLookupOptions(field, parameter) {
    if (!parameter) {
        parameter = null;
    }

    switch (field.FilterType) {
        case 1:
        case 3: { // VIEW, SPROD
            return http.get(`/api/field/${field.ID}/FilterValues?parameter=${parameter}`).then(response => response.data);
            break;
        }
        case 2: { // JSON
            return new Promise ((resolve, reject) => {
                try {
                    resolve(JSON.parse(field.FilterData));
                }
                catch (ex) {
                    reject('Could not parse FilterData: ' + ex);
                }
            });
            break;
        }
        case 4: { // REST
            return http.get(field.FilterCommand).then(response => response.data);
            break;
        }
    }

    return promise;
}

export function search(appId, searchOptions) {
    return http.post(`${getResourceUrl(appId)}/search`, searchOptions).then(response => response.data);
}