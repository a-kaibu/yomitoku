---
title: "解放関数から「自動後片付け関数」を量産するマクロ"
description: "hashmap_free のような解放関数を 1 行渡すだけで、_cleanup_ 属性に使える hashmap_freep を生成するマクロ群。## による名前の連結の好例。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/cleanup-util.h
lines: [13, 34]
function: "DEFINE_TRIVIAL_CLEANUP_FUNC"
difficulty: 2
format: 2
tags: [マクロ, メモリ管理, イディオム, メタプログラミング]
---

## ひとことで

systemd では、変数に `_cleanup_(xxxp)` という属性を付けると、スコープを抜けたときに `xxxp(&変数)` が自動で呼ばれます。
ただ、型ごとに `xxxp` を手で書くのは面倒です。そこで `DEFINE_TRIVIAL_CLEANUP_FUNC(Hashmap*, hashmap_free);` と 1 行書くだけで、
`hashmap_freep` という後片付け関数を **自動生成** するのがこのマクロ群です。

## コード

::: code-group

```c:line-numbers=13 [日本語訳]
/* func() が適切な型の「空」の値（NULL、-1 など）を返す場合 */
#define DEFINE_TRIVIAL_CLEANUP_FUNC(type, func)         \
        static inline void func##p(type *p) {           \
                if (*p)                                 \
                        *p = func(*p);                  \
        }

/* func() が適切な型を返さない場合は、後で変数を空にする。func() は動的に読み込まれた（dlopen()）
 * 共有ライブラリが提供するものかもしれないので、assert を入れておく。 */
#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, name, empty) \
        static inline void name(type *p) {                              \
                if (*p != (empty)) {                                    \
                        DISABLE_WARNING_ADDRESS;                        \
                        assert(func);                                   \
                        REENABLE_WARNING;                               \
                        func(*p);                                       \
                        *p = (empty);                                   \
                }                                                       \
        }

#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL(type, func, empty)             \
        DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, func##p, empty)
```

```c:line-numbers=13 [原文]
/* When func() returns the void value (NULL, -1, …) of the appropriate type */
#define DEFINE_TRIVIAL_CLEANUP_FUNC(type, func)         \
        static inline void func##p(type *p) {           \
                if (*p)                                 \
                        *p = func(*p);                  \
        }

/* When func() doesn't return the appropriate type, set variable to empty afterwards. The func() may be
 * provided by a dynamically loaded (dlopen()) shared library, hence add an assertion. */
#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, name, empty) \
        static inline void name(type *p) {                              \
                if (*p != (empty)) {                                    \
                        DISABLE_WARNING_ADDRESS;                        \
                        assert(func);                                   \
                        REENABLE_WARNING;                               \
                        func(*p);                                       \
                        *p = (empty);                                   \
                }                                                       \
        }

#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL(type, func, empty)             \
        DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, func##p, empty)
```

:::

## 前提知識

- **ポインタと `*p`**: ポインタはメモリ上の場所を持つ変数で、`*p` は「`p` が指している場所の中身」です。`type *p` は「`type` 型の値を指すポインタ」です。
- **`__attribute__((cleanup(f)))`**: GCC/Clang の拡張で、この属性付きのローカル変数がスコープを抜けるとき、`f(&変数)` を自動で呼びます。systemd では `_cleanup_(f)` というマクロで書きます。後片付け関数は **変数のアドレス** を受け取るので、`type` が `Hashmap*` なら引数は `Hashmap**` になります。
- **マクロとバックスラッシュ**: `#define` で定義する置き換え規則です。行末の `\` は「次の行も同じマクロの続き」という意味です。
- **`##`（トークン連結）**: マクロの中で 2 つの字句をくっつけて 1 つの名前にします。`func##p` は、`func` が `hashmap_free` なら `hashmap_freep` になります。
- **`static inline`**: ファイル内だけで見える、呼び出し箇所に展開できる小さな関数を作る定番の書き方です。ヘッダに書いても複数ファイルで衝突しません。
- **`assert`**: 条件が偽ならプログラムを止めるチェックです。

## 何をしているか

### 1. いちばん単純な形

