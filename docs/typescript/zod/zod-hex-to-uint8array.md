---
title: "2 文字ずつ読んで 16 進数をバイトにする"
description: "16 進数の文字列を、先頭の 0x を取り除いてから 2 文字ずつバイトに変換する hexToUint8Array。桁数が奇数なら例外にする。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1116, 1126]
function: "hexToUint8Array"
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, 防御的プログラミング]
---

## ひとことで

`hexToUint8Array(hex)` は、`'ff00'` のような 16 進数の文字列を、バイトの配列（`Uint8Array`）に変換します。

```ts
hexToUint8Array('0x0aff')  // [10, 255]
hexToUint8Array('abc')     // エラー（桁数が奇数）
```

16 進数の 1 桁は、2 進数の 4 ビットに対応します。そのため、**2 桁で 1 バイト** になります。この関数は、その対応をそのまま使って変換しています。

## コード

```ts:line-numbers=1116
export function hexToUint8Array(hex: string): InstanceType<typeof Uint8Array> {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
```

## 前提知識

- **16 進数**: `0` から `9` と `a` から `f` の 16 種類の数字で表す方式です。`ff` は 255 です。
- **`Uint8Array`**: 0 から 255 の整数だけを入れられる、バイトの配列です。
- **`parseInt(文字, 16)`**: 文字列を 16 進数として数値に変換します。
- **`replace(/^0x/, "")`**: 先頭の `0x` を取り除きます。

## 何をしているか

### 1. 先頭の `0x` と桁数を確かめる

```ts:line-numbers=1117
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
```

`0x` を取り除き、桁数が奇数なら 1 バイトに収まらないのでエラーにします。

### 2. 2 文字ずつ読んで数値にする

```ts:line-numbers=1121
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
```

バイトの数は、文字数の半分です。`i` は 0, 2, 4 と 2 ずつ進み、その 2 文字を 16 進数として読んで、`i / 2` 番目のバイトに入れます。

`'0aff'` の場合、`'0a'` が 10、`'ff'` が 255 になります。

## ここがすごい

- **2 文字 = 1 バイトという対応をそのまま使う**: 16 進数の 2 桁は、ちょうど 8 ビット、つまり 1 バイトです。ループの歩幅を 2 にしたことで、その関係が読み取れます。
- **不正な長さを先に弾く**: 途中まで変換してから失敗すると、どこで壊れたのか分かりにくくなります。最初に桁数を確かめることで、エラーの原因がはっきりします。
- **`Uint8Array` にそのまま入れる**: 結果を普通の配列ではなく、固定長のバイト配列にすることで、バイトの範囲外の値が入らない型になっています。

## まとめ

- 16 進数の 2 桁は、1 バイトに対応する。
- 変換の前に、桁数や接頭辞など前提を確かめておくと、エラーの原因が分かりやすい。
- 固定長の型（`Uint8Array`）を使うと、値の範囲が型で守られる。
