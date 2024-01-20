let crypto;
let Decimal;

if (typeof window === 'undefined') {
  // We are in a Node.js environment
  crypto = require('crypto');
  Decimal = require('decimal.js');
} else {
  // We are in a browser environment
  crypto = window.crypto;
  Decimal = window.Decimal;
}

Decimal.set({ rounding: 5 });
Decimal.set({ modulo: Decimal.ROUND_FLOOR });
Decimal.set({ crypto: true });
Decimal.set({ precision: 1e+4 });
Decimal.set({ toExpPos: 1000 });

function divmod(a, b, n) {
  let aCopy = (Decimal.isDecimal(a)) ? a : Decimal(a);
  let bCopy = (Decimal.isDecimal(b)) ? b : Decimal(b);
  let nCopy = (Decimal.isDecimal(n)) ? n : Decimal(n);
  let t = Decimal('0');
  let nt = Decimal('1');
  let r = nCopy;
  let nr = bCopy.mod(n);
  let tmp;
  while (!nr.isZero()) {
    let quot = Decimal.floor(r.div(nr));
    tmp = nt;  nt = t.sub(quot.times(nt));  t = tmp;
    tmp = nr;  nr = r.sub(quot.times(nr));  r = tmp;
  };
  if (r.greaterThan(1)) return Decimal(0);
  if (t.isNegative()) t = t.add(n);
  return aCopy.times(t).mod(n);
}

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
    let coeff = random(Decimal(0), p.sub(0x1));
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
  };
}

function lagrangeInterpolate(data, p) {
  let S = Decimal(0);

  for (let i = 0; i < data.length; i++) {
    let basis = lagrangeBasis(data, i);
    S = S.add(data[i].y.times(divmod(basis.numerator, basis.denominator, p)));
  }

  const rest = S.mod(p);

  return rest;
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

if (typeof module !== 'undefined' && module.exports) {
  // We are in a Node.js environment
  exports.split = split;
  exports.combine = combine;
  exports.divmod = divmod;
} else {
  // We are in a browser environment
  window.split = split;
  window.combine = combine;
  window.divmod = divmod;
}