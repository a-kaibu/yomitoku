---
title: "バイトを 2 桁に揃えて、16 進数の文字列に並べる"
description: "バイトの配列を 16 進数の文字列に変える uint8ArrayToHex。1 バイトごとに 16 進数にし、padStart で 2 桁に揃えてから連結する。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1128, 1132]
function: "uint8ArrayToHex"
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, イディオム]
---

## ひとことで

`uint8ArrayToHex(bytes)` は、バイトの配列を 16 進数の文字列にします。前に紹介した `hexToUint8Array` の逆の変換です。

```ts
uint8ArrayToHex(new Uint8Array([10, 255]))  // '0aff'
uint8ArrayToHex(new Uint8Array([1]))        // '01'
```

ハッシュ値や暗号の鍵を、人が読める形で表示するときによく使われる変換です。

## コード

```ts:line-numbers=1128
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

## 前提知識

- **`Array.from(bytes)`**: 配列のような値を、普通の配列に変換します。
- **`toString(16)`**: 数値を 16 進数の文字列にします。`10` は `'a'`、`255` は `'ff'` になります。
- **`padStart(2, "0")`**: 文字列の先頭を `0` で埋めて、長さを 2 にします。`'a'` は `'0a'` になります。
- **`map` と `join`**: 配列の各要素を変換して、1 つの文字列につなげます。

## 何をしているか

### 1. 各バイトを 16 進数にする

```ts:line-numbers=1129
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
```

`map` で、1 つずつ 16 進数の文字列に変えます。1 桁のものは、`padStart` で先頭に `0` を足して 2 桁にそろえます。

`[10, 1]` は `'0a'` と `'01'` になります。

### 2. 連結する

```ts:line-numbers=1131
    .join("");
```

2 桁ずつにそろえた文字列を、区切りなしで 1 つにつなげます。

## ここがすごい

- **2 桁に揃える理由がある**: `padStart` がないと、`1` は `'1'`、`10` は `'a'` と桁数がずれてしまいます。そのままつなげると、元に戻せなくなります。2 桁にそろえることで、逆変換の `hexToUint8Array` と対応します。
- **`map` と `join` で書き切る**: 手作業のループより、変換の意味がそのまま読める形になっています。
- **区切り文字を入れない**: 1 バイトが常に 2 文字なので、区切りがなくても、逆変換で元の長さを正しく読み戻せます。

## まとめ

- バイトを 16 進数にするときは、2 桁に揃えてからつなぐ。
- `padStart` で、桁数の違いによるずれを防げる。
- 逆変換と対応するように作ると、往復の確認がしやすい。
