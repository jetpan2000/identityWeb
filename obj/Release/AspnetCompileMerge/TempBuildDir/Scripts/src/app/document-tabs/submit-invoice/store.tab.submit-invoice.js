import { observable, action, toJS, computed } from 'mobx';
import { find, extend } from 'lodash-es';
import * as documentSvc from '../../services/api/documents';

import { AppGridSvc as appGridSvc } from 'odiss-app-grid';
import { FieldRendererHelper } from 'odiss-field-renderer';
const { mapFieldForOdissGrid } = FieldRendererHelper;

import './typedefs.submit-invoice';

/**
 * Mobx Store for the Submit Invoice state
 */
class SubmitInvoiceStore {
    constructor() {
        this.init();

        this.loadLookupOptions = this.loadLookupOptions.bind(this);
        this.receiveDocumentUpdate = this.receiveDocumentUpdate.bind(this);
        this.receiveLineItemsUpdate = this.receiveLineItemsUpdate.bind(this);
        this.receiveFileUploadUpdate = this.receiveFileUploadUpdate.bind(this);
        this.save = this.save.bind(this);
    }

    get appData () {
        return window.__appData;
    }

    get fields() {
        return this.appData.Fields.filter(x => !x.NotVisibleFilter).map(field => mapFieldForOdissGrid(field, toJS(this.lookupOptions.get(field.ID))));
    }

    get lineItemFields() {
        return this.appData.FieldsItems.filter(x => !x.NotVisibleFilter).map(field => mapFieldForOdissGrid(field, toJS(this.lookupOptions.get(field.ID))));
    }

    propertiesValidator = null;
    lineItemValidators = [];

    /** @type {DocumentInvoice} */
    @observable document = {
        isConfidential: false,
        lineItems: [],
        invoiceStatusCode: 'PendingApproval'
    };

    /** @type {File} */
    @observable file = null;

    /** @type {Boolean} */
    @observable isLoading = false;

    /** @type {FileUploadStatus} */
    @observable fileUploadStatus = null;

    /** @type {SubmissionAlert} */
    @observable submissionAlert = 'NONE';

    /** @type {ValidationState} */
    @observable validationState = 'VALID';

    @observable lookupOptions = observable.map();

    /** @returns {Currency} */
    @computed get currency() {
        if (!this.document) {
            return null;
        }

        var currencyField = find(this.fields, x => x.mapTo === 'CurrencyCode');
        var currencies = this.lookupOptions.get(currencyField.name);

        return find(currencies, x => x.code === this.document.currencyCode);
    }

    @action async init() {
        await this.loadLookupOptions();
    }

    @action async loadLookupOptions() {
        var fieldsNeedingLookup = this.appData.Fields.filter(field => field.Type === 5);

        await Promise.all(fieldsNeedingLookup.map(async (field) => {
            try {
                var lookupCollection = await appGridSvc.getLookupOptions(field);
                this.lookupOptions.set(field.ID, lookupCollection);
            }
            catch (e) {
                this.lookupOptions.set(field.ID, []);
            }
        }));
    }

    @action receiveDocumentUpdate(updatedProperties) {
        extend(this.document, updatedProperties);
    }

    @action receiveLineItemsUpdate(updatedLineItems) {
        this.document.lineItems.replace(updatedLineItems);
    }

    /**
     * Callback to receive update from file upload control
     * @param {File} file 
     * @param {FileUploadStatus} fileUploadStatus 
     */
    @action receiveFileUploadUpdate(file, fileUploadStatus) {
        this.file = file;
        this.fileUploadStatus = fileUploadStatus;
    }

    @action async save() {
        var validationResults = await Promise.all([this.propertiesValidator.resolveValidation(), ...this.lineItemValidators.map(x => x.resolveValidation()) ]);

        if (!validationResults.every(x => x === true)) {
            this.validationState = 'INVALID';
            return; // Do not save
        }

        if (this.file === null || this.file === undefined) {
            this.validationState = 'FILE_MISSING';
            return; // Do not save
        }

        try {
            this.isLoading = true;
            var document = toJS(this.document);
            
            await documentSvc.uploadDocument(document, this.file);
            this.submissionAlert = 'SUCCESS';
        }
        catch (e) {
            this.submissionAlert = 'SERVER_ERROR';
        }
        finally {
            this.isLoading = false;
        }
    }

    @action clear() {
        this.document = {
            isConfidential: false,
            lineItems: [],
            invoiceStatusCode: 'PendingApproval'
        };
    }
}

export default SubmitInvoiceStore;