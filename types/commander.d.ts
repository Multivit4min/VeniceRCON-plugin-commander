import { Battlefield } from "vu-rcon"

declare type CommanderExports = {
  manager: CommandManager
}

export default CommanderExports

declare class CommandManager {
  add(cmd: string): Command
}

declare class Command {
  /**
   * sets the command name
   * @param name command name
   */
  command(name: string): Command

  /**
   * sets a help text for the user
   * @param help a brief help text
   */
  help(text: string): Command

  /**
   * checks scopes from the webinterface
   * this validates if a user has enough permissions to use this command
   * @param scopes array of scope names @see https://alliance-apps.github.io/VeniceRCON-documentation/general/advanced/scopes/
   */
  requiredScopes(scopes: string[]): Command

  /**
   * registers a custom permission handler
   * @param cb function to invoke when custom permission check is necessary
   */
  checkPermissions(cb: Command.CheckPermissionCallback): Command

  /** enables this command */
  enable(): Command

  /** disables this command */
  disable(): Command

  /** assigns an argument */
  argument(cb: Command.CreateArgumentCallback): Command

  /**
   * handler which gets invoked when a command should be run
   * @param cb callback which gets invoked
   */
  execute<T>(cb: Command.ExecuteCallback<T>): Command
}

declare namespace Command {
  /** Command.execute */
  export type ExecuteCallback<T> = (data: ExeceuteProps<T>) => void
  export type ExeceuteProps<T extends {} = Record<string, any>> = {
    invoker: Battlefield.Player
    args: T
    reply: (message: string) => void
    raw: Events.PlayerOnChat
    /** player list at the time of execution */
    players: Battlefield.Player[]
  }
  /** Command.checkPermissions */
  export type CheckPermissionCallback = (data: CheckPermissionCallbackProps) => Promise<boolean>|boolean
  export type CheckPermissionCallbackProps = {
    invoker: Battlefield.Player
  }
  /** Command.argument */
  export type CreateArgumentCallback = (data: CreateArgumentCallbackProps) => Argument
  export type CreateArgumentCallbackProps = {
    string: StringArgument
    player: PlayerNameArgument
  }
}