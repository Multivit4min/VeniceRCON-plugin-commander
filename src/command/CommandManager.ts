import type { Battlefield, Events } from "vu-rcon"
import type { Logger, PluginEngine, PluginProps } from "../../types/types"
import { NameIteratorError } from "../exceptions/NameIteratorError"
import { NameIteratorTimeoutError } from "../exceptions/NameIteratorTimeoutError"
import { NameIterator } from "../util/NameIterator"
import { Command } from "./Command"

export class CommandManager {

  readonly logger: Logger
  readonly engine: PluginEngine
  readonly battlefield: Battlefield
  readonly prefix: string
  readonly commands: Command[] = []
  readonly iterators: Record<string, NameIterator> = {}

  constructor({ engine, battlefield, config, logger }: PluginProps) {
    this.engine = engine
    this.battlefield = battlefield
    this.logger = logger
    this.prefix = config.prefix.length > 0 ? config.prefix : "/"
    this.logger.info(`using "${this.prefix}" as command prefix`)
    this.battlefield.on("chat", this.onChat.bind(this))
    this.registerDefaultCommands()
  }

  private registerDefaultCommands() {
    //register yes command in order to search for players
    this.add("yes").execute(async ({ reply, invoker }) => {
      const iterator = this.iterators[invoker.name]
      if (!(iterator instanceof NameIterator)) return reply("no request found")
      await iterator.confirm()
    })
    //register no command in order to search for players
    this.add("no").execute(async ({ reply, invoker }) => {
      const iterator = this.iterators[invoker.name]
      if (!(iterator instanceof NameIterator)) return reply("no request found")
      await iterator.start()
    })
    //register help command
    this.add("help").execute(async ({ invoker, reply }) => {
      const useable: Command[] = []
      await Promise.all(this.commands.map(async cmd => {
        if (!cmd.isAllowed(invoker)) return
        useable.push(cmd)
      }))
      reply(useable.map(cmd => cmd.props.command).join(", "))
    })
  }

  private getCommandRegex() {
    const prefix = this.prefix.replace(/\//g, "\\/")
    return new RegExp(`${prefix}(\\S+)\\s*(.*)`)
  }

  private validateCommand(raw: string) {
    const match = raw.match(this.getCommandRegex())
    if (!match) return false
    return {
      name: match[1].toLowerCase(),
      args: match[2].trim()
    }
  }

  private async onChat(event: Events.PlayerOnChat) {
    if (!event.msg.startsWith(this.prefix)) return
    const parsed = this.validateCommand(event.msg)
    if (!parsed) return
    const { name, args } = parsed
    const found = this.commands.filter(cmd => cmd.props.command === name && cmd.props.enabled)
    const reply = this.createReplyFunction(event.player)
    if (found.length === 0) return reply("command not found")
    const players = await this.battlefield.getPlayers()
    const invoker = await this.getPlayerByName(players, event.player)
    if (!invoker) return //shouldnt happen
    const response = await Promise.allSettled(found.map(async cmd => {
      if (!cmd.props.execute) return this.logger.warn(`command ${cmd.props.command} has no execute handler`)
      if (!await cmd.isAllowed(invoker)) return reply("no permissions to use this command")
      try {
        await cmd.handleCommand({ players, raw: event, invoker, args, reply })
      } catch (e) {
        if (e instanceof NameIteratorTimeoutError) return //ignoreable
        if (e instanceof NameIteratorError) return reply(`failed to find player: ${e.message}`)
        reply(`failed to execute command`)
        this.logger.error(e.stack)
      }
    }))
    const errors = response.filter(({ status }) => status === "rejected")
    errors.forEach(({ reason }: any) => this.logger.error(reason))
  }

  private async getPlayerByName(players: Battlefield.PlayerList, name: string): Promise<Battlefield.Player|undefined> {
    return players.find(player => player.name === name)
  }

  private createReplyFunction(invoker: string) {
    return (message: string) => this.battlefield.say(message, ["player", invoker])
  }

  /**
   * adds a new command
   * @param cmd command to set
   */
  add(cmd: string) {
    const command = new Command(this).command(cmd)
    this.commands.push(command)
    return command
  }

}