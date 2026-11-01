---
title: "組み合わせの番号を「繰り上がり」で各配列の位置に分解する"
description: "複数の配列から 1 つずつ選ぶ全組み合わせ（直積）を作る関数。再帰を使わず、通し番号を各配列の長さで割っていく混合基数の考え方で組み立てている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/cartesianProduct.ts
lines: [83, 113]
function: "cartesianProduct"
difficulty: 2
format: 2
tags: [アルゴリズム, 数値計算, 最適化]
---

## ひとことで

`cartesianProduct` は、複数の配列から 1 つずつ要素を取り出した **すべての組み合わせ**（直積）を作る関数です。
たとえば `cartesianProduct([1, 2], ['a', 'b', 'c'])` は次の 6 通りを返します。

```
[1,'a'] [1,'b'] [1,'c'] [2,'a'] [2,'b'] [2,'c']
```

こうした処理は再帰で書かれることが多いのですが、この関数は「組み合わせに 0 から通し番号を振り、その番号を各配列の位置に分解する」という数の表し方の知識を使って、ループだけで作っています。

## コード

```ts:line-numbers=83
export function cartesianProduct<T>(...arrs: Array<readonly T[]>): T[][] {
  if (arrs.length === 0) {
    return [[]];
  }

  let total = 1;
  for (let i = 0; i < arrs.length; i++) {
    total *= arrs[i].length;
  }

  if (total === 0) {
    return [];
  }

  const n = arrs.length;
  const result: T[][] = Array(total);

  for (let i = 0; i < total; i++) {
    const tuple: T[] = Array(n);
    let idx = i;
    for (let j = n - 1; j >= 0; j--) {
      const arr = arrs[j];
      const len = arr.length;
      tuple[j] = arr[idx % len];
      idx = Math.floor(idx / len);
    }
    result[i] = tuple;
  }

  return result;
}
```

## 前提知識

- **`...arrs`**: 残り引数（レストパラメータ）です。呼び出し時に渡した配列がいくつあっても、すべてまとめて配列 `arrs` に入ります。
- **`Array<readonly T[]>`**: 「読み取り専用の配列」の配列という型です。
- **`%`（剰余）と `Math.floor(a / b)`**: `%` は割り算の余り、`Math.floor(a / b)` は割り算の商（小数切り捨て）です。この 2 つで「ある桁の数字」と「残りの上の桁」を取り出せます。
- **オーバーロード**: 実はこのファイルには、引数が 1〜4 個の場合の型だけを書いた宣言（関数の本体がないもの）が上に並んでいます。TypeScript では、こうして「この引数ならこの型を返す」を複数書けます。今回読むのは実際に動く本体です。

## 何をしているか

### 1. 特別な場合を先に片付ける

```ts:line-numbers=84
  if (arrs.length === 0) {
    return [[]];
  }

  let total = 1;
  for (let i = 0; i < arrs.length; i++) {
    total *= arrs[i].length;
  }

  if (total === 0) {
    return [];
  }
```
配列が 1 つもなければ「何も選ばない組み合わせ」が 1 通りあるとして `[[]]` を返します。

```ts:line-numbers=84
  if (arrs.length === 0) {
    return [[]];
  }
```

次に全組み合わせの数 `total` を、各配列の長さの掛け算で求めます。どれか 1 つでも空の配列があれば、掛け算の結果は 0 になり、空の配列を返します。

```ts:line-numbers=88
  let total = 1;
  for (let i = 0; i < arrs.length; i++) {
    total *= arrs[i].length;
  }
```

```ts:line-numbers=93
  if (total === 0) {
    return [];
  }
```


### 2. 通し番号を分解して組み合わせを作る

```ts:line-numbers=100
  for (let i = 0; i < total; i++) {
    const tuple: T[] = Array(n);
    let idx = i;
    for (let j = n - 1; j >= 0; j--) {
      const arr = arrs[j];
      const len = arr.length;
      tuple[j] = arr[idx % len];
      idx = Math.floor(idx / len);
    }
    result[i] = tuple;
  }
```
ここが核心です。通し番号 `i` を、**後ろの配列から順に** その配列の長さで割っていきます。

上の例（長さ 2 と 3）で `i = 4` のときを追います。

```
j = 1（長さ 3）: 4 % 3 = 1 → 'b'、 idx = floor(4 / 3) = 1
j = 0（長さ 2）: 1 % 2 = 1 → 2
結果: [2, 'b']
```

これは、時計の「時・分・秒」で秒数を分解するのと同じ考え方です。「秒 = 全体 % 60」「残り = floor(全体 / 60)」と下の桁から順に取り出していきます。ここでは桁ごとに「何進数か」が違う（配列の長さが違う）ので、**混合基数**と呼ばれる表し方になります。

`i` を 0, 1, 2, … と増やすと、いちばん後ろの配列の位置が最も速く変わり、繰り上がるたびに 1 つ前の配列の位置が進みます。これで辞書順にきれいに並んだ結果が得られます。

## ここがすごい

- **再帰なし・途中の配列なし**: 再帰で書くと、途中段階の小さな組み合わせ配列をたくさん作っては捨てることになります。この方法は最終的な組み合わせだけを直接作るので、無駄なメモリ確保がありません。
- **結果の配列を最初から正しい長さで確保**: `total` を先に計算しているので、`Array(total)` で必要な大きさを一度に確保し、`push` で少しずつ伸ばす必要がありません。
- **任意の番号の組み合わせを直接計算できる**: この「番号を分解する」考え方を使えば、「100 万番目の組み合わせ」だけを、前の 99 万 9999 個を作らずに求めることもできます。
- **境界の扱いが数学的に正しい**: 引数なしで `[[]]`、空配列を含めば `[]` という答えは、掛け算で `1` が「何もない」を表すのと同じ理屈で、一貫しています。

## まとめ

- 直積の組み合わせは「通し番号の混合基数表現」と 1 対 1 に対応する。
- `%` と `Math.floor(/)` で、下の桁から順に位置を取り出せる。
- 全体の個数がわかるなら、配列は最初に正しい大きさで確保すると無駄がない。
