import type { Battlefield } from "vu-rcon"
import { NameIteratorError } from "../exceptions/NameIteratorError"
import { NameIteratorTimeoutError } from "../exceptions/NameIteratorTimeoutError"

export class NameIterator {

  static DEFAULT_TIMEOUT = 2 * 60 * 1000

  players: Battlefield.Player[]|undefined
  private current: Battlefield.Player|undefined
  readonly battlefield: Battlefield
  readonly match: string
  readonly invoker: string
  private resolver: NameIterator.Resolver
  private timeout: any

  constructor(props: NameIterator.Props) {
    this.battlefield = props.battlefield
    this.match = props.match
    if (this.match.length === 0) throw new NameIteratorError("invalid player name specified")
    this.invoker = props.invoker
    const resolver: Partial<NameIterator.Resolver> = {}
    resolver.resolve = new Promise((fulfill, reject) => {
      resolver.fulfill = fulfill
      resolver.reject = reject
    })
    this.timeout = setTimeout(
      () => this.resolver.reject(new NameIteratorTimeoutError("request timed out")),
      typeof props.timeout === "number" ? props.timeout : NameIterator.DEFAULT_TIMEOUT
    )
    this.resolver = resolver as NameIterator.Resolver
    if (props.playerList) this.players = NameIterator.filterPlayers([...props.playerList], props.match)
  }

  waitForPlayer() {
    return this.resolver.resolve
  }

  static filterPlayers(players: Battlefield.PlayerList, matcher: string) {
    const regex = new RegExp(matcher, "i")
    return players.filter(player => regex.test(player.name))
  }

  private async matchingPlayers() {
    return NameIterator.filterPlayers(await this.battlefield.getPlayers(), this.match)
  }

  private found(player: Battlefield.Player) {
    clearTimeout(this.timeout)
    this.resolver.fulfill(player)
  }

  async confirm() {
    if (!this.current) throw new NameIteratorError(`no players found matching '${this.match}'`)
    this.found(this.current)
  }

  async start() {
    if (!this.players) this.players = await this.matchingPlayers()
    if (!this.current && this.players.length === 0) throw new NameIteratorError(`no players found matching '${this.match}'`)
    if (!this.current && this.players.length === 1) return this.found(this.players[0])
    this.current = this.players.shift() as Battlefield.Player
    await this.battlefield.say(`Did you mean ${this.current.name}? `, ["player", this.invoker])
  }
}

export namespace NameIterator {
  export interface Props {
    battlefield: Battlefield
    match: string
    invoker: string
    playerList?: Battlefield.PlayerList
    timeout?: number
  }

  export type Resolver = {
    resolve: Promise<Battlefield.Player>,
    fulfill: (player: Battlefield.Player) => void,
    reject: (err: Error) => void
  }
}