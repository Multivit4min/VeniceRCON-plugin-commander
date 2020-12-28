# VeniceRCON Command Plugin

This is a Plugin for VeniceRCON and allows other plugins access a unified commanding interface.
It has a built in Argument Parsing functionality and permission checking.

In order to let a plugin use this it will need to include this inside the `config.yaml`

```yaml
name: "Example Plugin"
description: "creates chat commands"
#add these 2 lines in order to receive the return values as dependency
dependency:
  - Commander
....
```

A minimal usage example would look like following:

```typescript
//type annotation is only important when using typescript
module.exports = (props: PluginProps<{}, { Commander: commander }>) => {

  const { manager } = dependency.Commander
  manager.add("hello").excecute(({ reply }) => reply("world!"))
}
```

When a user sends `/hello` (assuming prefix has been set to `/`) in the chat it will reply only to the user with `world!`

## Permission Handling
------------------

### Built in Scope check

In order to do permission checks you can either use the internal permission handler which checks for permissions a user has been received by the webinterface via:

```typescript
manager
  .add("hello")
  .requiredScopes(["PLAYER#KILL"])
  .excecute(({ reply }) => reply("world!"))
```

If you set multiple scopes into the array it will need to require all of them in order to be able to execute the command


### Custom Permission check

in order to do permission check with your own function you will need to do:

```typescript
manager
  .add("hello")
  .checkPermissions(invoker => invoker.name === "foobar")
  .excecute(({ reply }) => reply("world!"))
```

This will check if the users name is `"foobar"` he is allowed to use this command!
This callback can also resolve with a Promise


## Arguments
------------------

At this time there are only 2 types of arguments

### PlayerArgument

An example on how to use arguments is here:

```typescript
manager
  .add("hello")
  .argument(args => args.player.name("target"))
  .excecute(({ invoker, reply, args }) => {
    battlefield.say(`${invoker.name} says Hello!`, ["player", args.target.name])
    reply(`you said hello to ${args.target.name}`)
  })
```

The callback inside argument receives a single object which has `player` which searches for a Player and `string` which just parses the rest of a string

The cool thing about the player argument is that you only need to add a short part of a players name, if its uncertain which player you meant it will ask via chat if `did you mean xyz?` then you can either confirm via a default chat command `/yes` or `/no`.

* when answered with `/yes` it will execute the command
* when answered with `/no` it will skip to the next person in this list

The `.name("target")` defines which name it will receive in the args callback when exceute gets called.
You then receive the Argument via `event.args.target` which is a Battlefield.Player object


### StringArgument

The String argument will just consume the rest of the string remaining, so this should always be added last!


## Execute Props
------------------

The `.execute((props) => ...)` function will receive following properties:

key     | type                           | description
--------|--------------------------------|-----------------------------------------------------------
invoker | Battlefield.Player             | the raw Player object from the Battlefield Player list
args    | Record<string, any>            | this holds all parsed arguments
reply   | (message: string) => void      | this is a function which when invoked will send a message to the player which sent the command
raw     |                                | this holds the raw battlefield event object
players | Battlefield.Player[]           | holds the playerlist at time of invoking this command