---
title: "パスの末尾が区切り文字で終わっているかを調べる"
description: "TypeScript コンパイラの hasTrailingDirectorySeparator。空でないパスの最後の 1 文字が、スラッシュかバックスラッシュかを、文字コードで判定する。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [140, 142]
function: "hasTrailingDirectorySeparator"
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, 防御的プログラミング]
---

## ひとことで

`hasTrailingDirectorySeparator(path)` は、パスの末尾が `/` か `\` で終わっているかを判定する関数です。フォルダのパスは `src/` のように区切りで終わることがあり、この関数はそれを見分けます。空の文字列は `false` を返します。

```ts
hasTrailingDirectorySeparator('src/')   // true
hasTrailingDirectorySeparator('src')    // false
hasTrailingDirectorySeparator('')       // false
```

## コード

```ts:line-numbers=140
export function hasTrailingDirectorySeparator(path: string): boolean {
    return path.length > 0 && isAnyDirectorySeparator(path.charCodeAt(path.length - 1));
}
```

## 前提知識

- **末尾の区切り**: フォルダを表すパスは、末尾に区切りを付けることがあります。ファイルのパスとの区別に使えます。
- **`charCodeAt(位置)`**: 指定した位置の文字コードを返します。`path.length - 1` は、最後の文字の位置です。
- **`isAnyDirectorySeparator`**: 文字コードが区切りかどうかを判定する、このファイルの前の関数です。
- **空文字列の扱い**: `path.length > 0` の条件で、空の文字列の最後の文字を読もうとして起きる問題を防いでいます。

## 何をしているか

### 1. 空でないことを確かめる

```ts:line-numbers=141
    return path.length > 0 && isAnyDirectorySeparator(path.charCodeAt(path.length - 1));
```

`path.length > 0` で、空の文字列を除きます。空の文字列には、最後の文字がありません。

### 2. 最後の文字が区切りかを判定する

同じ行の `isAnyDirectorySeparator(path.charCodeAt(path.length - 1))` の部分です。最後の文字の文字コードを取り出し、区切りの文字コードかを前の関数で判定します。

## ここがすごい

- **空の場合を先に除く**: 最後の位置は `length - 1` なので、空の文字列では `-1` という位置を読んでしまいます。先に `length > 0` を確かめることで、その誤りを防いでいます。
- **判定の部品を再利用**: 区切りかどうかの判定は、前の関数に任せています。区切りの定義が 1 か所にまとまっています。
- **文字コードで比べる**: 文字列の末尾を切り出して比べるより、1 文字の文字コードを比べる方が、無駄な文字列の作成がありません。
- **1 行の判定**: 2 つの条件を `&&` でつないだ、短い式です。

## まとめ

- 末尾の区切りの判定は、空の文字列を先に除いてから最後の文字を調べる。
- 区切りの定義は 1 か所にまとめ、他の関数はその判定を使う。
- 文字列を作らず、文字コードの比較で判定すると効率がよい。
- 配列や文字列の末尾を読むときは、空の場合の扱いを必ず確かめる。
