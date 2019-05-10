import React from 'react';
import { Provider } from 'mobx-react';

import Store from './apfilter-store';
import './filter.scss';

import InvoiceFilter from './invoice-filter';
import ExceptionWidget from './exception-widget';

const store = new Store();
store.loadData();

class Filter extends React.Component {
    render() {
        return <Provider store={store}>
            <div className="filters-container">
                <InvoiceFilter />
                <ExceptionWidget />
            </div>
        </Provider>
    }
}

export default Filter;