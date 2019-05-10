import React from 'react';
import { Provider, observer } from 'mobx-react';
import { toJS, reaction } from 'mobx';
import { sortBy } from 'lodash';
import Store from './store';

import { Form, FormGroup, ControlLabel, FormControl, Col } from 'react-bootstrap';
import BootstrapSelect from 'bootstrap-select';
import { WithContext as ReactTags } from 'react-tag-input';

import './react-tags.css';

const store = new Store();

const KeyCodes = {
    comma: 188,
    enter: 13,
};

const delimiters = [KeyCodes.enter];

@observer
class MainAPTab extends React.Component {
    constructor(props) {
        super(props);

        this.addPlant = this.addPlant.bind(this);
        this.removePlant = this.removePlant.bind(this);
        this.getPlantSuggestions = this.getPlantSuggestions.bind(this);
        this.getPlantSelections = this.getPlantSelections.bind(this);

        this.disposeRoleChangeReaction = reaction(() => store.apUser.apRole, role => {
            store.apUser.plants.replace([]);
        });
    }

    componentWillUnmount() {
        this.disposeRoleChangeReaction();
    }

    addPlant(newValue) {
        store.apUser.plants.push(newValue);
    }

    removePlant(index) {
        var plant = store.apUser.plants[index];
        store.apUser.plants.remove(plant);
    }

    getPlantSelections() {
        return sortBy(toJS(store.apUser.plants), x => x.name);
    }

    getPlantSuggestions() {
        var currentPlantSelections = this.getPlantSelections().map(x => x.id);

        return toJS(store.plantOptions).filter(option => currentPlantSelections.indexOf(option.id) === -1);
    }

    render() {
        return <Provider store={store}>
            <Form>
                { store.viewName === 'workflow' && <FormGroup controlId="apRole" bsSize="sm">
                    <ControlLabel>Role</ControlLabel>
                    <BootstrapSelect
                        options={toJS(store.roleOptions)}
                        optionValue="code"
                        optionText="name"
                        value={store.apUser.apRole}
                        onChange={(newValue) => { store.apUser.apRole = newValue; }}
                        />
                </FormGroup> }
                {  store.viewName === 'documents' && store.canAssignPlants && <FormGroup controlId="plants" bsSize="sm">
                    <ControlLabel>Plants</ControlLabel>
                    <ReactTags
                        tags={this.getPlantSelections()}
                        inline={true}
                        placeholder="Type to search..."
                        suggestions={this.getPlantSuggestions()}
                        delimiters={delimiters}
                        labelField="name"
                        allowDragDrop={false}
                        handleAddition={this.addPlant}
                        handleDelete={this.removePlant}
                        classNames={{
                            tags: 'form-control plantselector-tags',
                            tagInput: 'plantselector-taginput',
                            tagInputField: 'taginput-ctrl',
                            tag: 'plantselector-tag',
                            remove: 'remove-button'
                        }} />
                </FormGroup>}
            </Form>
        </Provider>
    }
}

export default MainAPTab;