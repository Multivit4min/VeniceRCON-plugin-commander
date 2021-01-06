"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandManager_1 = require("./command/CommandManager");
module.exports = (props) => {
    return {
        manager: new CommandManager_1.CommandManager(props)
    };
};
