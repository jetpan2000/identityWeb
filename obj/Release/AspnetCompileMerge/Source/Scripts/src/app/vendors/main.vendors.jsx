import React from 'react';
import { reaction } from 'mobx';
import { Provider, observer } from 'mobx-react';
import Datagrid, { Store } from 'odiss-app-grid';
import { assign, clone, find } from 'lodash';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortAmountUp, faSortAmountDown, faSort, faSearch, faExchangeAlt, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

library.add(faSortAmountUp);
library.add(faSortAmountDown);
library.add(faSort);
library.add(faSearch);
library.add(faExchangeAlt);
library.add(faExclamationCircle);
library.add(faCheckCircle);

const fieldOverrides = [
    // Add unconditional overrides here as needed
];

var store = new Store();

var fields = {
    vendorId: find(store.fields, x => x.mapTo ==='VendorId')
};

@observer
class Main extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            canLockVendor: false,
            canSetVendorToConfidential: false
        }

        reaction(() => this.vendor, vendor => {
            const { principalCanLock, principalCanMakeConfidential } = vendor || {};

            this.setState({
                canLockVendor: principalCanLock,
                canSetVendorToConfidential: principalCanMakeConfidential
            });
        });
    }

    componentDidMount() {
        this.resolvePermission();
    }

    resolvePermission() {
    }

    get vendor() {
        if (!store.editItem) {
            return null;
        }

        var keys = {
            vendorId: store.editItem[fields.vendorId.name]
        }

        return find(store.data, x => x.vendorId === keys.vendorId);
    }

    render() {
        var overrides = clone(fieldOverrides);

        if (this.state.canLockVendor) {
            overrides.push({
                name: '9fb7bc08-392e-e911-842e-005056820bd7',
                editable: true
            });
        }

        if (this.state.canSetVendorToConfidential) {
            overrides.push({
                name: '6068d0cf-eb2b-e911-842d-005056820bd7',
                editable: true
            });
        }

        return <Provider store={store}>
            <Datagrid fieldOverrides={overrides} />
        </Provider>;
    }
}

export default Main;