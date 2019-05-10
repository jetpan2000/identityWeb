import React from 'react';
import Dropzone from 'react-dropzone';
import { FormControl, Button, Alert, Table } from 'react-bootstrap';
import { isEmpty } from 'validator';
import { inject, observer } from 'mobx-react';
import DocumentTab, { DocumentTabForm } from 'odiss-document-tab';
import OutsideRender from 'react-outside-render';
import DelayRender from 'react-delay-render';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as documentsSvc from '../../services/api/documents';
import $ from 'jquery';

const ALERT = {
    NONE: {
        HIDE: true,
        MESSAGE: '',
        ICON: '',
        ALERT_TYPE: ''
    },
    INFO: {
        MESSAGE: 'Upload a file by dropping in the box or click the box to select the file on your computer.',
        ICON: 'question-circle',
        ALERT_TYPE: 'info'
    },
    SUCCESS: {
        MESSAGE: 'Supporting Document has been successfully uploaded.',
        ICON: 'check-circle',
        ALERT_TYPE: 'success'
    },
    ERROR: {
        MESSAGE: 'Error while uploading Supporting Document. Try again later.',
        ICON: 'exclamation-circle',
        ALERT_TYPE: 'danger'
    },
    DROP_REJECT: {
        MESSAGE: 'File not allowed. Please ensure that the file format is PDF and that it is not larger than 50 MB.',
        ICON: 'exclamation-circle',
        ALERT_TYPE: 'danger'
    }
};

const CloseButton = inject('store')(observer(({ store }) =>
    <DelayRender delay={0}>
        <OutsideRender targetSelector={$('#modDocument .modal-footer button', parent.document)} insertPosition="before" containerClassName="close-button-container">
            { store.isShowingSupportingDocument && <Button 
                bsStyle="primary" 
                onClick={() => { store.closeSupportingDocument(); }}
                >
                Close Supporting Document
            </Button> }
        </OutsideRender>
    </DelayRender>
));

class SupportingDocuments extends React.Component {
    render() {
        return <React.Fragment>
            <DocumentList />
            <DocumentUpload />
            <CloseButton />
        </React.Fragment>;
    }
}

@inject('store')
@observer
class DocumentList extends React.Component {
    constructor(props) {
        super(props);
    }

    viewDocument(document, e) {
        e.preventDefault();
        
        this.props.store.showSupportingDocument(document.guid);
    }

    render() {
        const { store } = this.props;
        const { document } = store;

        if (!document) {
            return null;
        }

        const { supportingDocuments } = document;

        if (supportingDocuments.length === 0) {
            return null;
        }

        return <Table striped>
            <thead>
                <tr>
                    <th></th>
                    <th>Description</th>
                    <th>Filename</th>
                </tr>
            </thead>
            <tbody>
                { supportingDocuments.map(supportingDocument => (<tr key={supportingDocument.guid}>
                    <td><a href="#" onClick={this.viewDocument.bind(this, supportingDocument)}>View</a></td>
                    <td>{supportingDocument.description}</td>
                    <td>{supportingDocument.originalFilename}</td>
                </tr>)) }
            </tbody>
        </Table>;
    }
}

@inject('store')
class DocumentUpload extends React.Component {
    constructor(props) {
        super(props);

        this.validationRules = [{
            field: 'description',
            method: isEmpty,
            validWhen: false,
            message: 'Please enter description'
        }];

        this.state = {
            file: null,
            activeAlert: ALERT.INFO,
            description: '',
            isLoading: false
        };

        this.submit = this.submit.bind(this);
    }

    async submit(e, onSuccess, onError, onDone) {
        e.preventDefault();

        this.setState({
            isLoading: true
        });

        try {
            await documentsSvc.uploadSupportingDocument(this.props.store.document.guid, this.state.description, this.state.file);

            this.setState({
                activeAlert: ALERT.SUCCESS,
                file: null,
                description: ''
            });

            onSuccess();
        }
        catch (exception) {
            this.setState({
                activeAlert: ALERT.ERROR
            });

            onError();
        }
        finally {
            this.props.store.reload();

            this.setState({
                isLoading: false
            });

            onDone();
        }
    }

    onFilesDropped(files) {
        var file = files[0]; // no multiples
        this.setState({ 
            file, 
            activeAlert: ALERT.NONE
        });
    }

    onDropRejected(arg1, arg2, arg3) {
        this.setState({
            file: null,
            activeAlert: ALERT.DROP_REJECT
        });
    }

    renderAlert() {
        const { activeAlert } = this.state;

        if (activeAlert.HIDE) {
            return null;
        }

        return <Alert bsStyle={activeAlert.ALERT_TYPE}>
            <FontAwesomeIcon icon={activeAlert.ICON} /> {activeAlert.MESSAGE}
        </Alert>
    }

    render() {
        return <React.Fragment>
            <DocumentTab.Section title="File Upload">
                <Dropzone onDropAccepted={this.onFilesDropped.bind(this)} onDropRejected={this.onDropRejected.bind(this)} multiple={false} accept="application/pdf" maxSize={50 * 1024 * 1024} style={{ textAlign: 'center', verticalAlign: 'middle', lineHeight: '50px', border: '4px', borderStyle: 'dotted' }}>
                    <span style={{ display: 'block', fontSize: '20px' }}>
                        {!this.state.file && 'Click to upload file'}
                        {this.state.file && 'Click to replace file'}
                    </span>
                    <FontAwesomeIcon icon="cloud-upload-alt" size="4x" />
                </Dropzone>
            </DocumentTab.Section>
            <DocumentTab.Section title="File Properties">
                <DocumentTabForm validationRules={this.validationRules} validationObject={this.state} onSubmit={this.submit} isLoading={this.state.isLoading}>
                    <DocumentTabForm.Field controlId="filename">
                        <DocumentTabForm.Label>Filename</DocumentTabForm.Label>
                        <DocumentTabForm.Control>
                            <FormControl type="text" placeholder="Filename" defaultValue={this.state.file && this.state.file.name} readOnly/>
                        </DocumentTabForm.Control>
                    </DocumentTabForm.Field>
                    <DocumentTabForm.Field controlId="description">
                        <DocumentTabForm.Label>Description</DocumentTabForm.Label>
                        <DocumentTabForm.Control>
                            <FormControl type="text" placeholder="Description" value={this.state.description} onChange={(e) => { this.setState({description: e.target.value}); }} readOnly={!this.state.file} />
                        </DocumentTabForm.Control>
                    </DocumentTabForm.Field>
                    <DocumentTabForm.Footer>
                        {this.state.file && <Button bsSize="sm" bsStyle="primary" type="submit">Submit</Button>}
                    </DocumentTabForm.Footer>
                </DocumentTabForm>
            </DocumentTab.Section>
            {this.renderAlert()}
        </React.Fragment>
    }
}

export default SupportingDocuments;