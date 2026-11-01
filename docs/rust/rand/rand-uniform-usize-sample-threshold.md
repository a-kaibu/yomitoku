---
title: 偏りを生む端を、閾値で捨てて一様な整数を作る
description: rand の usize の一様抽出。乱数と範囲の積の上位を取り、下位が閾値より小さいときだけ捨て直す。捨てる部分を事前の閾値で決め、偏りを取り除く。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/distr/uniform_int.rs
lines: [514, 549]
function: UniformUsize::sample
difficulty: 3
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`sample` は、`low` から `low + range` の範囲で、**偏りのない一様な整数** を 1 つ作る関数です。乱数を範囲の大きさに合わせるには、単純な剰余を使うと、一部の値が出やすくなってしまいます。この関数は、その偏りを生む端の部分を **拒否** して、乱数をやり直します。

計算には、乱数と範囲の掛け算（`wmul`）を使います。その結果の下位の部分が閾値より小さいときだけ、乱数をやり直します。

## コード

```rust:line-numbers=514
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> usize {
        #[cfg(target_pointer_width = "32")]
        let mode32 = true;
        #[cfg(target_pointer_width = "64")]
        let mode32 = !self.mode64;

        if mode32 {
            let range = self.range as u32;
            if range == 0 {
                return rng.random::<u32>() as usize;
            }

            let thresh = self.thresh as u32;
            let hi = loop {
                let (hi, lo) = rng.random::<u32>().wmul(range);
                if lo >= thresh {
                    break hi;
                }
            };
            self.low.wrapping_add(hi as usize)
        } else {
            let range = self.range as u64;
            if range == 0 {
                return rng.random::<u64>() as usize;
            }

            let thresh = self.thresh as u64;
            let hi = loop {
                let (hi, lo) = rng.random::<u64>().wmul(range);
                if lo >= thresh {
                    break hi;
                }
            };
            self.low.wrapping_add(hi as usize)
        }
    }
```

この関数は、`UniformUsize` という構造体のメソッドです。`range`、`thresh`、`low` の 3 つの値は、事前に計算されて保存されています。`mode64` は、64 ビット版と 32 ビット版のどちらの乱数を使うかを決めます。

## 前提知識

- **偏り（モジュロバイアス）**: 乱数を剰余で範囲に収めると、範囲の大きさが乱数の総数の約数でない場合に、一部の値が出やすくなります。
- **`wmul`**: 2 つの整数の積を、上位と下位の部分に分けて返す演算です。上位が範囲の中の一様な値になります。
- **閾値（`thresh`）**: 偏りを生じさせる、下位の部分の境目です。その値より小さい下位の結果は捨てます。
- **`mode64`**: 64 ビットの範囲で計算するかを表すフラグです。範囲が小さい場合には、32 ビットの乱数で十分です。
- **`range == 0`**: 範囲が全体（すべての値）を表す特別な場合です。乱数をそのまま返せます。

## 何をしているか

### 1. 全範囲の場合は、乱数をそのまま返す

```rust:line-numbers=521
            let range = self.range as u32;
            if range == 0 {
                return rng.random::<u32>() as usize;
            }
```

32 ビットの経路では、範囲が 0 なら、全体の値を表すので、乱数をそのまま返します。64 ビットの経路も同じ考えで、`u64` の乱数を返します。

### 2. 乱数と範囲を掛けて、閾値と比べる

```rust:line-numbers=526
            let thresh = self.thresh as u32;
            let hi = loop {
                let (hi, lo) = rng.random::<u32>().wmul(range);
                if lo >= thresh {
                    break hi;
                }
            };
            self.low.wrapping_add(hi as usize)
```

乱数と範囲を `wmul` で掛けて、上位 `hi` と下位 `lo` に分けます。`lo` が閾値以上なら、そのときの `hi` を採用します。下位が閾値より小さい場合は、偏りを生む部分なので、乱数をもう一度引きます。

### 3. 採用した値に下限を足す

```rust:line-numbers=533
            self.low.wrapping_add(hi as usize)
```

最後に、採用した `hi` に `low` を足して返します。これで、結果は `low` から `low + range` の範囲に収まります。

### 4. 64 ビットの経路も同じ形

```rust:line-numbers=535
            let range = self.range as u64;
            if range == 0 {
                return rng.random::<u64>() as usize;
            }

            let thresh = self.thresh as u64;
            let hi = loop {
                let (hi, lo) = rng.random::<u64>().wmul(range);
                if lo >= thresh {
                    break hi;
                }
            };
            self.low.wrapping_add(hi as usize)
```

64 ビットの経路は、型を `u64` に替えただけで、手順は同じです。どちらの経路も、閾値による拒否を行います。

## ここがすごい

- **偏りを厳密に取り除く**: 拒否された値は、捨てられて乱数が引き直されます。その結果、どの値も同じ確率で出ます。
- **剰余を使わない**: 割り算の余りを使わないので、範囲の大きさが総数の約数でなくても、偏りが生じません。
- **拒否はまれ**: 閾値は、拒否される範囲が小さくなるように決められています。平均すると、乱数は 1 回か少しの回数で済みます。

## まとめ

- 乱数と範囲の掛け算の上位を取ると、剰余より偏りの少ない値が得られる。
- 下位が閾値より小さい場合だけ、乱数を引き直して偏りを取り除く。
- 全範囲の場合は、乱数をそのまま返す。
