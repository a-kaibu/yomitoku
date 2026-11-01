---
title: "切り上げ割り算を整数だけで書く"
description: "BigInt の範囲が何要素になるかを数える内部関数。BigInt の割り算は切り捨てなので、分子に「割る数 - 1」を足して切り上げにしている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/_internal/bigIntRangeLength.ts
lines: [12, 20]
function: "bigIntRangeLength"
difficulty: 2
format: 2
tags: [数値計算, イディオム, ハック]
---

## ひとことで

`bigIntRangeLength(start, end, step)` は、`start` から `end` の手前まで `step` 刻みで数を並べたとき、**何個になるか** を求める内部関数です。BigInt（とても大きな整数）版の `range` で、配列の長さを決めるのに使われます。

```
start = 0n, end = 10n, step = 3n → 0, 3, 6, 9 → 4 個
```

答えは「差 ÷ 刻み幅 の **切り上げ**」ですが、BigInt には `Math.ceil` が使えません。そこで **整数の割り算だけで切り上げる** 古典的なテクニックを使っています。

## コード

```ts:line-numbers=12
export function bigIntRangeLength(start: bigint, end: bigint, step: bigint): number {
  const difference = end - start;

  if (step > 0n) {
    return difference <= 0n ? 0 : Number((difference + step - 1n) / step);
  }

  return difference >= 0n ? 0 : Number((difference + step + 1n) / step);
}
```

## 前提知識

- **BigInt**: どんなに大きな整数でも正確に扱える型です。数字の後ろに `n` を付けて `10n` のように書きます。`number` と違って小数はありません。
- **BigInt の割り算**: `7n / 2n` は `3n` です。**小数点以下は 0 の方向に切り捨て** られます。`-7n / 2n` は `-3n` です。
- **`Math.ceil` が使えない**: `Math` の関数は `number` 用なので、BigInt を渡すとエラーになります。
- **`Number(x)`**: BigInt を普通の数値に変換します。配列の長さは普通の数値なので、最後に変換しています。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` の式です。

## 何をしているか

### 1. 差を求める

```ts:line-numbers=13
  const difference = end - start;
```
### 2. 刻み幅が正の場合

```ts:line-numbers=15
  if (step > 0n) {
    return difference <= 0n ? 0 : Number((difference + step - 1n) / step);
  }
```
差が 0 以下なら範囲が空なので 0 個です。そうでなければ `(差 + step - 1) / step` を計算します。

```
差 10, step 3: (10 + 3 - 1) / 3 = 12 / 3 = 4   ← 10/3 = 3.33… の切り上げ
差 9,  step 3: (9 + 3 - 1) / 3 = 11 / 3 = 3    ← ちょうど割り切れるときは 3 のまま
```

### 3. 刻み幅が負の場合

```ts:line-numbers=19
  return difference >= 0n ? 0 : Number((difference + step + 1n) / step);
```
`end` が `start` より小さくないと範囲が空です。差も刻み幅も負なので、割り算の結果は正になります。今度は `step + 1`（たとえば `step = -3` なら `-2`）を足します。

```
start 10, end 0, step -3: 差 -10 → (-10 - 3 + 1) / -3 = -12 / -3 = 4 → 10, 7, 4, 1
```

## ここがすごい

- **切り上げを整数だけで**: 「`a / b` の切り上げ = `(a + b - 1) / b` の切り捨て」は、C 言語などでも使われる有名なテクニックです。分子に「割る数 - 1」を足しておくと、余りが 1 以上あるときだけ商が 1 つ繰り上がります。余りが 0 のときは繰り上がりません。浮動小数点を一切使わないので、BigInt のような巨大な数でも誤差なく計算できます。
- **負の方向もきちんと**: BigInt の割り算は「0 の方向に切り捨て」なので、負の数どうしの場合は足す値の符号が変わります。刻み幅の符号で場合を分け、それぞれに正しい補正値を使っています。
- **空の範囲を先に判定**: 向きが逆の範囲（`range(10n, 0n, 1n)` など）は、割り算の前に 0 を返しています。式に入れると負の個数になってしまうのを防いでいます。

## まとめ

- 正の整数の切り上げ割り算は `(a + b - 1) / b` で書ける。
- BigInt の割り算は 0 方向への切り捨てなので、負の数では補正の向きが変わる。
- 浮動小数点を使わない計算は、大きな数でも誤差が出ない。
