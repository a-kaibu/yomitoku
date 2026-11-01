---
title: "起動時に一度だけハッシュの「種」を乱数で決める"
description: "curl のハッシュ表が使う種を初期化する関数。乱数のバイト列を 1 つの整数に組み立て、0 を避けて保存し、二度目以降は何もしない。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/hash.c
lines: [56, 84]
function: "Curl_hash_global_init"
difficulty: 1
format: 2
tags: [ハッシュ, 乱数, セキュリティ]
---

## ひとことで

`Curl_hash_global_init` は、curl のハッシュ表がキーの番号を計算するときに混ぜる「種」`hash_seed` を、乱数から作って保存します。何度呼ばれても、実際に種を作るのは最初の 1 回だけです。種が乱数なので、外から見て「どのキーが同じ箱に入るか」を予想しにくくなります。

## コード

::: code-group

```c:line-numbers=56 [日本語訳]
/* グローバル初期化で設定し、以後は読み取り専用 */
static size_t hash_seed;

CURLcode Curl_hash_global_init(void)
{
  static bool seeded;
  unsigned char buf[sizeof(size_t)];
  size_t seed = 0;
  size_t i;
  CURLcode result;

  if(seeded)
    return CURLE_OK;

  result = Curl_rand_bytes(NULL,
#ifdef DEBUGBUILD
                           FALSE,
#endif
                           buf, sizeof(buf));
  if(result)
    return result;

  for(i = 0; i < sizeof(buf); i++)
    seed = (seed << 8) | buf[i];

  hash_seed = seed ? seed : 1;
  seeded = TRUE;
  return CURLE_OK;
}
```

```c:line-numbers=56 [原文]
/* set at global init, read-only afterwards */
static size_t hash_seed;

CURLcode Curl_hash_global_init(void)
{
  static bool seeded;
  unsigned char buf[sizeof(size_t)];
  size_t seed = 0;
  size_t i;
  CURLcode result;

  if(seeded)
    return CURLE_OK;

  result = Curl_rand_bytes(NULL,
#ifdef DEBUGBUILD
                           FALSE,
#endif
                           buf, sizeof(buf));
  if(result)
    return result;

  for(i = 0; i < sizeof(buf); i++)
    seed = (seed << 8) | buf[i];

  hash_seed = seed ? seed : 1;
  seeded = TRUE;
  return CURLE_OK;
}
```

:::

## 前提知識

- **`static size_t hash_seed;`**: 関数の外に `static` を付けて置いた変数は、このファイルの中だけで使えるグローバル変数になります。プログラムの開始時に 0 で初期化されます。
- **関数の中の `static bool seeded;`**: 関数の中で `static` を付けた変数は、関数を抜けても値を覚えています。最初は `false`（0）です。「もう初期化したか」の印に使えます。
- **`unsigned char buf[sizeof(size_t)]`**: `size_t` と同じバイト数の配列です。64 ビット環境なら 8 バイトです。
- **`seed = (seed << 8) | buf[i]`**: 今の値を 8 ビット（1 バイト分）左にずらし、空いた下の 8 ビットに次のバイトを入れます。これを繰り返すと、バイトの並びが 1 つの整数になります。
- **`#ifdef DEBUGBUILD`**: 開発用ビルドのときだけ、その部分をコンパイルします。ここでは関数の引数の数がビルドによって変わります。
- **`CURLcode` と `CURLE_OK`**: curl の結果コードです。`CURLE_OK` は成功です。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、そうでなければ `c` です。

## 何をしているか

### 1. 二度目以降はすぐ戻る

```c:line-numbers=67
  if(seeded)
    return CURLE_OK;
```

`seeded` が真なら、もう種は決まっているので成功を返します。

### 2. 乱数のバイトをもらう

```c:line-numbers=70
  result = Curl_rand_bytes(NULL,
#ifdef DEBUGBUILD
                           FALSE,
#endif
                           buf, sizeof(buf));
  if(result)
    return result;
```

`Curl_rand_bytes` で `buf` を乱数で埋めます。デバッグビルドでは引数が 1 つ多く（`FALSE`）、テストのために乱数を固定する仕組みを使わないよう指定しています。乱数が取れなければ、そのエラーを返します。

### 3. バイト列を整数に組み立てる

```c:line-numbers=78
  for(i = 0; i < sizeof(buf); i++)
    seed = (seed << 8) | buf[i];
```

`buf` が `{0x12, 0x34, 0x56, 0x78, ...}` なら、ループは次のように進みます。

- 1 回目: `seed = 0x12`
- 2 回目: `seed = 0x1234`
- 3 回目: `seed = 0x123456`

8 回で 8 バイト全部が `seed` に入ります。

### 4. 0 を避けて保存

```c:line-numbers=81
  hash_seed = seed ? seed : 1;
  seeded = TRUE;
  return CURLE_OK;
```

`hash_seed = seed ? seed : 1;` で、たまたま 0 になったときは 1 にします。最後に `seeded` を真にして、成功を返します。

## ここがすごい

- **一度だけ実行する仕組みが 2 行**: 関数の中の `static` 変数を印にすると、「初回だけ処理する」が簡単に書けます。種が途中で変わると、すでに表に入っている要素の番号が合わなくなるので、二度と作り直さないことが大事です。`hash_seed` の前のコメント「グローバル初期化で設定し、以後は読み取り専用」がその約束です。
- **エンディアンに依存しない組み立て**: `memcpy(&seed, buf, sizeof(seed))` でも整数にできますが、シフトと OR で 1 バイトずつ組み立てれば、CPU のバイトの並び順に関係なく同じ手順で作れます。乱数なので結果はどちらでもよいのですが、型の読み替えをせずに済む素直な書き方です。
- **0 を避ける**: 種が 0 だと、`hash_str_seeded` の初期値 `5381 ^ seed` は種がないときと同じ 5381 になります。乱数で 0 が出る確率はとても低いですが、種なしと区別できない値を念のため避けています。
- **失敗を隠さない**: 乱数が取れなかったら、弱い種で黙って続けるのではなく、エラーを返して呼び出し側に知らせます。

## まとめ

- 関数の中の `static` 変数は、「初回だけ実行」の印に使える。
- バイト列は `x = (x << 8) | b` を繰り返して 1 つの整数にできる。
- ハッシュの種は起動時に一度だけ決め、以後は変えない。
- 意味が「なし」と区別できない値（ここでは 0）は避けておく。
