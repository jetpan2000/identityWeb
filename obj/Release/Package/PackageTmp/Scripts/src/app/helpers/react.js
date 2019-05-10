import React from 'react';
import { find } from 'lodash';

export function getChildOfComponentType(children, componentType) {
    return find(React.Children.toArray(children), x => x && x.type === componentType);
}