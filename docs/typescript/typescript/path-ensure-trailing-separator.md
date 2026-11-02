---
title: "パスの末尾に区切りが無ければ付け足す"
description: "TypeScript コンパイラの ensureTrailingDirectorySeparator。末尾に区切りが無いときだけ、既定の区切りを付けて返す。フォルダのパスとして扱うための正規化。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [807, 813]
function: "ensureTrailingDirectorySeparator"
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, イディオム]
---

## ひとことで

`ensureTrailingDirectorySeparator(path)` は、パスの末尾に区切り文字が無ければ付け足して返す関数です。`'src'` は `'src/'` になり、すでに `'src/'` なら変わりません。前の関数 `removeTrailingDirectorySeparator` と対になる関数です。

```ts
ensureTrailingDirectorySeparator('src')   // 'src/'
ensureTrailingDirectorySeparator('src/')  // 'src/'（変わらない）
```

## コード

```ts:line-numbers=807
export function ensureTrailingDirectorySeparator(path: string) {
    if (!hasTrailingDirectorySeparator(path)) {
        return path + directorySeparator;
    }

    return path;
}
```

## 前提知識

- **`directorySeparator`**: TypeScript コンパイラが使う、既定の区切り文字の定数です。通常はスラッシュ `/` です。
- **対になる関数**: 片方が「取り除く」、もう片方が「付け足す」という関係です。どちらも、末尾の表記をそろえるために使います。
- **文字列の連結 `+`**: 2 つの文字列をつなげて、新しい文字列を作ります。
- **冪等（べきとう）性**: 何回呼んでも結果が同じになる性質です。この関数は、1 回でも 2 回でも、末尾の区切りは 1 つだけになります。

## 何をしているか

### 1. 末尾に区切りがあるかを確かめる

```ts:line-numbers=808
    if (!hasTrailingDirectorySeparator(path)) {
```

`hasTrailingDirectorySeparator` の否定で、区切りが無いかを調べます。無い場合だけ、次の処理に進みます。

### 2. 区切りを付け足す

```ts:line-numbers=809
        return path + directorySeparator;
```

既定の区切り文字を末尾に連結して返します。

### 3. 既にあれば、そのまま返す

```ts:line-numbers=812
    return path;
```

区切りが既にあれば、何もせず元の値を返します。

## ここがすごい

- **何度呼んでも安全**: 既に区切りがあるものには何も足さないので、2 回目以降の呼び出しで区切りが重なりません。冪等な関数になっています。
- **区切りの定数を使う**: 区切りの文字を `directorySeparator` という定数で持つので、環境ごとの違いも、この関数の外で扱えます。
- **判定と処理の分離**: 有無の判定は、前の関数に任せています。同じ判定を使い回すことで、規則のずれを防いでいます。
- **対になる関数の存在**: 取り除く関数と組で使うと、フォルダの表記を自由に行き来できます。

## まとめ

- 末尾の区切りは、無いときだけ付けると、重複を防げる。
- 何度呼んでも同じ結果になる（冪等な）関数は、正規化の道具として安全。
- 区切りの定数を使うと、環境の違いを 1 か所で扱える。
- 取り除く関数と付け足す関数を対で用意すると、表記の変換が自在になる。
