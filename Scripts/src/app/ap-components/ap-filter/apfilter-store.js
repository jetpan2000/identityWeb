import { observable, action } from 'mobx';
import * as documentsApi from '../../services/api/documents';
import $ from 'jquery';

class APFilterStore {
    @observable documentStatusSummary = [];
    @observable exceptionCount = undefined;

    get exceptionsUrl() {
        return window.__exceptionsUrl;
    }

    @action async loadData() {
        this.documentStatusSummary = await documentsApi.getDocumentStatusSummary();
        this.exceptionCount = await documentsApi.getExceptionCount();
    }

    @action initiateStatusFilterSearch(statusCode) {
        $('select[title="Invoice Status"]').val(statusCode);
        window.OdissApp.refreshSearch();
    }
}

export default APFilterStore;