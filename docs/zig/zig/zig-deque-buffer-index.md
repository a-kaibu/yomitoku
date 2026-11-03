---
title: 円形の配列の「論理的な位置」を、割り算なしで実際の位置に変える
description: Zig の std.Deque の bufferIndex。先頭の位置からの番号を、配列の中の本当の位置へ変換する。剰余演算を使わず、足し算と引き算だけで済ませる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/deque.zig
lines: [236, 245]
function: Deque.bufferIndex
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`bufferIndex` は、両端キュー（Deque）の中で「先頭から何番目か」という番号を、配列の中の実際の位置に直す関数です。
円形のバッファでは、データが配列の末尾を越えて先頭へ続くことがあります。そのため、番号をそのまま配列の添字に使うと、正しい要素を指せません。

普通は `(head + index) % buffer.len` と書けば済みます。しかし、この関数は割り算（剰余）を使わず、比較と引き算だけで位置を求めています。

## コード

::: code-group

```zig:line-numbers=236 [日本語訳]
        fn bufferIndex(deque: *const Self, index: usize) usize {
            // この関数は、オーバーフローを避けるために、このように書かれている。
            // 割り算は重い命令なので、避けている。
            const head_len = deque.buffer.len - deque.head;
            if (index < head_len) {
                return deque.head + index;
            } else {
                return index - head_len;
            }
        }
```

```zig:line-numbers=236 [原文]
        fn bufferIndex(deque: *const Self, index: usize) usize {
            // This function is written in this way to avoid overflow and
            // expensive division.
            const head_len = deque.buffer.len - deque.head;
            if (index < head_len) {
                return deque.head + index;
            } else {
                return index - head_len;
            }
        }
```

:::
## 前提知識

- **両端キュー（Deque）**: 先頭と末尾の両方から、要素を追加したり取り出したりできるデータ構造です。
- **円形のバッファ（リングバッファ）**: 配列を輪のように使い、末尾の次は先頭に戻るように扱う仕組みです。
- **`head`**: 先頭の要素が配列のどこにあるかを表す位置です。
- **論理的な位置と物理的な位置**: 論理的な位置は、先頭から数えた番号（0 が先頭）です。物理的な位置は、配列の中の添字です。
- **`%`（剰余）**: 割った余りを求める演算です。割り算の仲間で、CPU にとっては比較的重い命令です。
- **`if ... else`**: 条件によって、戻す値を選ぶ書き方です。

## 何をしているか

### 1. 先頭から配列の末尾までの長さを求める

```zig:line-numbers=239
            const head_len = deque.buffer.len - deque.head;
```

`head` から配列の末尾までに、いくつの位置があるかを求めます。たとえば配列の長さが 8 で、`head` が 6 なら、`head_len` は 2 です（位置 6 と 7）。

### 2. 番号が末尾の内側にあれば、足すだけ

```zig:line-numbers=240
            if (index < head_len) {
                return deque.head + index;
```

番号 `index` が `head_len` より小さければ、その要素は `head` から続く位置にあります。`head + index` を返すだけで済みます。

### 3. 末尾を越えたら、先頭に戻って数える

```zig:line-numbers=242
            } else {
                return index - head_len;
            }
```

番号が `head_len` 以上なら、要素は配列の先頭側に回り込んでいます。`index - head_len` で、先頭からの位置を求めます。

たとえば配列の長さ 8、`head = 6` で `index = 3` のとき、`head_len = 2` です。`3 >= 2` なので、`3 - 2 = 1` を返します。配列の位置 6、7、0、1 の順に並んでいるので、論理的な 3 番目は位置 1 です。合っています。

## ここがすごい

- **割り算を使わない**: `% buffer.len` と書くと、割り算が毎回必要になります。ここでは、比較と 1 回の足し算か引き算で済むので、速く動きます。
- **オーバーフローを避ける**: `head + index` の結果が配列の範囲を越えるような場合も、先に長さを比べるので、大きな値の計算で誤りが出にくくなっています。
- **分岐は 1 回だけ**: 最初の比較で、「末尾の内側」と「先頭に回り込んだ後」を決めます。ループや再帰はありません。
- **読み手への配慮**: コメントに、この書き方の理由が明記されています。速さのために、あえてこの形を選んだことが分かります。

## まとめ

- 円形のバッファでは、論理的な番号を配列の位置に直す計算が必要です。
- 先頭から末尾までの長さと比べると、足すだけか、引くだけかが決まります。
- 割り算を避けると、同じ仕事をより軽く行えます。
- コメントに理由を書いておくと、後から読む人が意図を理解できます。
