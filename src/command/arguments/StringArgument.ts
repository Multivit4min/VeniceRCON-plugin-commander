import { Argument } from "./Argument"

export class StringArgument extends Argument<string> {

  async validate(args: string) {
    return [args, ""] as [string, string]
  }

}