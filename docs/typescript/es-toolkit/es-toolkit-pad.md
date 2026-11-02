---
title: "文字列を真ん中に寄せて、両側を埋める"
description: "es-toolkit の pad。文字列の両側を指定の文字で埋め、真ん中寄せにする。左側の埋める量を、切り捨てて決めている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/pad.ts
lines: [17, 19]
function: "pad"
difficulty: 2
format: 2
tags: [文字列処理, イディオム, 数値計算]
---

## ひとことで

`pad(str, length, chars)` は、文字列を指定の長さまで、両側から `chars` で埋める関数です。文字列を真ん中に寄せて表示したいときに使えます。`pad('abc', 7, '*')` は `'**abc**'` になります。左右の埋める量が奇数になるときは、左側を少なく、右側を多くします。

```ts
pad('abc', 7, '*')   // '**abc**'
pad('abc', 8, '-')   // '--abc---'（左 2、右 3）
```

## コード

```ts:line-numbers=17
export function pad(str: string, length: number, chars = ' '): string {
  return str.padStart(Math.floor((length - str.length) / 2) + str.length, chars).padEnd(length, chars);
}
```

## 前提知識

- **`padStart(長さ, 文字)`**: 文字列の先頭を、指定の文字で、指定の長さまで埋める組み込みメソッドです。
- **`padEnd(長さ, 文字)`**: 文字列の末尾を、指定の文字で、指定の長さまで埋めるメソッドです。
- **`Math.floor`**: 小数点以下を切り捨てる組み込み関数です。
- **メソッドのチェーン**: `a.b().c()` のように、メソッドの結果に続けて別のメソッドを呼ぶ書き方です。

## 何をしているか

### 1. 左側を埋める長さを決める

```ts:line-numbers=18
  return str.padStart(Math.floor((length - str.length) / 2) + str.length, chars).padEnd(length, chars);
```

`length - str.length` が、埋める必要のある合計の数です。その半分を切り捨てたものが、左側の埋める量です。残りが右側になります。

### 2. 先頭を埋めて、末尾を埋める

同じ行の `.padStart(…).padEnd(length, chars)` の部分です。まず `padStart` で、左側の必要な分を埋めます。そのあと `padEnd` で、全体が `length` になるまで右側を埋めます。

## ここがすごい

- **組み込みの仕組みを 2 回使う**: 両側を埋める処理を、左と右の 2 回の `pad` 系メソッドで表しています。ループや文字列の結合を書く必要がありません。
- **左を少なく、右を多くする規則**: 切り捨ての `Math.floor` によって、奇数の余りは右側に回ります。この規則が、式の中に隠れています。
- **文字列の長さの計算が 1 回**: 必要な合計は 1 回だけ計算し、その結果を左右で使い分けています。
- **メソッドの連鎖が読みやすい**: 「先頭を埋める」→「末尾を埋める」の順番が、そのまま読めます。

## まとめ

- 真ん中寄せは、埋める合計の半分を左に、残りを右に割り当てると作れる。
- 切り捨てを使うと、余りの 1 文字は右側に入る。
- `padStart` と `padEnd` を続けると、両側を埋める処理を 1 行で書ける。
- 規則を式の中に埋め込むと、短く書けるが、どちらに寄るかをコメントや例で示すと親切。
