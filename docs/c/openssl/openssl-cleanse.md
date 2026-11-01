---
title: "消したはずの秘密鍵を残さない、volatile 関数ポインタの memset"
description: "秘密のデータを 0 で塗りつぶす関数。ふつうの memset は「どうせ使わないメモリ」と判断されて消されることがあるため、volatile な関数ポインタ経由で呼び出し、最適化を確実に防ぐ。"
language: c
project: OpenSSL
repo: https://github.com/openssl/openssl
license: Apache-2.0
copyright: "Copyright 2002-2016 The OpenSSL Project Authors. All Rights Reserved."
commit: "aad00a888ccb47ec49afeb7545f2dddf9397fbb5"
file: crypto/mem_clr.c
lines: [13, 33]
function: "OPENSSL_cleanse"
difficulty: 2
tags: [セキュリティ, 暗号, メモリ管理, 防御的プログラミング]
---

## ひとことで

`OPENSSL_cleanse(ptr, len)` は、`ptr` から `len` バイトを **0 で上書きして消す** 関数です。パスワードや秘密鍵を使い終わったあと、メモリに残さないために呼びます。
中身はほぼ `memset(ptr, 0, len)` ですが、「`memset` を直接呼ばずに、`volatile` な関数ポインタを通して呼ぶ」という工夫がしてあります。

## コード

```c:line-numbers=13
/*
 * Pointer to memset is volatile so that compiler must de-reference
 * the pointer and can't assume that it points to any function in
 * particular (such as memset, which it then might further "optimize")
 */
typedef void *(*memset_t)(void *, int, size_t);

static volatile memset_t memset_func = memset;

void OPENSSL_cleanse(void *ptr, size_t len)
{
    /*
     * If len is zero, ptr may be NULL. However, due to a C language bug, memset
     * cannot be called with NULL and zero. This will be fixed in C2y and
     * retroactively applied to older versions of C, but we still support older
     * compilers and sanitizers, so explicitly check len. See
     * https://developers.redhat.com/articles/2024/12/11/making-memcpynull-null-0-well-defined
     */
    if (len != 0)
        memset_func(ptr, 0, len);
}
```

## 前提知識

- **`memset(ptr, 0, len)`**: 標準ライブラリの関数で、`ptr` から `len` バイトを指定した値（ここでは 0）で埋めます。
- **関数ポインタ**: 関数のアドレスを入れておける変数です。`typedef void *(*memset_t)(void *, int, size_t);`（18 行目）は、「`void *, int, size_t` を受け取って `void *` を返す関数」を指すポインタの型に、`memset_t` という名前を付けています。
- **`typedef`**: 型に別名を付ける構文です。複雑な関数ポインタの型を何度も書かずに済みます。
- **`static`（ファイルの外側の変数）**: 20 行目の `static` は「この変数はこのファイルの中でしか見えない」という意味です。
- **`volatile`**: 「この変数の値は、プログラムが知らないうちに変わるかもしれない」とコンパイラに伝える修飾子です。コンパイラは `volatile` 変数の読み出しを省略したり、中身を決めつけたりできません。
- **デッドストア除去**: コンパイラの最適化の 1 つで、「書き込んだあと二度と読まれないメモリへの書き込み」を無駄として削除します。
- **NULL**: どこも指していないことを表す特別なポインタの値です。

## 何をしているか

### 1. memset を指す volatile なポインタを用意する（18〜20 行目）

`static volatile memset_t memset_func = memset;` は、「`memset` 関数を指す、`volatile` な関数ポインタ変数」を作ります。値は最初から `memset` ですが、`volatile` なので、コンパイラは「呼び出すときにも中身は `memset` のままだ」と仮定できません。コメント（13〜17 行目）がまさにその意図を説明しています。

### 2. 長さ 0 のときは何もしない（24〜31 行目）

`len != 0` のときだけ呼び出します。コメントによると、`len` が 0 のときは `ptr` が NULL のこともありますが、C 言語の規格では `memset(NULL, 0, 0)` が（何もしないはずなのに）未定義動作とされています。将来の規格（C2y）で修正され、さかのぼって適用される予定ですが、古いコンパイラやサニタイザ（未定義動作を検出する道具）を考えて、明示的に避けています。

### 3. 関数ポインタ経由で呼ぶ（32 行目）

`memset_func(ptr, 0, len);` で、ポインタ変数から読み出したアドレスの関数を呼びます。

## ここがすごい

- **なぜ普通の memset ではだめか**: 次のようなコードを考えます。

  ```c
  char key[32];
  /* key を使う */
  memset(key, 0, sizeof(key));
  return;
  ```

  `key` は関数を抜けると二度と使われません。コンパイラは「0 を書いても誰も読まないので無駄」と判断し、`memset` を丸ごと消してよいのです。`memset` は標準関数なので、コンパイラはその意味を知っています。結果として、秘密鍵がメモリに残ってしまいます。
- **意味を知られなければ消されない**: `volatile` な関数ポインタから関数を呼ぶと、コンパイラは「どの関数が呼ばれるか」を知りえません。正体不明の関数はメモリを読むかもしれないので、呼び出しを削除できません。こうして、標準 C の範囲だけで「消されない memset」を作っています。
- **移植性が高い**: 今では `memset_s`（C11 の任意機能）や `explicit_bzero`（一部の OS）のような専用関数もありますが、どの環境にもあるとは限りません。この方法なら、どのコンパイラでも同じ書き方で動きます。
- **小さなことも手を抜かない**: `len == 0` のチェックは、ほとんどの環境では無くても困りません。それでも、規格上の未定義動作をきちんと避け、理由をコメントに残しているところに、暗号ライブラリの慎重さが表れています。

## まとめ

- コンパイラは「書いたあと読まれないメモリ」への書き込みを消すことがあり、秘密を消す memset も例外ではない。
- `volatile` な関数ポインタ経由で呼ぶと、コンパイラは呼び出し先の正体がわからず、呼び出しを削除できない。
- 専用の関数に頼らず、標準 C だけで実現しているので移植性が高い。
- `memset(NULL, 0, 0)` のような細かな未定義動作も避けておく。
