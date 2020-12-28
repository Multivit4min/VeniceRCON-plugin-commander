"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentError = void 0;
class ArgumentError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ArgumentError = ArgumentError;
