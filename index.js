global.crypto = require('crypto');
const fs = require('fs');
const int = require('big-integer');
const Decimal = require('decimal.js');
Decimal.set({ modulo: Decimal.ROUND_FLOOR });
Decimal.set({ crypto: true });
Decimal.set({ precision: 1000000 });
Decimal.set({ toExpPos: 90000000000000 });
// const mersenne = Decimal(2**127 - 1);
const mersenne = Decimal(2**512 - 1);
const sample_key = Decimal('0xe9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262');

function random(lower, upper) {
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }
  return lower.add(Decimal.random().times(upper.sub(lower + 1)).floor());
}

const mySecret = Decimal(1234);
const myShares = [
  { x: Decimal(3), y: Decimal(2) },
  { x: Decimal(4), y: Decimal(1) },
  { x: Decimal(5), y: Decimal(2) },
];

function q(x, { a }) {
  let value = a[0];
  for (let i = 1; i < a.length; i++) {
    value = value.add(x.pow(i).times(a[i]));
  }

  return value;
}

function split(S, n, k, prime) {
  let a = [S];
  let D = [];

  for (let i = 1; i < k; i++) {
    a.push(random(Decimal(0), Decimal(prime).sub(1)));
  }

  for (let i = 0; i < n; i++) {
    let x = Decimal(i + 1);
    D.push({
      x,
      y: q(x, { a }).mod(prime),
    });
  }

  let string = '';
  let string2 = '';

  for (let i = 0; i < a.length; i++) {
    string = `${string}a_${i}: ${a[i].toString()}\n`;
  }
  for (let i = 0; i < D.length; i++) {
    string2 = `${string2}D_${i}: (${D[i].x.toNumber()}, ${D[i].y.toHex()})\n`;
  }
  console.log(a[0].toHex());
  console.log(string);
  console.log(string2);

  return D;
}

function lagrangeBasis(data, j) {
  // Lagrange basis evaluated at 0; L(0).
  let denominator = Decimal(1);
  let numerator = Decimal(1);
  for (let i = 0; i < data.length; i++) {
    if (!data[j].x.equals(data[i].x)) {
      denominator = denominator.times(data[i].x.minus(data[j].x));
    }
  }

  for (let i = 0; i < data.length; i++) {
    if (!data[j].x.equals(data[i].x)) {
      numerator = numerator.times(data[i].x);
    }
  }

  return {
    numerator,
    denominator,
    fraction: numerator.div(denominator),
  };
}

function lagrangeInterpolate(data, p) {
  let S = Decimal(0);
  for (let i = 0; i < data.length; i++) {
    let basis = lagrangeBasis(data, i);
    S = S.add(data[i].y.times(basis.numerator).div(basis.denominator));
  }

  return S.mod(p);
}

function combine(shares, p) {
  return lagrangeInterpolate(shares, p);
}

const sample_shares = [
  {
    x: Decimal(1),
    y: Decimal('0xdad7a51746faca3cab57875fad5d1c77347bbc037d59d7dbb865c6ad4470a4f3c140175e5df59bcaadc26fe013fb197b70216f0cf6648403e6cf54cbf78efcd7'),
  },
  {
    x: Decimal(2),
    y: Decimal('0xa7814787e649bffb9571a9cdd115057d3025cd1b3dd252400be3f251c977c034284d26abe439c6d6aaf42f1deec14f6c8df8d9f58a551841f8f601326a162794'),
  },
  {
    x: Decimal(3),
    y: Decimal('0x65fce751ddece0b3bf521a0d6db56a6f49456d46ebf4b77f33070a51c6af15563883b2fd08b2123486713c80b09a9fc79eb853e9f977dbdaf3dc01569238b299'),
  },
];

// split(sample_key, 6, 3, Decimal(2**512 - 1));
console.log(combine(sample_shares, Decimal(2**512 - 1)).toHex());
