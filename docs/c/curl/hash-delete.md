---
title: "「ポインタへのポインタ」で先頭の特別扱いを消す ― ハッシュ表からの削除"
description: "curl のハッシュ表の削除関数。箱の中の単方向リストを、要素ではなく「要素を指している場所」でたどるので、先頭かどうかの場合分けが要らない。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/hash.c
lines: [383, 413]
function: "Curl_hash_delete"
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, イディオム]
---

## ひとことで

`Curl_hash_delete` は、キーを指定してハッシュ表から要素を 1 つ取り除き、その要素の後始末（デストラクタの呼び出しとメモリの解放）をします。見つかれば 0、見つからなければ 1 を返します。各箱の中身は単方向リストで、そこからの取り外しに「ポインタへのポインタ」を使っているのが見どころです。

## コード

::: code-group

```c:line-numbers=383 [日本語訳]
/* 指定したハッシュの要素を取り除く。
 * 失敗したら 0 以外を返す。
 *
 * @unittest: 1603（この番号の単体テストで確かめている）
 */
int Curl_hash_delete(struct Curl_hash *h, const void *key, size_t key_len)
{
  const struct hash_functions *functions;

  DEBUGASSERT(h);
  DEBUGASSERT(h->slots);
  DEBUGASSERT(h->init == HASHINIT);
  if(!hash_key_is_valid(h->type, key_len))
    return 1;
  if(h->table) {
    struct Curl_hash_element *he, **he_anchor;

    functions = hash_get_functions(h->type);
    he_anchor = &h->table[functions->hash(key, key_len, h->slots)];
    while(*he_anchor) {
      he = *he_anchor;
      if(functions->compare(hash_elem_key(he), he->key_len, key, key_len)) {
        hash_elem_unlink(h, he_anchor, he);
        hash_elem_destroy(h, he);
        return 0;
      }
      he_anchor = &he->next;
    }
  }
  return 1;
}
```

```c:line-numbers=383 [原文]
/* Remove the identified hash entry.
 * Returns non-zero on failure.
 *
 * @unittest: 1603
 */
int Curl_hash_delete(struct Curl_hash *h, const void *key, size_t key_len)
{
  const struct hash_functions *functions;

  DEBUGASSERT(h);
  DEBUGASSERT(h->slots);
  DEBUGASSERT(h->init == HASHINIT);
  if(!hash_key_is_valid(h->type, key_len))
    return 1;
  if(h->table) {
    struct Curl_hash_element *he, **he_anchor;

    functions = hash_get_functions(h->type);
    he_anchor = &h->table[functions->hash(key, key_len, h->slots)];
    while(*he_anchor) {
      he = *he_anchor;
      if(functions->compare(hash_elem_key(he), he->key_len, key, key_len)) {
        hash_elem_unlink(h, he_anchor, he);
        hash_elem_destroy(h, he);
        return 0;
      }
      he_anchor = &he->next;
    }
  }
  return 1;
}
```

:::

取り外しに使う小さな関数は、同じファイルにあります。

```c:line-numbers=314
static void hash_elem_unlink(struct Curl_hash *h,
                             struct Curl_hash_element **he_anchor,
                             struct Curl_hash_element *he)
{
  *he_anchor = he->next;
  --h->size;
}
```

## 前提知識

- **ハッシュ表**: キーから計算した番号で箱を選び、データを入れる構造です。curl では `h->table` が箱の配列で、各箱は要素の単方向リスト（次の要素だけを指してつなぐ列）の先頭を指しています。
- **`struct Curl_hash_element *he`**: 要素 1 つを指すポインタです。`he->next` で次の要素へ進みます。
- **`struct Curl_hash_element **he_anchor`（ポインタへのポインタ）**: 「要素を指しているポインタ変数」がどこにあるかを指します。最初は箱そのもの（`&h->table[i]`）、その後は前の要素の `next` メンバー（`&he->next`）を指します。
- **`*he_anchor = x`**: `he_anchor` が指している場所（箱か、前の要素の `next`）に `x` を書き込みます。
- **`&`**: 変数やメンバーのアドレスを取ります。
- **関数ポインタ**: `functions->hash(...)` は、構造体に入れておいた関数を呼んでいます。キーの種類（文字列かソケットか）によって使う関数を切り替えるためです。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめるマクロです。

