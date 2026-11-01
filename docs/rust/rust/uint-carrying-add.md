---
title: 繰り上がり付きの足し算と「2 つは同時に立たない」という証明
description: 多倍長整数の足し算の部品になる「繰り上がり入力つき加算」。2 回の加算の繰り上がりが同時に起きないことを示し、OR を最適化しやすい形で書いている。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [3051, 3064]
function: carrying_add
difficulty: 3
format: 2
tags: [数値計算, 最適化, ビット演算, 標準ライブラリ]
---

## ひとことで

`carrying_add` は、`self + rhs + carry` を計算し、**結果と「さらに上の桁への繰り上がり」** の 2 つを返す関数です。
筆算の足し算で「下の桁からの繰り上がりを足して、次の桁への繰り上がりを出す」のと同じことを、整数 1 個を 1 桁とみなして行います。

たとえば `u8` で `200.carrying_add(100, true)` は `200 + 100 + 1 = 301` なので、結果は `301 - 256 = 45`、繰り上がりは `true` です。
これを何個もつなげれば、64 ビットを超える巨大な整数（多倍長整数）の足し算が作れます。

## コード

::: code-group

```rust:line-numbers=3051 [日本語訳]
        #[inline]
        pub const fn carrying_add(self, rhs: Self, carry: bool) -> (Self, bool) {
            // 注: 長期的には組み込み関数で行うべきだが、これが
            //   今のところ最適なコードを生むことが分かっており、LLVM に同等の組み込みはない。
            let (a, c1) = self.overflowing_add(rhs);
            let (b, c2) = a.overflowing_add(carry as $SelfT);
            // 理想的には LLVM が、こちらが教えなくても互いに重ならないと分かるべきだが、
            // 分からないので <https://github.com/llvm/llvm-project/issues/118162> を参照。
            // SAFETY: `c1` と `c2` は同時には立たない。
            // c1 が立つには加算があふれている必要があり、あふれたなら
            // `a` は高々 `MAX-1` なので、`c2` があふれることはありえない
            // （`bool` から来るので、足すのは高々 `1`）。
            (b, unsafe { intrinsics::disjoint_bitor(c1, c2) })
        }
```

```rust:line-numbers=3051 [原文]
        #[inline]
        pub const fn carrying_add(self, rhs: Self, carry: bool) -> (Self, bool) {
            // note: longer-term this should be done via an intrinsic, but this has been shown
            //   to generate optimal code for now, and LLVM doesn't have an equivalent intrinsic
            let (a, c1) = self.overflowing_add(rhs);
            let (b, c2) = a.overflowing_add(carry as $SelfT);
            // Ideally LLVM would know this is disjoint without us telling them,
            // but it doesn't <https://github.com/llvm/llvm-project/issues/118162>
            // SAFETY: Only one of `c1` and `c2` can be set.
            // For c1 to be set we need to have overflowed, but if we did then
            // `a` is at most `MAX-1`, which means that `c2` cannot possibly
            // overflow because it's adding at most `1` (since it came from `bool`)
            (b, unsafe { intrinsics::disjoint_bitor(c1, c2) })
        }
```

:::

## 前提知識

- **タプル `(Self, bool)`**: 複数の値をひとまとめにして返す型です。`let (a, c1) = ...` と書くと、タプルの中身を 2 つの変数に分けて受け取れます。
- **`bool`**: `true` か `false` の 2 値の型です。`carry as $SelfT` で `true` は `1`、`false` は `0` の整数に変換できます。
- **`overflowing_add`**: 足し算をして、型の範囲を超えたら折り返した結果と「オーバーフローしたか」を `(結果, bool)` で返すメソッドです。`u8` で `200.overflowing_add(100)` は `(44, true)` です。
- **`$SelfT`**: このコードは各整数型（`u8`〜`u128`）に同じ関数を作るマクロの中にあり、`$SelfT` はその型名に置き換わります。
- **`unsafe`**: Rust がふだん保証している安全性チェックを、プログラマの責任で外すブロックです。「ここは正しいと人間が保証する」という印でもあります。
- **`intrinsics::disjoint_bitor`**: コンパイラ内蔵の関数で、「2 つの値に共通の 1 ビットがない」と約束したうえで OR を計算します。約束を破ると未定義動作になります。

## 何をしているか

### 1. 2 段階で足す

```rust:line-numbers=3055
            let (a, c1) = self.overflowing_add(rhs);
            let (b, c2) = a.overflowing_add(carry as $SelfT);
```


`u8` で `self = 200`、`rhs = 100`、`carry = true` の例です。

```
(a, c1) = 200.overflowing_add(100) = (44, true)
(b, c2) = 44.overflowing_add(1)    = (45, false)
```

まず `self + rhs`、次にその結果に `carry`（0 か 1）を足します。それぞれの足し算で繰り上がりが起きたかを `c1`、`c2` に受け取ります。

### 2. 繰り上がりをまとめる

```rust:line-numbers=3063
            (b, unsafe { intrinsics::disjoint_bitor(c1, c2) })
```


最終的な繰り上がりは「`c1` または `c2`」です。ふつうは `c1 | c2` と書けば十分ですが、ここでは `disjoint_bitor` を使っています。

### 3. なぜ「同時には立たない」のかのコメント）

```rust:line-numbers=3059
            // SAFETY: Only one of `c1` and `c2` can be set.
            // For c1 to be set we need to have overflowed, but if we did then
            // `a` is at most `MAX-1`, which means that `c2` cannot possibly
            // overflow because it's adding at most `1` (since it came from `bool`)
```


`c1` が `true` になるのは `self + rhs` があふれたときです。`u8` の最大値は 255 なので、あふれた結果 `a` は最大でも `255 + 255 - 256 = 254`、つまり `MAX - 1` です。
そこに足すのは高々 `1` なので、`a + 1 <= 255` となり、2 回目は絶対にあふれません。逆に `c2` が立つのは `a = 255` のときだけで、そのとき 1 回目はあふれていません。
よって `c1` と `c2` は同時に `true` にならず、OR と XOR と足し算がすべて同じ結果になります。

## ここがすごい

- **証明をコメントに書いてから `unsafe` を使う**: `unsafe` を使う箇所には「なぜ安全か」を `// SAFETY:` コメントで説明するのが Rust の習慣です。ここでは短い数学的な証明がそのまま書かれています。
- **最適化のための情報をコンパイラに渡す**: 「2 つのビットが重ならない」とわかれば、コンパイラは OR を足し算として扱ったり、CPU の繰り上がりフラグ付き加算命令（x86 の `adc` など）にまとめたりしやすくなります。コメント中のリンクのとおり、LLVM が自力ではこの事実に気づけないため、人間が教えています。
- **素朴な実装を選んだ理由も書いてある**: コメントで、本来は専用の組み込み関数でやるべきだが、今はこの書き方が最適なコードを生むことが確かめられている、と経緯を残しています。
- **多倍長演算の基本部品**: 暗号や任意精度計算のライブラリは、この関数を「1 桁ぶんの加算器」として何度もつないで使えます。

## まとめ

- 多倍長整数の足し算は「繰り上がりを受け取り、繰り上がりを返す」加算の連鎖で作れる。
- `a + b + 1` の繰り上がりは 2 回に分けて調べられ、その 2 つは同時に起きない。
- `unsafe` を使うときは、安全である理由を必ずコメントで説明する。
- コンパイラが知らない事実を伝えると、よりよいコードが生成されることがある。
