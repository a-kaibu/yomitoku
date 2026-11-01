---
title: "「x がこのどれかか」を switch に変える IN_SET マクロ"
description: "IN_SET(x, 'a', 'b', 'c') と書くと、可変長引数の個数を数えて case ラベルの列を生成する。プリプロセッサだけで引数の数を数える古典的テクニックの実例。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [374, 418]
function: "IN_SET"
difficulty: 3
format: 2
tags: [マクロ, メタプログラミング, ハック, 最適化]
---

## ひとことで

`IN_SET(x, 1, 2, 3)` は、「`x` が 1、2、3 のどれかなら真」を返すマクロです。
`x == 1 || x == 2 || x == 3` と書く代わりに使え、systemd のコードの至るところに登場します。
中身は、引数の個数をプリプロセッサで数えて、**`switch` 文の `case` ラベルを自動生成** するという凝った仕組みです。

## コード

::: code-group

```c:line-numbers=374 [日本語訳]
#define  CASE_F_1(X)      case X:
#define  CASE_F_2(X, ...) case X:  CASE_F_1( __VA_ARGS__)
#define  CASE_F_3(X, ...) case X:  CASE_F_2( __VA_ARGS__)
#define  CASE_F_4(X, ...) case X:  CASE_F_3( __VA_ARGS__)
#define  CASE_F_5(X, ...) case X:  CASE_F_4( __VA_ARGS__)
#define  CASE_F_6(X, ...) case X:  CASE_F_5( __VA_ARGS__)
#define  CASE_F_7(X, ...) case X:  CASE_F_6( __VA_ARGS__)
#define  CASE_F_8(X, ...) case X:  CASE_F_7( __VA_ARGS__)
#define  CASE_F_9(X, ...) case X:  CASE_F_8( __VA_ARGS__)
#define CASE_F_10(X, ...) case X:  CASE_F_9( __VA_ARGS__)
#define CASE_F_11(X, ...) case X: CASE_F_10( __VA_ARGS__)
#define CASE_F_12(X, ...) case X: CASE_F_11( __VA_ARGS__)
#define CASE_F_13(X, ...) case X: CASE_F_12( __VA_ARGS__)
#define CASE_F_14(X, ...) case X: CASE_F_13( __VA_ARGS__)
#define CASE_F_15(X, ...) case X: CASE_F_14( __VA_ARGS__)
#define CASE_F_16(X, ...) case X: CASE_F_15( __VA_ARGS__)
#define CASE_F_17(X, ...) case X: CASE_F_16( __VA_ARGS__)
#define CASE_F_18(X, ...) case X: CASE_F_17( __VA_ARGS__)
#define CASE_F_19(X, ...) case X: CASE_F_18( __VA_ARGS__)
#define CASE_F_20(X, ...) case X: CASE_F_19( __VA_ARGS__)
#define CASE_F_21(X, ...) case X: CASE_F_20( __VA_ARGS__)
#define CASE_F_22(X, ...) case X: CASE_F_21( __VA_ARGS__)

#define GET_CASE_F(_1,_2,_3,_4,_5,_6,_7,_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20,_21,_22,NAME,...) NAME
#define FOR_EACH_MAKE_CASE(...) \
        GET_CASE_F(__VA_ARGS__,CASE_F_22,CASE_F_21,CASE_F_20,CASE_F_19,CASE_F_18,CASE_F_17,CASE_F_16,CASE_F_15,CASE_F_14,CASE_F_13,CASE_F_12, \
                               CASE_F_11,CASE_F_10,CASE_F_9,CASE_F_8,CASE_F_7,CASE_F_6,CASE_F_5,CASE_F_4,CASE_F_3,CASE_F_2,CASE_F_1) \
                   (__VA_ARGS__)

#define IN_SET(x, first, ...)                                           \
        ({                                                              \
                bool _found = false;                                    \
                /* ビルドが下の行で失敗したら、case マクロを増やす必要がある。typeof(+x) を使うのは、 \
                 * x がビットフィールドだとそのままでは不正になるので、型を広げるため。 */      \
                static const typeof(+x) __assert_in_set[] _unused_ = { first, __VA_ARGS__ }; \
                assert_cc(ELEMENTSOF(__assert_in_set) <= 22);           \
                switch (x) {                                            \
                FOR_EACH_MAKE_CASE(first, __VA_ARGS__)                  \
                        _found = true;                                  \
                        break;                                          \
                default:                                                \
                        ;                                               \
                }                                                       \
                _found;                                                 \
        })
```

