---
title: "パスが相対パスの形で始まるかを判定する"
description: "TypeScript のコンパイラの pathIsRelative は、パスが ./ や ../ で始まるかを正規表現で判定する。Windows の区切り文字も両方受け付けている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [100, 102]
function: "pathIsRelative"
difficulty: 1
format: 2
tags: [文字列処理]
---

## ひとことで

`pathIsRelative(path)` は、パスが `./` や `../` で始まる相対パスの形かを判定する関数です。

```ts
pathIsRelative('./a.ts')    // true
pathIsRelative('../a.ts')   // true
pathIsRelative('lodash')    // false
```

## コード

```ts:line-numbers=100
export function pathIsRelative(path: string): boolean {
    return /^\.\.?(?:$|[\\/])/.test(path);
}
```

## 前提知識

- **正規表現**: 文字列の形を、記号の組み合わせで表す書き方です。`test` メソッドで、文字列が形に合うかを調べます。
- **相対パス**: 今いる場所を基準にした、ファイルの場所の書き方です。`./` は同じフォルダ、`../` は 1 つ上のフォルダを表します。
- **区切り文字**: パスの中で、フォルダを分ける記号です。Unix では `/`、Windows では `\` も使われます。

## 何をしているか

### 1. 先頭の形を調べる

```ts:line-numbers=101
    return /^\.\.?(?:$|[\\/])/.test(path);
```

```ts
return /^\.\.?(?:$|[\\/])/.test(path);
```

先頭が `.` か `..` で、その後に文字列の終わりか区切り文字が続くかを調べます。`.foo` のような名前は、ここで弾かれます。

## ここがすごい

- **名前とパスを区別できる**: `./` で始まるものだけを相対パスとみなし、`.eslintrc` のような普通の名前を誤って相対扱いしません。
- **両方の区切り文字に対応**: `/` と `\` の両方を受け付けるので、OS によらず同じ判定になります。
- **一行で完結**: 形を 1 つの式で書いているので、判定の範囲が一目で分かります。

## まとめ

- `pathIsRelative` は、パスが `./` か `../` で始まるかを判定する。
- 正規表現で、先頭の形と区切り文字の種類を同時に調べる。
- `.foo` のような普通の名前を、相対パスと取り違えないようになっている。
