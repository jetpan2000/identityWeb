import React from 'react';
import { observer, Provider } from 'mobx-react';
import { toJS } from 'mobx';
import { extend, isArray } from 'lodash';
import Decimal from 'decimal';
import DocumentTab, { EditProperties, LineItems } from 'odiss-document-tab';
import { FIELD_TYPES, LOOKUP_TYPES, OdissFieldRenderer } from 'odiss-field-renderer';
import Store from './store';
import ActionBar from './edit-action-bar';
import InvoiceHistory from './invoice-history';
import DebitCredit from './debit-credit';
import ForwardToOtherPlant from './forward-to-other-plant';
import SupportingDocuments from './supporting-documents';
import AlertInvoice from './alert.invoice';
import glCodeFormatter from '../../helpers/gl-code-formatter';
import { isDecimal } from 'validator';
import * as invoiceLookupSvc from '../../services/api/invoice-lookups';
import * as appGridSvc from '../../services/api/app-grid';
import globalSearch from '../../services/api/search';

import './document-tab.scss';

var store = new Store();
store.loadLookupOptions();
store.loadDocument(window.__invoiceTabState.documentId);
window.__documentTabStore = store;

const globalSearchResolver = (field, query, searchParameters) => {
    return globalSearch(field, query, { 
        searchParameters,
        callingApplicationIdentifier: store.applicationIdentifier
    }).then(data => data.records);
};

@observer
class DocumentTabMain extends React.Component {
    constructor(props) {
        super(props);

        this.receiveDocumentUpdate = this.receiveDocumentUpdate.bind(this);
        this.receiveLineItemsUpdate = this.receiveLineItemsUpdate.bind(this);

        this.invoiceHeaderValidations = [{
            field: '886183ae-e40a-e911-842c-005056820bd7|885f9797-8715-49d4-ac76-fd983233e9b1|94adfdb2-735b-4f06-bd7e-3cd32a46cb39',
            method: (inputValue) => {
                if (isNaN(inputValue)) {
                    return false;
                }
                var value = Decimal(inputValue);

                const { gsthst, pstqst, lineItems } = store.document;
                const lineItemTotalAmounts = lineItems.map(x => Decimal(x.totalAmount));

                var lineTotals = lineItemTotalAmounts.length > 0 ? lineItemTotalAmounts.reduce((accumulator, currentValue) => {
                    return currentValue.add(accumulator);
                }) : Decimal(0);

                const gsthstNumber = Decimal(gsthst);
                const pstqstNumber = Decimal(pstqst);
                const totalExpected = lineTotals.add(gsthstNumber).add(pstqstNumber);

                return value.toNumber() === totalExpected.toNumber();
            },
            message: 'Total Amount must equal line number totals + GST/HST + PST/QST',
            validWhen: true
        }];

        this.lineItemValidations = [{
            field: '746a3545-3cf7-e811-822e-d89ef34a256d|19375c8a-1008-450a-9056-2cbfb0029ab4|054e30c1-a645-47c9-9ee9-7921c118677a',
            method: (inputValue) => {
                return store.allowedGlCodes.indexOf(inputValue) > -1;[]
            },
            // This was an attempt to make the validation asynchronous.
            // isAsync: true,
            // method: async inputValue => {
            //     return await documentsSvc.validateGlAccountNumber(inputValue, store.document.plantId);
            // },
            validWhen: true,
            message: 'GL account is not included in the master list'
        }, {
            field: '453cfb60-3cf7-e811-822e-d89ef34a256d|bb859a73-3cf7-e811-822e-d89ef34a256d|f92951c6-e60a-e911-842c-005056820bd7',
            method: (inputValue) => {
                return isDecimal(inputValue, { decimal_digits: '1,2', locale: 'en-US' });
            },
            message: 'Quantity must be a decimal number of maximum two digits',
            validWhen: true
        }];
    }

    receiveDocumentUpdate(updatedProperties) {
        extend(store.document, updatedProperties);
    }

    receiveLineItemsUpdate(updatedLineItems) {
        store.document.lineItems.replace(updatedLineItems);
    }

