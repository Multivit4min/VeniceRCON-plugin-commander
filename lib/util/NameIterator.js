"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameIterator = void 0;
const NameIteratorError_1 = require("../exceptions/NameIteratorError");
const NameIteratorTimeoutError_1 = require("../exceptions/NameIteratorTimeoutError");
class NameIterator {
    constructor(props) {
        this.battlefield = props.battlefield;
        this.match = props.match;
        if (this.match.length === 0)
            throw new NameIteratorError_1.NameIteratorError("invalid player name specified");
        this.invoker = props.invoker;
        const resolver = {};
        resolver.resolve = new Promise((fulfill, reject) => {
            resolver.fulfill = fulfill;
            resolver.reject = reject;
        });
        this.timeout = setTimeout(() => this.resolver.reject(new NameIteratorTimeoutError_1.NameIteratorTimeoutError("request timed out")), typeof props.timeout === "number" ? props.timeout : NameIterator.DEFAULT_TIMEOUT);
        this.resolver = resolver;
        if (props.playerList)
            this.players = NameIterator.filterPlayers([...props.playerList], props.match);
    }
    waitForPlayer() {
        return this.resolver.resolve;
    }
    static filterPlayers(players, matcher) {
        const regex = new RegExp(matcher, "i");
        return players.filter(player => regex.test(player.name));
    }
    async matchingPlayers() {
        return NameIterator.filterPlayers(await this.battlefield.getPlayers(), this.match);
    }
    found(player) {
        clearTimeout(this.timeout);
        this.resolver.fulfill(player);
    }
    async confirm() {
        if (!this.current)
            throw new NameIteratorError_1.NameIteratorError(`no players found matching '${this.match}'`);
        this.found(this.current);
    }
    async start() {
        if (!this.players)
            this.players = await this.matchingPlayers();
        if (!this.current && this.players.length === 0)
            throw new NameIteratorError_1.NameIteratorError(`no players found matching '${this.match}'`);
        if (!this.current && this.players.length === 1)
            return this.found(this.players[0]);
        this.current = this.players.shift();
        await this.battlefield.say(`Did you mean ${this.current.name}? `, ["player", this.invoker]);
    }
}
exports.NameIterator = NameIterator;
NameIterator.DEFAULT_TIMEOUT = 2 * 60 * 1000;
