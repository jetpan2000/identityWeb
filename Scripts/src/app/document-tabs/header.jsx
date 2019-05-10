import React from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import { ButtonToolbar, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import BootstrapConfirm from 'bootstrap-confirm';
import * as OdissOld from '../helpers/odiss-old';

import './header.scss';

@observer
class ModalHeader extends React.Component {
    constructor(props) {
        super(props);

        this.nextClick = this.nextClick.bind(this);
        this.prevClick = this.prevClick.bind(this);
        this.refreshNavStates = this.updateNavStates.bind(this);

        window.postal.subscribe({
            channel: 'app',
            topic: 'document.open',
            callback: ({ dataId, dataExtra }, envelope) => {
                this.documentId = dataId;
                this.updateNavStates();
            }
        });

        this.state = {
            canGoPrev: !!this.prevDocumentId,
            canGoNext: !!this.nextDocumentId,
            showNavWarning: false,
            documentId: null
        };
    }

    documentId = null;

    storedNavFunction = () => {}; // Noop initially

    get datagrid() {
        return window.OdissApp && window.OdissApp.TB;
    }

    // Document Ids currently visible in grid
    get availableDocumentIds() {
        if (!this.datagrid) {
            return [];
        }

        return this.datagrid.data().filter(d => d instanceof Array).map(d => d[0]);
    }

    get documentStore () {
        return this.documentFrame.contentWindow.__documentTabStore; 
    }

    get nextDocumentId() {
        var currentIndex = this.availableDocumentIds.indexOf(this.documentId);

        if (currentIndex >= this.availableDocumentIds.length) {
            return null;
        }

        return this.availableDocumentIds[currentIndex + 1];
    }

    get prevDocumentId() {
        var currentIndex = this.availableDocumentIds.indexOf(this.documentId);

        if (currentIndex <= 0) {
            return null;
        }

        return this.availableDocumentIds[currentIndex - 1];
    }

    get documentFrame() {
        return document.getElementById('iViewerBase');
    }

    get isDirty() {
        return !!(this.documentStore && this.documentStore.isDirty);
    }

    updateNavStates() {
        this.setState({
            canGoPrev: !!this.prevDocumentId,
            canGoNext: !!this.nextDocumentId,
            showNavWarning: false
        });
    }

    navigateTo(documentId) {
        const funcInner = () => {
            OdissOld.submitDocumentViewer(documentId);

            this.documentId = documentId;
            this.updateNavStates();
        };

        if (this.isDirty) {
            this.storedNavFunction = funcInner;

            this.setState({
                showNavWarning: true
            });
        }
        else {
            funcInner();
        }
    }

    nextClick(e) {
        e.preventDefault();

        this.navigateTo(this.nextDocumentId);
    }

    prevClick(e) {
        e.preventDefault();

        this.navigateTo(this.prevDocumentId);
    }

    render() {
        const boolVisibility = boolValue => boolValue ? 'visible' : 'hidden';

        return <React.Fragment>
            <ButtonToolbar {...this.props}>
                <Button bsStyle="primary" onClick={this.prevClick} style={{ visibility: boolVisibility(this.state.canGoPrev) }}>
                    <FontAwesomeIcon icon="long-arrow-alt-left" /> Previous
                </Button>
                <Button bsStyle="primary" onClick={this.nextClick} style={{ visibility: boolVisibility(this.state.canGoNext) }}>
                    Next <FontAwesomeIcon icon="long-arrow-alt-right" />
                </Button>
            </ButtonToolbar>
            <BootstrapConfirm
                show={this.isDirty && this.state.showNavWarning}
                title="Warning"
                message="You have made changes to the current document. If you don't save your changes first then they will be lost. Are you sure that you want to proceed?"
                yesAction={this.storedNavFunction}
                onClose={() => { this.setState({showNavWarning: false}); }}
             />
        </React.Fragment>
    }
}

export default ModalHeader;