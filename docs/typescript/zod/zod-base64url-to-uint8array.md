---
title: "記号を置き換えて、足りない = を補うだけの base64url 復号"
description: "URL で使いやすい base64url を、通常の base64 に直してから復号する関数。- と _ を + と / に戻し、4 の倍数になるように = を補う。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [1106, 1110]
function: "base64urlToUint8Array"
difficulty: 1
format: 2
tags: [文字列処理, イディオム]
---

## ひとことで

`base64urlToUint8Array(text)` は、URL で使われる **base64url** の文字列を、元のバイト列（`Uint8Array`）に戻します。

```ts
base64urlToUint8Array('aGk')  // バイト列 [104, 105]（"hi" の UTF-8 バイト）
```

base64url は、通常の base64 の `+` と `/` を `-` と `_` に置き換え、末尾の `=` を省いた形式です。この関数は、それを通常の base64 に戻してから、既存の復号関数に渡しています。

## コード

```ts:line-numbers=1106
export function base64urlToUint8Array(base64url: string): InstanceType<typeof Uint8Array> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return base64ToUint8Array(base64 + padding);
}
```

## 前提知識

- **base64**: バイナリデータを、英数字と `+`、`/`、`=` の 64 種類の文字で表す方式です。4 文字で 3 バイトを表します。
- **base64url**: URL の中でも安全に使えるように、`+` と `/` を `-` と `_` に変えたものです。末尾の `=` は省かれることが多いです。
- **`padStart` や `repeat` の計算**: `"=".repeat(n)` は `=` を n 個並べた文字列を作ります。
- **`%`（剰余）**: 割り算の余りです。`base64.length % 4` で、4 の倍数からどれだけずれているかが分かります。

## 何をしているか

### 1. `-` と `_` を戻す

```ts:line-numbers=1107
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
```

URL 用の文字を、通常の base64 の `+` と `/` に置き換えます。

### 2. 4 の倍数になるように `=` を補う

```ts:line-numbers=1108
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return base64ToUint8Array(base64 + padding);
```

base64 の長さは 4 の倍数である必要があります。足りない分だけ `=` を末尾に足し、そのあと通常の base64 の復号に渡します。

`'aGk'` は長さ 3 なので、`(4 - 3 % 4) % 4 = 1` で、`=` が 1 個補われて `'aGk='` になります。

## ここがすごい

- **既存の関数を再利用する**: 文字の置き換えと `=` の補いだけを自分で行い、バイト列への変換は `base64ToUint8Array` に任せています。役割が分かれているので読みやすくなっています。
- **`(4 - n % 4) % 4` で補う数を求める**: 余りが 0 のときは補わないように、外側に `% 4` を付けています。この式で、どんな長さでも必要な `=` の数が正しく決まります。
- **逆の変換との対応**: `uint8ArrayToBase64url` は、`=` を取り除き `+` と `/` を戻す逆の処理です。両方を並べると、往復で同じ値に戻ることが確かめやすくなります。

## まとめ

- base64url は、通常の base64 に直してから復号する。
- 足りない `=` は、長さを 4 で割った余りから計算する。
- 変換と復号を分けると、それぞれの関数が単純になる。
