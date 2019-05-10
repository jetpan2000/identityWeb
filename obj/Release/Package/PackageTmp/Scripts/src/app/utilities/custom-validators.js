import { isAlphanumeric, isAlpha, isEmpty } from 'validator';

export function isAlphanumericAllowSpaces(input) {
    return input.split(' ').every(word => isAlphanumeric(word) || isEmpty(word));
}

export function isAlphaAllowSpaces(input) {
    return input.split(' ').every(word => isAlpha(word) || isEmpty(word));
}