global.crypto = require('crypto');
const fs = require('fs');
const int = require('big-integer');
const Decimal = require('decimal.js');
Decimal.set({ modulo: Decimal.ROUND_FLOOR });
Decimal.set({ crypto: true });
Decimal.set({ precision: 1000000 });
Decimal.set({ toExpPos: 90000000000000 });

const exampleKey = '0xe9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262';
const mersenne = Decimal(2**512 - 1);

function random(lower, upper) {
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }

  return lower.add(Decimal.random().times(upper.sub(lower + 1)).floor());
}

function q(x, { a }) {
  let value = a[0];
  for (let i = 1; i < a.length; i++) {
    value = value.add(x.pow(i).times(a[i]));
  }

  return value;
}

function split(secret, n, k, prime) {
  const S = Decimal(secret);
  const p = Decimal(prime);
  let a = [S];
  let D = [];

  for (let i = 1; i < k; i++) {
    a.push(random(Decimal(0), p.sub(1)));
  }

  for (let i = 0; i < n; i++) {
    let x = Decimal(i + 1);
    D.push({
      x,
      y: q(x, { a }).mod(p),
    });
  }

  return D.map((share) => ({
    x: share.x.toString(),
    y: share.y.toHex(),
  }));
}

function lagrangeBasis(data, j) {
  // Lagrange basis evaluated at 0, i.e. L(0).
  // You don't need to interpolate the whole polynomial to get the secret, you
  // only need the constant term.
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

function combine(shares, prime) {
  const p = Decimal(prime);

  // Wrap with Decimal on the input shares
  const decimalShares = shares.map((share) => ({
    x: Decimal(share.x),
    y: Decimal(share.y),
  }));

  return lagrangeInterpolate(decimalShares, p);
}

exports.exampleKey = exampleKey;
exports.mersenne = mersenne;
exports.split = split;
exports.combine = combine;