## 何をしているか

### 1. 検査

```c:line-numbers=392
  DEBUGASSERT(h);
  DEBUGASSERT(h->slots);
  DEBUGASSERT(h->init == HASHINIT);
  if(!hash_key_is_valid(h->type, key_len))
    return 1;
```

表が初期化済みかをデバッグ時に確かめ、キーの長さがその表の種類に合っていなければ 1 を返します。

### 2. 箱を選ぶ

```c:line-numbers=397
  if(h->table) {
    struct Curl_hash_element *he, **he_anchor;

    functions = hash_get_functions(h->type);
    he_anchor = &h->table[functions->hash(key, key_len, h->slots)];
```

表がまだ一度も確保されていなければ（何も入れていなければ）何もしません。確保されていれば、キーのハッシュ値で箱を選び、`he_anchor` をその箱のアドレスにします。

### 3. 「指している場所」でたどる

```c:line-numbers=402
    while(*he_anchor) {
      he = *he_anchor;
      if(functions->compare(hash_elem_key(he), he->key_len, key, key_len)) {
        hash_elem_unlink(h, he_anchor, he);
        hash_elem_destroy(h, he);
        return 0;
      }
      he_anchor = &he->next;
    }
```

`*he_anchor` が今の要素です。キーが一致したら、`hash_elem_unlink` で `*he_anchor` を `he->next` に書き換えて要素をリストから外し、`hash_elem_destroy` で後始末して 0 を返します。一致しなければ、`he_anchor = &he->next` として「今の要素の `next` 欄」に進みます。

箱の中が `A → B → C` で `B` を消す場合、

- 最初 `he_anchor` は箱を指し、`*he_anchor` は `A`。一致しないので `he_anchor = &A->next`
- `*he_anchor` は `B`。一致したので `A->next` に `C` を書く → `A → C`

先頭の `A` を消す場合は、`he_anchor` が箱そのものを指しているので、箱に `B` が書かれて `B → C` になります。

### 4. 見つからなければ 1

```c:line-numbers=412
  return 1;
```

## ここがすごい

- **先頭の特別扱いが消える**: 「前の要素」を覚えるふつうの書き方では、消す要素が先頭なら箱を、そうでなければ前の要素の `next` を書き換える、という `if` が必要です。「要素を指している場所」そのものを持ち歩けば、箱も `next` 欄も同じ「ポインタ変数」なので、どちらでも `*he_anchor = he->next` の 1 行で済みます。Linus Torvalds が「よいセンス」の例として挙げたことでも知られる書き方です。
- **同じ道具を何度も使う**: 同じ形のループが同じファイルの `Curl_hash_clean` や `Curl_hash_clean_with_criterium` にも出てきます。取り外しを `hash_elem_unlink` という小さな関数にまとめたので、要素数の更新を忘れることがありません。
- **表を遅れて確保する**: `h->table` は最初の追加で初めて確保されるので、まだ空の表なら削除は箱を探すことすらせずに終わります。
- **キーの種類ごとに関数を差し替える**: ハッシュ関数と比較関数を表の種類ごとに切り替えるので、文字列キーとソケット番号キーを同じコードで扱えます。

## まとめ

- 単方向リストの削除は、「前の要素」ではなく「今の要素を指している場所」を持つと、先頭の場合分けが要らない。
- `T **` は「`T *` 型の変数がどこにあるか」を表す。その場所に書けば、箱でも `next` でも同じように付け替えられる。
- 取り外しと要素数の更新を小さな関数にまとめると、書き忘れを防げる。
- 関数ポインタで比較方法を差し替えると、キーの種類に依存しない表が作れる。
