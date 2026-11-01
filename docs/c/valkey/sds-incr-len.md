---
title: "read() で直接書き込んでから長さだけ進める、コピーなしの追記"
description: "SDS 文字列の長さだけを増減させる関数。先に空きを確保し、カーネルにその空きへ直接書かせてから長さを更新することで、中間バッファへのコピーを省く。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [458, 497]
function: "sdsIncrLen"
difficulty: 2
tags: [メモリ管理, 入出力, 最適化]
---

## ひとことで

`sdsIncrLen(s, incr)` は、SDS 文字列 `s` の **長さだけ** を `incr` だけ増やす（負なら減らす）関数です。中身には触らず、最後に終端の `'\0'` を書き直すだけです。
一見地味ですが、コメントの使用例のように「空きを確保 → `read()` でそこに直接書き込む → 長さを進める」という流れを作るための部品です。
ネットワークから届いたデータを、余計なコピーなしで文字列の末尾に追加できます。

## コード

```c:line-numbers=458
void sdsIncrLen(sds s, ssize_t incr) {
    size_t len;
    switch (sdsType(s)) {
    case SDS_TYPE_5: {
        unsigned char *fp = ((unsigned char *)s) - 1;
        unsigned char oldlen = SDS_TYPE_5_LEN(*fp);
        assert((incr > 0 && oldlen + incr < 32) || (incr < 0 && oldlen >= (unsigned int)(-incr)));
        *fp = SDS_TYPE_5 | ((oldlen + incr) << SDS_TYPE_BITS);
        len = oldlen + incr;
        break;
    }
    case SDS_TYPE_8: {
        SDS_HDR_VAR(8, s);
        assert((incr >= 0 && sh->alloc - sh->len >= incr) || (incr < 0 && sh->len >= (unsigned int)(-incr)));
        len = (sh->len += incr);
        break;
    }
    case SDS_TYPE_16: {
        SDS_HDR_VAR(16, s);
        assert((incr >= 0 && sh->alloc - sh->len >= incr) || (incr < 0 && sh->len >= (unsigned int)(-incr)));
        len = (sh->len += incr);
        break;
    }
    case SDS_TYPE_32: {
        SDS_HDR_VAR(32, s);
        assert((incr >= 0 && sh->alloc - sh->len >= (unsigned int)incr) ||
               (incr < 0 && sh->len >= (unsigned int)(-incr)));
        len = (sh->len += incr);
        break;
    }
    case SDS_TYPE_64: {
        SDS_HDR_VAR(64, s);
        assert((incr >= 0 && sh->alloc - sh->len >= (uint64_t)incr) || (incr < 0 && sh->len >= (uint64_t)(-incr)));
        len = (sh->len += incr);
        break;
    }
    default: len = 0; /* Just to avoid compilation warnings. */
    }
    s[len] = '\0';
}
```

`src/sds.h` の 88〜92 行目で、次のマクロが定義されています。

```c
#define SDS_TYPE_MASK 7
#define SDS_TYPE_BITS 3
#define SDS_HDR_VAR(T, s) struct sdshdr##T *sh = (struct sdshdr##T *)((s) - (sizeof(struct sdshdr##T)))
#define SDS_HDR(T, s) ((struct sdshdr##T *)((s) - (sizeof(struct sdshdr##T))))
#define SDS_TYPE_5_LEN(f) ((unsigned char)(f) >> SDS_TYPE_BITS)
```

## 前提知識

