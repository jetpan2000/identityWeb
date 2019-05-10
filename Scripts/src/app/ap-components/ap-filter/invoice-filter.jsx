import React from 'react';
import { observer, inject } from 'mobx-react';
import accounting from 'accounting';
import { toJS } from 'mobx';

@inject('store')
@observer
class InvoiceFilter extends React.Component {
    statusClicked(statusCode, e) {
        e.preventDefault();

        this.props.store.initiateStatusFilterSearch(statusCode);
    }

    render () {
        var statuses = toJS(this.props.store.documentStatusSummary);

        if (statuses.length === 0) {
            return null;
        }

        return <table className="ap-filter-table">
            <thead>
                <tr>
                    <th>Invoice Status</th>
                    <th>Total</th>
                    <th>Total Amount</th>
                </tr>
            </thead>
            <tbody>
            { statuses.map(x => (<tr key={x.statusCode} onClick={this.statusClicked.bind(this, x.statusCode)}>
                <td>{x.status.name}</td>
                <td>{x.count}</td>
                <td>{accounting.formatMoney(x.summedTotalAmount || 0)}</td>
            </tr>)) }
            </tbody>
        </table>
    }
}

export default InvoiceFilter;