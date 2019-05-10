const ALERT = {
    NONE: {
        HIDE: true,
        CODE: 'NONE',
        MESSAGE: '',
        ICON: '',
        ALERT_TYPE: ''
    },
    SUCCESS: {
        MESSAGE: 'Save completed.',
        CODE: 'SUCCESS',
        ICON: 'check-circle',
        ALERT_TYPE: 'success'
    },
    ERROR: {
        MESSAGE: 'Error while saving changes. Try again later.',
        CODE: 'ERROR',
        ICON: 'exclamation-circle',
        ALERT_TYPE: 'danger'
    },
    PLANT_FORWARD_SUCCCES: {
        MESSAGE: 'Invoice has been forwarded to another plant.',
        CODE: 'PLANT_FORWARD_SUCCESS',
        ICON: 'check-circle',
        ALERT_TYPE: 'success'
    },
    PLANT_FORWARD_ERROR: {
        MESSAGE: 'Error while forwarding plant.',
        CODE: 'PLANT_FORWARD_ERROR',
        ICON: 'exclamation-circle',
        ALERT_TYPE: 'danger'
    },
    VALIDATION_ERROR: {
        MESSAGE: 'Please check your input',
        CODE: 'VALIDATION_ERROR',
        ICON: 'exclamation-circle',
        ALERT_TYPE: 'danger'
    }
};

export default ALERT;