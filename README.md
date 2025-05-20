# Spalk Tech Test 

by [Carl Smith](https://github.com/CarlosNZ)

## MPEG Transport stream parser

- Written in Typescript (`/src/parser.ts`), compiled to Javascript (`/dist/parser.js`)
- Test files in `/artifacts` (supplied plus some variations for different cases)
- Tested with **Node v20** (but probably fine for v16+)

*All commands should be run from root of this repo*

Parse individual file:
```sh
# e.g.
cat artifacts/test_success.ts | node dist/parser.js
```

To batch test on *all* sample files:
```sh
./test.sh
```

Run parser directly from Typescript source:
```sh
yarn install # or npm install
yarn parse artifacts/test_success.ts

# OR
cat artifacts/test_success.ts | npx ts-node src/parser.ts
```