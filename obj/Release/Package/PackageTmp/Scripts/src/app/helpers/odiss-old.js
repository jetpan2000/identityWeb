import $ from 'jquery';

// Document Viewer
const FORM_JQUERY = $('#tmpForm');
const HID_DOC_JQUERY = $('#hidDoc');
const HID_EXTRA_JQUERY = $('#hidExtra');

// Odiss Viewer
// const ODISS_FORM_JQUERY = $('#iDocument');
// const ODISS_HID_DOC_JQUERY = $('#hidDoc');

export function submitDocumentViewer(documentId) {
    HID_DOC_JQUERY.val(documentId);
    FORM_JQUERY.submit();
}

export function changeDocumentInViewer(url) {
    window.OdissViewerBase.loadCustomViewer(url, '{}');
}

export function changeDocumentToOriginalInViewer() {
    window.OdissViewerBase.reloadOriginalViewer();
}

// export function submitOdissViewer(documentId) {

// }