import React from 'react';
import { Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AlertHeadlessHeadless from 'odiss-alert-headless';
import { inject, observer } from 'mobx-react';

/**
 * @param {{submissionAlert: SubmissionAlert, validationStateFromStore: ValidationState}} options
 */
const getIconForState = ({submissionAlert, validationStateFromStore}) => {
    switch (submissionAlert) {
        case 'SUCCESS': return 'check-circle';
        case 'SERVER_ERROR': return 'exclamation-circle';
    }

    if (validationStateFromStore !== 'VALID') {
        return 'exclamation-triangle';
    }

    return null;
}

const AlertView = inject('store')(observer(({store: { submissionAlert, validationState: validationStateFromStore }}) => 
    <AlertHeadlessHeadless
        visibleWhen={({successState, validationState}) => successState !== 'NONE' || validationState !== 'VALID'}
        successState={submissionAlert}
        successWhen={(successState) => successState === 'SUCCESS'}
        validationState={validationStateFromStore}
        validWhen={(validationState) => validationState === 'VALID'}
        timeoutSeconds={null}
        messages={{
            success: 'Document has been submitted.',
            error: 'Could not submit document. Try again later.',
            invalid: ({successState, validationState}) => {
                if (validationState === 'INVALID') {
                    return 'Please check your input';
                }
                else if (validationState === 'FILE_MISSING') {
                    return 'You must upload file';
                }
            }
        }}
    >
        {({ visible, state, text, bsStyle }) => {
            if (!visible || !state) {
                return null;
            }

            return <Alert bsStyle={bsStyle}>
                <FontAwesomeIcon icon={getIconForState({submissionAlert, validationStateFromStore})} /> {text}
            </Alert>
        }}
    </AlertHeadlessHeadless>
));

export default AlertView;