import { observable, action, toJS, reaction, computed } from 'mobx';
import { camelCase, isEqual, find, first } from 'lodash-es';
import { v4 as uuid } from 'uuid';
import ALERT from './alert';
import * as documentSvc from '../../services/api/documents';
import * as plantsSvc from '../../services/api/plants';
import { AppGridSvc as appGridSvc } from 'odiss-app-grid';
import * as usersSvc from '../../services/api/users';
import * as invoiceLookupSvc from '../../services/api/invoice-lookups';
import { FieldRendererHelper } from 'odiss-field-renderer';
import * as OdissOld from '../../helpers/odiss-old';
const { mapFieldForOdissGrid } = FieldRendererHelper;
import ActionResolver from 'odiss-action-resolver';

class InvoiceStore {
    constructor () {
        reaction(() => this.document, doc => {
            this.resolveActions();
            window.documentId = doc.guid;
        });

        reaction(() => toJS(this.document), updatedDoc => {
            if (!isEqual(updatedDoc, this.cleanDocument)) {
                this.isDirty = true;
            }
        });

        reaction(() => this.document && this.document.plantId, async plantId => {
            var data = await plantsSvc.getGLAccountNumbers(plantId);
            this.allowedGlCodes = data.map(d => d.accountNumber);
            this.glCodeOptions.replace(data);
        });

        reaction(() => {
            // This is the function whose return value the reaction reacts to
            // We need the combination of plantId and poNumber

            if (!this.document) {
                return null;
            }

            const { plantId, poNumber } = this.document;

            return { plantId, poNumber };
        }, async ({plantId, poNumber}) => {
            var data = await invoiceLookupSvc.searchPartNumbers({ plantId, poNumber, pageSize: 2000 }).then(d => d.records);
            this.partNumberOptions.replace(data);
        });

        reaction(() => this.isReadOnly, value => {
            this.resolveActions();

            // If isReadOnly ever gets the value false then we lock in showing the forward to other plant tab
            // The intention is that it's available to show even if the page later becomes read-only, then it still shows but with disabled fields
            if (value === false) {
                this.showForwardingTab = true;
            }
        });

        this.lineItemAutoCalcDisposer = computed(() => this.document && this.document.lineItems.map(({quantity, unitPrice}, index) => ({index, quantity, unitPrice}))).observe(({newValue, oldValue}) => {
            if (!oldValue) {
                return;
            }

            newValue.forEach(({index, quantity, unitPrice}) => {
                var lineItem = this.document.lineItems[index];
                var old = oldValue[index];

                if (!old) {
                    return;
                }

                if (this.isDirty && (old.quantity !== quantity || old.unitPrice !== unitPrice)) {
                    var autoCalcValue = (Number(quantity) * Number(unitPrice));

                    if (!isNaN(autoCalcValue)) {
                        lineItem.totalAmount = autoCalcValue.toFixed(2);
                    }
                }
            });
        });

        this.addLineItem = this.addLineItem.bind(this);
        this.save = this.save.bind(this);
        this.performWorkflowAction = this.performWorkflowAction.bind(this);
        this.setToPendingApproval = this.setToPendingApproval.bind(this);
        this.approve = this.approve.bind(this);
        this.submitForApproval = this.submitForApproval.bind(this);
        this.reject = this.reject.bind(this);
        this.archive = this.archive.bind(this);
        this.onHold = this.onHold.bind(this);
        this.revertRejection = this.revertRejection.bind(this);
        this.forwardToOtherPlant = this.forwardToOtherPlant.bind(this);
        this.resubmit = this.resubmit.bind(this);
    }

    cleanDocument = null;
    canRevertHistoryItem = false;
    lineItemValidators = [];

    @observable document = null;
    @observable history = [];
    @observable glCodeOptions = [];
    @observable partNumberOptions = [];
    @observable lookupOptions = observable.map();
    @observable activeAlert = ALERT.NONE;
    @observable activeForwardAlert = ALERT.NONE;
    @observable validationResults = [];
    @observable isLoading = false;
    @observable userCanEditDocument = null;
    @observable userCanViewConfidentialDocument = false;
    @observable showForwardingTab = false;
    @observable isDirty = false;
    @observable isShowingSupportingDocument = false;
    @observable allowedActions = null;
    @observable errorMessage = null;

    get appData () {
        return window.__appData;
    }

    get applicationIdentifier () {
        return this.appData.ID;
    }

