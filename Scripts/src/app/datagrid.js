import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, observer } from 'mobx-react';
import Datagrid, { Store } from 'odiss-app-grid';
//import Datagrid from './data-grid';
//import Store from './data-grid/store';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortAmountUp, faSortAmountDown, faSort, faSearch, faExchangeAlt, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons'

import './styles/custom-react-table.css'

library.add(faSortAmountUp);
library.add(faSortAmountDown);
library.add(faSort);
library.add(faSearch);
library.add(faExchangeAlt);
library.add(faExclamationCircle);
library.add(faCheckCircle);

const Root = observer(() => <Provider store={new Store()}>
    <Datagrid />
</Provider>);

ReactDOM.render(<Root />, document.getElementById('react-root'));