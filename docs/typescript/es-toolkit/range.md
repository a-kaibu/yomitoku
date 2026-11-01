---
title: "長さを先に計算してから埋める range"
description: "開始・終了・刻み幅から数の列を作る range。何個になるかを割り算と切り上げで最初に求め、ちょうどの長さの配列を一度に確保してから埋めていく。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/math/range.ts
lines: [57, 75]
function: "range"
difficulty: 1
format: 2
tags: [数値計算, 最適化, API設計]
---

## ひとことで

`range` は、Python の `range` のように **連続した数の配列** を作る関数です。

```ts
range(4)         // [0, 1, 2, 3]
range(1, 5)      // [1, 2, 3, 4]
range(0, 20, 5)  // [0, 5, 10, 15]
range(5, 0, -1)  // [5, 4, 3, 2, 1]
```

素直に書くなら `while (i < end) { push(i); i += step }` ですが、この関数は **何個の数ができるかを最初に計算** し、その長さの配列を用意してから埋めています。

## コード

```ts:line-numbers=57
export function range(start: number, end?: number, step = 1): number[] {
  if (end == null) {
    end = start;
    start = 0;
  }

  if (!Number.isInteger(step) || step === 0) {
    throw new Error(`The step value must be a non-zero integer.`);
  }

  const length = Math.max(Math.ceil((end - start) / step), 0);
  const result = new Array<number>(length);

  for (let i = 0; i < length; i++) {
    result[i] = start + i * step;
  }

  return result;
}
```

## 前提知識

- **省略できる引数**: `end?: number` の `?` は「省略してもよい」、`step = 1` は「省略したら 1」という意味です。
- **オーバーロード**: ファイルの上部に、引数 1 個・2 個・3 個の場合の型だけの宣言が並んでいます。動く本体はこの関数です。
- **`end == null`**: `==` で `null` と比べると、`null` と `undefined` の両方にマッチします。「省略された」を判定する定番の書き方です。
- **`new Array<number>(length)`**: 長さ `length` の空の配列を作ります。`<number>` は中身の型です。
- **`Math.ceil` / `Math.max`**: 切り上げと、大きいほうを選ぶ関数です。

## 何をしているか

### 1. 引数 1 個の呼び方に対応

```ts:line-numbers=58
  if (end == null) {
    end = start;
    start = 0;
  }
```
`range(4)` のように終了だけを渡されたら、それを `end` にずらして `start` を 0 にします。

### 2. 刻み幅を確認

```ts:line-numbers=63
  if (!Number.isInteger(step) || step === 0) {
    throw new Error(`The step value must be a non-zero integer.`);
  }
```
刻み幅が 0 だと永遠に終わらないので、整数でない場合と合わせてエラーにします。

### 3. 長さを計算

```ts:line-numbers=67
  const length = Math.max(Math.ceil((end - start) / step), 0);
```
`(end - start) / step` を切り上げると、作られる数の個数になります。

```
range(0, 20, 5): (20 - 0) / 5 = 4        → 4 個 [0, 5, 10, 15]
range(1, 10, 4): (10 - 1) / 4 = 2.25 → 3 個 [1, 5, 9]
range(5, 0, -1): (0 - 5) / -1 = 5        → 5 個 [5, 4, 3, 2, 1]
range(5, 0)    : (0 - 5) / 1 = -5 → max で 0 個 []
```

負になる場合（向きと刻み幅の符号が合わない）は `Math.max(…, 0)` で 0 個にします。

### 4. 埋める

```ts:line-numbers=70
  for (let i = 0; i < length; i++) {
    result[i] = start + i * step;
  }
```
`i` 番目の値は `start + i * step` です。足し算を繰り返すのではなく、毎回この式で直接求めています。

## ここがすごい

- **向きの判定がいらない**: 増える方向か減る方向かで条件を `<` と `>` に分けたくなるところですが、割り算 1 つで個数を出しているので分岐がありません。符号が合わない呼び方も、自然に 0 個になります。
- **配列を一度で確保**: 長さが先にわかるので、`push` で少しずつ伸ばすより、JavaScript エンジンが効率よくメモリを確保できます。
- **誤差が積み重ならない**: `value += step` を繰り返す方式では、刻み幅が小数だと誤差が少しずつ溜まります。`start + i * step` なら、各値の誤差はその 1 回の計算ぶんだけです（このライブラリでは刻み幅を整数に限定していますが、考え方として大事です）。
- **無限ループを入口で防ぐ**: 刻み幅 0 を最初に弾くことで、どんな入力でも必ず終わることが保証されています。

## まとめ

- 個数を先に計算できる処理は、配列を一度に確保してから埋めると速くて単純。
- `(end - start) / step` の切り上げで、増加・減少の両方の個数を分岐なしに求められる。
- 繰り返しの足し算より、`start + i * step` で直接求めるほうが誤差に強い。
