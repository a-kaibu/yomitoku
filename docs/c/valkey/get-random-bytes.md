---
title: "種とカウンタを HMAC にかけ続けて乱数の列を作る"
description: "一度だけ /dev/urandom から読んだ 64 バイトの種を鍵にして、カウンタを SHA-256 の HMAC でハッシュし続け、必要なだけの乱数バイトを作る関数。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2009-2012, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/util.c
lines: [1147, 1198]
function: "getRandomBytes"
difficulty: 3
tags: [乱数, 暗号, ハッシュ]
---

## ひとことで

`getRandomBytes` は、指定した長さ `len` だけランダムなバイト列を `p` に書き込む関数です。
Valkey はこれで、起動ごとに変わる「ラン ID」やレプリケーション ID、クラスタのノード名などを作ります。
OS の乱数源 `/dev/urandom` から読むのは **最初の 1 回（64 バイト）だけ** で、あとはその種を鍵にした HMAC-SHA256 で「0, 1, 2, …」というカウンタをハッシュし続けます。

## コード

```c:line-numbers=1147
/* Get random bytes, attempts to get an initial seed from /dev/urandom and
 * the uses a one way hash function in counter mode to generate a random
 * stream. However if /dev/urandom is not available, a weaker seed is used.
 *
 * This function is not thread safe, since the state is global.
 *
 * This is the non-secret entry point: run ids, replication ids, cluster node
 * names and shard ids, the RDB EOF mark, migrate slot job names, the sentinel
 * id, and ValkeyModule_GetRandomBytes(). Secret material uses
 * getSecureRandomBytes() below. */
void getRandomBytes(unsigned char *p, size_t len) {
    static uint64_t counter = 0; /* The counter we hash with the seed. */

    if (!seed_initialized) {
        initializeRandomSeed();
    }

    while (len) {
        /* This implements SHA256-HMAC. */
        unsigned char digest[SHA256_BLOCK_SIZE];
        unsigned char kxor[64];
        unsigned int copylen = len > SHA256_BLOCK_SIZE ? SHA256_BLOCK_SIZE : len;

        /* IKEY: key xored with 0x36. */
        memcpy(kxor, seed, sizeof(kxor));
        for (unsigned int i = 0; i < sizeof(kxor); i++) kxor[i] ^= 0x36;

        /* Obtain HASH(IKEY||MESSAGE). */
        SHA256_CTX ctx;
        sha256_init(&ctx);
        sha256_update(&ctx, kxor, sizeof(kxor));
        sha256_update(&ctx, (unsigned char *)&counter, sizeof(counter));
        sha256_final(&ctx, digest);

        /* OKEY: key xored with 0x5c. */
        memcpy(kxor, seed, sizeof(kxor));
        for (unsigned int i = 0; i < sizeof(kxor); i++) kxor[i] ^= 0x5C;

        /* Obtain HASH(OKEY || HASH(IKEY||MESSAGE)). */
        sha256_init(&ctx);
        sha256_update(&ctx, kxor, sizeof(kxor));
        sha256_update(&ctx, digest, SHA256_BLOCK_SIZE);
        sha256_final(&ctx, digest);

        /* Increment the counter for the next iteration. */
        counter++;

        memcpy(p, digest, copylen);
        len -= copylen;
        p += copylen;
    }
}
```

## 前提知識

