---
title: "文字列の先頭の一文字だけを大文字にする"
description: "es-toolkit の upperFirst は、文字列の先頭の一文字だけを大文字にして、残りはそのままにする。lowerFirst と対になる、substring で分けてつなぐ短い関数。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/upperFirst.ts
lines: [12, 14]
function: "upperFirst"
difficulty: 1
format: 2
tags: [文字列処理, イディオム]
---

## ひとことで

`upperFirst(str)` は、文字列の先頭の 1 文字だけを大文字にして、残りの部分はそのままにした文字列を返す関数です。`lowerFirst` と対になる関数です。

```ts
upperFirst('hello')  // 'Hello'
upperFirst('abc')    // 'Abc'
```

## コード

```ts:line-numbers=12
export function upperFirst(str: string): string {
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}
```

## 前提知識

- **`substring`**: 文字列の一部を取り出すメソッドです。`substring(0, 1)` は先頭 1 文字、`substring(1)` は 2 文字目以降です。
- **`toUpperCase`**: 英字を大文字に変換するメソッドです。英字以外の文字は変わりません。
- **文字列の連結**: `+` で、2 つの文字列を 1 つにつなげます。

## 何をしているか

### 1. 先頭の 1 文字を大文字にする

```ts:line-numbers=13
  return str.substring(0, 1).toUpperCase() + str.substring(1);
```

`str.substring(0, 1)` で先頭の 1 文字を取り出し、`toUpperCase()` で大文字にします。その後ろに、`str.substring(1)` で取り出した残りを連結します。

## ここがすごい

- **先頭と残りを分けて扱う**: 変えたい部分と変えない部分を分けて、それぞれ処理してからつなぐ考え方です。
- **空の文字列も安全**: 空の文字列を渡すと、結果も空になり、例外は起きません。
- **対の関数と見比べられる**: `lowerFirst` と並べると、大文字と小文字の違いだけで同じ形になっていることが分かります。

### 注意点

- 先頭が英字でない場合（数字や記号など）は、変わらずにそのまま残ります。
- 英字以外の文字は、大文字にしても変化しません。

## まとめ

- `upperFirst` は、先頭 1 文字だけを大文字にする。
- 先頭と残りを `substring` で分け、つなぎ直す。
- 空の文字列や英字以外の先頭文字でも安全に動く。
