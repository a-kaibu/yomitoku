---
title: "スラッシュかバックスラッシュかを、文字コードの数で判定する"
description: "TypeScript コンパイラの isAnyDirectorySeparator。パスの区切りには / と \ の両方があるので、文字コードを 2 つ比べて、どちらかなら真を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [41, 43]
function: "isAnyDirectorySeparator"
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, イディオム]
---

## ひとことで

`isAnyDirectorySeparator(charCode)` は、ある文字がパスの区切り文字かを判定する関数です。Unix 系のシステムでは `/`、Windows では `\` が区切りになります。TypeScript コンパイラは両方を区切りとして扱うため、この関数で両方を一度に判定します。

```ts
isAnyDirectorySeparator('/'.charCodeAt(0))   // true
isAnyDirectorySeparator('\\'.charCodeAt(0))  // true
isAnyDirectorySeparator('a'.charCodeAt(0))   // false
```

## コード

```ts:line-numbers=41
export function isAnyDirectorySeparator(charCode: number): boolean {
    return charCode === CharacterCodes.slash || charCode === CharacterCodes.backslash;
}
```

## 前提知識

- **文字コード**: 文字を数で表したものです。`/` は `47`、`\` は `92` です。`charCodeAt(i)` で取り出せます。
- **`CharacterCodes`**: TypeScript コンパイラの中で、よく使う文字コードに名前を付けた定数の集まりです。`CharacterCodes.slash` は `/` の文字コードです。
- **パスの区切り**: ファイルの場所を、フォルダの階層で表すときの区切りの記号です。環境によって記号が違うので、両方を扱う必要があります。
- **`||`（または）**: どちらかの条件が真なら真になります。

## 何をしているか

### 1. 文字コードを、区切りの定数と比べる

```ts:line-numbers=42
    return charCode === CharacterCodes.slash || charCode === CharacterCodes.backslash;
```

与えられた文字コードが、スラッシュの文字コードか、バックスラッシュの文字コードのどちらかに一致するかを調べます。どちらかなら `true` です。

## ここがすごい

- **文字を直接比べず、文字コードを比べる**: 文字列の `'/'` と比べる代わりに、数どうしを比べます。コンパイラは文字を何億回も読むので、数の比較の方が速く、扱いも簡単です。
- **名前付きの定数**: `CharacterCodes.slash` と書くことで、47 という数字の意味が伝わります。マジックナンバーを避けています。
- **引数が文字コード**: 文字列ではなく数を受け取るので、`charCodeAt` の結果をそのまま渡せます。文字列を作り直す手間がありません。
- **2 つの区切りを 1 つにまとめる**: Unix と Windows の違いを、この 1 行の中に閉じ込めています。呼び出し側は、環境の違いを気にしなくて済みます。

## まとめ

- パスの区切りは、環境によって `/` と `\` の両方がありえる。
- 文字は文字コードの数にして比べると、速くて扱いやすい。
- 名前付きの定数を使うと、数字の意味が読み手に伝わる。
- 環境の違いを 1 つの関数に閉じ込めると、呼び出し側が楽になる。
