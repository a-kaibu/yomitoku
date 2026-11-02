---
title: "バイト列を 16 進数の文字列に変える"
description: "zod の uint8ArrayToHex は、バイトごとに 16 進数の 2 桁へ変えて、それらを連結する。一桁の値も 0 で埋めて、常に 2 桁になるようにしている。"
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
tags: [文字列処理, 数値計算]
---

## ひとことで

`uint8ArrayToHex(bytes)` は、バイトの配列を、16 進数の文字列に変換する関数です。`[255, 1]` は `'ff01'` のようになります。

```ts
uint8ArrayToHex(new Uint8Array([255, 1]))  // 'ff01'
```

## コード

```ts:line-numbers=1128
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

## 前提知識

- **16 進数**: 0 から 9 と a から f の 16 個の記号で数を表す形式です。1 バイトは、ちょうど 2 桁の 16 進数で表せます。
- **`Array.from`**: 配列のような値から、普通の配列を作るメソッドです。
- **`padStart`**: 文字列の先頭を、指定した文字で指定の長さまで埋めるメソッドです。

## 何をしているか

### 1. 各バイトを 2 桁の 16 進数にする

```ts:line-numbers=1130
    .map((b) => b.toString(16).padStart(2, "0"))
```

各バイトを 16 進数の文字列に変えます。`padStart` で 2 桁になるように先頭を `0` で埋めるので、`1` は `01` になります。

### 2. 連結する

```ts:line-numbers=1131
    .join("");
```

すべての 2 桁の文字列を、区切りなしでつなげます。

## ここがすごい

- **桁がそろう**: `padStart` のおかげで、どの値も必ず 2 桁になり、全体の長さが正しくなります。
- **メソッドをつなげて読める**: `Array.from`、`map`、`join` と順に書くので、変換の流れが上から読めます。
- **手作業の計算が要らない**: 16 進数への変換は、`toString(16)` の 1 回の呼び出しで済みます。

### 注意点

- 出来上がる文字列は、バイト数の 2 倍の長さになります。
- 小文字で出力されるので、大文字が必要な場合は別に変換します。

## まとめ

- `uint8ArrayToHex` は、バイト列を 16 進数の文字列にする。
- 各バイトを `toString(16)` で変え、`padStart` で 2 桁にそろえる。
- 配列を変換して、`join` で一つの文字列にまとめる。
