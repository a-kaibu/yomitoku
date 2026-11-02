---
title: "文字列の先頭の一文字だけを小文字にする"
description: "es-toolkit の lowerFirst は、文字列の先頭の一文字だけを小文字にして、残りはそのままにする。substring で先頭と残りに分けて、つなぎ直す短い関数。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/lowerFirst.ts
lines: [12, 14]
function: "lowerFirst"
difficulty: 1
format: 2
tags: [文字列処理, イディオム]
---

## ひとことで

`lowerFirst(str)` は、文字列の先頭の 1 文字だけを小文字にして、残りの部分はそのままにした文字列を返す関数です。

```ts
lowerFirst('Hello')  // 'hello'
lowerFirst('ABC')    // 'aBC'
```

## コード

```ts:line-numbers=12
export function lowerFirst(str: string): string {
  return str.substring(0, 1).toLowerCase() + str.substring(1);
}
```

## 前提知識

- **`substring`**: 文字列の一部を取り出すメソッドです。`substring(0, 1)` は先頭 1 文字、`substring(1)` は 2 文字目以降を取り出します。
- **`toLowerCase`**: 文字列の英字を小文字にするメソッドです。英字以外の文字は変わりません。
- **文字列の連結**: `+` で 2 つの文字列を 1 つにつなげます。

## 何をしているか

### 1. 先頭の 1 文字を小文字にする

```ts:line-numbers=13
  return str.substring(0, 1).toLowerCase() + str.substring(1);
```

`str.substring(0, 1)` で先頭の 1 文字を取り出し、`toLowerCase()` で小文字にします。

### 2. 残りの部分をつなげる

同じ式の `+ str.substring(1)` で、2 文字目以降をそのまま後ろにつなげます。残りの部分は、大文字のままです。

## ここがすごい

- **元の文字列を分けて考える**: 先頭と残りに分け、それぞれに適した処理をしてからつなぎ直します。
- **空の文字列も安全**: 空の文字列を渡すと、どちらの部分も空になり、結果は空の文字列になります。例外は起きません。
- **短く読める**: 1 行で「先頭だけ小文字、残りは変えない」という意図が分かります。

### 注意点

- 先頭が英字でない場合は、そのまま残ります。例えば `'1A'` は `'1A'` のままです。
- 大文字と小文字の変換は、英字の範囲で行われます。

## まとめ

- `lowerFirst` は、先頭 1 文字だけを小文字にする。
- 先頭と残りを `substring` で分け、つなぎ直す。
- 空の文字列でも安全で、英字以外の先頭文字は変わらない。
