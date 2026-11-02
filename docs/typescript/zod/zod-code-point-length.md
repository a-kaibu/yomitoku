---
title: "絵文字の 2 文字分を 1 文字と数える"
description: "JavaScript の文字列の長さは UTF-16 の単位で数えるため、絵文字は 2 と数えられる。codePointLength は、サロゲートペアを 1 文字として数え直す。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1019, 1030]
function: "codePointLength"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 最適化]
---

## ひとことで

`codePointLength(str)` は、文字列の **文字数**（コードポイント数）を返します。JavaScript の `str.length` と違い、絵文字のような文字を 1 文字と数えます。

```ts
'abc'.length          // 3
'😀'.length           // 2（UTF-16 の 2 単位）
codePointLength('😀') // 1
```

JavaScript の文字列は UTF-16 で保存されていて、一部の文字は 2 つの単位で表されます。この 2 つの単位の組み合わせを **サロゲートペア** と呼びます。Zod では、文字列の長さを制限するときに、人が数える文字数で判定したいので、この関数を使っています。

## コード

```ts:line-numbers=1019
export function codePointLength(str: string): number {
  const units = str.length;
  if (!highSurrogate.test(str)) return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 0xfc00) === 0xd800 && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      count--;
      i++;
    }
  }
  return count;
}
```

## 前提知識

- **UTF-16**: 文字を 16 ビット単位で表す方式です。ほとんどの文字は 1 単位ですが、多くの絵文字は 2 単位（サロゲートペア）になります。
- **サロゲートペア**: 前半の「上位サロゲート」（`0xD800` から `0xDBFF`）と、後半の「下位サロゲート」（`0xDC00` から `0xDFFF`）の組です。
- **`charCodeAt(i)`**: `i` 番目の単位の数値を返します。
- **`&`（ビットごとの AND）**: `& 0xfc00` で、上位 6 ビットだけを取り出します。これで、サロゲートかどうかを判定できます。

## 何をしているか

### 1. サロゲートを含まなければ、長さをそのまま返す

```ts:line-numbers=1020
  const units = str.length;
  if (!highSurrogate.test(str)) return units;
```

`highSurrogate` という正規表現で、サロゲートが 1 つもなければ、単位数がそのまま文字数になります。

### 2. サロゲートペアを 1 つ減らす

```ts:line-numbers=1023
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 0xfc00) === 0xd800 && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      count--;
      i++;
    }
```

前の単位が上位サロゲート、次の単位が下位サロゲートなら、2 単位で 1 文字です。`count` を 1 減らし、次の位置を飛ばします。

`'a😀b'` は単位数が 4 ですが、絵文字のペアを 1 文字として数えると 3 文字になります。

### 3. 数え終わったら返す

```ts:line-numbers=1029
  return count;
```

## ここがすごい

- **ペアの判定をビット演算で行う**: `& 0xfc00 === 0xd800` で、上位 6 ビットが同じかを見ています。範囲の比較を 2 回書くより短く、サロゲートの定義にも合っています。
- **サロゲートがなければ速く返す**: 大半の文字列には絵文字がないので、最初の判定で終わります。ループは必要なときだけ動きます。
- **ペアを飛ばす**: 2 単位目を `i++` で飛ばすので、後半の下位サロゲートを 1 文字として数え直すことはありません。

## まとめ

- JavaScript の `length` は UTF-16 の単位数で、絵文字は 2 と数えられる。
- サロゲートペアは、2 単位で 1 文字と数える。
- 先に「絵文字がないか」を確かめると、普通の文字列では余計な処理が要らない。
