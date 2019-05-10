import React from 'react';
import { observer } from 'mobx-react';
import BootstrapSelect from 'bootstrap-select';

const DebitCredit = ({document, ...otherProps}) => {
    const options = [{
        text: 'Debit',
        value: false
    }, {
        text: 'Credit',
        value: true
    }];
    
    const onChange = (newValue) => {
        var boolValue = undefined;
    
        switch (newValue) {
            case 'true': boolValue = true; break;
            case 'false': boolValue = false; break;
            default: boolValue = undefined; break;
        }
    
        document.isCredit = boolValue;
    
        if (boolValue === null || boolValue === undefined) {
            document.debitCredit = null;
        }
        else {
            document.debitCredit = boolValue ? 'C' : '';
        }
    }

    return <BootstrapSelect value={document.isCredit} options={options} optionValue="value" optionText="text" onChange={onChange} {...otherProps} />;
};

export default observer(DebitCredit);