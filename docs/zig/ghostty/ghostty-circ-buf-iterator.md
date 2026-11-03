---
title: 円形バッファを、古い順か新しい順に読み進める反復子を作る
description: Ghostty の CircBuf.iterator。バッファの値を持つ構造体と、読む向きを受け取り、位置 0 から始まる反復子を返す。順方向と逆方向の両方に対応する。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [116, 122]
function: CircBuf.iterator
difficulty: 2
format: 2
tags: [データ構造, イディオム, 標準ライブラリ]
---

## ひとことで

`iterator` は、円形バッファの中身を順番に読むための反復子（イテレータ）を作る関数です。読む向きとして、古い順か新しい順かを選べます。Ghostty では、バッファの値を先頭から一つずつ取り出すときに使われます。

## コード

```zig:line-numbers=116
        pub fn iterator(self: Self, direction: Iterator.Direction) Iterator {
            return Iterator{
                .buf = self,
                .idx = 0,
                .direction = direction,
            };
        }
```

## 前提知識

- **反復子（iterator）**: 集まりの要素を、一つずつ順に取り出すための値です。`next` 関数で、次の要素を返します。
- **向き（direction）**: 読む順番です。`forward` は古い順、`reverse` は新しい順を表します。
- **構造体のリテラル（`Iterator{ ... }`）**: 名前付きの値を並べて、構造体を作る書き方です。
- **値のコピー**: `self` を値として受け取るので、反復子はバッファのコピーを持ちます。ここでは、中身を読むだけなので、元のバッファは変わりません。
- **`idx`**: 反復子が今どこまで読んだかを表す位置です。

## 何をしているか

### 1. バッファと向きを持つ反復子を作る

```zig:line-numbers=117
            return Iterator{
                .buf = self,
                .idx = 0,
                .direction = direction,
            };
```

`Iterator` の構造体に、バッファ（`buf`）、読み始めの位置（`idx = 0`）、読む向き（`direction`）を入れて返します。読み始めは 0 から、つまり一番古い位置からです。

### 2. 呼び出し側が次々に読む

反復子の `next` 関数を呼ぶたびに、`idx` が進みます。向きによって、先頭から末尾へ進むか、末尾から先頭へ進むかが決まります。

## ここがすごい

- **読み取り専用**: 反復子は、バッファの中身を変えずに読みます。読みながら書き換える危険がありません。
- **向きを引数で選ぶ**: 同じ `iterator` の関数で、古い順と新しい順の両方を読めます。`first` と `last` も、この仕組みを使っています。
- **状態を反復子に閉じ込める**: 読んだ位置の情報は反復子が持つので、バッファ自体には増えません。
- **値を返す形**: 反復子は値として返るので、ループの中で気軽に作って、使い捨てられます。

## まとめ

- `iterator` は、読む向きを選べる反復子を作ります。
- 反復子は、読む位置と向きを持ち、バッファを変えずに中身を読みます。
- 古い順と新しい順の両方に対応します。
