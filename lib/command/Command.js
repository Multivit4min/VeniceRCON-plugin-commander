"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const ArgumentError_1 = require("../exceptions/ArgumentError");
const PlayerNameArgument_1 = require("./arguments/PlayerNameArgument");
const StringArgument_1 = require("./arguments/StringArgument");
class Command {
    constructor(parent) {
        this.props = {
            command: "_",
            help: false,
            scopes: [],
            enabled: true,
            permissionCheck: undefined,
            arguments: [],
            execute: () => null
        };
        this.parent = parent;
    }
    /** sets the command name */
    command(name) {
        this.props.command = name.toLowerCase();
        return this;
    }
    /** sets a help text, should be as minimal as possible */
    help(text) {
        this.props.help = text;
        return this;
    }
    /** sets the required scopes the requester should have */
    requiredScopes(scopes) {
        this.props.scopes = scopes;
        return this;
    }
    /** custom permission check which should return a boolean */
    checkPermissions(cb) {
        this.props.permissionCheck = cb;
        return this;
    }
    async isAllowed(invoker) {
        //permission check with scopes
        if (this.props.scopes.length > 0) {
            const scopes = await this.parent.engine.requestPlayerPermissions(invoker.guid);
            const ok = this.props.scopes.every(scope => scopes.includes(scope));
            if (!ok)
                return false;
        }
        //permission check with custom permission handler
        if (typeof this.props.permissionCheck === "function") {
            const ok = await this.props.permissionCheck({ invoker });
            if (!ok)
                return false;
        }
        return true;
    }
    enable() {
        this.props.enabled = true;
        return this;
    }
    disable() {
        this.props.enabled = false;
        return this;
    }
    argument(cb) {
        const props = {
            battlefield: this.parent.battlefield,
            nameIterator: this.parent.iterators
        };
        this.props.arguments.push(cb({
            player: new PlayerNameArgument_1.PlayerNameArgument(props),
            string: new StringArgument_1.StringArgument(props)
        }));
        return this;
    }
    async validateArguments(props) {
        const args = [...this.props.arguments];
        const response = {};
        let stringArg = props.args;
        while (args.length > 0) {
            const argument = args.shift();
            const name = argument.getName();
            if (!name)
                throw new ArgumentError_1.ArgumentError(`command ${this.props.command} has missing argument name`);
            const [resolved, remaining] = await argument.validate(stringArg, props);
            stringArg = remaining;
            response[name] = resolved;
        }
        return response;
    }
    async handleCommand(props) {
        const args = await this.validateArguments(props);
        if (!this.props.execute)
            return this.parent.logger.warn(`no excecute handler for command "${this.props.command}" found`);
        const { invoker, reply, raw, players } = props;
        await this.props.execute({ invoker, args, reply, raw, players });
    }
    /** execute handler */
    execute(cb) {
        this.props.execute = cb;
        return this;
    }
}
exports.Command = Command;
