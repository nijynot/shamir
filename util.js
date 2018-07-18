function mod(n, m) {
  return ((n % m) + m) % m;
}

function random(lower, upper) {
  if (lower > upper) {
    const temp = lower;
    lower = upper;
    upper = temp;
  }
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

function combine(shares, p) {
  return lagrangeInterpolate(shares, p);
}

function split(S, n, k, prime) {
  let coefficients = [];
  let D = [];
  // let x = [1, ];

  for (let i = 0; i < k - 1; i++) {
    coefficients.push(random(0, prime - 1));
  }

  for (let i = 0; i < n; i++) {
    D.push({
      x: i + 1,
      y: (S + (coefficients[0] * (i + 1)) + (coefficients[0] * (i + 1)**2)).toString(16),
    });
  }
  return D;
}

function lagrangeBasis(data, j) {
  // Lagrange basis evaluated at 0; L(0).
  let denominator = 1;
  let numerator = 1;
  for (let i = 0; i < data.length; i++) {
    if (j != data[i].x) {
      denominator = denominator * (data[i].x - j);
    }
  }

  for (let i = 0; i < data.length; i++) {
    if (j != data[i].x) {
      numerator = numerator * data[i].x;
    }
  }

  return {
    numerator,
    denominator,
    fraction: (numerator / denominator),
  };
}

function lagrangeInterpolate(data, p) {
  let S = 0;
  for (let i = 0; i < data.length; i++) {
    S = S + (data[i].y * lagrangeBasis(data, data[i].x).fraction);
  }

  return mod(S, p);
}
