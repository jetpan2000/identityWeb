import { cloneDeep } from 'lodash';

class ActionResolver {
    constructor(definitions) {
        // definitions is a array of objects of the form { name: string, func: function, canPerform: Promise resolving a boolean, props?: any }
        this.definitions = definitions;
    }

    async resolveDefinitions() {
        // Resolves the definitions and returns a list of actions that can be performed on the system

        var defs = cloneDeep(this.definitions);
        var operations = defs.map(def => new Promise((resolve, reject) => {
            def.canPerform.then(result => {
                def.result = result;
                resolve(result);
            }, (error) => {
                resolve(false);
            });
        }));

        await Promise.all(operations);

        return defs.filter(def => def.result === true).map(def => {
            return {
                name: def.name,
                func: def.func,
                props: def.props
            };
        });
    }
}

export default ActionResolver;