---
title: "絵文字を 1 文字と数える。UTF-16 の代理ペアの扱い"
description: "valibot の _getCodePointCount。JavaScript の文字列の length は UTF-16 の単位で数えるため、絵文字を 2 と数える。サロゲートペアを見つけたら数を 1 つ減らして、文字数を正しく数えている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_getCodePointCount/_getCodePointCount.ts
lines: [11, 26]
function: "_getCodePointCount"
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, 最適化]
---

## ひとことで

`_getCodePointCount(input)` は、文字列が **コードポイント（Unicode の 1 文字の番号）** でいくつあるかを数える関数です。JavaScript の `input.length` は、UTF-16 という内部の単位で数えるため、絵文字などは 2 と数えられてしまいます。この関数は、その差を正しく埋めています。

```ts
'abc'.length                    // 3
'😀'.length                     // 2（UTF-16 では 2 単位）
_getCodePointCount('abc')       // 3
_getCodePointCount('😀')        // 1（1 文字）
```

## コード

::: code-group

```ts:line-numbers=11 [日本語訳]
export function _getCodePointCount(input: string): number {
  let count = input.length;
  // 代理ペアは最後の 1 単位からは始まれないので、その位置から走査を始める必要はない
  // そのため、最後の 1 単位の手前までを確認する
  const lengthMinus1 = input.length - 1;
  for (let i = 0; i < lengthMinus1; ) {
    // i は必ず範囲内なので、codePointAt は undefined を返さない
    if (input.codePointAt(i)! <= 0xffff) {
      i++;
    } else {
      i += 2; // 代理ペアの 2 単位をまとめて読み飛ばす
      count--; // 2 単位を 1 コードポイントとして数え直す
    }
  }
  return count;
}
```

```ts:line-numbers=11 [原文]
export function _getCodePointCount(input: string): number {
  let count = input.length;
  // A surrogate pair cannot start at the last code unit, so no iteration needs
  // to start there
  const lengthMinus1 = input.length - 1;
  for (let i = 0; i < lengthMinus1; ) {
    // codePointAt never returns undefined because i is always in bounds
    if (input.codePointAt(i)! <= 0xffff) {
      i++;
    } else {
      i += 2; // Move past both code units of the surrogate pair
      count--; // Count the pair as one code point instead of two code units
    }
  }
  return count;
}
```

:::

## 前提知識

- **UTF-16**: JavaScript の文字列の内部で使われる形式です。1 単位は 16 ビットで、ほとんどの文字は 1 単位で表せます。
- **コードポイント**: Unicode で、1 文字ごとに割り当てられた番号です。絵文字の `😀` は `U+1F600` という番号を持ちます。
- **代理ペア（サロゲートペア）**: 16 ビットに収まらない文字を、2 つの 16 ビットの単位で表す仕組みです。前の単位は `0xD800`〜`0xDBFF` の範囲になります。
- **`codePointAt(i)`**: 位置 `i` から、1 つのコードポイントの番号を返します。代理ペアの先頭なら、2 単位分をまとめた番号を返します。
- **`!`（非 null の表明）**: 型の上では `undefined` かもしれないが、実際にはそうならないと開発者が保証する書き方です。

## 何をしているか

### 1. 単位の数を最初の値にする

```ts:line-numbers=12
  let count = input.length;
```

まず、UTF-16 の単位の数を入れます。ここから、代理ペアのたびに 1 ずつ減らしていきます。

### 2. 代理ペアの先頭を探す

```ts:line-numbers=18
    if (input.codePointAt(i)! <= 0xffff) {
```

`codePointAt(i)` の値が `0xFFFF`（16 ビットに収まる最大）以下なら、普通の 1 文字です。それより大きければ、代理ペアの先頭です。

### 3. 2 単位を 1 文字として数え直す

```ts:line-numbers=21
      i += 2; // 代理ペアの 2 単位をまとめて読み飛ばす
      count--; // 2 単位を 1 コードポイントとして数え直す
```

代理ペアは 2 単位で 1 文字なので、位置を 2 進めて、数を 1 減らします。`😀` なら、単位は 2 つ、数えるのは 1 つです。

## ここがすごい

- **文字列を配列にしない**: `[...input].length` のように展開すると、長い文字列では余計なメモリを使います。この関数は、数だけを数えて配列を作りません。
- **最後の 1 単位は調べない**: 代理ペアは必ず 2 単位ある必要があるので、最後の単位からは始まりません。`length - 1` まで回せば十分です。
- **範囲外を気にしない**: `codePointAt` は範囲内の位置なら必ず値を返すので、`undefined` を気にせず `!` で済ませています。コメントにもその理由が書かれています。
- **読みやすい手順**: 「1 単位ずつ数える」を基本にし、例外（代理ペア）だけを足し引きで直しています。

## まとめ

- JavaScript の `length` は文字数ではなく、UTF-16 の単位数。絵文字は 2 と数えられる。
- 代理ペアは 2 単位で 1 文字なので、見つけたら数を 1 減らす。
- 文字列を配列にせず、数えるだけで文字数を求められる。
- 範囲の端で起きない条件は、ループの終わりを 1 つ手前にして省ける。
