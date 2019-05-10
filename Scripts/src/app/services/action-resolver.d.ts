export class ActionResolver {
    constructor(options: Array<ActionDefinition>);
}

// interface ActionDefinition {
//     name: String;
//     func: Function;
//     canPerform: Promise<Boolean>;
// }

interface ActionDefinition extends Action {
    canPerform: Promise<Boolean>;
}

interface Action {
    name: String;
    func: Function;
}