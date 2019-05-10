import React from 'react';
import ReactDOM from 'react-dom';

import Login from 'odiss-login';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronCircleLeft, faCheckCircle, faExclamationCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronCircleLeft);
library.add(faCheckCircle);
library.add(faExclamationCircle);
library.add(faExclamationTriangle);

ReactDOM.render(<Login />, document.getElementById('react-root'));