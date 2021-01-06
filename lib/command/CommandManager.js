"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandManager = void 0;
const NameIteratorError_1 = require("../exceptions/NameIteratorError");
const NameIteratorTimeoutError_1 = require("../exceptions/NameIteratorTimeoutError");
const NameIterator_1 = require("../util/NameIterator");
const Command_1 = require("./Command");
class CommandManager {
    constructor({ engine, battlefield, config, logger }) {
        this.commands = [];
        this.iterators = {};
        this.engine = engine;
        this.battlefield = battlefield;
        this.logger = logger;
        this.prefix = config.prefix.length > 0 ? config.prefix : "/";
        this.logger.info(`using "${this.prefix}" as command prefix`);
        this.battlefield.on("chat", this.onChat.bind(this));
        this.registerDefaultCommands();
    }
    registerDefaultCommands() {
        //register yes command in order to search for players
        this.add("yes").execute(async ({ reply, invoker }) => {
            const iterator = this.iterators[invoker.name];
            if (!(iterator instanceof NameIterator_1.NameIterator))
                return reply("no request found");
            await iterator.confirm();
        });
        //register no command in order to search for players
        this.add("no").execute(async ({ reply, invoker }) => {
            const iterator = this.iterators[invoker.name];
            if (!(iterator instanceof NameIterator_1.NameIterator))
                return reply("no request found");
            await iterator.start();
        });
        //register help command
        this.add("help").execute(async ({ invoker, reply }) => {
            const useable = [];
            await Promise.all(this.commands.map(async (cmd) => {
                if (!await cmd.isAllowed(invoker))
                    return;
                useable.push(cmd);
            }));
            reply(`commands with prefix "${this.prefix}": ${useable.map(cmd => cmd.props.command).join(", ")}`);
        });
    }
    getCommandRegex() {
        const prefix = this.prefix.replace(/\//g, "\\/");
        return new RegExp(`${prefix}(\\S+)\\s*(.*)`);
    }
    validateCommand(raw) {
        const match = raw.match(this.getCommandRegex());
        if (!match)
            return false;
        return {
            name: match[1].toLowerCase(),
            args: match[2].trim()
        };
    }
    async onChat(event) {
        if (!event.msg.startsWith(this.prefix))
            return;
        const parsed = this.validateCommand(event.msg);
        if (!parsed)
            return;
        const { name, args } = parsed;
        const found = this.commands.filter(cmd => cmd.props.command === name && cmd.props.enabled);
        const reply = this.createReplyFunction(event.player);
        if (found.length === 0)
            return reply("command not found");
        const players = await this.battlefield.getPlayers();
        const invoker = await this.getPlayerByName(players, event.player);
        if (!invoker)
            return; //shouldnt happen
        const response = await Promise.allSettled(found.map(async (cmd) => {
            if (!cmd.props.execute)
                return this.logger.warn(`command ${cmd.props.command} has no execute handler`);
            if (!await cmd.isAllowed(invoker))
                return reply("no permissions to use this command");
            try {
                await cmd.handleCommand({ players, raw: event, invoker, args, reply });
            }
            catch (e) {
                if (e instanceof NameIteratorTimeoutError_1.NameIteratorTimeoutError)
                    return; //ignoreable
                if (e instanceof NameIteratorError_1.NameIteratorError)
                    return reply(`failed to find player: ${e.message}`);
                reply(`failed to execute command`);
                this.logger.error(e.stack);
            }
        }));
        const errors = response.filter(({ status }) => status === "rejected");
        errors.forEach(({ reason }) => this.logger.error(reason));
    }
    async getPlayerByName(players, name) {
        return players.find(player => player.name === name);
    }
    createReplyFunction(invoker) {
        return (message) => this.battlefield.say(message, ["player", invoker]);
    }
    /**
     * adds a new command
     * @param cmd command to set
     */
    add(cmd) {
        const command = new Command_1.Command(this).command(cmd);
        this.commands.push(command);
        return command;
    }
    /** retrieves the current prefix for commands */
    getPrefix() {
        return this.prefix;
    }
}
exports.CommandManager = CommandManager;
