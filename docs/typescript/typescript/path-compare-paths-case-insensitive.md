---
title: "大文字と小文字を区別せずに、パスの順番を決める"
description: "TypeScript コンパイラの comparePathsCaseInsensitive。パスを区切りごとに比べ、大文字と小文字の違いを無視して並べ替えの順序を決める。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [934, 936]
function: "comparePathsCaseInsensitive"
difficulty: 2
format: 2
tags: [ソート, ファイル, 文字列処理]
---

## ひとことで

`comparePathsCaseInsensitive(a, b)` は、2 つのパスの順番を、大文字と小文字を区別せずに決める関数です。戻り値は `-1`（a が前）、`0`（同じ）、`1`（a が後）のいずれかです。Windows のように大文字小文字を区別しないファイルシステムで、パスを並べ替えるときに使われます。

```ts
comparePathsCaseInsensitive('src/A.ts', 'src/a.ts')  // 0（同じとみなす）
comparePathsCaseInsensitive('src/b.ts', 'src/A.ts')  // 1（b は A より後）
```

## コード

```ts:line-numbers=934
export function comparePathsCaseInsensitive(a: string, b: string): Comparison {
    return comparePathsWorker(a, b, compareStringsCaseInsensitive);
}
```

## 前提知識

- **比較関数（コンパレータ）**: 2 つの値を受け取り、前後の関係を `-1`、`0`、`1` で返す関数です。並べ替えの `sort` に渡して使います。
- **`Comparison`**: 比較の結果を表す型です。`-1`、`0`、`1` のどれかの値を持ちます。
- **大文字小文字の区別しない比較**: `A` と `a` を同じ文字とみなして比べます。ファイル名の検索などで使われます。
- **`comparePathsWorker`**: 区切りごとに比べる、この関数が呼んでいる内部の関数です。文字列の比べ方を、引数で差し替えられます。

## 何をしているか

### 1. 比べ方を差し替えて、共通の処理に任せる

```ts:line-numbers=935
    return comparePathsWorker(a, b, compareStringsCaseInsensitive);
```

実際の比較は、`comparePathsWorker` という共通の関数に任せます。その際、文字列の比べ方として `compareStringsCaseInsensitive` を渡します。

### 2. 結果をそのまま返す

この関数自体は、比べ方を選んで渡すだけです。区切りの扱いや、順番の決め方は、共通の関数が担当します。

## ここがすごい

- **比べ方を部品として渡す**: 「区切りで分けて比べる」という仕組みは 1 つだけ作り、「大文字小文字を区別するか」を差し替えるだけで 2 つの関数ができます。重複がありません。
- **小さな関数で用途を表す**: 名前の `CaseInsensitive` が、この関数の目的をはっきり伝えます。呼び出し側は、何を比べるのかを迷いません。
- **区切りごとの比較**: パスを文字列として比べると、`a/b` と `a-b` の順番がずれることがあります。区切りで分けて比べることで、フォルダの構造に沿った順番になります。
- **順番の一貫性**: 同じ規則で並べることで、並べ替えや検索の結果が毎回同じになります。

## まとめ

- 比較の仕組みを共通化し、比べ方だけを差し替えると、関数の重複を防げる。
- パスは区切りごとに比べると、フォルダの構造に沿った順番になる。
- 大文字小文字を区別しない比較は、ファイルシステムの性質に合わせるために必要。
- 関数の名前で目的を明示すると、呼び出し側が迷わない。
