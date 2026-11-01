---
title: "qsort の比較関数を型チェックさせる typesafe_qsort"
description: "標準の qsort は void * だらけで、間違った比較関数を渡しても気づけない。関数ポインタへの代入を 1 回挟むだけで、要素の型と比較関数の型をコンパイラに照合させる。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/basic/sort-util.h
lines: [27, 35]
function: "typesafe_qsort"
difficulty: 2
format: 2
tags: [ソート, マクロ, 型システム, 防御的プログラミング]
---

## ひとことで

`typesafe_qsort(p, n, func)` は、標準関数 `qsort` を **型安全に** 呼ぶためのマクロです。
`int a[5]` を並べ替えるなら `typesafe_qsort(a, 5, cmp_int);` と書くだけで、要素の大きさは自動で決まり、
比較関数が「`const int *` を 2 つ受け取る関数」でなければ、コンパイル時に警告やエラーになります。

## コード

::: code-group

```c:line-numbers=27 [日本語訳]
void qsort_safe(void *base, size_t nmemb, size_t size, comparison_fn_t compar);

/* 上の関数のラッパーだが、型安全性を加える: 要素のサイズは型から自動で導かれ、
 * 比較関数のプロトタイプも同様に導かれる */
#define typesafe_qsort(p, n, func)                                      \
        ({                                                              \
                int (*_func_)(const typeof((p)[0])*, const typeof((p)[0])*) = func; \
                qsort_safe((p), (n), sizeof((p)[0]), (comparison_fn_t) _func_); \
        })
```

```c:line-numbers=27 [原文]
void qsort_safe(void *base, size_t nmemb, size_t size, comparison_fn_t compar);

/* A wrapper around the above, but that adds typesafety: the element size is automatically derived from the type and so
 * is the prototype for the comparison function */
#define typesafe_qsort(p, n, func)                                      \
        ({                                                              \
                int (*_func_)(const typeof((p)[0])*, const typeof((p)[0])*) = func; \
                qsort_safe((p), (n), sizeof((p)[0]), (comparison_fn_t) _func_); \
        })
```

:::

## 前提知識

- **`qsort`**: C 標準ライブラリの並べ替え関数です。`qsort(配列, 要素数, 1 要素のバイト数, 比較関数)` のように呼びます。どんな型の配列でも扱えるよう、比較関数は `int (*)(const void *, const void *)`、つまり **型のない汎用ポインタ** を受け取る形と決まっています。
- **比較関数**: 2 つの要素を受け取り、「1 つ目が小さければ負、等しければ 0、大きければ正」を返す関数です。
- **関数ポインタ**: 関数のアドレスを入れる変数です。`int (*f)(const int *, const int *)` は「`const int *` を 2 つ受け取って `int` を返す関数」を指す変数 `f` の宣言です。型が合わない関数を代入しようとすると、コンパイラが警告を出します（systemd はこうした警告をエラー扱いにする設定でビルドされます）。
- **キャスト `(型) 値`**: 値を別の型として扱うよう、強制的に変換します。
- **`typeof((p)[0])`**: GCC/Clang 拡張で、配列 `p` の要素の型を取り出します。`int a[5]` なら `int` です。
- **`({ ... })`（文式）**: 中の文を実行してまとめる GCC 拡張です。

## 何をしているか

### 1. 土台の qsort_safe

```c:line-numbers=27
void qsort_safe(void *base, size_t nmemb, size_t size, comparison_fn_t compar);
```

`qsort_safe` は `src/basic/sort-util.c` にある関数で、要素数が 1 以下なら何もせず、それ以外は `qsort` を呼びます。
標準の `qsort` は要素数が 0 でも配列のポインタに `NULL` を渡すことを許していないので、その面倒を吸収しています。

### 2. 比較関数の型を一度チェックする

```c:line-numbers=31
#define typesafe_qsort(p, n, func)                                      \
        ({                                                              \
                int (*_func_)(const typeof((p)[0])*, const typeof((p)[0])*) = func; \
```

`typesafe_qsort` の中で、まず関数ポインタ変数 `_func_` を宣言します。`p` が `int` の配列なら、これは「`const int *` を 2 つ受け取る関数ポインタ」です。ここに `func` を代入するので、

- `func` が `int cmp_int(const int *a, const int *b)` なら、型が一致して問題なし。
- `func` が `const char *` を受け取る関数なら、型が合わないとコンパイラが指摘します。

### 3. qsort が求める形に変換して渡す

```c:line-numbers=34
                qsort_safe((p), (n), sizeof((p)[0]), (comparison_fn_t) _func_); \
        })
```

チェックが済んだ `_func_` を `(comparison_fn_t)` で汎用の比較関数型にキャストし、`qsort_safe` に渡します。
要素の大きさは `sizeof((p)[0])` で自動的に求めます。

## ここがすごい

- **`void *` の世界に型を持ち込む**: 標準の `qsort` に比較関数を渡すとき、比較関数側では `const void *` を自分でキャストし直すのが普通です。この方式では、要素が `int` なのに `long` として読む、といった間違いを書いてもコンパイラは何も言いません。`typesafe_qsort` は、比較関数を **最初から正しい型で書かせ**、それが配列の要素型と合っているかを照合します。
- **代入 1 回だけのチェック**: 型を確かめるための特別な仕組みは使っていません。「関数ポインタ変数への代入では型が照合される」という C の普通のルールを、検査のためだけに利用しています。実行時のコストはありません。
- **サイズを書き間違えない**: `qsort(a, n, sizeof(int), ...)` の `sizeof(int)` は、配列の型を変えたときに直し忘れがちです。`sizeof((p)[0])` なら、配列の型に自動で追従します。
- **比較関数が読みやすくなる**: 比較関数を `int cmp_int(const int *a, const int *b) { return CMP(*a, *b); }` のように素直に書けます。中でキャストする必要がありません。
- **トレードオフ**: 最後に関数ポインタを別の型へキャストして呼び出す点は、厳密には C の規格では未定義の動作に当たります。ポインタの表現がすべて同じである Linux 上の GCC/Clang では問題なく動くという前提の上に立った、実用的な割り切りです。

## まとめ

- 標準の `qsort` は `void *` で汎用化されているため、比較関数の型の誤りを検出できない。
- 正しい型の関数ポインタ変数に一度代入すると、コンパイラに型を照合させられる。
- 要素サイズを `sizeof((p)[0])` で求めれば、配列の型の変更に自動で追従する。
- 空の配列や要素 1 個のときの扱いは、`qsort_safe` が吸収している。
