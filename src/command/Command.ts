import { Battlefield, Events } from "vu-rcon"
import { ArgumentError } from "../exceptions/ArgumentError"
import { Argument } from "./arguments/Argument"
import { PlayerNameArgument } from "./arguments/PlayerNameArgument"
import { StringArgument } from "./arguments/StringArgument"
import type { CommandManager } from "./CommandManager"

export class Command {

  parent: CommandManager
  readonly props: Command.Props = {
    command: "",
    help: false,
    scopes: [],
    enabled: true,
    permissionCheck: undefined,
    arguments: [],
    execute: () => null
  }

  constructor(parent: CommandManager) {
    this.parent = parent
  }

  /** sets the command name */
  command(name: string) {
    this.props.command = name.toLowerCase()
    return this
  }

  /** sets a help text, should be as minimal as possible */
  help(text: string) {
    this.props.help = text
    return this
  }

  /** sets the required scopes the requester should have */
  requiredScopes(scopes: string[]) {
    this.props.scopes = scopes
    return this
  }

  /** custom permission check which should return a boolean */
  checkPermissions(cb: Command.CheckPermissionCallback) {
    this.props.permissionCheck = cb
    return this
  }

  async isAllowed(invoker: Battlefield.Player) {
    //permission check with scopes
    if (this.props.scopes.length > 0) {
      const scopes = await this.parent.engine.requestPlayerPermissions(invoker.guid)
      const ok = this.props.scopes.every(scope => scopes.includes(scope))
      if (!ok) return false
    }
    //permission check with custom permission handler
    if (typeof this.props.permissionCheck === "function") {
      const ok = await this.props.permissionCheck({ invoker })
      if (!ok) return false
    }
    return true
  }

  enable() {
    this.props.enabled = true
    return this
  }

  disable() {
    this.props.enabled = false
    return this
  }

  argument(cb: Command.CreateArgumentCallback) {
    const props: Argument.Props = {
      battlefield: this.parent.battlefield,
      nameIterator: this.parent.iterators
    }
    this.props.arguments.push(cb({
      player: new PlayerNameArgument(props),
      string: new StringArgument(props)
    }))
    return this
  }

  private async validateArguments(props: Command.HandleCommandProps) {
    const args = [...this.props.arguments]
    const response: Record<string, any> = {}
    let stringArg = props.args
    while (args.length > 0) {
      const argument = args.shift() as Argument
      const name = argument.getName()
      if (!name) throw new ArgumentError(`command ${this.props.command} has missing argument name`)
      const [resolved, remaining] = await argument.validate(stringArg, props)
      stringArg = remaining
      response[name] = resolved
    }
    return response
  }

  async handleCommand(props: Command.HandleCommandProps) {
    const args = await this.validateArguments(props)
    if (!this.props.execute) return this.parent.logger.warn(`no excecute handler for command "${this.props.command}" found`)
    const { invoker, reply, raw, players } = props
    await this.props.execute({ invoker, args, reply, raw, players })
  }

  /** execute handler */
  execute<T>(cb: Command.ExecuteCallback<T>) {
    this.props.execute = cb
    return this
  }
}

export namespace Command {
  /** Command.handleCommand */
  export type HandleCommandProps = {
    invoker: Battlefield.Player
    args: string
    reply: (message: string) => void
    raw: Events.PlayerOnChat
    players: Battlefield.Player[]
  }
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

  export type Props = {
    command: string
    help: false|string
    scopes: string[]
    enabled: boolean
    arguments: Argument[]
    permissionCheck: undefined|CheckPermissionCallback
    execute: ExecuteCallback<any>|undefined
  }
}