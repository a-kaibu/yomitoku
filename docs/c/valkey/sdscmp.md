---
title: "途中に 0 があっても正しく比べられる、長さつき文字列の比較"
description: "2 つの SDS 文字列を辞書順で比較する関数。strcmp ではなく memcmp で短いほうの長さぶんを比べ、同じなら長さで決着をつける。バイナリデータでも正しく動く。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [845, 866]
function: "sdscmp"
difficulty: 1
tags: [文字列処理, 標準ライブラリ, イディオム]
---

## ひとことで

`sdscmp(s1, s2)` は、2 つの SDS 文字列を比べて、`s1` が大きければ正、小さければ負、まったく同じなら `0` を返します。
`"apple"` と `"apricot"` なら、3 文字目の `'p'` と `'r'` の違いで `"apple"` が小さい、と判定します。
`"abc"` と `"abcd"` のように片方がもう片方の先頭部分と同じなら、**長いほうが大きい** とします。

## コード

```c:line-numbers=845
/* Compare two sds strings s1 and s2 with memcmp().
 *
 * Return value:
 *
 *     positive if s1 > s2.
 *     negative if s1 < s2.
 *     0 if s1 and s2 are exactly the same binary string.
 *
 * If two strings share exactly the same prefix, but one of the two has
 * additional characters, the longer string is considered to be greater than
 * the smaller one. */
int sdscmp(const_sds s1, const_sds s2) {
    size_t l1, l2, minlen;
    int cmp;

    l1 = sdslen(s1);
    l2 = sdslen(s2);
    minlen = (l1 < l2) ? l1 : l2;
    cmp = memcmp(s1, s2, minlen);
    if (cmp == 0) return l1 > l2 ? 1 : (l1 < l2 ? -1 : 0);
    return cmp;
}
```

## 前提知識

- **C の文字列と `strcmp`**: C の文字列は、値 0 のバイト（`'\0'`）で終わりを表します。標準の `strcmp` は、この 0 に出会うまで比べます。そのため、途中に 0 のバイトを含むデータ（画像やバイナリ）は、0 のところで「終わり」と誤解されてしまいます。
- **SDS**: Valkey の文字列形式で、長さをヘッダに記録しています。`sdslen(s)` で長さがすぐにわかり、途中に 0 があってもかまいません（バイナリセーフ）。
- **`memcmp(a, b, n)`**: メモリの `n` バイトを先頭から比べる標準関数です。最初に違ったバイトの大小で正・負を返し、全部同じなら 0 を返します。0 のバイトも特別扱いしません。バイトは符号なし（0〜255）として比べられます。
- **`const_sds`**: `const char *` の別名です。「この関数は中身を書き換えない」という約束です。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、偽なら `c` になる式です。864 行目はこれを 2 つ入れ子にしています。

## 何をしているか

### 1. 長さを取り出す（860〜862 行目）

`s1 = "abc"`（長さ 3）、`s2 = "abcd"`（長さ 4）とします。`minlen` は短いほうの 3 です。

### 2. 共通の長さだけ比べる（863 行目）

`memcmp(s1, s2, 3)` は `"abc"` と `"abc"` を比べるので `0` です。

`s1 = "apple"`、`s2 = "apricot"` なら、`minlen = 5` で比べ、3 文字目で `'p'`（0x70）と `'r'`（0x72）が違うので負の値が返ります。この場合は 865 行目でそのまま返します。

### 3. 先頭が同じなら長さで決める（864 行目）

`cmp == 0` のとき、`l1 > l2` なら 1、`l1 < l2` なら -1、同じなら 0 です。`"abc"` と `"abcd"` は `3 < 4` なので `-1` が返り、`"abc"` が小さいと判定されます。

### 4. 途中に 0 がある例

`s1` が `a \0 b`（3 バイト）、`s2` が `a \0 c`（3 バイト）だとします。`strcmp` なら 1 バイト目の `'\0'` で両方「終わり」とみなし、等しいと答えてしまいます。`memcmp` は 3 バイトすべてを比べるので、`'b' < 'c'` で正しく負を返します。

## ここがすごい

**バイナリセーフ**: Valkey のキーや値には、どんなバイト列でも入れられます。比較を `strcmp` ではなく「長さ＋`memcmp`」で行うことで、0 を含むデータでも正しい順序が得られます。ソート済み集合（sorted set）の要素の並び順など、比較の正しさが直接データの正しさにつながる場面で欠かせません。

**長さがすでにわかっている強み**: C の文字列だと、長さを知るには 0 を探して全体を読む必要があります。SDS は長さをヘッダに持っているので、`sdslen` は一瞬です。比べる範囲を最初から決められるので、`memcmp` は最適化された一括比較（何バイトかまとめて比べる）を使えます。

**辞書順の定義どおり**: 「共通部分で決まらなければ、短いほうが先」は辞書の並べ方と同じです。`"abc"` が `"abcd"` より前に来るのは、辞書で「あい」が「あいう」より前に来るのと同じ理屈です。

**戻り値は符号だけを使う**: `memcmp` の戻り値は「正か負か」が意味を持ち、具体的な値は実装によって違います。呼び出し側も符号だけを見るのが約束です。

## まとめ

- `strcmp` は 0 のバイトで止まるので、バイナリデータの比較には使えない。
- 長さがわかっていれば、短いほうの長さで `memcmp` し、同じなら長さで決着をつける。
- 共通部分が同じなら短いほうが小さい、が辞書順のルール。
- 長さを別に持つ文字列は、比較やコピーで 0 のバイトを特別扱いしなくて済む。
