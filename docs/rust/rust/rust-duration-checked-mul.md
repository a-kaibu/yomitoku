---
title: 秒とナノ秒の組を、溢れを確かめながら掛ける
description: 標準ライブラリの Duration の checked_mul。ナノ秒の部分を先に u64 で掛けて、1 秒を超えた分を秒へ繰り上げる。秒の掛け算と足し算は checked で確かめ、溢れたら None。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/time.rs
lines: [870, 883]
function: Duration::checked_mul
difficulty: 3
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`checked_mul` は、時間の長さを表す `Duration`（秒とナノ秒の組）を、整数倍する関数です。掛けた結果が表せない大きさになったら、`None` を返します。

`Duration` は、秒を `u64`、ナノ秒を 0 から 999,999,999 までの `u32` で持ちます。ナノ秒の部分を掛けると 1 秒を超えることがあるので、その分を秒へ繰り上げてから、秒と合わせます。

## コード

::: code-group

```rust:line-numbers=870 [日本語訳]
    pub const fn checked_mul(self, rhs: u32) -> Option<Duration> {
        // ナノ秒は u64 で掛けます。この順序なら溢れないからです。
        let total_nanos = self.nanos.as_inner() as u64 * rhs as u64;
        let extra_secs = total_nanos / (NANOS_PER_SEC as u64);
        let nanos = (total_nanos % (NANOS_PER_SEC as u64)) as u32;
        // FIXME(const-hack): 可能になったら `and_then` を使う。
        if let Some(s) = self.secs.checked_mul(rhs as u64) {
            if let Some(secs) = s.checked_add(extra_secs) {
                debug_assert!(nanos < NANOS_PER_SEC);
                return Some(Duration::new(secs, nanos));
            }
        }
        None
    }
```

```rust:line-numbers=870 [原文]
    pub const fn checked_mul(self, rhs: u32) -> Option<Duration> {
        // Multiply nanoseconds as u64, because it cannot overflow that way.
        let total_nanos = self.nanos.as_inner() as u64 * rhs as u64;
        let extra_secs = total_nanos / (NANOS_PER_SEC as u64);
        let nanos = (total_nanos % (NANOS_PER_SEC as u64)) as u32;
        // FIXME(const-hack): use `and_then` once that is possible.
        if let Some(s) = self.secs.checked_mul(rhs as u64) {
            if let Some(secs) = s.checked_add(extra_secs) {
                debug_assert!(nanos < NANOS_PER_SEC);
                return Some(Duration::new(secs, nanos));
            }
        }
        None
    }
```

:::

この関数は、`self` の各部分に `rhs`（掛ける数）を掛けます。掛けた結果が `u64` の秒に収まらないときだけ `None` になります。成功すれば、正しく正規化された `Duration` を返します。

## 前提知識

- **`Duration`**: 時間の長さを、秒とナノ秒の組で表す型です。ナノ秒の部分は、必ず 1 秒未満になるように保たれます。
- **正規化**: ナノ秒が 10 億（1 秒）以上になったら、秒へ繰り上げて、ナノ秒を 1 秒未満に戻すことです。
- **`checked_mul` と `checked_add`**: 溢れたら `None` を返す計算です。溢れを確実に検出できます。
- **`as_inner`**: 内部の値を取り出す補助のメソッドです。ナノ秒の値を `u32` として取り出します。
- **`debug_assert!`**: デバッグのときだけ、ナノ秒が 1 秒未満であることを確かめます。

## 何をしているか

### 1. ナノ秒の部分を、先に 64 ビットで掛ける

```rust:line-numbers=872
        let total_nanos = self.nanos.as_inner() as u64 * rhs as u64;
        let extra_secs = total_nanos / (NANOS_PER_SEC as u64);
        let nanos = (total_nanos % (NANOS_PER_SEC as u64)) as u32;
```

ナノ秒（最大約 10 億）に `rhs` を掛けます。`u32` どうしの積は `u64` に収まるので、溢れません。その結果を 1 秒（10 億ナノ秒）で割って、秒への繰り上がり `extra_secs` と、残りのナノ秒 `nanos` に分けます。

### 2. 秒の部分を掛けて、繰り上がりを足す

```rust:line-numbers=876
        if let Some(s) = self.secs.checked_mul(rhs as u64) {
            if let Some(secs) = s.checked_add(extra_secs) {
```

秒の部分に `rhs` を掛けます。溢れたら `None` です。その後、繰り上がった `extra_secs` を足します。ここでも溢れたら `None` です。

### 3. 正規化された値を返す

```rust:line-numbers=878
                debug_assert!(nanos < NANOS_PER_SEC);
                return Some(Duration::new(secs, nanos));
            }
        }
        None
```

すべての計算が成功したら、秒とナノ秒の組を `Duration` として返します。どこかで溢れていれば、最後まで `None` が返ります。

## ここがすごい

- **溢れを段階で防ぐ**: ナノ秒の積は、`u64` に収まるように順番を決めています。溢れうるのは、秒の掛け算と足し算だけで、どちらも `checked` で確かめます。
- **繰り上がりを明示**: 1 秒を超えた分を、整数の割り算と剰余で正確に秒へ運びます。正規化の不変条件が保たれます。
- **失敗が値になる**: 溢れは `None` として返るので、呼び出し側が、計算できない場合を選んで扱えます。

## まとめ

- 秒とナノ秒の組は、ナノ秒を先に掛けて、1 秒を超えた分を秒へ繰り上げる。
- 秒の掛け算と足し算は `checked` で確かめ、溢れは `None` で返す。
- 結果は必ず、ナノ秒が 1 秒未満になるように正規化する。
