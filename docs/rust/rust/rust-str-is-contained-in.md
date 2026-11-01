---
title: 短い針は SIMD で、長い針は通常の検索で判定する
description: 標準ライブラリの &str のパターン判定。針が 1 バイトなら contains、短い針で SIMD が使えるなら専用の比較、それ以外は一般の検索器で、包含を判定する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/str/pattern.rs
lines: [989, 1015]
function: impl Pattern for &str::is_contained_in
difficulty: 3
format: 2
tags: [文字列処理, 最適化, 探索]
---

## ひとことで

`is_contained_in` は、針（パターン）の文字列が、ヘイスタック（対象の文字列）の **中に含まれているかだけ** を判定する関数です。どこに現れるかは気にせず、有無だけを返します。

判定は、針の長さに応じて 3 つの経路に分けられます。1 バイトの針は、バイトの検索で済みます。短い針で SIMD が使えるなら、SIMD による比較を使います。それ以外は、一般的な検索器に任せます。

## コード

```rust:line-numbers=989
    fn is_contained_in(self, haystack: &str) -> bool {
        if self.is_empty() {
            return true;
        }

        match self.len().cmp(&haystack.len()) {
            Ordering::Less => {
                if self.len() == 1 {
                    return haystack.as_bytes().contains(&self.as_bytes()[0]);
                }

                #[cfg(any(
                    all(target_arch = "x86_64", target_feature = "sse2"),
                    all(target_arch = "loongarch64", target_feature = "lsx"),
                    all(target_arch = "aarch64", target_feature = "neon")
                ))]
                if self.len() <= 32 {
                    if let Some(result) = simd_contains(self, haystack) {
                        return result;
                    }
                }

                self.into_searcher(haystack).next_match().is_some()
            }
            _ => self == haystack,
        }
    }
```

この関数は、`&str` を針として、ヘイスタックを受け取ります。空の針はどこにでも含まれるので、最初に `true` を返します。針の長さと対象の長さを比べて、針が短いときだけ、詳しい検索に進みます。

## 前提知識

- **パターン（`Pattern`）**: 文字列の検索で、探す対象を表すトレイトです。`&str` や `char` などが実装しています。
- **SIMD**: 1 つの命令で、複数のバイトを同時に比べる仕組みです。CPU の機能に依存します。
- **`cfg` 属性**: 対象の CPU の機能によって、コードを含めるかを決める仕組みです。ここでは、SSE2 や NEON などが使える場合にだけ、SIMD の経路を含めます。
- **`into_searcher`**: 一般の検索器を作ります。前から順に、一致する場所を見つけます。
- **`simd_contains`**: SIMD で包含を判定する関数です。判定できない場合は `None` を返し、一般の検索に戻ります。

## 何をしているか

### 1. 空の針と、長い針を先に扱う

```rust:line-numbers=990
        if self.is_empty() {
            return true;
        }
```

空の針は、どこにでも含まれるので `true` です。針がヘイスタックより長いなら、含まれようがないので、等しい場合だけを `self == haystack` で判定します。

### 2. 1 バイトの針は、バイトの検索で済ませる

```rust:line-numbers=996
                if self.len() == 1 {
                    return haystack.as_bytes().contains(&self.as_bytes()[0]);
                }
```

針が 1 バイトなら、ヘイスタックのバイト列に、そのバイトが含まれるかを調べます。

### 3. 短い針は SIMD で判定する

```rust:line-numbers=1005
                if self.len() <= 32 {
                    if let Some(result) = simd_contains(self, haystack) {
                        return result;
                    }
                }
```

針が 32 バイト以下で、SIMD が使える環境なら、`simd_contains` を試します。結果が得られれば、それを返します。`None` なら、次の経路に進みます。

### 4. それ以外は一般の検索器に任せる

```rust:line-numbers=1011
                self.into_searcher(haystack).next_match().is_some()
```

どの経路でも判定できなければ、一般の検索器を作って、一致する場所があるかを調べます。

## ここがすごい

- **場合ごとの最適化**: 1 バイト、短い針、一般の針で、それぞれ最も速い方法を選びます。
- **SIMD は環境に合わせる**: `cfg` 属性で、対応する CPU でだけ SIMD のコードを含めます。対応しない環境では、一般の検索に進むだけです。
- **結果だけを返す**: 一致の位置を求めないので、途中で見つかった時点で止められます。

## まとめ

- 有無だけを知りたいときは、針の長さに応じて最も速い経路を選ぶ。
- 短い針は、SIMD の比較で一度に判定する。
- SIMD が使えない場合や判定できない場合は、一般の検索器に任せる。
