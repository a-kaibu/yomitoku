---
title: "バイト列を Base64 の文字列に変える"
description: "zod の uint8ArrayToBase64 は、バイトの配列を一文字ずつ文字に直してつなぎ、btoa で Base64 にする。ブラウザでも動く、標準の関数だけで作られた変換。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1098, 1104]
function: "uint8ArrayToBase64"
difficulty: 2
format: 2
tags: [文字列処理, 低レイヤ]
---

## ひとことで

`uint8ArrayToBase64(bytes)` は、バイトの配列（`Uint8Array`）を、Base64 という形式の文字列に変換する関数です。画像や鍵などのバイナリデータを、文字列として送るときに使われます。

```ts
uint8ArrayToBase64(new Uint8Array([72, 105]))  // 'SGk='
```

## コード

```ts:line-numbers=1098
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
```

## 前提知識

- **バイト**: 0 から 255 までの数で、データの最小単位です。`Uint8Array` は、この数を並べた配列です。
- **Base64**: バイナリデータを、英数字と記号だけの文字列で表す形式です。文字化けせずに、テキストとして扱えます。
- **`String.fromCharCode`**: 数を、その番号に対応する文字に変えるメソッドです。
- **`btoa`**: 文字列を Base64 に変換する、ブラウザや実行環境に標準で備わる関数です。

## 何をしているか

### 1. 空の文字列を用意する

```ts:line-numbers=1099
  let binaryString = "";
```

バイト列を文字に直したものを、ここに少しずつ足していきます。

### 2. バイトを文字に直して足す

```ts:line-numbers=1100
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
```

バイトの数を、同じ番号の文字に変えて、順に後ろに足します。ここで作られる文字列は、各文字がちょうど 1 バイトを表す「バイナリ文字列」です。

### 3. Base64 に変換する

```ts:line-numbers=1103
  return btoa(binaryString);
```

バイナリ文字列を `btoa` に渡し、Base64 の文字列にして返します。

## ここがすごい

- **標準の関数だけで作る**: 外部のライブラリに頼らず、`btoa` と文字の変換だけで実装されています。
- **二段階の変換が明快**: まず「バイトを文字に」、次に「文字を Base64 に」という順番で、どの段階かが読み取れます。
- **どの環境でも使える**: ブラウザや、標準の実行環境で使える関数だけを使っているので、移植しやすくなっています。

### 注意点

- 文字を 1 つずつ足すので、非常に大きなデータでは時間がかかることがあります。
- 戻り値は標準の Base64 なので、URL で使うときは別の変換が必要です。

## まとめ

- `uint8ArrayToBase64` は、バイト列を Base64 の文字列にする。
- バイトを文字に直してつなぎ、`btoa` で変換する二段階の処理。
- 標準の関数だけで書かれ、どの環境でも動きやすい。
