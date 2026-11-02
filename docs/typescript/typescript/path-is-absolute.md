---
title: "パスが絶対パスの形で始まるかを判定する"
description: "TypeScript のコンパイラの pathIsAbsolute は、パスにルートの部分があるかを調べて、絶対パスかどうかを判定する。ルートの長さを表す数が 0 でないことを見る。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [91, 93]
function: "pathIsAbsolute"
difficulty: 1
format: 2
tags: [文字列処理, 設計パターン]
---

## ひとことで

`pathIsAbsolute(path)` は、パスが絶対パスかどうかを判定する関数です。絶対パスは、`/src/a.ts` や `C:/a.ts` のように、どこから始まるかが決まっている書き方です。

```ts
pathIsAbsolute('/src/a.ts')  // true
pathIsAbsolute('./a.ts')     // false
```

## コード

```ts:line-numbers=91
export function pathIsAbsolute(path: string): boolean {
    return getEncodedRootLength(path) !== 0;
}
```

## 前提知識

- **絶対パス**: ルートから書いた、場所を一意に表すパスです。相対パスは、今いる場所を基準にした書き方です。
- **パスのルート**: パスの先頭にある、どこから始まるかを表す部分です。`/` や `C:` などがあります。
- **ルートの長さ**: `getEncodedRootLength` は、ルートの長さを数で返す同じファイルの関数です。ルートが無ければ 0 を返します。

## 何をしているか

### 1. ルートの長さが 0 でないかを確かめる

```ts:line-numbers=92
    return getEncodedRootLength(path) !== 0;
```

ルートの長さが 0 でなければ、パスにはルートがあるということです。その場合に `true` を返します。

## ここがすごい

- **判定の知識を一か所に**: ルートの読み方は `getEncodedRootLength` にまとめられ、この関数はその結果の 0 かどうかだけを見ます。
- **一行で意図が伝わる**: 「ルートが無い場合以外は絶対」という考え方が、`!== 0` の一つの比較で表されています。
- **URL も含む**: 前の `isUrl` と同じく、URL のルートも長さが 0 でないので、この関数は URL に対しても `true` になります。判定の範囲を理解しておくと、読み間違いがなくなります。

## まとめ

- `pathIsAbsolute` は、パスにルートがあるかで絶対パスかを判定する。
- ルートの長さが 0 でないかを、一つの比較で確かめる。
- URL もルートを持つので、`true` になることに注意する。
