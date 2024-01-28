# Grug-UI

Grug-UI is a set of light-weight JavaScript utilities for programmatically:
- Generating HTML and CSS -- SSR
- Creating DOM and CSSDOM (TBD) nodes
- Mutating the DOM (TBD)
- Enabling interactivity


## Examples

[Tic-Tac-Toe](./examples/tic-tac-toe/index.mjs)


## TODOs

- [ ] Add HTML statements set for DOM mutation
- [ ] Add CSS statements as wrapper around the CSSStyleSheet API
- [ ] Provide API for creation of reactive "components"
    - More or less just just add something that emulates an event loop
      by calling an `update` function
