# CosmDrone
CosmDrone is a multitool for interfacing with virtually any Cosmos SDK-based blockchain. It is designed as a library with a CLI tool. It can be used from the command line, in the Node REPL, on a server backend, in your Dapp frontend, in React Native...

**Features:**
- [x] Query chain info (all the info on chain-registry)
- [x] Query OpenAPI documentation
- [x] Synchronizes with [cosmos/chain-registry](https://github.com/cosmos/chain-registry)
- [x] Default `CosmosDirectory extends RestGateway` for configuration-less immediate access to blockchains
- [x] Raw-query state of any standard Smart Contract on any configured chain (i.e. pretty much any contract using `cw_storage_plus`)
- [x] Smart-query contracts on any configured chain
- [x] *CLI:* Local address book
- [ ] Sign & submit arbitrary transactions
- [ ] *CLI:* Smart Contract pipeline *(see below)*
- [ ] Query IBC info (connections, channels, clients, human readable info)
- [ ] Query arbitrary endpoints (w/ address book support)
- [ ] *CLI:* use OpenAPI documentation to offer autocomplete
- [ ] List, iterate & filter all smart contract state (aka. models)
- [ ] `RPCGateway`
- [ ] Configurable gateways & URLs (e.g. path to OpenAPI)
- [ ] Specialized smart query CLI editor w/ hotkeys & schema support
- [ ] Many more - suggest some!

Unchecked items above are sorted by my personal priority. I will gradually work off this checklist in this order.

# Documentation
As you can see from the feature list above, this project is still an early WIP. On top of that, I'm building it in my spare time.

At this moment, there is no explicit documentation yet; however, the CLI tool is built on [yargs](https://yargs.js.org) which comes with a certain degree of self-documentation that may help.

If you have any questions feel free to [hit me up on Twitter](https://twitter.com/0xkiruse) for now. I will eventually build a [gitbook](https://www.gitbook.com) for this project. Thank you for your patience.

# Smart Contract Pipeline
The plan here is to develop various utilities for smart contract developer, from setting up your environment over creating new projects, compiling & optimizing, and finally deploying. Personally, I constantly forget the various commands, dependencies, and processes, so I intend to build this tool to streamline the entire process.

Since TFL is building JAX and T1 is building CWScript, I'll probably add the choice of which pipeline to build later, when each respective system is ready (and I have the time).

# License
LGPL v3.0 or higher
