"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringArgument = void 0;
const Argument_1 = require("./Argument");
class StringArgument extends Argument_1.Argument {
    async validate(args) {
        return [args, ""];
    }
}
exports.StringArgument = StringArgument;
