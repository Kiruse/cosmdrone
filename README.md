# CosmDrone
CosmDrone is a multitool for interfacing with virtually any Cosmos SDK-based blockchain. It is designed as a library with a CLI tool. It can be used from the command line, in the Node REPL, on a server backend, in your Dapp frontend, in React Native...

**Features:**
- [x] Query chain info (all the info on chain-registry)
- [x] Query OpenAPI documentation
- [x] Synchronizes with [cosmos/chain-registry](https://github.com/cosmos/chain-registry)
- [x] Default `CosmosDirectory extends RestGateway` for configuration-less immediate access to blockchains
- [x] Raw-query state of any standard Smart Contract on any configured chain (i.e. pretty much any contract using `cw_storage_plus`)
- [ ] Smart-query contracts on any configured chain
- [ ] List, iterate & filter all smart contract state (aka. models)
- [ ] Sign & submit arbitrary transactions
- [ ] Query IBC info (connections, channels, clients, human readable info)
- [ ] *CLI:* use OpenAPI documentation to offer generic queries + autocomplete
- [ ] `RPCGateway`
- [ ] Configurable gateways & URLs (e.g. path to OpenAPI)
- [ ] Many more - suggest some!

Unchecked items above are sorted by my personal priority. I will gradually work off this checklist in this order.

# Documentation
As you can see from the feature list above, this project is still an early WIP. On top of that, I'm building it in my spare time.

At this moment, there is no explicit documentation yet; however, the CLI tool is built on [yargs](https://yargs.js.org) which comes with a certain degree of self-documentation that may help.

If you have any questions feel free to [hit me up on Twitter](https://twitter.com/0xkiruse) for now. I will eventually build a [gitbook](https://www.gitbook.com) for this project. Thank you for your patience.

# License
LGPL v3.0 or higher
