import React from 'react';
import { observer, inject } from 'mobx-react';

const ExceptionWidget = inject('store')(observer(({store}) => {
    if (store.exceptionCount === undefined) {
        return null;
    }

    return <div className="exceptions-widget">
        <a href={store.exceptionsUrl}>
            <h5>Exceptions</h5>
            <h3>{ store.exceptionCount }</h3>
        </a>
    </div>
}));

export default ExceptionWidget;