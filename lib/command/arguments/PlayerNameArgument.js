"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerNameArgument = void 0;
const NameIterator_1 = require("../../util/NameIterator");
const Argument_1 = require("./Argument");
class PlayerNameArgument extends Argument_1.Argument {
    async validate(args, props) {
        const invoker = props.invoker.name;
        const splitted = args.split(" ");
        const match = splitted.shift();
        const iterator = new NameIterator_1.NameIterator({
            battlefield: this.battlefield, invoker, playerList: props.players, match
        });
        this.nameIterator[invoker] = iterator;
        await iterator.start();
        try {
            return [await iterator.waitForPlayer(), splitted.join(" ")];
        }
        catch (e) {
            delete this.nameIterator[invoker];
            throw e;
        }
    }
}
exports.PlayerNameArgument = PlayerNameArgument;
