global.crypto = require('crypto');
const Decimal = require('decimal.js');
Decimal.set({ modulo: Decimal.EUCLID });
Decimal.set({ crypto: true });
Decimal.set({ precision: 1e+6 });
Decimal.set({ toExpPos: 1000 });

const exampleKey = '0xe9873d79c6d87dc0fb6a5778633389f4453213303da61f20bd67fc233aa33262';

// Sufficient prime for most uses. Pick a larger prime from
// https://en.wikipedia.org/wiki/Largest_known_prime_number
// if your secret is large.
const prime512 = Decimal('2').pow(3217).sub(1);
const prime3217 = Decimal('2').pow(3217).sub(1);
const prime19937 = Decimal('2').pow(19937).sub(1);

function random(lower, upper) {
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }

  return lower.add(Decimal.random().times(upper.sub(lower + 1)).floor());
}

// Polynomial function where `a` is the coefficients
function q(x, { a }) {
  let value = a[0];
  for (let i = 1; i < a.length; i++) {
    value = value.add(x.pow(i).times(a[i]));
  }

  return value;
}

function split(secret, n, k, prime) {
  if (Number.isInteger(secret) || Number.isInteger(prime)) {
    throw new TypeError(
      'The shamir.split() function must be called with a String<secret>' +
      'but got Number<secret>.'
    );
  }

  if (Number.isInteger(prime)) {
    throw new TypeError(
      'The shamir.split() function must be called with a String<prime>' +
      'but got Number<prime>.'
    );
  }

  if (secret.substring(0, 2) !== '0x') {
    throw new TypeError(
      'The shamir.split() function must be called with a' +
      'String<secret> in hexadecimals that begins with 0x.'
    );
  }

  if (!Decimal.isDecimal(prime) && prime.substring(0, 2) !== '0x') {
    throw new TypeError(
      'The shamir.split() function must be called with a' +
      'String<prime> in hexadecimals that begins with 0x.'
    );
  }

  const S = Decimal(secret);
  const p = Decimal(prime);

  if (S.greaterThan(prime)) {
    throw new RangeError('The String<secret> must be less than the String<prime>.');
  }

  let a = [S];
  let D = [];

  for (let i = 1; i < k; i++) {
    let coeff = random(Decimal(0), p.sub(1));
    a.push(coeff);
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
exports.prime512 = prime512;
exports.prime3217 = prime3217;
exports.prime19937 = prime19937;
exports.split = split;
exports.combine = combine;
