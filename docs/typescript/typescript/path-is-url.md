---
title: "パスが URL の形かを判定する"
description: "TypeScript のコンパイラの isUrl は、パス文字列が URL かどうかを判定する。ルートの長さを表す数の符号を使い、URL の場合だけ負の値になる仕組み。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [50, 52]
function: "isUrl"
difficulty: 1
format: 2
tags: [文字列処理, 設計パターン]
---

## ひとことで

`isUrl(path)` は、与えられた文字列が `https://` のような URL の形をしているかを判定する関数です。

```ts
isUrl('https://example.com/a.ts')  // true
isUrl('./src/index.ts')            // false
```

## コード

```ts:line-numbers=50
export function isUrl(path: string): boolean {
    return getEncodedRootLength(path) < 0;
}
```

## 前提知識

- **パスのルート**: パスの先頭にある、「どこから始まるか」を表す部分です。`/` や `C:` や `https://host` などがあります。
- **符号付きの数**: この関数では、ルートの長さを数で表し、符号で種類を区別しています。
- **`getEncodedRootLength`**: 同じファイルの中にある関数で、パスのルートの長さを返します。URL の場合は負の値を返す決まりです。

## 何をしているか

### 1. ルートの長さを調べる

```ts:line-numbers=51
    return getEncodedRootLength(path) < 0;
```

`getEncodedRootLength` にパスを渡して、ルートの情報を数で受け取ります。URL のルートは負の数で表されるので、その符号を見るだけで判定できます。

## ここがすごい

- **判定の仕組みを 1 か所に集める**: URL かどうかの知識を、ルートを読む関数に任せています。同じ仕組みを他の関数も使えます。
- **一行で答えが出る**: 符号を見るだけなので、判定の中身が短く、読み間違いが起きにくくなっています。
- **符号で情報を運ぶ**: 1 つの数に「長さ」と「URL かどうか」の 2 つを入れる工夫です。

## まとめ

- `isUrl` は、パスが URL の形かを判定する。
- ルートの長さを表す数の符号を見て、負なら URL と判断する。
- 判定の知識はルートを読む関数に任せ、この関数は短く保たれている。
