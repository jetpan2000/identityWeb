import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const iconProps = {
    color: 'black',
    style: {
        marginRight: '3px'
    }
};

const VendorName = ({vendorName, isConfidential, isVendorLocked}) => <span>
    {isConfidential && <FontAwesomeIcon icon="user-secret" {...iconProps} />}
    {isVendorLocked && <FontAwesomeIcon icon="lock" {...iconProps} />}
    {vendorName}
</span>

export default VendorName;