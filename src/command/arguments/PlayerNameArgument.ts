import { Battlefield } from "vu-rcon"
import { NameIterator } from "../../util/NameIterator"
import { Command } from "../Command"
import { Argument } from "./Argument"

export class PlayerNameArgument extends Argument<Battlefield.Player> {

  async validate(args: string, props: Command.HandleCommandProps) {
    const invoker = props.invoker.name
    const splitted = args.split(" ")
    const match = splitted.shift() as string
    const iterator = new NameIterator({
      battlefield: this.battlefield, invoker, playerList: props.players, match
    })
    this.nameIterator[invoker] = iterator
    await iterator.start()
    try {
      return [await iterator.waitForPlayer(), splitted.join(" ")] as [Battlefield.Player, string]
    } catch (e) {
      delete this.nameIterator[invoker]
      throw e
    }
  }



}