    get fields() {
        return this.appData.Fields.filter(x => !x.NotVisibleFilter).map(field => mapFieldForOdissGrid(field, toJS(this.lookupOptions.get(field.ID))));
    }

    get lineItemFields() {
        return this.appData.FieldsItems.filter(x => !x.NotVisibleFilter).map(field => mapFieldForOdissGrid(field, toJS(this.lookupOptions.get(field.ID))));
    }

    @computed get canForward() {
        // TODO - Add additonal logic to prevent forwarding based on AP roles of the user
        return !this.isReadOnly;
    }

    @computed get isReadOnly() {
        return !this.userCanEditDocument || this.document && ['Archived', 'Approved'].indexOf(this.document.invoiceStatusCode) > -1;
    }

    @computed get currency() {
        if (!this.document) {
            return null;
        }

        var currencyField = find(this.fields, x => x.mapTo === 'CurrencyCode');
        var currencies = this.lookupOptions.get(currencyField.name);

        return find(currencies, x => x.code === this.document.currencyCode);
    }

    @observable actions = [];

    @action showSupportingDocument(documentId) {
        OdissOld.changeDocumentInViewer(window.__getSupportingDocumentUrl + '/' + documentId);
        this.isShowingSupportingDocument = true;
    }

    @action closeSupportingDocument() {
        OdissOld.changeDocumentToOriginalInViewer();
        this.isShowingSupportingDocument = false;
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

    @action async loadDocument(documentId) {
        try {
            this.history = await documentSvc.getHistory(documentId);
        }
        catch (e) {}

        this.allowedActions = await documentSvc.getAllowedActions(documentId);
        var document = await documentSvc.getById(documentId);
        this.isDirty = false;
        this.cleanDocument = document;
        this.document = document;
        this.userCanViewConfidentialDocument = await usersSvc.hasPermission('ViewConfidentialDocuments');
        this.userCanEditDocument = await usersSvc.canEditDocument(documentId);
        this.isDirty = false;
    }

    @action reload() {
        this.loadDocument(this.document.guid);
    }

    @action setAlert(alert) {
        if (alert === ALERT.VALIDATION_ERROR) {
            // Disabling validation errors for now
            this.activeAlert = ALERT.NONE;
            return;
        }

        this.activeAlert = alert;
    }

    /**
     * Takes a function as argument and executes it only after the store data is successfully saved before unless the state is not dirty and all form validations pass.
     * This is necessary to ensure that we don't allow performing any workflow actions unless the form is valid and changes are saved.
     * 
     * For certain actions, requireSaveIfNotDirty is passed as false as we don't need to validate and save in the event that the form is not dirty. The reason being
     * we want to allow the action if it means that the document is not actively going to remain in workflow (e.g. when putting on hold, archiving, rejecting).
     * 
     * @param {InvoiceStore} store
     * @param {Function} action
     * @param {bool} requireSaveIfNotDirty
     * @returns {Function} - Wrapped function performing the action if successfully saved ahead of time
     */
    @action wrapSaveBeforeAction(store, action, requireSaveIfNotDirty) {
        return () => {
            const saveAndActionIfOk = () => {
                store.save().then(saveSuccess => {
                    if (saveSuccess) {
                        action();
                    }
                });
            }

            if (store.isDirty) {
                // We always need to save if state is dirty
                saveAndActionIfOk();
                return;
            }

            if (requireSaveIfNotDirty) {
                store.checkValidations().then(validationsOk => {
                    if (validationsOk) {
                        // Since validations are okay we can just perform the action (no need to save)
                        action();
                    }
                    else {
                        // Need to save before performing action
                        saveAndActionIfOk();
                    }
                });
            }
            else {
                // State is not dirty and we don't require validation beforehand so just perform the action
                action();
            }
        }
    }

    @action async resolveActions() {
        const saveWrapper = this.wrapSaveBeforeAction.bind(this);

        this.actions = await new ActionResolver([
            {
                name: 'Save',
                func: this.save,
                canPerform: new Promise((resolve, reject) => {
                    resolve(!this.isReadOnly);
                }),
                props: {
                    key: 1,
                    bsStyle: 'primary',
                    left: true
                }
            },
            {
                name: 'Ready for Approval',
                func: saveWrapper(this, this.setToPendingApproval, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.setToPendingApproval.isSuccess);
                }),
                props: {
                    key: 2,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Approve',
                func: saveWrapper(this, this.approve, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.approve.isSuccess);
                }),
                props: {
                    key: 3,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Reject',
                func: saveWrapper(this, this.reject, false),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.reject.isSuccess);
                }),
                props: {
                    key: 4,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Archive',
                func: saveWrapper(this, this.archive, false),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.archive.isSuccess);
                }),
                props: {
                    key: 5,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'On Hold',
                func: saveWrapper(this, this.onHold, false),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.setToOnHold.isSuccess);
                }),
                props: {
                    key: 6,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Off Hold',
                func: saveWrapper(this, this.setToPendingApproval, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(!this.isReadOnly && this.document.invoiceStatusCode === 'OnHold');
                }),
                props: {
                    key: 7,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Submit for Approval',
                func: saveWrapper(this, this.submitForApproval, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.submitForApproval.isSuccess);
                }),
                props: {
                    key: 8,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Revert Rejection',
                func: saveWrapper(this, this.revertRejection, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.revertRejection.isSuccess);
                }),
                props: {
                    key: 9,
                    bsStyle: 'primary',
                    right: true
                }
            },
            {
                name: 'Resubmit',
                func: saveWrapper(this, this.resubmit, true),
                canPerform: new Promise((resolve, reject) => {
                    resolve(this.allowedActions.resubmit.isSuccess);
                }),
                props: {
                    key: 9,
                    bsStyle: 'primary',
                    right: true
                }
            }
        ]).resolveDefinitions();
    }

    @action addLineItem() {
        var fields = this.lineItemFields.map(field => camelCase(field.MapTo));
        var obj = {};
        
        fields.forEach(field => {
            obj[field] = '';
        });
        obj.id = uuid();

        this.document.lineItems.push(obj);
    }

    /**
     * Performs form validations and resolves a promise with the results of such check. Will replace the stored validationResults for this store also.
     * @returns {Promise<bool>} - true if all validation checks pass, false otherwise
     */
    @action async checkValidations() {
        var validationResults = await Promise.all([this.editPropertiesValidator.resolveValidation(), ...this.lineItemValidators.map(x => x.resolveValidation()) ]);
        this.validationResults.replace(validationResults);

        return this.validationResults.every(x => x === true);
    }

    @action async save() {
        var validationCheck = await this.checkValidations();

        if (!validationCheck) {
            this.setAlert(ALERT.VALIDATION_ERROR);
            return false; // Do not save
        }

        try {
            this.isLoading = true;
            var document = toJS(this.document);
            
            await documentSvc.update(document);
            this.setAlert(ALERT.SUCCESS);
            await this.reload();
            
            return true;
        }
        catch (e) {
            this.setAlert(ALERT.ERROR);
            this.errorMessage = e.response.data;

            return false;
        }
        finally {
            this.isLoading = false;
        }
    }

    /**
     * @param {Promise} workflowAction
     */
    @action performWorkflowAction(workflowAction) {
        this.isLoading = true;

        workflowAction.then(() => {
            this.setAlert(ALERT.SUCCESS);
        }, () => {
            this.setAlert(ALERT.ERROR);
        }).finally(() => {
            this.isLoading = false;

            this.reload();
        })
    }

    @action setToPendingApproval() {
        this.performWorkflowAction(documentSvc.setToPendingApproval(this.document.guid));
    }

    @action approve() {
        this.performWorkflowAction(documentSvc.approve(this.document.guid));
    }

    @action submitForApproval() {
        this.performWorkflowAction(documentSvc.submitForApproval(this.document.guid));
    }

    @action reject() {
        this.performWorkflowAction(documentSvc.reject(this.document.guid));
    }

    @action archive() {
        this.performWorkflowAction(documentSvc.archive(this.document.guid));
    }

    @action onHold() {
        this.performWorkflowAction(documentSvc.setToOnHold(this.document.guid));
    }

    @action revertRejection() {
        this.performWorkflowAction(documentSvc.revertRejection(this.document.guid));
    }

    @action resubmit() {
        this.performWorkflowAction(documentSvc.resubmit(this.document.guid));
    }

    @action async forwardToOtherPlant(plantId) {
        try {
            this.isLoading = true;

            await documentSvc.forwardToOtherPlant(this.document.guid, plantId);
            this.activeForwardAlert = ALERT.PLANT_FORWARD_SUCCCES;
        }
        catch (e) {
            this.activeForwardAlert = ALERT.PLANT_FORWARD_ERROR;
        }
        finally {
            this.isLoading = false;
        }

        await this.reload();
    }
}

export default InvoiceStore;