// Home の低在庫アラート用: "25 (2箱+5個)"
export function formatQuantity(qty: number, unitPerBox: number): string {
  const upb = unitPerBox || 1;
  if (upb <= 1) return `${qty}`;
  const boxes = Math.floor(qty / upb);
  const rem = qty % upb;
  if (rem === 0) return `${qty} (${boxes}箱)`;
  return `${qty} (${boxes}箱+${rem}個)`;
}

// 入荷ページ用: 切り捨てて箱数だけ表示 "2箱"
export function formatBoxQuantity(qty: number, unitPerBox: number): string {
  const upb = unitPerBox || 1;
  if (upb <= 1) return `${qty}`;
  return `${Math.floor(qty / upb)}箱`;
}
