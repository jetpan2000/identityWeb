import React from 'react';
import { inject, observer } from 'mobx-react';

import { Button, ButtonToolbar, ButtonGroup } from 'react-bootstrap';

const ActionButton = ({action}) => <Button
    bsSize="sm" 
    onClick={action.func} 
    bsStyle={action.props.bsStyle}
    style={{ margin: '1px' }}>
    {action.name}
</Button>

@inject('store')
@observer
class InvoiceEditActionBar extends React.Component {
    constructor (props) {
        super(props);
    }

    actionOnClick(action, e) {
        e.preventDefault();

        action.func();
    }

    render() {
        const { actions } = this.props.store;
        var leftActions = actions.filter(x => x.props.left);
        var rightActions = actions.filter(x => x.props.right);

        return <ButtonToolbar>

            <ButtonGroup className="pull-left">
                {leftActions.map(action => <ActionButton key={action.props.key} action={action} />)}
            </ButtonGroup>

            <ButtonGroup className="pull-right">
                {rightActions.map(action => <ActionButton key={action.props.key} action={action} />)}
            </ButtonGroup>

        </ButtonToolbar>
    }
}

export default InvoiceEditActionBar;