import React from 'react';
import ReactDOM from 'react-dom';
import Vendors from './vendors';

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

ReactDOM.render(<Vendors />, document.getElementById('react-root'));