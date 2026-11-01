---
title: "5381 と「33 倍して XOR」― 種を混ぜた小さな文字列ハッシュ"
description: "curl のハッシュ表が使う文字列ハッシュ関数。有名な djb2 の形に、起動時に決めた乱数の種を混ぜて、衝突を狙った入力を作りにくくしている。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/hash.c
lines: [86, 104]
function: "hash_str_seeded"
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, セキュリティ]
---

## ひとことで

`hash_str_seeded` は、バイト列（キー）から「何番目の箱（スロット）に入れるか」を計算するハッシュ関数です。初期値 5381 に種 `seed` を XOR し、1 文字ごとに「33 倍して文字を XOR」を繰り返して、最後に箱の数で割った余りを返します。同じキーと同じ種なら、いつも同じ番号になります。

## コード

::: code-group

```c:line-numbers=86 [日本語訳]
/* @unittest 1603（この番号の単体テストで確かめている）
 */
UNITTEST size_t hash_str_seeded(const void *key, size_t key_length,
                                size_t slots_num, size_t seed);
UNITTEST size_t hash_str_seeded(const void *key, size_t key_length,
                                size_t slots_num, size_t seed)
{
  const char *key_str = (const char *)key;
  const char *end = key_str + key_length;
  size_t h = 5381 ^ seed;

  while(key_str < end) {
    size_t j = (size_t)*key_str++;
    h += h << 5;
    h ^= j;
  }

  return (h % slots_num);
}
```

```c:line-numbers=86 [原文]
/* @unittest 1603
 */
UNITTEST size_t hash_str_seeded(const void *key, size_t key_length,
                                size_t slots_num, size_t seed);
UNITTEST size_t hash_str_seeded(const void *key, size_t key_length,
                                size_t slots_num, size_t seed)
{
  const char *key_str = (const char *)key;
  const char *end = key_str + key_length;
  size_t h = 5381 ^ seed;

  while(key_str < end) {
    size_t j = (size_t)*key_str++;
    h += h << 5;
    h ^= j;
  }

  return (h % slots_num);
}
```

:::

実際にハッシュ表から呼ばれるのは、すぐ下の `hash_str` です。起動時に一度だけ決めた `hash_seed` を渡しています。

```c:line-numbers=108
UNITTEST size_t hash_str(const void *key, size_t key_length, size_t slots_num);
UNITTEST size_t hash_str(const void *key, size_t key_length, size_t slots_num)
{
  return hash_str_seeded(key, key_length, slots_num, hash_seed);
}
```

## 前提知識

- **ハッシュ表**: キーから計算した番号（ハッシュ値）で箱を選び、そこにデータを入れる構造です。番号の計算が速く、ばらつきがよいほど、探すのが速くなります。
- **衝突**: 違うキーが同じ箱に入ることです。1 つの箱に多く集まると、その中を順に探す必要があり遅くなります。
- **`const void *key`**: 型を決めない汎用ポインタです。関数の中で `const char *` に読み替えて 1 バイトずつ扱います。
- **`size_t`**: 長さや大きさを表す負にならない整数型です。64 ビット環境ではたいてい 64 ビットです。
- **`h << 5`**: 左に 5 ビットずらすことで、32 倍と同じです。`h += h << 5` は `h = h + 32h`、つまり `h` を 33 倍します。
- **`^`（XOR）**: ビットごとに、違えば 1、同じなら 0 にする演算です。
- **`%`**: 割り算の余りです。`h % slots_num` は 0〜`slots_num - 1` になります。
- **符号なし整数のあふれ**: `size_t` のような符号なし整数は、上限を超えると 0 に戻って続きます（2 の累乗で割った余りになる）。これは C で決められた動きなので、ハッシュの計算では気にせず使えます。
- **`UNITTEST`**: テスト用ビルドでは外から呼べ、ふだんはこのファイルだけで使える関数にする curl のマクロです。

## 何をしているか

### 1. 初期値を作る

```c:line-numbers=93
  const char *key_str = (const char *)key;
  const char *end = key_str + key_length;
  size_t h = 5381 ^ seed;
```

キーを文字の並びとして扱い、終わりの位置 `end` を計算します。`h` の初期値は `5381 ^ seed` です。

### 2. 1 文字ずつ混ぜる

```c:line-numbers=97
  while(key_str < end) {
    size_t j = (size_t)*key_str++;
    h += h << 5;
    h ^= j;
  }
```

1 文字読んで `j` に入れ、`h` を 33 倍してから `j` を XOR します。

種を 0 として `"ab"` で追ってみます（`'a'` = 97、`'b'` = 98）。

- 最初: `h = 5381`
- `'a'`: `5381 × 33 = 177573`、`177573 ^ 97 = 177604`
- `'b'`: `177604 × 33 = 5860932`、`5860932 ^ 98 = 5860902`

### 3. 箱の番号にする

```c:line-numbers=103
  return (h % slots_num);
```

箱が 7 個なら、`5860902 % 7` が箱の番号です。

## ここがすごい

- **掛け算を使わない 33 倍**: `h += h << 5` はシフト 1 回と足し算 1 回です。「5381 から始めて 33 倍しながら文字を混ぜる」形は、djb2 と呼ばれる有名な文字列ハッシュで、短いコードでよくばらつくことで知られています。ここでは足し算ではなく XOR で混ぜる版を使っています。
- **種を混ぜる**: 種が決まっていると、攻撃者は「同じ箱に入るキー」を大量に計算して送りつけられます。ハッシュ表の 1 つの箱に要素が集中すると、探索がとても遅くなります（一般にハッシュ衝突攻撃と呼ばれます）。初期値に乱数の種を混ぜておけば、外からはどのキーが衝突するか予想できません。種は同じファイルの `Curl_hash_global_init` で、起動時に乱数から作られます。
- **テストしやすい分け方**: 種を引数で受け取る版を別に作り、ふだんは `hash_str` 経由で隠れた種を渡しています。テストでは決まった種を渡して、結果がいつも同じになることを確かめられます（関数の前のコメント `@unittest 1603` は、それを確かめるテスト番号です）。
- **長さを引数で受け取る**: ヌル文字を探さず `key_length` で終わりを決めるので、文字列でないバイト列もキーにできます。

## まとめ

- `h = h * 33 ^ c` を繰り返す djb2 形のハッシュは、シフトと足し算だけで書ける。
- 初期値に乱数の種を混ぜると、衝突を狙った入力を作られにくくなる。
- 種を引数に取る版を用意しておくと、テストで結果を固定できる。
- 符号なし整数のあふれは定義された動きなので、ハッシュ計算では自由に使ってよい。
