import moment from 'moment';

export function formatDateTime(dateTime) {
    return moment(dateTime).format('MMMM Do YYYY [at] h:mm:ss a [(EST)]');
}

export function formatDatePicker(dateTime) {
    return moment(dateTime).format( 'DD MMM YYYY');
}