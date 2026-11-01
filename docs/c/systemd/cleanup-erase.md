---
title: "スコープを抜けたら秘密の値を確実に消す CLEANUP_ERASE"
description: "パスワードや鍵を置いた変数に CLEANUP_ERASE(var) と 1 行添えるだけで、関数を抜けるときにメモリが 0 で上書きされる。最適化で消されない消去の仕組み。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/fundamental/memory-util.h
lines: [38, 73]
function: "CLEANUP_ERASE"
difficulty: 2
format: 2
tags: [セキュリティ, メモリ管理, マクロ, イディオム]
---

## ひとことで

`CLEANUP_ERASE(key);` と書くと、変数 `key` の **中身が、スコープを抜けるときに 0 で塗りつぶされます**。
パスワードや暗号鍵のような秘密の値を、使い終わったあとメモリに残さないための仕組みです。
ポインタの先のバッファを消したいときは `CLEANUP_ERASE_PTR(&p, size)` を使います。

## コード

::: code-group

```c:line-numbers=38 [日本語訳]
struct VarEraser {
        /* 注: CLEANUP_ERASE() の場合は消去するメモリへのポインタ。CLEANUP_ERASE_PTR() の場合は
         * 消去するメモリを指すポインタへのポインタ */
        void *p;
        size_t size;
};

static inline void erase_var(struct VarEraser *e) {
        explicit_bzero_safe(e->p, e->size);
}

/* スコープを抜けるときに var を消去するよう印を付ける。 */
#define CLEANUP_ERASE(var)                                              \
        _cleanup_(erase_var) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = &(var),                                            \
                .size = sizeof(var),                                    \
        }

static inline void erase_varp(struct VarEraser *e) {

        /* erase_var() とよく似ているが、`p` は「中身を破棄すべきメモリを指すポインタ」へのポインタだとみなす。 */
        if (!e->p)
                return;

        explicit_bzero_safe(*(void**) e->p, e->size);
}

/* スコープを抜けるときに、ポインタが指すメモリを消去するよう印を付ける。注意: これは指定したポインタの
 * コピーではなく、そのポインタへのポインタを受け取る。こうすることで、呼び出し側が使用後にポインタを
 * 無効化して自動消去を止められる（たとえば、やりたいことが成功したので、確保したバッファを
 * 消去せずに呼び出し元へ返したい場合など）。 */
#define CLEANUP_ERASE_PTR(ptr, sz)                                      \
        _cleanup_(erase_varp) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = (ptr),                                             \
                .size = (sz),                                           \
        }
```

```c:line-numbers=38 [原文]
struct VarEraser {
        /* NB: This is a pointer to memory to erase in case of CLEANUP_ERASE(). Pointer to pointer to memory
         * to erase in case of CLEANUP_ERASE_PTR() */
        void *p;
        size_t size;
};

static inline void erase_var(struct VarEraser *e) {
        explicit_bzero_safe(e->p, e->size);
}

/* Mark var to be erased when leaving scope. */
#define CLEANUP_ERASE(var)                                              \
        _cleanup_(erase_var) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = &(var),                                            \
                .size = sizeof(var),                                    \
        }

static inline void erase_varp(struct VarEraser *e) {

        /* Very similar to erase_var(), but assumes `p` is a pointer to a pointer whose memory shall be destructed. */
        if (!e->p)
                return;

        explicit_bzero_safe(*(void**) e->p, e->size);
}

/* Mark pointer so that memory pointed to is erased when leaving scope. Note: this takes a pointer to the
 * specified pointer, instead of just a copy of it. This is to allow callers to invalidate the pointer after
 * use, if they like, disabling our automatic erasure (for example because they succeeded with whatever they
 * wanted to do and now intend to return the allocated buffer to their caller without it being erased). */
#define CLEANUP_ERASE_PTR(ptr, sz)                                      \
        _cleanup_(erase_varp) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = (ptr),                                             \
                .size = (sz),                                           \
        }
```

:::

## 前提知識

- **`struct`（構造体）**: 複数の値をひとまとめにした型です。`struct VarEraser { void *p; size_t size; };` は「消す場所」と「消すバイト数」の組です。
- **`void *` と `void **`**: `void *` はどんな型でも指せる汎用ポインタ、`void **` は「ポインタ変数の置き場所」を指すポインタです。`*(void**) e->p` で「`e->p` が指すポインタ変数の中身」を取り出せます。
- **`->`**: 構造体へのポインタからメンバを取り出す演算子です。`e->p` は `(*e).p` と同じです。
- **`sizeof(var)`**: 変数 `var` が何バイトかをコンパイル時に求めます。配列 `char key[32]` なら 32 です。
- **`_cleanup_(f)`**: systemd のマクロで、GCC/Clang の `__attribute__((cleanup(f)))` の短縮です。付けた変数がスコープを抜けるとき、`f(&変数)` が自動で呼ばれます。
- **指示付き初期化子**: `{ .p = &x, .size = 8 }` のように、メンバ名を指定して構造体を初期化する書き方です。
- **`explicit_bzero`**: 指定した範囲を 0 で埋める関数です。普通の `memset` と違い、「この後読まれないから消しても意味がない」とコンパイラに **省略されない** ことが保証されています。

