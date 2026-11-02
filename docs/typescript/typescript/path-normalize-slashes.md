---
title: "バックスラッシュを、すべてスラッシュに置き換える"
description: "TypeScript コンパイラの normalizeSlashes。パスに含まれる \ を / に置き換えて、区切りを統一する。バックスラッシュが無ければ元の文字列をそのまま返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [526, 530]
function: "normalizeSlashes"
difficulty: 1
format: 2
tags: [文字列処理, ファイル, イディオム]
---

## ひとことで

`normalizeSlashes(path)` は、パスの中のバックスラッシュ（`\`）をすべてスラッシュ（`/`）に置き換える関数です。Windows のパスを、内部では同じ形式で扱うために使われます。`'src\\index.ts'` は `'src/index.ts'` になります。

```ts
normalizeSlashes('src\\a\\b.ts')  // 'src/a/b.ts'
normalizeSlashes('src/a/b.ts')        // 'src/a/b.ts'（変わらない）
```

## コード

```ts:line-numbers=526
export function normalizeSlashes(path: string): string {
    return path.includes("\\")
        ? path.replace(backslashRegExp, directorySeparator)
        : path;
}
```

## 前提知識

- **バックスラッシュ**: Windows のパスの区切りです。文字列の中では `\\` と 2 つ書いて 1 つの `\` を表します。
- **正規表現による置換**: `replace` に正規表現を渡すと、一致した部分をまとめて置き換えられます。`backslashRegExp` は、バックスラッシュを探す正規表現です。
- **`includes`**: 文字列に指定の文字が含まれるかを判定します。含まれていなければ、置換の処理を省けます。
- **三項演算子**: `条件 ? A : B` の形で、条件によって値を選ぶ書き方です。

## 何をしているか

### 1. バックスラッシュがあるかを先に調べる

```ts:line-numbers=527
    return path.includes("\\")
```

`includes("\\")` で、バックスラッシュが含まれるかを確かめます。含まれていなければ、置換をせずに元の文字列を返します。

### 2. 含まれていれば、すべて置き換える

```ts:line-numbers=528
        ? path.replace(backslashRegExp, directorySeparator)
```

`replace(backslashRegExp, directorySeparator)` で、一致した部分をすべてスラッシュに置き換えます。`backslashRegExp` の `g` 指定によって、1 回ですべてが置き換わります。

## ここがすごい

- **変化がなければ何もしない**: 多くのパスはすでにスラッシュだけです。その場合は、正規表現による置換を行わず、元の文字列を返します。無駄な処理を省く、典型的な最適化です。
- **置き換え先を名前で表す**: `directorySeparator` という定数を使うので、区切りの文字を変えたいときは 1 か所を直せば済みます。
- **文字列の値は変えない**: JavaScript の文字列は書き換えられない値なので、置換は新しい文字列を作ります。元のパスはそのまま残ります。
- **比較的単純な規則**: 「すべての `\` を `/` にする」という 1 つの規則だけで、区切りの統一ができています。

## まとめ

- パスの区切りを統一するには、バックスラッシュを探してすべてスラッシュに置き換える。
- 置換が不要な場合は、先に含まれているかを確かめて処理を省くと効率的。
- 区切りの文字を定数で持つと、変更の影響が 1 か所に限られる。
- 正規表現の `g` 指定は、すべての一致を一度に置き換えるために必要。
