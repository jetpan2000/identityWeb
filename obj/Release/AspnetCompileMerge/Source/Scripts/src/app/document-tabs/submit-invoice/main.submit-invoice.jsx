import React from 'react';
import { observer, Provider } from 'mobx-react';
import { toJS, computed } from 'mobx';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import DocumentViewer from 'odiss5-document-viewer';

import SubmitInvoiceTab from './tab.submit-invoice';
import SubmitInvoiceStore from './store.tab.submit-invoice';
import './styles.submit-invoice.scss';

const store = new SubmitInvoiceStore();

@observer
class SubmitInvoiceMain extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showModal: false
        };

        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalHide = this.handleModalHide.bind(this);
    }

    handleModalShow() {
        this.setState({ showModal: true });
    }

    handleModalHide() {
        this.setState({ showModal: false });
    }

    render() {
        return <Provider store={store}>
            <React.Fragment>
                <Button className="submit-document-btn" type="button" onClick={this.handleModalShow}>
                    Submit Document <FontAwesomeIcon className="submit-document-icon" icon="cloud-upload-alt" />
                </Button>
                <Modal show={this.state.showModal} onHide={this.handleModalHide} dialogClassName="modal-dialog-full">
                    <Modal.Header closeButton closeLabel="Close">
                        <Modal.Title>Submit Invoice</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-content-full-body">
                        <DocumentViewer submitUrl={window.__submitUrl} file={store.file} sidebarSize="large">
                            <SubmitInvoiceTab />
                        </DocumentViewer>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.handleModalHide} bsStyle="danger">Close</Button>
                    </Modal.Footer>
                </Modal>
            </React.Fragment>
        </Provider>
    }
}

export default SubmitInvoiceMain;