- **SDS のヘッダ**: SDS 文字列は、中身の直前に「長さ `len`」「確保した大きさ `alloc`」「種類 `flags`」を持つヘッダがあります。種類は 5 つあり、TYPE_5 だけは `flags` の 1 バイトに長さも詰め込みます（下位 3 ビットが種類、上位 5 ビットが長さ）。
- **`switch` 文**: 値によって処理を分ける構文です。`case` のあとに書いた値と一致したところから実行し、`break` で抜けます。
- **`##`（トークン連結）**: マクロの中で、2 つの単語をくっつけて 1 つの名前にします。`SDS_HDR_VAR(8, s)` は `struct sdshdr8 *sh = ...` に展開されます。種類ごとに似たコードを書くための技です。
- **`->`**: 構造体を指すポインタから、そのメンバを読み書きする演算子です。`sh->len` は「`sh` が指すヘッダの `len`」です。
- **`ssize_t`**: 符号付きのサイズ型です。負の値（縮める）も渡せるように、`size_t` ではなくこちらを使っています。
- **`len = (sh->len += incr)`**: C の代入は値を持つので、`sh->len` を増やし、その新しい値を `len` にも入れる、を 1 行で書けます。
- **`read(fd, buf, n)`**: ファイルやソケットから最大 `n` バイトを `buf` に読み込むシステムコールです。実際に読んだバイト数を返します。

## 何をしているか

### 1. TYPE_5 の場合（461〜468 行目）

`s` の 1 バイト手前が `flags` です。`SDS_TYPE_5_LEN` で上位 5 ビットを取り出して今の長さを得ます。
たとえば長さ 3 に `incr = 2` なら、新しい長さは 5 です。464 行目の `assert` で、結果が 32 未満（5 ビットに収まる）かを確かめます。
465 行目で、`SDS_TYPE_5 | (5 << 3)` を `flags` に書き戻します。種類のビット（下位 3 ビット）を保ったまま、上位 5 ビットを新しい長さにするのです。

### 2. TYPE_8〜TYPE_64 の場合（469〜493 行目）

`SDS_HDR_VAR` でヘッダへのポインタ `sh` を作り、`sh->len` に `incr` を足します。
増やすときは「空き（`alloc - len`）が `incr` 以上あるか」、減らすときは「今の長さが `-incr` 以上あるか」を `assert` で確かめます。空きの外まで長さを伸ばすと、確保していないメモリを文字列の一部とみなしてしまうからです。

### 3. 終端を書く（496 行目）

最後に `s[len] = '\0'` を書いて、C の文字列としても正しく終わるようにします。

### 4. 使い方の例（452〜456 行目のコメント）

```c
oldlen = sdslen(s);
s = sdsMakeRoomFor(s, BUFFER_SIZE);
nread = read(fd, s+oldlen, BUFFER_SIZE);
sdsIncrLen(s, nread);
```

長さ 10 の文字列に 16KB の空きを確保し、`read` が 500 バイト読んだら、`sdsIncrLen(s, 500)` で長さを 510 にします。

## ここがすごい

**中間バッファをなくす**: ふつうは「一時的な配列に `read` して、それを文字列に追記（コピー）する」と書きます。この方法なら、カーネルが文字列の空き領域に直接書き込むので、コピーが 1 回減ります。サーバーがクライアントから大量のデータを受け取る場面では、この差が積み重なります。

**「場所の確保」と「長さの更新」を分ける**: `sdsMakeRoomFor` は空きを作るだけ、`sdsIncrLen` は長さを進めるだけ、と役割を分けています。その間に `read` のような外部の処理を挟めるのが、この分割の利点です。

**種類ごとの違いをマクロで吸収**: 5 種類のヘッダで長さのフィールドの型が違うので、`switch` で分岐し、`SDS_HDR_VAR` マクロで同じ形のコードを書いています。TYPE_5 だけはビットを詰めた特殊な形なので、別の処理になっています。

**負の増分で右側を切り詰め**: コメントにあるとおり、`incr` を負にすれば末尾を切り落とせます。たとえば最後の改行 1 文字を消すなら `sdsIncrLen(s, -1)` です。

## まとめ

- 「空きを確保 → 直接書き込む → 長さを進める」で、中間バッファのコピーを省ける。
- 確保と長さの更新を別の関数にすると、その間に外部の処理を挟める。
- `##` を使ったマクロで、型だけが違う似たコードを簡潔に書ける。
- 長さを変える前に、空きの範囲内かを必ず確かめる。
