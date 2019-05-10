import React from 'react';
import { toJS } from 'mobx';
import { observer, inject } from 'mobx-react';
import { ListGroup, ListGroupItem, Pagination, Button } from 'react-bootstrap';
import { find, chain, orderBy, range, chunk, extend, camelCase } from 'lodash';
import { formatDateTime } from '../../utilities/datetime-formatter';
import diff from 'deep-diff';
import humanizer from 'humanize-string';
import capitalize from 'capitalize';
import { isUUID } from 'validator';
import { isBlank } from 'string-helper';

const PAGE_SIZE = 10;

var statusOptions = {};
const fieldsLookup = [...window.__appData.Fields, ...window.__appData.FieldsItems];

function buildChangeDescription(obj) {
    var action = '';
    var changeDescription = '';

    var changedProperty = `<b>${humanizeField(obj.path[0])}</b>`;

    if (obj.path.length > 1) {
        changedProperty += ` (item <b>#${obj.path[1] + 1}</b>, field <b>${humanizeField(obj.path[2])}</b>)`;
    }

    switch(obj.kind) {
        case 'E':  {
            action = 'changed'; 
            changeDescription = `from <b>${!isBlank(obj.lhs) ? obj.lhs : 'blank'}</b> to <b>${!isBlank(obj.rhs) ? obj.rhs : 'blank'}</b>`;
            break;
        }
        case 'D': {
            action = 'deleted';
            break;
        }
        case 'A': {
            if (obj.item.kind === 'D') {
                return `${changedProperty} (item <b>#${obj.index + 1}</b>) was deleted`;
            }
            else if (obj.item.kind === 'N') {
                return `${changedProperty} has new row added`;
            }
        }
    }

    return `${changedProperty} was ${action} ${changeDescription}`;
}

function humanizeField(fieldName) {
    var { Name } = find(fieldsLookup, x => camelCase(x.MapTo) === fieldName) || {};

    return Name || capitalize.words(humanizer(fieldName));
}

const DiffViewer = ({ diffObj, lhs, rhs, fieldsIgnore, ignoreGuids }) => {
    var obj = diffObj || diff(lhs, rhs);
    obj = orderBy(obj, x => (x.index || (x.path && x.path.length >= 1 && x.path[1])));

    if (!obj || obj.length === 0) {
        return null;
    }

    return <ul style={{marginTop: '20px'}}>
        { obj.map((diffObj, i) => {
            // TODO - Find a way to refactor the logic below so it's more "general"
            // Needs to be done when extracting this component into a Odiss Component in its own NPM package
            // Good amount of spec tests need to be written for it as well.
            // - A pattern that I'm sensing now is that the last index of path is the property name always.. spec tests need to confirm it
            if ((diffObj.path.length === 1 && fieldsIgnore.indexOf(diffObj.path[0]) > -1) || (diffObj.path.length > 2 && fieldsIgnore.indexOf(diffObj.path[2]) > -1)) {
                return null;
            }

            if (ignoreGuids && (typeof(diffObj.lhs) === 'string' && isUUID(diffObj.lhs)) || (typeof(diffObj.rhs) === 'string' && isUUID(diffObj.rhs))) {
                return null;
            }

            return <li key={i} dangerouslySetInnerHTML={{ __html: buildChangeDescription(diffObj) }}>
            </li>
        }) }
    </ul>
}

const PropertyViewer = ({ diffObj: item, fields }) => <ul style={{marginTop: '20px'}}>
    {fields.map(fieldName => <li key={fieldName}><b>{humanizeField(fieldName)}</b>: {item[fieldName]}</li>)}
</ul>


const ACTIONS = {
    UPDATED: {
        text: 'Updated',
        diffObjSelector: (diffObj) => diffObj,
        fieldsIgnore: ['isCredit'],
        ComponentToRender: DiffViewer
    },
    SUPPORTING_DOC_UPLOADED: { 
        text: 'Supporting Document Uploaded',
        diffObjSelector: (diffObj) => diffObj[0].item.rhs,
        fields: [
            'originalFilename',
            'description'
        ],
        ComponentToRender: PropertyViewer
    }
};

@inject("store")
@observer
class InvoiceHistoryItem extends React.Component {

