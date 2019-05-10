/**
 * Document Invoice
 * @typedef DocumentInvoice
 * @property {Date} captureDate
 * @property {Guid} guid
 * @property {String} fileName
 * @property {Boolean} isConfidential
 * @property {Array<DocumentInvoiceLineItem>} lineItems
 */

/**
 * Document Invoice Line Item
 * @typedef DocumentInvoiceLineItem
 * @property {Number} quantity
 * @property {Number} unitPrice
 * @property {Number} totalAmount
 */

/**
 * Currency
 * @typedef Currency
 * @property {string} code - Two digit currency code (CA for Canada, US for USA, etc.)
 * @property {string} description
 * @property {string} name - Name of the currency
 * @property {Number} order - Number to indicate the order to display the currency (for ordered lists)
 * @property {string} symbol - Currency Symbol ('$' for dollars)
 */

/**
 * Submission Alert
 * @typedef {('NONE'|'SUCCESS'|'SERVER_ERROR')} SubmissionAlert
 */

/**
 * Validation State
 * @typedef {('VALID'|'INVALID'|'FILE_MISSING')} ValidationState
 */

/**
 * File Upload Status
 * @typedef {('READY'|'SUCCESS'|'ERROR'|'DROP_REJECT')} FileUploadStatus
 */