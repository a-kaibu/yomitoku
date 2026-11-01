---
title: "比較 1 回で「0 以上 limit 未満」を確かめる添字チェック"
description: "リストの添字が範囲内かを調べる CPython の小さな関数。符号なし整数へのキャストを使い、2 回必要な比較を 1 回にまとめている。"
language: c
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: "Copyright (c) 2001 Python Software Foundation; All Rights Reserved"
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Objects/listobject.c
lines: [341, 352]
function: "valid_index"
difficulty: 1
format: 2
tags: [ビット演算, 最適化, イディオム, 防御的プログラミング]
---

## ひとことで

`valid_index` は、添字 `i` が「`0 <= i < limit`」の範囲に入っているかを調べる関数です。Python の `lst[i]` のような処理の内側で、範囲外アクセスを防ぐために使われます。
ふつうなら「0 以上か」「limit 未満か」の 2 回の比較が要りますが、この関数は **符号なし整数への変換** を使って比較を 1 回にしています。

## コード

::: code-group

```c:line-numbers=341 [日本語訳]
static inline int
valid_index(Py_ssize_t i, Py_ssize_t limit)
{
    /* size_t へキャストすれば、i が 0 <= i < limit の範囲にあるかを
       比較 1 回だけで確かめられる。

       参照: Agner Fog の最適化マニュアルの 14.2 節「境界チェック」
       マニュアルの場所:
       https://www.agner.org/optimize/optimizing_cpp.pdf
    */
    return (size_t) i < (size_t) limit;
}
```

```c:line-numbers=341 [原文]
static inline int
valid_index(Py_ssize_t i, Py_ssize_t limit)
{
    /* The cast to size_t lets us use just a single comparison
       to check whether i is in the range: 0 <= i < limit.

       See:  Section 14.2 "Bounds Checking" in the Agner Fog
       optimization manual found at:
       https://www.agner.org/optimize/optimizing_cpp.pdf
    */
    return (size_t) i < (size_t) limit;
}
```

:::

## 前提知識

- **`static inline`**: `static` は「この関数はこのファイルの中だけで使う」という意味です。`inline` は「呼び出し側に本体を埋め込んでよい」というコンパイラへのヒントで、小さな関数の呼び出しコストをなくせます。
- **`Py_ssize_t`**: CPython が長さや添字に使う **符号付き** 整数型です。負の値も表せます。64 ビット環境ではふつう 8 バイトです。
- **`size_t`**: サイズを表す **符号なし** 整数型です。負の値を持てません。`Py_ssize_t` と同じ大きさです。
- **キャスト `(size_t) i`**: 値を別の型として扱い直す書き方です。符号付きの負の数を符号なしに変換すると、C の規則では「2 の 64 乗を足した値」になります。たとえば `-1` は `18446744073709551615`（とても大きな数）になります。
- **2 の補数**: 現代の CPU が負の整数を表す方法です。`-1` はすべてのビットが 1 の並びで表されるので、符号なしとして読むと最大値になります。
- **`int` を真偽値として返す**: C の比較演算 `<` は、成り立てば `1`、成り立たなければ `0` という整数を返します。

## 何をしているか

### 1. 関数の形

```c:line-numbers=341
static inline int
valid_index(Py_ssize_t i, Py_ssize_t limit)
{
```
`static inline int` は、戻り値が `int`（真なら 1、偽なら 0）であることを表します。引数は調べたい添字 `i` と上限 `limit` です。`limit` にはリストの長さが渡されます。

### 2. コメントが種明かし

```c:line-numbers=344
    /* The cast to size_t lets us use just a single comparison
       to check whether i is in the range: 0 <= i < limit.

       See:  Section 14.2 "Bounds Checking" in the Agner Fog
       optimization manual found at:
       https://www.agner.org/optimize/optimizing_cpp.pdf
    */
```
コメントには「`size_t` へのキャストで、`0 <= i < limit` を 1 回の比較で確かめられる」と書かれています。出典として、Agner Fog 氏の最適化マニュアルの「境界チェック」の節が挙げられています。

### 3. 1 回の比較

```c:line-numbers=351
    return (size_t) i < (size_t) limit;
```
`return (size_t) i < (size_t) limit;` がこの関数のすべてです。具体的な値で追ってみます。`limit = 5`（長さ 5 のリスト）とします。

- `i = 3` のとき: `3 < 5` なので真。範囲内です。
- `i = 5` のとき: `5 < 5` は偽。範囲外です。
- `i = -1` のとき: `(size_t)-1` は `18446744073709551615` という巨大な数になります。`18446744073709551615 < 5` は偽なので、範囲外と判定されます。

このように、**負の数は符号なしにすると必ず巨大な数になる** ので、「limit 未満か」を調べるだけで「0 以上か」も同時に確かめられるのです。`limit` 自体は 0 以上の長さなので、符号なしにしても値は変わりません。

## ここがすごい

- **比較が 1 回になる**: 素直に書くと `return i >= 0 && i < limit;` です。`&&` は「左が偽なら右を評価しない」ので、コンパイラは分岐（条件ジャンプ）を作ることがあります。キャスト版は比較 1 回だけなので、分岐が減り、CPU の分岐予測の失敗も起きません。
- **名前で意図を伝える**: このトリックは一見すると何をしているかわかりにくい書き方です。そこで `valid_index` という名前の関数に閉じ込め、コメントで理由と出典を書いています。呼び出し側は `valid_index(i, Py_SIZE(a))` と書くだけで済み、読みやすさと速さを両立しています。
- **前提条件がはっきりしている**: このトリックは `limit` が 0 以上であることが前提です。リストの長さは負にならないので、この前提は常に成り立ちます。
- **ほかでも使われる**: 同じ考え方は CPython の別の場所にも出てきます。たとえば `collections.deque` の上限チェック（`NEEDS_TRIM` マクロ）も、符号なしへのキャスト 1 回で「0 以上かつ長さ未満」を調べています。

## まとめ

- 負の数を符号なし整数にキャストすると、とても大きな数になる。
- そのため `(size_t)i < (size_t)limit` だけで `0 <= i && i < limit` と同じ判定ができる。
- 比較と分岐が減るので、頻繁に呼ばれる境界チェックが速くなる。
- わかりにくいトリックは、名前のついた小さな関数とコメントに閉じ込めると安全に使える。
