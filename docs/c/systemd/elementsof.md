---
title: "ポインタを渡すとコンパイルエラーになる配列長マクロ ELEMENTSOF"
description: "sizeof(x)/sizeof(x[0]) の弱点「ポインタを渡しても黙って間違った値になる」を、GCC の組み込み関数でコンパイル時に検出する 5 行のマクロ。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/macro.h
lines: [151, 155]
function: "ELEMENTSOF"
difficulty: 3
format: 2
tags: [マクロ, 型システム, 防御的プログラミング, ハック]
---

## ひとことで

`ELEMENTSOF(x)` は、配列 `x` の **要素数** を返すマクロです。`int a[10];` なら `ELEMENTSOF(a)` は `10` です。
よく知られた `sizeof(x)/sizeof(x[0])` と同じ計算ですが、**配列ではなくポインタを渡すとコンパイルエラーになる** よう工夫されています。

## コード

```c:line-numbers=151
#define ELEMENTSOF(x)                                                   \
        (__builtin_choose_expr(                                         \
                !__builtin_types_compatible_p(typeof(x), typeof(&*(x))), \
                sizeof(x)/sizeof((x)[0]),                               \
                VOID_0))
```

`VOID_0` は同じファイルで次のように定義されています（Coverity という解析ツール以外では `((void)0)` が使われます）。

```c:line-numbers=145
#ifndef __COVERITY__
#  define VOID_0 ((void)0)
#else
#  define VOID_0 ((void*)0)
#endif
```

## 前提知識

- **配列とポインタ**: C の配列 `int a[10]` は、ほとんどの場面で「先頭要素へのポインタ」に自動変換されます。関数の引数に配列を渡すと、受け取る側には **ポインタしか届きません**。
- **`sizeof`**: 型や変数が何バイトかをコンパイル時に求める演算子です。`int a[10]` なら `sizeof(a)` は 40（`int` が 4 バイトの場合）、`sizeof(a[0])` は 4 です。ところが `int *p` に対する `sizeof(p)` は、ポインタそのものの大きさ（64 ビット環境で 8）になります。
- **`typeof(x)`**: GCC/Clang の拡張で、式の型を取り出します。`typeof(a)` は `int[10]`、`typeof(p)` は `int *` です。
- **`&*(x)`**: `*x` で中身を取り出し、`&` でそのアドレスを取ります。結果は「要素を指すポインタ」になります。配列 `a` に対しては `int *`、ポインタ `p` に対しても `int *` です。
- **`__builtin_types_compatible_p(A, B)`**: GCC の組み込み関数で、2 つの型が同じなら 1、違えば 0 をコンパイル時に返します。
- **`__builtin_choose_expr(c, e1, e2)`**: コンパイル時の定数 `c` が真なら `e1`、偽なら `e2` に **置き換わる** 組み込み関数です。三項演算子 `? :` と違い、選ばれなかった側の型は結果に影響しません。
- **`(void)0`**: 「値を持たない式」です。これを数値として使おうとするとコンパイルエラーになります。

## 何をしているか

### 1. 配列かポインタかを判定する

```c:line-numbers=153
                !__builtin_types_compatible_p(typeof(x), typeof(&*(x))), \
```

ここで、「`x` の型」と「`x` の要素を指すポインタの型」を比べます。

- `int a[10]` のとき: `typeof(a)` は `int[10]`、`typeof(&*a)` は `int *`。**違う型** なので 0。
- `int *p` のとき: `typeof(p)` は `int *`、`typeof(&*p)` も `int *`。**同じ型** なので 1。

つまり「同じ型なら、`x` はポインタだ」と見抜けます。

### 2. 結果を選ぶ

```c:line-numbers=151
#define ELEMENTSOF(x)                                                   \
        (__builtin_choose_expr(                                         \
                !__builtin_types_compatible_p(typeof(x), typeof(&*(x))), \
                sizeof(x)/sizeof((x)[0]),                               \
                VOID_0))
```

先頭の `!` で判定を反転し、`__builtin_choose_expr` に渡します。

- 配列なら `sizeof(x)/sizeof((x)[0])`、つまり要素数が選ばれます。`int a[10]` なら 40 / 4 = 10 です。
- ポインタなら `VOID_0`、つまり `(void)0` が選ばれます。

### 3. 間違いがエラーになる仕組み

`size_t n = ELEMENTSOF(p);` のようにポインタで使うと、右辺が `(void)0` になり、「void の値は代入できない」というコンパイルエラーになります。
`for (size_t i = 0; i < ELEMENTSOF(p); i++)` のような比較でも同様です。

## ここがすごい

- **黙って間違う罠を塞ぐ**: 素朴な `sizeof(x)/sizeof(x[0])` は、ポインタを渡すと「8 / 4 = 2」のようにもっともらしい数を返し、何の警告も出ません。関数の引数で受け取った配列にうっかり使うと、バグに気づきにくいのです。`ELEMENTSOF` ならその場でビルドが止まります。
- **実行時のコストはゼロ**: 判定はすべてコンパイル時に終わり、生成されるコードは定数 1 つだけです。
- **`__builtin_choose_expr` を選んだ理由**: `? :` を使うと、両方の枝の型をそろえる規則が働き、`(void)0` を混ぜられません。`__builtin_choose_expr` は選ばれた枝だけが残るので、「ポインタのときだけ void になる」という仕掛けが成立します。
- **静的解析ツールへの配慮**: `VOID_0` は Coverity という解析ツール向けにだけ `(void*)0` に変わるようになっていて、ツールが誤検知しないよう調整されています。
- **トレードオフ**: GCC/Clang の組み込み関数に依存するので、他のコンパイラでは使えません。Linux カーネルにも同じ目的の `ARRAY_SIZE` マクロがあり、C で「配列とポインタを区別したい」ときの典型的な技です。

## まとめ

- 配列はポインタに化けやすく、`sizeof(x)/sizeof(x[0])` はポインタでも黙って値を返してしまう。
- 「`x` の型」と「`&*x` の型」が一致するかどうかで、配列とポインタを区別できる。
- `__builtin_choose_expr` で、ポインタのときだけ void 式にすれば、誤用がコンパイルエラーになる。
- 判定はすべてコンパイル時なので、実行速度には影響しない。
