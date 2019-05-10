import React from 'react';
import ReactDOM from 'react-dom';

import Main from './main.submit-invoice';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes, faCheckCircle, faExclamationCircle, faExclamationTriangle, faCalendar, faSearch, faQuestionCircle, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons'

library.add(faPlus);
library.add(faTimes);
library.add(faQuestionCircle);
library.add(faCloudUploadAlt);
library.add(faCheckCircle);
library.add(faExclamationCircle);
library.add(faExclamationTriangle);
library.add(faCalendar);
library.add(faSearch);

const element = document.getElementById('react-submit-invoice-root');

if (element.dataset.show === 'true') {
    ReactDOM.render(<Main />, element);
}