```c:line-numbers=374 [原文]
#define  CASE_F_1(X)      case X:
#define  CASE_F_2(X, ...) case X:  CASE_F_1( __VA_ARGS__)
#define  CASE_F_3(X, ...) case X:  CASE_F_2( __VA_ARGS__)
#define  CASE_F_4(X, ...) case X:  CASE_F_3( __VA_ARGS__)
#define  CASE_F_5(X, ...) case X:  CASE_F_4( __VA_ARGS__)
#define  CASE_F_6(X, ...) case X:  CASE_F_5( __VA_ARGS__)
#define  CASE_F_7(X, ...) case X:  CASE_F_6( __VA_ARGS__)
#define  CASE_F_8(X, ...) case X:  CASE_F_7( __VA_ARGS__)
#define  CASE_F_9(X, ...) case X:  CASE_F_8( __VA_ARGS__)
#define CASE_F_10(X, ...) case X:  CASE_F_9( __VA_ARGS__)
#define CASE_F_11(X, ...) case X: CASE_F_10( __VA_ARGS__)
#define CASE_F_12(X, ...) case X: CASE_F_11( __VA_ARGS__)
#define CASE_F_13(X, ...) case X: CASE_F_12( __VA_ARGS__)
#define CASE_F_14(X, ...) case X: CASE_F_13( __VA_ARGS__)
#define CASE_F_15(X, ...) case X: CASE_F_14( __VA_ARGS__)
#define CASE_F_16(X, ...) case X: CASE_F_15( __VA_ARGS__)
#define CASE_F_17(X, ...) case X: CASE_F_16( __VA_ARGS__)
#define CASE_F_18(X, ...) case X: CASE_F_17( __VA_ARGS__)
#define CASE_F_19(X, ...) case X: CASE_F_18( __VA_ARGS__)
#define CASE_F_20(X, ...) case X: CASE_F_19( __VA_ARGS__)
#define CASE_F_21(X, ...) case X: CASE_F_20( __VA_ARGS__)
#define CASE_F_22(X, ...) case X: CASE_F_21( __VA_ARGS__)

#define GET_CASE_F(_1,_2,_3,_4,_5,_6,_7,_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20,_21,_22,NAME,...) NAME
#define FOR_EACH_MAKE_CASE(...) \
        GET_CASE_F(__VA_ARGS__,CASE_F_22,CASE_F_21,CASE_F_20,CASE_F_19,CASE_F_18,CASE_F_17,CASE_F_16,CASE_F_15,CASE_F_14,CASE_F_13,CASE_F_12, \
                               CASE_F_11,CASE_F_10,CASE_F_9,CASE_F_8,CASE_F_7,CASE_F_6,CASE_F_5,CASE_F_4,CASE_F_3,CASE_F_2,CASE_F_1) \
                   (__VA_ARGS__)

#define IN_SET(x, first, ...)                                           \
        ({                                                              \
                bool _found = false;                                    \
                /* If the build breaks in the line below, you need to extend the case macros. We use typeof(+x) \
                 * here to widen the type of x if it is a bit-field as this would otherwise be illegal. */      \
                static const typeof(+x) __assert_in_set[] _unused_ = { first, __VA_ARGS__ }; \
                assert_cc(ELEMENTSOF(__assert_in_set) <= 22);           \
                switch (x) {                                            \
                FOR_EACH_MAKE_CASE(first, __VA_ARGS__)                  \
                        _found = true;                                  \
                        break;                                          \
                default:                                                \
                        ;                                               \
                }                                                       \
                _found;                                                 \
        })
```

:::

## 前提知識

- **`switch` と `case`**: `switch (x) { case 1: case 2: ...; break; default: ... }` は、`x` の値に応じて処理を分ける文です。`case` は続けて並べると「どれかに当てはまれば」の意味になります。`case` の値は **コンパイル時の定数** でなければなりません。
- **可変長引数マクロ**: `#define F(x, ...)` の `...` は任意個の引数を受け取り、本体では `__VA_ARGS__` で参照できます。
- **マクロの再帰的な展開**: マクロ A の展開結果に別のマクロ B が含まれていれば、B もさらに展開されます。ただし同じマクロが自分自身を展開することはできません。
- **`({ ... })`（文式）**: GCC 拡張で、中の文を実行し、最後の式（ここでは `_found;`）を値にします。
- **`static const` 配列**: 関数の中で `static const int a[] = {...};` と書くと、プログラム開始時に作られる読み取り専用の配列になります。初期値は定数である必要があります。
- **`assert_cc(expr)`**: systemd のマクロで `_Static_assert` の短縮です。条件が偽なら **コンパイル時に** エラーになります。
- **ビットフィールド**: 構造体のメンバを `unsigned flag:1;` のようにビット単位で宣言したものです。`typeof` を直接適用できません。

## 何をしているか

### 1. case ラベルを並べる部品

```c:line-numbers=374
#define  CASE_F_1(X)      case X:
#define  CASE_F_2(X, ...) case X:  CASE_F_1( __VA_ARGS__)
#define  CASE_F_3(X, ...) case X:  CASE_F_2( __VA_ARGS__)
#define  CASE_F_4(X, ...) case X:  CASE_F_3( __VA_ARGS__)
```

