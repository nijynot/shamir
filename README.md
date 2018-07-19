# shamir

## Usage

Example:
```js

const shamir = require('./index.js');

// Exmaple Bitcoin private key from https://en.bitcoin.it/wiki/Private_key
const example = '0xe9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262';

// Split the secret into 6 shares such that at least 3 shares are required to reconstruct the secret
const shares = shamir.split(example, 6, 3, shamir.mersenne);
// => [{ x: 1, y: 0x... }, { x: 2, y: 0x... }, ... ,{ x: 6, y: 0x... }]

const secret = shamir.combine([shares[0], shares[1], shares[2]], shamir.mersenne).toHex();
// => 0xe9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262
```

## API

### `shamir.split(secret, n, k, prime)`
##### `secret`

Type: `String`

##### `n`
Type: `Number`

The amount of shares you want to generate.

##### `k`
Type: `Number`

The minumum amount of shares required to reconstruct the secret.

##### `prime`
Type: `String` or `Number`

A prime number.

### `shamir.combine(shares, prime)`
##### `shares`
Type: `Array`

Array of your shares, where each share is an `Object` with the corresponding `x` and `y` values generated from `shamir.split`.

##### `prime`
Type: `String` or `Number`

A prime number.

### `shamir.mersenne`
Type: `Decimal` (Decimal from decimal.js)

Returns the mersenne prime, 2**512 - 1.
