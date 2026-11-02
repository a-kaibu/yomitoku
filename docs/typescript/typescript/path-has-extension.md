---
title: "ファイル名に拡張子が付いているかを、ドットの有無で調べる"
description: "TypeScript コンパイラの hasExtension。パスの最後の部分（ファイル名）にドットが含まれるかで、拡張子の有無を判定する。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [115, 117]
function: "hasExtension"
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, イディオム]
---

## ひとことで

`hasExtension(fileName)` は、ファイル名に拡張子（`.ts` や `.json` などの末尾の部分）が付いているかを判定する関数です。`'src/index.ts'` なら `true`、`'src/components'` なら `false` を返します。

```ts
hasExtension('src/index.ts')    // true
hasExtension('src/components')  // false
hasExtension('.gitignore')      // true（ドットを含むので、拡張子ありとみなす）
```

## コード

```ts:line-numbers=115
export function hasExtension(fileName: string): boolean {
    return getBaseFileName(fileName).includes(".");
}
```

## 前提知識

- **拡張子（extension）**: ファイル名の最後の `.` 以降の部分です。`index.ts` の拡張子は `ts` です。
- **ファイル名だけを取り出す**: `getBaseFileName` は、パスの最後の部分（フォルダ名を除いたファイル名）を返す関数です。このファイルの別の場所で定義されています。
- **`includes`**: 文字列に指定の文字列が含まれるかを判定するメソッドです。
- **ドットで始まるファイル名**: `.gitignore` のように、先頭にドットがあるファイル名もあります。拡張子の定義によっては、これは拡張子なしとみなされることもあります。

## 何をしているか

### 1. パスの最後の部分を取り出す

```ts:line-numbers=116
    return getBaseFileName(fileName).includes(".");
```

`getBaseFileName(fileName)` で、フォルダの部分を除いたファイル名を取り出します。`'src/index.ts'` なら `index.ts` です。

### 2. その中にドットがあるかを調べる

同じ行の `.includes(".")` の部分です。ドットが 1 つでも含まれていれば、拡張子があるとみなして `true` を返します。

## ここがすごい

- **フォルダのドットを無視する**: フォルダ名に `.` が含まれていても（たとえば `v1.2/`）、ファイル名だけを見るので誤判定しません。先にファイル名を切り出す、という順序が効いています。
- **1 行で完結**: 取り出しと判定を、2 つの関数の組み合わせで書いています。読み手はすぐに意味が分かります。
- **拡張子の正しさは問わない**: ドットがあるかだけを見ます。`.ts` が正しい拡張子かどうかは、別の関数の仕事です。役割が分かれています。
- **注意点**: `.gitignore` のような例もあるので、「ドットがあれば拡張子」という単純な規則は、常に正確とは限りません。用途を理解して使うことが大切です。

## まとめ

- 拡張子の有無は、フォルダを除いたファイル名にドットがあるかで判定できる。
- フォルダ名のドットに惑わされないよう、先にファイル名を切り出す。
- 判定の規則は単純な方が読みやすいが、例外があることも覚えておく。
- 役割を分けておくと（有無の判定と、拡張子の正しさの判定）、それぞれの関数が単純になる。
