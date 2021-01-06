"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Argument = void 0;
class Argument {
    constructor(props) {
        this.battlefield = props.battlefield;
        this.nameIterator = props.nameIterator;
    }
    getName() {
        return this._name;
    }
    name(name) {
        this._name = name;
        return this;
    }
}
exports.Argument = Argument;
