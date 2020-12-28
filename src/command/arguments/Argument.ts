import { Battlefield } from "vu-rcon"
import { NameIteratorError } from "../../exceptions/NameIteratorError"
import { NameIterator } from "../../util/NameIterator"
import { Command } from "../Command"

export abstract class Argument<T = any> {

  protected battlefield: Battlefield
  protected _name: string|undefined
  protected nameIterator: Record<string, NameIterator>

  constructor(props: Argument.Props) {
    this.battlefield = props.battlefield
    this.nameIterator = props.nameIterator
  }

  abstract validate(args: string, props: Command.HandleCommandProps): Promise<[T, string]>

  getName() {
    return this._name
  }

  name(name: string) {
    this._name = name
    return this
  }
}

export namespace Argument {

  export interface Props {
    battlefield: Battlefield
    nameIterator: Record<string, NameIterator>
  }

}