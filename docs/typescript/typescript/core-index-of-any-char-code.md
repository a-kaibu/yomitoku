---
title: "指定した文字コードのどれかが最初に現れる位置を探す"
description: "TypeScript コンパイラの indexOfAnyCharCode。文字列の中で、候補の文字コードのどれかが最初に出てくる位置を返す。見つからなければ -1 を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [232, 239]
function: "indexOfAnyCharCode"
difficulty: 1
format: 2
tags: [文字列処理, 探索, パース]
---

## ひとことで

`indexOfAnyCharCode(text, charCodes, start?)` は、文字列の中から、指定した文字コードのどれかに一致する文字が最初に現れる位置を返す関数です。見つからなければ `-1` を返します。たとえば、コードの中で最初に出てくる区切り文字を探すときに使われます。

```ts
indexOfAnyCharCode('a,b;c', [59])        // 3（';' の位置）
indexOfAnyCharCode('a,b;c', [44, 59])    // 1（',' が先に出てくる）
```

## コード

```ts:line-numbers=232
export function indexOfAnyCharCode(text: string, charCodes: readonly number[], start?: number): number {
    for (let i = start ?? 0; i < text.length; i++) {
        if (contains(charCodes, text.charCodeAt(i))) {
            return i;
        }
    }
    return -1;
}
```

## 前提知識

- **文字コード（char code）**: 文字を数で表したものです。`','` は `44`、`';'` は `59` です。`text.charCodeAt(i)` で、位置 `i` の文字コードが取り出せます。
- **`contains`**: 配列に値が含まれるかを判定する、TypeScript コンパイラの内部関数です。
- **`start ?? 0`**: 開始位置が指定されていなければ `0` を使う、null 合体演算子の書き方です。
- **字句解析**: 文字列を、意味のある単位（トークン）に分ける処理です。コンパイラの最初の段階で、このような検索が多く使われます。

## 何をしているか

### 1. 開始位置から、1 文字ずつ見る

```ts:line-numbers=233
    for (let i = start ?? 0; i < text.length; i++) {
```

`start` が指定されていれば、そこから、なければ先頭から、文字列の末尾まで位置を進めます。

### 2. その文字コードが候補に入るかを確かめる

```ts:line-numbers=234
        if (contains(charCodes, text.charCodeAt(i))) {
            return i;
        }
```

位置 `i` の文字コードが、`charCodes` のどれかと一致するか調べます。一致したら、その位置を返します。

### 3. 見つからなければ -1

```ts:line-numbers=238
    return -1;
```

最後まで見つからなければ、`-1` を返します。`indexOf` と同じ約束です。

## ここがすごい

- **文字列ではなく数で比べる**: 文字をそのまま比べる代わりに、文字コードの数を比べます。候補の一覧を、数の配列で持てるので、判定が速く、簡潔です。
- **複数の候補を一度に探せる**: 1 文字ずつ別々に探す代わりに、候補をまとめて 1 回の走査で見つけます。コンパイラのように、同じ文字列を何度も見る場面で効きます。
- **開始位置の指定**: 途中から探し直せるので、トークンを順に読む処理と組み合わせやすくなっています。
- **`-1` の約束**: 組み込みの `indexOf` と同じ戻り値にしているので、利用者は既に知っている規則で使えます。

## まとめ

- 文字列の中の複数の候補を探すには、文字コードの配列を使うと速く書ける。
- 開始位置を引数にすると、途中から続けて探せる。
- 見つからないときの戻り値を、`indexOf` と同じ `-1` にすると、覚えることが減る。
- コンパイラの字句解析のように、文字の並びを読む処理の基本になる考え方。
