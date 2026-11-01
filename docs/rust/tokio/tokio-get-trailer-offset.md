---
title: 構造体の並びに、アラインメントの詰め物を入れて位置を求める
description: tokio のタスクの領域で、後ろの領域（トレーラ）の開始位置を求める関数。ヘッダ、本体、トレーラの順に並べ、それぞれの配置の要件に合うよう、余白を切り上げて計算する。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/task/raw.rs
lines: [123, 143]
function: get_trailer_offset
difficulty: 3
format: 2
tags: [型システム, メモリ管理, 数値計算]
---

## ひとことで

`get_trailer_offset` は、タスクの **メモリ上の 1 つのブロック** の中で、後ろに置く **トレーラ**（追加の領域）が始まる位置を、バイト単位で求める関数です。ブロックは、ヘッダ、本体（core）、トレーラの順に並びます。

CPU は、型ごとに決まった位置（アラインメント）にデータがあると速く読めます。この関数は、本体とトレーラがそれぞれの配置の要件を満たすように、必要な余白を入れて位置を決めます。

## コード

```rust:line-numbers=123
const fn get_trailer_offset(
    header_size: usize,
    core_size: usize,
    core_align: usize,
    trailer_align: usize,
) -> usize {
    let mut offset = header_size;

    let core_misalign = offset % core_align;
    if core_misalign > 0 {
        offset += core_align - core_misalign;
    }
    offset += core_size;

    let trailer_misalign = offset % trailer_align;
    if trailer_misalign > 0 {
        offset += trailer_align - trailer_misalign;
    }

    offset
}
```

この関数は `const fn` なので、コンパイル時にも計算できます。戻り値は、トレーラを置き始めるオフセットです。

## 前提知識

- **アラインメント（配置の要件）**: 型のデータは、そのアラインメントの倍数の位置に置かれる必要があります。たとえば 8 バイトのアラインメントなら、アドレスが 8 の倍数です。
- **余白（パディング）**: 位置を揃えるために入れる、使われない空きのバイトです。
- **`%` と切り上げ**: 位置が揃っていないときは、剰余から不足分を求め、次の倍数まで進めます。
- **`const fn`**: コンパイル時に呼べる関数です。定数の計算に使えます。
- **ヘッダ・本体・トレーラ**: タスクの領域の前、中央、後ろの部分です。それぞれ大きさと配置の要件が違います。

## 何をしているか

### 1. 本体の位置を揃える

```rust:line-numbers=129
    let mut offset = header_size;

    let core_misalign = offset % core_align;
    if core_misalign > 0 {
        offset += core_align - core_misalign;
    }
```

ヘッダの後ろから始めて、本体の配置の要件に合わせます。ずれていれば、次の倍数まで余白を足します。

### 2. 本体の大きさを足す

```rust:line-numbers=135
    offset += core_size;
```

本体の大きさを足して、本体の終わりの位置を求めます。

### 3. トレーラの位置を揃える

```rust:line-numbers=137
    let trailer_misalign = offset % trailer_align;
    if trailer_misalign > 0 {
        offset += trailer_align - trailer_misalign;
    }
```

本体の終わりから、トレーラの配置の要件に合うように、余白を足します。揃ったところが、トレーラの開始位置です。

```rust:line-numbers=142
    offset
```

求めた位置を返します。

## ここがすごい

- **計算が一定の手間**: 剰余と足し算だけで、位置が決まります。ループも分岐の数も少なく、コンパイル時に計算できます。
- **必要な余白だけ入れる**: 配置がすでに揃っていれば、余白は入りません。無駄な空きを減らせます。
- **配置の要件を明示**: 本体とトレーラの要件を、引数として分けて渡しています。型が変わっても、同じ関数で位置を求められます。

## まとめ

- ヘッダ、本体、トレーラの順に並べ、それぞれの配置の要件に合わせて余白を入れる。
- 余白は剰余から求めた不足分だけで、無駄を増やさない。
- `const fn` なので、コンパイル時に位置を決めることもできる。
