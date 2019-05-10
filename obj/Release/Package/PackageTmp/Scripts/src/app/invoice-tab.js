import React from 'react';
import ReactDOM from 'react-dom';
import InvoiceTab from './document-tabs/invoice';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes, faCheckCircle, faExclamationCircle, faCalendar, faSearch, faQuestionCircle, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons'

library.add(faPlus);
library.add(faTimes);
library.add(faQuestionCircle);
library.add(faCloudUploadAlt);
library.add(faCheckCircle);
library.add(faExclamationCircle);
library.add(faCalendar);
library.add(faSearch);

ReactDOM.render(<InvoiceTab />, document.getElementById('react-invoice-tab-root'));