    render() {
        /** @type {Array<OdissFieldRenderer>} */
        var fieldOverrides = [{
            name: 'c0a7c606-e7f3-e811-822e-d89ef34a256d|2d767887-dbca-4fa7-861f-b6b7510e3eab|fd8a1bee-5a40-471a-8e31-7dba8ea6dd32|c0a7c606-e7f3-e811-822e-d89ef34a202d',
            lookupValueField: 'purchaseOrder',
            lookupPromiseResolver: (field, query, isSearchingForExisting) => {
                const { companyCode: CompanyCode } = store.plant;

                return globalSearchResolver(field, query, isSearchingForExisting ? {} : { CompanyCode });
            },
            lookupFindExistingItemBySearchPromise: true
        }, {
            name: '947c8c8d-7010-e911-842c-005056820bd7|947c8c8d-7010-e911-842c-005056822bd7|947c8c8d-7010-e911-842c-005056820bd6|9ae6cd34-5b13-e911-842c-005056820bd7',
            lookupPromiseResolver: (field, query, isSearchingForExisting) => {
                const { companyCode: CompanyCode, postalCode: PostalCode } = store.plant;

                return globalSearchResolver(field, query, isSearchingForExisting ? {} : { CompanyCode, PostalCode });
            },
            lookupFindExistingItemBySearchPromise: true
        }, {
            name: '14642531-41cd-4be4-8b39-001e4821c0c4',
            CustomElement: ({value}) => {
                const exceptionCodes = toJS(value);
                if (!isArray(exceptionCodes)) {
                    return <div></div>;
                }

                return <ul style={{ padding: '2px' }}>
                    { exceptionCodes.map(({exception: { description }, exceptionCode}) => <li key={exceptionCode}>{exceptionCode} - {description}</li>) }
                </ul>
            }
        }, {
            name: '896183ae-e40a-e911-842c-005056820bd7|5d24d8e9-c0cf-42be-8d50-668a984b1aa8|0006a605-061d-4d48-bef1-88189d758f33|896183ae-e40a-e911-842c-005056820bd2',
            CustomElement: ({props}) => {
                return <DebitCredit document={store.document} {...props} />;
            }
        }];

        if (store.userCanViewConfidentialDocument) {
            fieldOverrides.push({
                name: '47a2967e-2e35-e911-842e-005056820bd7',
                editable: true
            });
        }

        return <Provider store={store}>
            <React.Fragment>
                { store.showForwardingTab && <DocumentTab title="Forward to another site">
                    <ForwardToOtherPlant isReadOnly={store.isReadOnly} onUpdateDocument={this.receiveDocumentUpdate} />
                </DocumentTab> }
                <DocumentTab title="Properties" defaultExpanded={true}>
                    { store.document && <React.Fragment>
                        <DocumentTab.Section title="Invoice Header">
                            <EditProperties 
                                document={store.document} 
                                onUpdateDocument={this.receiveDocumentUpdate} 
                                appData={window.__appData} 
                                lookupCollection={toJS(store.lookupOptions)} 
                                isReadOnly={store.isReadOnly}
                                fieldOverrides={fieldOverrides}
                                customValidationRules={this.invoiceHeaderValidations}
                                validatorRef={(ref) => { store.editPropertiesValidator = ref; }}
                                currency={store.currency}
                                />
                        </DocumentTab.Section>
                        <DocumentTab.Section title="Line Items">
                            <LineItems 
                                lineItems={toJS(store.document.lineItems)} 
                                onUpdateLineItems={this.receiveLineItemsUpdate} 
                                appData={window.__appData} 
                                isReadOnly={store.isReadOnly}
                                fieldOverrides={[{
                                    name: '746a3545-3cf7-e811-822e-d89ef34a256d|19375c8a-1008-450a-9056-2cbfb0029ab4|054e30c1-a645-47c9-9ee9-7921c118677a|746a3545-3cf7-e811-822e-d89ef34a236d',
                                    lookupType: LOOKUP_TYPES.AUTOCOMPLETE,
                                    filterData: {
                                        displayFormat: '{formattedAccountNumber} - {description}'
                                    },
                                    lookupValueField: 'accountNumber',
                                    lookupValueFormatter: glCodeFormatter,
                                    lookupPromiseResolver: () => {
                                        return new Promise(resolve => {
                                            resolve(toJS(store.glCodeOptions));
                                        });
                                    },
                                    setValueOnInputChange: (input, setValue) => {
                                        var dashesStripped = input.split('-').join('');
                                        setValue(dashesStripped);
                                    },
                                    className: 'gl-account-number'
                                 },{
                                    name: '443cfb60-3cf7-e811-822e-d89ef34a256d|18d8e1b0-1a4a-4284-bcfb-f17d63885bc7|c4bbe481-5c7a-4d20-aca2-d1b9dbd30baa|443cfb60-3cf7-e811-822e-d89ef34a266d',
                                    lookupValueField: 'number',
                                    // below is an example of how to render the field with a pre-loading of lookup data if dataset is not very large after applying filters
                                    // it's not used in this case as it makes more sense to have the store retrieve this data just once for all instances of this control
                                    //fetchLookupAhead: () => (store.document && { plantNumber: store.document.plantNumber, poNumber: store.document.poNumber }) || {},


                                    lookupPromiseResolver: () => {
                                        return new Promise(resolve => {
                                            resolve(toJS(store.partNumberOptions));
                                        });
                                        // const { plantNumber, poNumber } = store.document;

                                        // return invoiceLookupSvc.searchPartNumbers(plantNumber, poNumber, { pageSize: 10000 }).then(data => data.records);
                                    },
                                    className: 'part-number'
                                }, {
                                    name: '453cfb60-3cf7-e811-822e-d89ef34a256d|bb859a73-3cf7-e811-822e-d89ef34a256d|f92951c6-e60a-e911-842c-005056820bd7|a2195b21-69dc-4bc5-92f2-fd6155a5a563|618637e1-1f04-4c95-a9c4-24343ee9ad17|96b8db4d-4856-457b-8354-6b8af843e38a|e7983d1b-b01f-4b6c-bc7c-4cb7b9b59909|cc5d9b28-7740-43e0-a659-9bea5809b80c|7595d635-a2ff-401e-89a4-fc0bfea54f57|453cfb60-3cf7-e811-822e-d89ef34a276d|f92951c6-e60a-e911-842c-005056828bd7|bb859a73-3cf7-e811-822e-d89ef34a296d',
                                    shrinkToFit: true
                                }]}
                                customValidationRules={this.lineItemValidations}
                                validators={store.lineItemValidators}
                                currency={store.currency}
                                />
                        </DocumentTab.Section>
                        <AlertInvoice />
                        { <div style={{ marginLeft: '5px', marginRight: '5px' }}><ActionBar /></div>}
                    </React.Fragment> }
                </DocumentTab>
                <DocumentTab title="Invoice History">
                    <InvoiceHistory />
                </DocumentTab>
                <DocumentTab title="Supporting Documents" nopad>
                    <SupportingDocuments />
                </DocumentTab>
            </React.Fragment>
        </Provider>
    }
}

export default DocumentTabMain;