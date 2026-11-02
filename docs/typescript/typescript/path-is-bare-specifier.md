---
title: "パッケージ名のように書かれたパスかを判定する"
description: "TypeScript のコンパイラの pathIsBareSpecifier は、絶対パスでも相対パスでもない指定を、パッケージ名として判定する。二つの判定を組み合わせた短い関数。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [110, 112]
function: "pathIsBareSpecifier"
difficulty: 1
format: 2
tags: [設計パターン, 文字列処理]
---

## ひとことで

`pathIsBareSpecifier(path)` は、絶対パスでも相対パスでもない指定かを判定する関数です。`react` や `lodash/fp` のように、パッケージの名前で書かれた指定がこれに当たります。

```ts
pathIsBareSpecifier('react')       // true
pathIsBareSpecifier('./local')     // false
pathIsBareSpecifier('/abs/path')   // false
```

## コード

```ts:line-numbers=110
export function pathIsBareSpecifier(path: string): boolean {
    return !pathIsAbsolute(path) && !pathIsRelative(path);
}
```

## 前提知識

- **絶対パス**: ルートから書いた、場所を一意に表すパスです。`/` や `C:` で始まります。
- **相対パス**: 前の関数で扱った、`./` や `../` で始まるパスです。
- **バンドルの指定**: `import` で書く `react` のような名前は、コンパイラが node_modules などから探す対象です。この指定を、ファイルの場所とは区別して扱う必要があります。

## 何をしているか

### 1. 絶対でも相対でもないことを確かめる

```ts:line-numbers=111
    return !pathIsAbsolute(path) && !pathIsRelative(path);
```

まず `pathIsAbsolute` で絶対パスでないことを確かめ、次に `pathIsRelative` で相対パスでもないことを確かめます。両方に当てはまらないものだけが、パッケージの指定になります。

## ここがすごい

- **既存の判定を組み合わせる**: 新しく文字列を調べず、2 つの判定を論理の `&&` で組み合わせています。ルールが変わっても、元の判定だけ直せば済みます。
- **否定の形で言い切る**: 「パッケージ名」を直接調べるのではなく、「それ以外」として定義しているので、取りこぼしが少なくなります。
- **読むだけで意図が分かる**: 名前が示す通りの定義で、短く書かれています。

## まとめ

- `pathIsBareSpecifier` は、パッケージ名のように書かれた指定を判定する。
- 絶対パスでも相対パスでもないものを、そう見なす。
- 既存の 2 つの判定を組み合わせて、短く定義されている。
