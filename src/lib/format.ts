export function shortMoney(n: number) {
  return n >= 1000000
    ? `${+(n / 1000000).toFixed(1)}jt`
    : n >= 1000
      ? `${Math.round(n / 1000)}rb`
      : String(n);
}