`CASE_F_1(X)` は `case X:` に、`CASE_F_2(X, ...)` は `case X:` に続けて `CASE_F_1(残り)` に展開されます。
つまり `CASE_F_3(a, b, c)` は `case a: case b: case c:` になります。名前を変えて `CASE_F_22` まで 22 段用意してあるのは、マクロが自分自身を呼べないからです。

### 2. 引数の個数で部品を選ぶ

```c:line-numbers=397
#define GET_CASE_F(_1,_2,_3,_4,_5,_6,_7,_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20,_21,_22,NAME,...) NAME
#define FOR_EACH_MAKE_CASE(...) \
        GET_CASE_F(__VA_ARGS__,CASE_F_22,CASE_F_21,CASE_F_20,CASE_F_19,CASE_F_18,CASE_F_17,CASE_F_16,CASE_F_15,CASE_F_14,CASE_F_13,CASE_F_12, \
                               CASE_F_11,CASE_F_10,CASE_F_9,CASE_F_8,CASE_F_7,CASE_F_6,CASE_F_5,CASE_F_4,CASE_F_3,CASE_F_2,CASE_F_1) \
                   (__VA_ARGS__)
```

`GET_CASE_F` は 23 番目の引数をそのまま返すマクロです。`FOR_EACH_MAKE_CASE(a, b, c)` は、

```c
GET_CASE_F(a, b, c, CASE_F_22, CASE_F_21, ..., CASE_F_1)
```

と呼びます。`a, b, c` が 1〜3 番目を占めるので、後ろの名前の列が 3 つずれ、23 番目には `CASE_F_3` が来ます。
こうして「引数が 3 個なら `CASE_F_3`」が選ばれ、最後の `(__VA_ARGS__)` で `CASE_F_3(a, b, c)` が呼ばれます。

### 3. 候補をコンパイル時に検査する

```c:line-numbers=405
                bool _found = false;                                    \
                /* If the build breaks in the line below, you need to extend the case macros. We use typeof(+x) \
                 * here to widen the type of x if it is a bit-field as this would otherwise be illegal. */      \
                static const typeof(+x) __assert_in_set[] _unused_ = { first, __VA_ARGS__ }; \
                assert_cc(ELEMENTSOF(__assert_in_set) <= 22);           \
```

`_found` を偽で用意したあと、候補の値を `static const` 配列に入れます。実行には使いませんが（`_unused_`）、候補が定数かどうか、型が `x` に代入できるかをコンパイラにチェックさせる役目があります。
`typeof(+x)` の `+` は、ビットフィールドでも普通の整数型に広げるための技だとコメントに書かれています。
続く `assert_cc` で、候補が 22 個を超えたらコンパイルエラーにします。

### 4. switch で判定する

```c:line-numbers=410
                switch (x) {                                            \
                FOR_EACH_MAKE_CASE(first, __VA_ARGS__)                  \
                        _found = true;                                  \
                        break;                                          \
                default:                                                \
                        ;                                               \
                }                                                       \
                _found;                                                 \
        })
```

`switch (x)` に生成した `case` 列を置き、当てはまれば `_found = true;` にします。最後の `_found;` が文式全体の値です。
`IN_SET(c, 'a', 'b')` なら、実質こうなります。

```c
switch (c) { case 'a': case 'b': _found = true; break; default: ; }
```

## ここがすごい

- **`x` は一度だけ評価される**: `x == 1 || x == 2 || x == 3` では `x` を 3 回書きますが、`switch (x)` は 1 回だけ評価します。`IN_SET(read_char(), ...)` のように関数呼び出しを渡しても安全です。
- **コンパイラが最適化しやすい**: `switch` は、値が連続していればジャンプ表に、そうでなくても比較の木などに変換できます。どう変換するかはコンパイラに任せられます。
- **重複もコンパイル時に発見**: `case` ラベルが重複するとコンパイルエラーになるので、`IN_SET(x, 1, 1)` のような書き間違いもビルド時に見つかります。
- **プリプロセッサで個数を数える技**: 「引数の後ろに逆順の名前を並べ、N 番目を取る」方法は、可変長引数の個数を数える有名なテクニックです。ここではそれを「数える」だけでなく「対応する部品を選ぶ」ことに使っています。
- **トレードオフ**: 候補は定数に限られ（文字列は不可。systemd には文字列用の `STR_IN_SET` が別にあります）、上限は 22 個です。上限を超えたら、`assert_cc(ELEMENTSOF(__assert_in_set) <= 22)` がわかりやすく教えてくれます。

## まとめ

- `IN_SET(x, ...)` は可変長引数から `case` ラベルの列を生成し、`switch` で判定する。
- 引数の後ろに逆順の候補を並べて N 番目を取ると、プリプロセッサで引数の個数を数えられる。
- `switch` にすることで、`x` の一度だけの評価と、コンパイラによる最適化が得られる。
- `static const` 配列と `assert_cc` で、候補の型・定数性・個数をコンパイル時に検査している。
