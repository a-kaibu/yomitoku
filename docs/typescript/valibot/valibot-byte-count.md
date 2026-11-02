---
title: "文字列が UTF-8 で何バイトになるかを、TextEncoder で数える"
description: "valibot の _getByteCount。文字列を UTF-8 のバイト列に変換して、その長さを返す。日本語の文字は 3 バイトになるため、文字数とは違う値になる。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_getByteCount/_getByteCount.ts
lines: [13, 18]
function: "_getByteCount"
difficulty: 1
format: 2
tags: [Unicode, 文字列処理, 入出力]
---

## ひとことで

`_getByteCount(input)` は、文字列を UTF-8 という形式のバイト列にしたとき、そのバイト数を返す関数です。文字数とは違い、日本語の文字は 1 文字あたり 3 バイト、英字は 1 バイトになります。valibot では、「最大 100 バイトまで」といった制限を検査するときに使われます。

```ts
_getByteCount('abc')  // 3（英字は 1 バイトずつ）
_getByteCount('あ')   // 3（ひらがなは 1 文字 3 バイト）
```

## コード

```ts:line-numbers=13
export function _getByteCount(input: string): number {
  if (!textEncoder) {
    textEncoder = new TextEncoder();
  }
  return textEncoder.encode(input).length;
}
```

## 前提知識

- **UTF-8**: 文字を 1 バイトから 4 バイトの可変長で表す形式です。インターネットで最もよく使われる文字コードです。
- **バイト（byte）**: 8 ビットのデータの単位です。ファイルの大きさや、通信量の単位として使われます。
- **`TextEncoder`**: 文字列を UTF-8 のバイト列（`Uint8Array`）に変換する、組み込みのクラスです。
- **`encode`**: `TextEncoder` のメソッドで、文字列をバイト列に変換します。
- **シングルトン（使い回し）**: 1 つの `TextEncoder` を変数に覚えておき、何度も使い回す書き方です。

## 何をしているか

### 1. エンコーダを一度だけ作る

```ts:line-numbers=14
  if (!textEncoder) {
    textEncoder = new TextEncoder();
  }
```

最初に呼ばれたときだけ、`TextEncoder` を作って変数に入れます。2 回目以降は、作った物を使い回します。

### 2. バイト列の長さを返す

```ts:line-numbers=17
  return textEncoder.encode(input).length;
```

`encode(input)` で文字列をバイト列にし、その `length` を返します。変換の結果の長さが、そのまま UTF-8 のバイト数です。

## ここがすごい

- **文字数ではなくバイト数で数える**: 文字数で制限すると、絵文字や日本語の多い入力で、実際の保存容量を超えてしまうことがあります。バイト数で数えると、容量の制限を正しく扱えます。
- **自前で計算しない**: UTF-8 の変換規則は複雑です。組み込みの `TextEncoder` に任せるので、正しさと速さの両方が得られます。
- **エンコーダを使い回す**: `TextEncoder` を毎回作ると、無駄が生まれます。一度作って覚えておくことで、呼び出しの負担を減らしています。
- **副作用のない計算**: 文字列を受け取り、数を返すだけです。入力は変わりません。

## まとめ

- 保存や通信の容量を数えるには、文字数ではなくバイト数（UTF-8）で数える。
- UTF-8 の変換は自前で書かず、`TextEncoder` に任せると正確になる。
- 高頻度で呼ぶ道具は、作ったオブジェクトを使い回すと効率がよい。
- 日本語の文字は 3 バイトなので、文字数との違いに注意する。