    constructor (props) {
        super(props);

        this.calcAction = this.calcAction.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onRevertClick = this.onRevertClick.bind(this);
        this.state = {
            showDiff: false
        };
    }

    calcAction() {
        const { item: { newState, oldState } } = this.props;
        const diffObj = diff(oldState, newState);

        if (!newState) {
            return {
                actionText: null,
                viewerElement: null
            };
        }

        if (!oldState) {
            return this.buildActionResult({text: statusOptions[newState.invoiceStatusCode]});
        }

        if (newState.invoiceStatusCode !== oldState.invoiceStatusCode) {
            if (newState.invoiceStatusCode === 'PendingApproval' && oldState.invoiceStatusCode === 'Archived') {
                return this.buildActionResult({text: 'Rejection Reverted'});
            }
            else {
                return this.buildActionResult({text: statusOptions[newState.invoiceStatusCode]});
            }
        }
        else if (diffObj && diffObj.length === 1 && diffObj[0].path[0] === 'supportingDocuments' && diffObj[0].item && diffObj[0].item.kind === 'N') {
            return this.buildActionResult(ACTIONS.SUPPORTING_DOC_UPLOADED, diffObj);
        }
        else {
            return this.buildActionResult(ACTIONS.UPDATED, diffObj);
        }
    }

    buildActionResult({text, ComponentToRender = null, fields = [], fieldsIgnore = [], ignoreGuids = true, diffObjSelector = (diffObj) => diffObj}, diffObj) {
        return {
            actionText: text,
            viewerElement: ComponentToRender && <ComponentToRender diffObj={diffObjSelector(diffObj)} {...{ignoreGuids, fields, fieldsIgnore: [...fieldsIgnore, ...['guid', 'id']]}} />
        };
    }

    onClick(e) {
        e.preventDefault();

        this.setState({
            showDiff: !this.state.showDiff
        });
    }

    onRevertClick(e) {
        e.preventDefault();

        const { store } = this.props;

        if (!store.canRevertHistoryItem) {
            return;
        }

        store.document = extend(store.document, this.props.item.oldState);
        store.userCanEditDocument = true;
        store.showForwardingTab = false;
        store.save();
    }

    render () {
        const { item } = this.props;
        const { actionText, viewerElement, skip } = this.calcAction();

        return <ListGroupItem onClick={this.onClick}>
            {actionText} by {item.updatedBy.username} on {formatDateTime(item.updatedAt)}
            { this.state.showDiff && <div>
                {viewerElement}
            </div> }
            { this.props.store.canRevertHistoryItem && <Button bsSize="sm" onClick={this.onRevertClick} className="pull-right">Revert</Button> }
        </ListGroupItem>
    }
}

@inject("store")
@observer
class InvoiceHistory extends React.Component {
    constructor(props) {
        super(props);

        this.paginateClick = this.paginateClick.bind(this);

        this.state = {
            currentPage: 1
        };
    }

    componentWillUpdate() {
        const { store } = this.props;
        var field = find(store.appData.Fields, x => x.MapTo === 'InvoiceStatusCode');
        var options = toJS(store.lookupOptions.get(field.ID));

        statusOptions = chain(options).keyBy('code').mapValues('name').value();
    }

    paginateClick(page, e) {
        e.preventDefault();

        this.setState({
            currentPage: page
        });
    }

    render () {
        if (this.props.store.history.length === 0) {
            return <div>No changes found</div>;
        }

        var paginatedList = chunk(toJS(this.props.store.history), PAGE_SIZE)[this.state.currentPage - 1];
        var numberOfPages = this.props.store.history.length / PAGE_SIZE + 1;

        return <React.Fragment>
            <ListGroup>
                { paginatedList.map(item => (<InvoiceHistoryItem key={item.id} item={item} />)) }
            </ListGroup>
            { numberOfPages > 1 && <Pagination bsSize="small">
                { range(1, numberOfPages).map(page => {
                    return <Pagination.Item key={page} onClick={this.paginateClick.bind(this, page)} active={page === this.state.currentPage}>{page}</Pagination.Item>
                })}
                </Pagination>
            }
        </React.Fragment>
    }
}

export default InvoiceHistory;