```c:line-numbers=13
/* When func() returns the void value (NULL, -1, …) of the appropriate type */
#define DEFINE_TRIVIAL_CLEANUP_FUNC(type, func)         \
        static inline void func##p(type *p) {           \
                if (*p)                                 \
                        *p = func(*p);                  \
        }
```

`DEFINE_TRIVIAL_CLEANUP_FUNC(Hashmap*, hashmap_free)` と書くと、次の関数が生成されます。

```c
static inline void hashmap_freep(Hashmap* *p) {
        if (*p)
                *p = hashmap_free(*p);
}
```

`*p` が `NULL` でなければ `func` を呼び、その **戻り値を変数に書き戻します**。
systemd の解放関数は `hashmap_free` のように「解放したあと `NULL` を返す」作法で書かれているので、変数は自動的に `NULL` になります。
直前のコメント「func() が適切な型の空の値（NULL、-1 など）を返す場合」は、この作法を前提にしているという意味です。

### 2. 戻り値を使えない関数向け

```c:line-numbers=22
#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, name, empty) \
        static inline void name(type *p) {                              \
                if (*p != (empty)) {                                    \
                        DISABLE_WARNING_ADDRESS;                        \
                        assert(func);                                   \
                        REENABLE_WARNING;                               \
                        func(*p);                                       \
                        *p = (empty);                                   \
                }                                                       \
        }
```

`closedir` や `pclose` のような標準ライブラリの関数は `int` を返すので、戻り値を書き戻せません。
そこでこの版は、関数を呼んだあと自分で `*p = (empty);` と空の値を代入します。
比較も `*p != (empty)` なので、空の値が `NULL` でも `-1` でも使えます。

`assert(func)` は、関数が実行時に `dlopen`（共有ライブラリを後から読み込む仕組み）で得たポインタかもしれないので、それが `NULL` でないことを確かめています。
普通の関数名を `assert` に渡すと「常に真だよ」という警告が出るため、`DISABLE_WARNING_ADDRESS` と `REENABLE_WARNING` でその警告だけを一時的に止めています。

### 3. 名前を自動で決める版

```c:line-numbers=33
#define DEFINE_TRIVIAL_CLEANUP_FUNC_FULL(type, func, empty)             \
        DEFINE_TRIVIAL_CLEANUP_FUNC_FULL_RENAME(type, func, func##p, empty)
```

`DEFINE_TRIVIAL_CLEANUP_FUNC_FULL(type, func, empty)` は、名前を `func##p` にして `_RENAME` 版を呼ぶだけです。
実際に `src/basic/fd-util.h` には `DEFINE_TRIVIAL_CLEANUP_FUNC_FULL(DIR*, closedir, NULL);` とあり、これで `closedirp` が生まれます。

## ここがすごい

- **規約とマクロの合わせ技**: 「解放関数は `NULL` を返す」というプロジェクト内の規約があるからこそ、`if (*p) *p = func(*p);` だけの最小形が成り立ちます。規約に従わない外部の関数には `_FULL` 版を使う、という二段構えです。
- **二重解放を防ぐ**: 後片付けのあと変数が必ず空の値になるので、同じ変数を誤ってもう一度解放しても `if (*p)` で止まります。
- **名前の規則が自動で揃う**: `hashmap_free` に対して `hashmap_freep`、`closedir` に対して `closedirp` と、「末尾に p」という規則がマクロで強制されます。読む側は `_cleanup_(xxxp)` を見るだけで、何が呼ばれるか予想できます。
- **手書きとの比較**: 型ごとに 4〜5 行の関数を書くと、数百の型でコピペが増え、`NULL` チェックを忘れるなどのミスも入り込みます。マクロにすると 1 行で済み、挙動もすべての型で同じになります。

## まとめ

- `##` を使うと、マクロの引数から新しい関数名を組み立てられる。
- 「解放関数は空の値を返す」という規約があると、後片付け関数を機械的に生成できる。
- 戻り値が使えない関数には、空の値を自分で代入する `_FULL` 版を使い分ける。
- 後片付け後に変数を空にしておくと、二重解放を防げる。
