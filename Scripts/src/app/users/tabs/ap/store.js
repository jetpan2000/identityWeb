import { observable, action, reaction, toJS, computed } from 'mobx';
import * as apRolesSvc from '../../../services/api/ap-roles';
import * as apUsersSvc from '../../../services/api/ap-users';
import * as plantSvc from '../../../services/api/plants';
import { makeEditFormDirty } from '../../helpers';

var disposeRoleReaction = () => { };
var disposePlantsReaction = () => { };

class APTabStore {
    constructor() {
        this.getUserPostal = this.getUserPostal.bind(this);
        this.saveCompletedPostal = this.saveCompletedPostal.bind(this);
        this.receiveUserId = this.receiveUserId.bind(this);
        this.setAPView = this.setAPView.bind(this);

        window.postal.subscribe({
            channel: 'app',
            topic: 'users.edit.getUser',
            callback: this.getUserPostal
        });

        window.postal.subscribe({
            channel: 'app',
            topic: 'users.edit.saveCompleted',
            callback: this.saveCompletedPostal
        });

        window.postal.subscribe({
            channel: 'app',
            topic: 'users.add',
            callback: this.getUserPostal
        });

        window.postal.subscribe({
            channel: 'app',
            topic: 'users.setAPView',
            callback: this.setAPView
        })

        this.loadOptions();
    }

    @observable roleOptions = [];
    @observable plantOptions = [];
    @observable apUser = {
        userId: undefined,
        apRole: undefined,
        plants: []
    };
    @observable viewName = null;

    @computed get canAssignPlants() {
        return true;
        //return this.apUser.apRole !== 'HeadOfficeAP';
    }

    setAPView(viewName) {
        this.viewName = viewName;
    }

    async getUserPostal(data) {
        if (data.User.Type === 0) {
            this.receiveUserId(data && data.User.ID);
        }
    }

    async receiveUserId(userId) {
        if (this.apUser.userId == userId) {
            return;
        }

        disposeRoleReaction();
        disposePlantsReaction();
        this.apUser.userId = userId;

        try {
            var user = await apUsersSvc.get(this.apUser.userId);

            this.apUser.apRole = user.apRole;
            this.apUser.plants = user.plants;
        }
        catch (e) {
            this.apUser.apRole = undefined;
            this.apUser.plants = [];
            this.autoAssignRole();
        }
        finally {
            disposeRoleReaction = reaction(() => this.apUser.apRole, (role) => {
                makeEditFormDirty();
            });

            disposePlantsReaction = reaction(() => this.apUser.plants.length, (length) => {
                makeEditFormDirty();
            });
        }
    }

    async saveCompletedPostal(data) {
        if (data.user.Type === 0 || data.user.Type === 2) {
            // Only if a regular user or administrator
            this.apUser.userId = data.saveResult.id;
            await apUsersSvc.save(toJS(this.apUser));
        }
    }

    @action async loadOptions() {
        this.roleOptions = await apRolesSvc.getAll();
        this.plantOptions = await plantSvc.getAll();

        this.autoAssignRole();
    }

    @action reset() {
    }

    autoAssignRole() {
        if (!this.apUser.apRole) {
            this.apUser.apRole = this.roleOptions[0].code;
        }
    }
}

export default APTabStore;