## 何をしているか

### 1. 消去の依頼票 VarEraser

```c:line-numbers=38
struct VarEraser {
        /* NB: This is a pointer to memory to erase in case of CLEANUP_ERASE(). Pointer to pointer to memory
         * to erase in case of CLEANUP_ERASE_PTR() */
        void *p;
        size_t size;
};
```

構造体 `VarEraser` は「どこを（`p`）」「何バイト（`size`）」消すかを持ちます。
コメントにあるとおり、`CLEANUP_ERASE` では `p` は消したいメモリそのもの、`CLEANUP_ERASE_PTR` では「消したいメモリを指すポインタ」の置き場所を指します。

### 2. 変数そのものを消す

```c:line-numbers=45
static inline void erase_var(struct VarEraser *e) {
        explicit_bzero_safe(e->p, e->size);
}

/* Mark var to be erased when leaving scope. */
#define CLEANUP_ERASE(var)                                              \
        _cleanup_(erase_var) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = &(var),                                            \
                .size = sizeof(var),                                    \
        }
```

`CLEANUP_ERASE(var)` は、使い捨ての名前の `VarEraser` 変数を宣言し、`.p = &(var)`、`.size = sizeof(var)` で初期化します。
この変数には `_cleanup_(erase_var)` が付いているので、スコープを抜けると `erase_var(&依頼票)` が呼ばれ、`explicit_bzero_safe` で `var` 全体が 0 になります。

たとえば次のように書けます。

```c
char key[32];
CLEANUP_ERASE(key);
read_key(key);       /* どこで return しても key は 0 で消される */
```

`_unused_` は「この変数は使われていない」という警告を抑えるためのものです。実際、依頼票は後片付けのためだけに存在します。

### 3. ポインタの先を消す

```c:line-numbers=56
static inline void erase_varp(struct VarEraser *e) {

        /* Very similar to erase_var(), but assumes `p` is a pointer to a pointer whose memory shall be destructed. */
        if (!e->p)
                return;

        explicit_bzero_safe(*(void**) e->p, e->size);
}
```

`CLEANUP_ERASE_PTR(ptr, sz)` は、`ptr` に **ポインタ変数のアドレス** を渡します。後片付けの `erase_varp` は、その時点でのポインタ変数の中身を `*(void**) e->p` で読み、指す先を `sz` バイト消します。
`e->p` 自体が `NULL` なら何もしません。

### 4. 取り消しができる理由

```c:line-numbers=65
/* Mark pointer so that memory pointed to is erased when leaving scope. Note: this takes a pointer to the
 * specified pointer, instead of just a copy of it. This is to allow callers to invalidate the pointer after
 * use, if they like, disabling our automatic erasure (for example because they succeeded with whatever they
 * wanted to do and now intend to return the allocated buffer to their caller without it being erased). */
#define CLEANUP_ERASE_PTR(ptr, sz)                                      \
        _cleanup_(erase_varp) _unused_ struct VarEraser CONCATENATE(_eraser_, UNIQ) = { \
                .p = (ptr),                                             \
                .size = (sz),                                           \
        }
```

コメントが理由を説明しています。ポインタのコピーではなくアドレスを受け取るので、呼び出し側が途中でポインタを `NULL` にすれば、消去を取りやめられます。
たとえば「処理に成功したので、このバッファは消さずに呼び出し元へ返す」という場合です。

## ここがすごい

- **消し忘れが構造的に起きない**: 秘密の値を扱う関数は、途中の `return` が多くなりがちです。そのたびに `explicit_bzero` を書くのは大変で、1 か所でも忘れると秘密がメモリに残ります。宣言の直後に 1 行書くだけで、すべての出口で消去が保証されます。
- **最適化に負けない消去**: 関数の最後で `memset(key, 0, sizeof(key));` と書いても、コンパイラは「この後 `key` は読まれない」と判断して消去を省くことがあります。`explicit_bzero` はそれを防ぐための関数です。
- **「依頼票」の構造体という発想**: cleanup 属性は「変数 1 つに関数 1 つ」しか付けられず、関数には変数のアドレスしか渡りません。そこで、消去に必要な情報（場所とサイズ）を持つ変数をわざわざ作り、それに cleanup を付けています。元の変数の型を変えずに後付けできる、うまい回避策です。
- **取り消せる設計**: `CLEANUP_ERASE_PTR` はポインタの置き場所を見るので、所有権を渡すときは `NULL` を入れるだけで消去を止められます。`TAKE_PTR` と組み合わせやすい形です。

## まとめ

- `CLEANUP_ERASE(var)` は、スコープを抜けると `var` を 0 で上書きする。
- 普通の `memset` は最適化で省かれることがあるので、秘密の消去には `explicit_bzero` を使う。
- cleanup 属性に追加の情報を渡したいときは、情報を持つ「依頼票」の変数を作って、それに cleanup を付ける。
- ポインタの置き場所を渡しておけば、後から `NULL` にして消去を取りやめられる。
