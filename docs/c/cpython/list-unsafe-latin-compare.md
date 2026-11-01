---
title: "1 バイト文字の文字列比較を memcmp 一発で済ませるソート用比較関数"
description: "リストの要素がすべて 1 バイト文字の文字列だとわかっているとき、Python のソートが使う特別な比較関数。型チェックを省き、C の memcmp でまとめて比べる。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [2887, 2909]
function: "unsafe_latin_compare"
difficulty: 2
format: 2
tags: [ソート, 文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`unsafe_latin_compare` は、Python の `list.sort()` が「リストの要素は全部、1 文字 1 バイトで表せる文字列（Latin-1 の範囲）だ」と事前に確認できたときだけ使う比較関数です。
`v < w` なら 1、そうでなければ 0 を返します。たとえば `"apple" < "apricot"` は、先頭 2 文字が同じで 3 文字目 `p` と `r` を比べ、`p` が小さいので 1 です。汎用の比較を通さず、C 標準の `memcmp` でバイト列をまとめて比べるので速くなります。

## コード

::: code-group

```c:line-numbers=2887 [日本語訳]
/* Latin 文字列の比較: 1 文字 1 バイトの文字列どうしなら安全。 */
static int
unsafe_latin_compare(PyObject *v, PyObject *w, MergeState *ms)
{
    Py_ssize_t len;
    int res;

    /* Objects/unicodeobject.c の unicode_compare を、次の前提で改変したもの: */
    assert(Py_IS_TYPE(v, &PyUnicode_Type));
    assert(Py_IS_TYPE(w, &PyUnicode_Type));
    assert(PyUnicode_KIND(v) == PyUnicode_KIND(w));
    assert(PyUnicode_KIND(v) == PyUnicode_1BYTE_KIND);

    len = Py_MIN(PyUnicode_GET_LENGTH(v), PyUnicode_GET_LENGTH(w));
    res = memcmp(PyUnicode_DATA(v), PyUnicode_DATA(w), len);

    res = (res != 0 ?
           res < 0 :
           PyUnicode_GET_LENGTH(v) < PyUnicode_GET_LENGTH(w));

    assert_compare_consistent(v, w, res);
    return res;
}
```

```c:line-numbers=2887 [原文]
/* Latin string compare: safe for any two latin (one byte per char) strings. */
static int
unsafe_latin_compare(PyObject *v, PyObject *w, MergeState *ms)
{
    Py_ssize_t len;
    int res;

    /* Modified from Objects/unicodeobject.c:unicode_compare, assuming: */
    assert(Py_IS_TYPE(v, &PyUnicode_Type));
    assert(Py_IS_TYPE(w, &PyUnicode_Type));
    assert(PyUnicode_KIND(v) == PyUnicode_KIND(w));
    assert(PyUnicode_KIND(v) == PyUnicode_1BYTE_KIND);

    len = Py_MIN(PyUnicode_GET_LENGTH(v), PyUnicode_GET_LENGTH(w));
    res = memcmp(PyUnicode_DATA(v), PyUnicode_DATA(w), len);

    res = (res != 0 ?
           res < 0 :
           PyUnicode_GET_LENGTH(v) < PyUnicode_GET_LENGTH(w));

    assert_compare_consistent(v, w, res);
    return res;
}
```

:::

## 前提知識

- **CPython の文字列の内部表現**: CPython は文字列を、中に含まれる文字に応じて 1 文字 1 バイト・2 バイト・4 バイトのどれかで保存します。`PyUnicode_KIND` がその種類を返し、`PyUnicode_1BYTE_KIND` は 1 バイト版（U+0000〜U+00FF の文字だけ）です。
- **`memcmp(p, q, len)`**: C の標準関数で、メモリ上の `len` バイトを先頭から比べます。`p` 側が小さければ負、同じなら 0、大きければ正を返します。CPU 向けに高度に最適化されています。
- **`PyUnicode_DATA`, `PyUnicode_GET_LENGTH`**: 文字列の中身（バイト列）の先頭アドレスと、文字数を返すマクロです。
- **`Py_MIN(a, b)`**: 小さいほうを返すマクロです。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` を値として返します。
- **`assert`**: 開発用ビルドだけで有効なチェックです。ここでは「前提が本当に成り立っているか」を確かめるために使われ、製品ビルドでは消えます。
- **"unsafe" の意味**: 型の確認を自分ではしないので、前提が崩れた入力に使うと誤動作します。呼び出し側（`list.sort` の事前チェック）が安全を保証しています。

## 何をしているか

### 1. 前提の確認

```c:line-numbers=2895
    assert(Py_IS_TYPE(v, &PyUnicode_Type));
    assert(Py_IS_TYPE(w, &PyUnicode_Type));
    assert(PyUnicode_KIND(v) == PyUnicode_KIND(w));
    assert(PyUnicode_KIND(v) == PyUnicode_1BYTE_KIND);
```
両方が文字列型であること、文字の種類が同じであること、それが 1 バイト版であることを `assert` で確かめます。これらは `list.sort` が並べ替えの前に全要素を調べて保証している条件です。

### 2. 短いほうの長さまで memcmp

```c:line-numbers=2900
    len = Py_MIN(PyUnicode_GET_LENGTH(v), PyUnicode_GET_LENGTH(w));
    res = memcmp(PyUnicode_DATA(v), PyUnicode_DATA(w), len);
```
2 つの文字列の短いほうの長さ `len` を求め、その範囲を `memcmp` で比べます。1 文字 1 バイトなので、文字数とバイト数が一致し、バイトの大小と文字コードの大小も一致します。

### 3. 結果を 0/1 に直す

```c:line-numbers=2903
    res = (res != 0 ?
           res < 0 :
           PyUnicode_GET_LENGTH(v) < PyUnicode_GET_LENGTH(w));
```
- `memcmp` の結果が 0 でなければ、どこかで違う文字があったということです。`res < 0`（`v` が小さい）なら 1、そうでなければ 0 にします。
- 0 なら、短いほうの長さまでは完全に一致しています。この場合は **短いほうが小さい** と決まります。`"app"` と `"apple"` なら、`"app"` のほうが小さいので、長さの比較 `len(v) < len(w)` が答えです。

### 4. 開発用の検算

```c:line-numbers=2907
    assert_compare_consistent(v, w, res);
```
`assert_compare_consistent` は、デバッグビルドで汎用の比較と結果が一致するかを確かめる仕組みです。

## ここがすごい

- **事前チェックで汎用処理を省く**: 通常の比較 `PyObject_RichCompareBool` は、型を調べ、`__lt__` メソッドを探し、結果を Python の `True`/`False` オブジェクトとして受け取ってから真偽に直します。ソートでは比較が n log n 回ほど行われるので、この手間が積み重なります。`list.sort` は最初に一度だけ「全要素が同じ型か」を調べ、条件を満たせばこの専用関数に切り替えます。
- **memcmp に任せる**: 1 文字ずつのループを書く代わりに、C ライブラリの `memcmp` を使います。`memcmp` は多くの環境で複数バイトをまとめて比べる実装になっています。
- **1 バイト版に限る理由**: 2 バイト・4 バイト版では、メモリ上のバイトの並び順（エンディアン）によって `memcmp` の結果が文字の大小と一致しないことがあります。1 バイト版ならその心配がありません。
- **安全性を assert と命名で表す**: 名前に `unsafe_` を付け、前提を `assert` で書くことで、「この関数を使ってよい条件」がコードから読み取れます。

## まとめ

- ソート前に要素の型を一度だけ調べれば、比較のたびの型チェックを省ける。
- 1 バイト文字の文字列は、バイト列として `memcmp` で比べれば文字列としての大小になる。
- 共通部分が一致したら、短いほうが小さい。
- 「速いが危険な」関数は、名前と `assert` で使用条件を明示しておく。
