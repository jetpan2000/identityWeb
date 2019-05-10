import React from 'react';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
import { Button } from 'react-bootstrap';
import * as appGridSvc from '../../services/api/app-grid';

import DocumentTab, { EditProperties, LineItems, DocumentSubmit } from 'odiss-document-tab';
import Alert from './alert.submit-invoice';
import SubmitInvoiceStore from './store.tab.submit-invoice';

/**
 * @extends React.Component<{store: SubmitInvoiceStore}, {}, {}>
 */
@inject('store')
@observer
class SubmitInvoiceTab extends React.Component {
    componentWillUnmount() {
        this.props.store.clear();
    }

    render() {
        const { store } = this.props;

        return <React.Fragment>
        <DocumentTab title="New Invoice" defaultExpanded nopad>
            <DocumentTab.Section title="File Upload">
                <DocumentSubmit receiveUpdates={(({file, status}) => { store.receiveFileUploadUpdate(file, status); })} />
            </DocumentTab.Section>
            <DocumentTab.Section title="Invoice Header">
                <EditProperties 
                    document={store.document} 
                    onUpdateDocument={store.receiveDocumentUpdate} 
                    appData={window.__appData}
                    ignoreValidationForProperties={[
                        'c0a7c606-e7f3-e811-822e-d89ef34a256d',
                        '856183ae-e40a-e911-842c-005056820bd7',
                        '866183ae-e40a-e911-842c-005056820bd7',
                        '876183ae-e40a-e911-842c-005056820bd7',
                        '886183ae-e40a-e911-842c-005056820bd7'
                    ]}
                    lookupCollection={toJS(store.lookupOptions)}
                    customValidationRules={[
                        {
                            field: '947c8c8d-7010-e911-842c-005056820bd7',
                            method: 'isEmpty', 
                            validWhen: false, 
                            message: 'Vendor # is required'
                        }
                    ]}
                    validatorRef={(ref) => { store.propertiesValidator = ref; }}
                    fieldOverrides={[{
                        name: '1d1e005f-7410-e911-842c-005056820bd7',
                        editable: true,
                        order: {
                            editor: 1
                        },
                        visibility: {
                            editor: true
                        }
                    }, {
                        name: '947c8c8d-7010-e911-842c-005056820bd7',
                        editable: true,
                        order: {
                            editor: 2
                        },
                        visibility: {
                            editor: true
                        },
                        lookupPromiseResolver: (field, query) => {
                            const vendorManagementAppId = '66a1f0a7-0bed-e811-822b-d89ef34a256d';
                            const { plantNumber: CompanyCode } = store.document;
            
                            return appGridSvc.search(vendorManagementAppId, {
                                searchParameters: { CompanyCode, 'VendorName OR VendorNumber': query },
                                pageSize: 10,
                                sortings: {
                                    VendorNumber: 'Ascending'
                                }
                            }).then(data => data.records);
                        }
                    }, {
                        name: 'c0a7c606-e7f3-e811-822e-d89ef34a256d',
                        order: {
                            editor: 3
                        }
                    }, {
                        name: '856183ae-e40a-e911-842c-005056820bd7',
                        visibility: {
                            editor: false
                        }
                    }]}
                    currency={store.currency} />
            </DocumentTab.Section>
            <DocumentTab.Section title="Line Items">
                <LineItems
                    lineItems={toJS(store.document.lineItems)} 
                    onUpdateLineItems={store.receiveLineItemsUpdate} 
                    appData={window.__appData}
                    validators={store.lineItemValidators}
                    currency={store.currency} />
            </DocumentTab.Section>
            <Alert />
            <Button bsSize="sm" onClick={store.save} bsStyle="primary" style={{ margin: '1px' }}>
                Save
            </Button>
        </DocumentTab>
    </React.Fragment>
    }
}

export default SubmitInvoiceTab;