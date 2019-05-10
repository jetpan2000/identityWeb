import React from 'react';
import { inject, observer } from 'mobx-react';
import { Form, FormGroup, FormControl, ControlLabel, HelpBlock, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { find, forEach } from 'lodash';

import HeadlessFormValidator from 'headless-form-validator';
import { validatorHelpers } from 'odiss-form-validator';

import { renderField, DefaultFieldRenderer, FieldRendererHelper } from 'odiss-field-renderer';
const { mapFieldForOdissGrid, mapFieldsWithDynamicItem } = FieldRendererHelper;

const FIELD_PLANT_IDS = ['1d1e005f-7410-e911-842c-005056820bd7', 'fe22dc56-5b13-e911-842c-005056820bd7', '9a1b0475-753b-e911-842e-005056820bd7'];

@inject('store')
@observer
export default class ForwardToOtherPlant extends React.Component {
    constructor(props) {
        super(props);

        this.fieldRenderer = new DefaultFieldRenderer(this, {bsSize: 'sm'});
        this.state = {};

        this.forward = this.forward.bind(this);
        this.reset = this.reset.bind(this);

        this.plantIdField = find(this.props.store.fields, x => FIELD_PLANT_IDS.indexOf(x.name) !== -1);
        this.state[this.plantIdField.name] = undefined;
    }

    get isReadOnly() {
        return this.props.isReadOnly;
    }

    get validationRules() {
        return validatorHelpers.createValidatorRules(this.props.store.appData.Fields.filter(x => x.ID === this.plantIdField.name));
    }

    forward() {
        this.props.store.forwardToOtherPlant(this.state[this.plantIdField.name]);
    }

    reset() {
        var changes = {};
        changes[this.plantIdField.name] = null;

        this.setState(changes);
        this.fieldComponent.getInstance().clear();
        this.validator.reset();
    }

    renderAlert() {
        const { activeForwardAlert } = this.props.store;

        if (!activeForwardAlert || activeForwardAlert.HIDE) {
            return null;
        }

        return <Alert bsStyle={activeForwardAlert.ALERT_TYPE}>
            <FontAwesomeIcon icon={activeForwardAlert.ICON} /> {activeForwardAlert.MESSAGE}
        </Alert>
    }

    render() {
        return <HeadlessFormValidator onSubmit={this.forward} validationRules={this.validationRules} validationObject={this.state} validatorRef={ref => { this.validator = ref; }}>
                {({ onSubmit, getReactBootstrapValidationStateForField, getValidationForField }) => { 
                    const plantFieldName = this.plantIdField.name;
                    const plantValidation = getValidationForField(plantFieldName);
                    const plantValidationState = getReactBootstrapValidationStateForField(plantFieldName);

                    return <Form>
                        <FormGroup validationState={plantValidationState}>
                            <ControlLabel>Enter plant to forward this invoice to</ControlLabel>
                            { renderField(this.plantIdField, this.fieldRenderer, fieldComponent => { this.fieldComponent = fieldComponent; }) }
                            <FormControl.Feedback />
                            {plantValidation && plantValidation.isInvalid && <HelpBlock>{plantValidation.message}</HelpBlock>}
                        </FormGroup>
                        { !this.isReadOnly && <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                            <Button bsSize="sm" bsStyle="primary" style={{marginRight: '1px'}} onClick={onSubmit}>Forward</Button>
                            <Button bsSize="sm" onClick={this.reset}>Reset</Button>
                        </div> }
                        {this.renderAlert()}
                    </Form>
                }
            }
        </HeadlessFormValidator>
    }
}