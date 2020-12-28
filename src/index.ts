import { CommandManager } from "./command/CommandManager"
import { PluginProps } from "../types/types"

module.exports = (props: PluginProps) => {

  return {
    manager: new CommandManager(props)
  }

}