- **ハッシュ関数 SHA-256**: どんな長さのデータからも 32 バイトの「指紋」を作る関数です。入力が 1 ビットでも違えば出力はまったく違うものになり、出力から入力を推測することは事実上できません。`sha256_init`・`sha256_update`・`sha256_final` の 3 段階で使います（`update` は何回呼んでもよく、データを継ぎ足せます）。
- **HMAC**: 秘密の鍵とメッセージからハッシュを作る標準的な方式です。`HASH((鍵 XOR 0x5c…) || HASH((鍵 XOR 0x36…) || メッセージ))` と 2 回ハッシュします（`||` はつなげること）。`0x36` と `0x5c` は HMAC の仕様で決められた定数です。
- **`static` なローカル変数**: 1158 行目の `counter` は関数の中にありますが、`static` なので呼び出しのたびに 0 に戻らず、前回の値を覚えています。
- **`^=`（XOR 代入）**: `a ^= b` は `a = a ^ b` の略で、ビットごとの排他的論理和です。
- **`sizeof`**: 変数や型のバイト数です。`sizeof(kxor)` は 64 です。
- **`&counter` のキャスト**: `(unsigned char *)&counter` は「`counter` という整数が置かれたメモリを、バイトの並びとして見る」という意味です。8 バイトの整数をそのままハッシュに入れています。
- **`SHA256_BLOCK_SIZE`**: `sha256.h` で 32 と定義されている、SHA-256 の出力の大きさです。

## 何をしているか

### 1. 種を用意する（1160〜1162 行目）

まだ種がなければ `initializeRandomSeed` を呼び、`/dev/urandom` から 64 バイトを読みます（1100〜1120 行目）。読めなかった場合は時刻とプロセス ID から弱い種を作ります。

### 2. 32 バイトずつ作る（1164〜1197 行目）

`len = 40` で追うと、ループは 2 回まわります。1 回目は 32 バイト、2 回目は残りの 8 バイトです。1168 行目の `copylen` が「今回コピーする量」です。

各周回では、HMAC を手で組み立てています。

1. 1171〜1172 行目: 種を `kxor` にコピーし、全バイトを `0x36` と XOR（内側の鍵）。
2. 1176〜1179 行目: 「内側の鍵 + カウンタ」を SHA-256 にかけ、`digest` を得る。
3. 1182〜1183 行目: 種をもう一度コピーし、今度は `0x5C` と XOR（外側の鍵）。
4. 1186〜1189 行目: 「外側の鍵 + さっきの digest」を SHA-256 にかける。

### 3. カウンタを進めて書き出す（1192〜1196 行目）

`counter` を 1 増やし、得られた 32 バイトのうち `copylen` バイトを `p` にコピーします。`p` を進め、`len` を減らして次の周回へ。カウンタは `static` なので、次に関数が呼ばれたときは続きの番号から始まり、同じ出力が繰り返されません。

## ここがすごい

**OS への問い合わせが 1 回で済む**: 乱数が必要になるたびに `/dev/urandom` を開いて読むと、ファイル操作のシステムコールが毎回かかります。この関数は最初の 64 バイトだけを OS からもらい、あとは計算だけで必要なだけ作り出します。

**カウンタモードという考え方**: 「秘密の種」と「毎回違う番号」をハッシュすれば、出力は互いに無関係に見え、種を知らない人には予測できません。暗号の世界で「カウンタモード」と呼ばれる定番の作り方です。番号は 64 ビットなので、実用上ぐるっと一周して同じ値に戻ることはありません。

**素の SHA-256 ではなく HMAC**: 種とカウンタを単純につなげてハッシュするより、鍵付きハッシュとして定義のはっきりした HMAC を使うほうが、性質を説明しやすく安全です。とはいえ専用のライブラリ関数は使わず、20 行ほどで手組みしているのが Valkey らしい簡潔さです。

**用途の線引き**: コメントにあるとおり、この関数は「秘密ではない」ID などに使う入口です。種が弱い種にフォールバックすることもあるので、パスワード生成のような秘密の材料には、別の `getSecureRandomBytes`（1231 行目）を使う設計になっています。また状態がグローバルなので、スレッド安全ではないことも明記されています。

## まとめ

- 乱数の種を一度だけもらい、「種＋カウンタ」をハッシュすれば、乱数を好きなだけ作れる（カウンタモード）。
- HMAC は、鍵を 2 種類の定数と XOR して 2 回ハッシュする方式。
- `static` なローカル変数は、関数の呼び出しをまたいで値を保つ。
- 秘密の用途と秘密でない用途で、乱数の入口を分けておくと安全。
