---
title: 2 つのエポックが何世代離れているかを求める
description: crossbeam-epoch の Epoch::wrapping_sub。印のビットを無視して差を取り、1 ビット右にずらして世代の差を得る。番号が溢れても正しく動く。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-epoch/src/epoch.rs
lines: [50, 55]
function: Epoch::wrapping_sub
difficulty: 3
format: 2
tags: [並行処理, ビット演算, 数値計算]
---

## ひとことで

`wrapping_sub` は、2 つのエポックが **何世代ぶん離れているか** を符号付きの整数で返す関数です。`self` が `rhs` より 3 世代先なら 3、後なら −3 のような値になります。
番号は途中で溢れて、0 に戻ることがあります。それでも、差を正しく求められるように、引き算の結果を符号付きとして読み、ピン留めの印を捨てる形になっています。

## コード

::: code-group

```rust:line-numbers=50 [日本語訳]
    pub(crate) fn wrapping_sub(self, rhs: Self) -> EpochReprSigned {
        // 結果は `(self.data & !1).wrapping_sub(rhs.data & !1) as isize >> 1` と同じになる
        // `(self.data & !1).wrapping_sub(rhs.data & !1)` では最下位ビットの差が出うるが
        // シフト演算で無視されるため
        self.data.wrapping_sub(rhs.data & !1) as EpochReprSigned >> 1
    }
```

```rust:line-numbers=50 [原文]
    pub(crate) fn wrapping_sub(self, rhs: Self) -> EpochReprSigned {
        // The result is the same with `(self.data & !1).wrapping_sub(rhs.data & !1) as isize >> 1`,
        // because the possible difference of LSB in `(self.data & !1).wrapping_sub(rhs.data & !1)`
        // will be ignored in the shift operation.
        self.data.wrapping_sub(rhs.data & !1) as EpochReprSigned >> 1
    }
```

:::

番号は、1 世代進むごとに 2 ずつ増えます（最下位ビットは印として空けてあります）。そのため、ずらしの量が 1 ビットで済みます。

## 前提知識

- **`wrapping_sub`**: 引き算が型の範囲を下回っても止まらず、2^n を法として余りを返す引き算です。番号が溢れても、差は正しい値になります。
- **符号付きと符号なし**: 同じビット列でも、符号なしとして見るか、符号付きとして見るかで意味が変わります。最上位ビットが 1 なら、符号付きでは負の数になります。
- **算術右シフト**: 符号付きの整数を右にずらすとき、上位に元の符号ビットを残す（符号を保つ）シフトです。`as EpochReprSigned >> 1` で、負の差も負のまま 2 で割れます。
- **`rhs.data & !1`**: 比べる相手の印を消してから引き算をする、という意味です。
- **`EpochReprSigned`**: 番号を表す符号付きの整数型です。`usize` と同じビット幅を持ちます。

## 何をしているか

### 1. 印を無視して引き算をする

```rust:line-numbers=54
        self.data.wrapping_sub(rhs.data & !1) as EpochReprSigned >> 1
```

（`wrapping_sub` の本体です。）`rhs` の印を消してから、`self.data` から引きます。結果は、`self` の印の差だけを最下位ビットに残した値になります。

### 2. 符号付きとして読み、1 ビット右にずらす

同じ行の `as EpochReprSigned >> 1` で、結果を符号付きの整数として読み直し、1 ビット右にずらします。
最下位ビットは、印の差です。それを捨てると、番号の差が 2 倍になった数が残ります。番号は 2 ずつ進むので、右に 1 ビットずらすと、ちょうど世代の差になります。

### 3. 溢れても答えが変わらない

`wrapping_sub` を使うので、番号が型の最大値を超えて 0 に戻っても、差はそのまま正しく求まります。ずらしたあとの値も、符号付きの範囲に収まる前提で設計されています。

## ここがすごい

- **比較を引き算 1 回で済ませる**: 世代の前後を判定するのに、番号の大小を比べると、溢れた瞬間に大小が逆転してしまいます。引き算の結果を符号で読めば、溢れの前後でも正しく判定できます。
- **印の影響を消す工夫**: `rhs.data & !1` で相手の印を消し、結果のずらしで自分の印を捨てています。印の情報を気にせず、番号の差だけを取り出せます。
- **コメントに理屈が書かれている**: 最下位ビットの差がシフトで消えること、そのため結果が同じになること、がコメントで説明されています。読み手が式を確かめられます。
- **番号の範囲が限られている**: 番号は `(isize::MIN / 2) .. (isize::MAX / 2)` の範囲で表され、差もその範囲に入ります。範囲を決めておくことで、符号付きの読み替えが安全になります。
- **世代の管理が一定の速さ**: 引き算とシフトだけなので、いつ比べても同じ時間で終わります。

## まとめ

- エポックの差は、印を消して引き算し、符号付きで 1 ビット右にずらすと求まる。
- 番号は 2 ずつ進むので、1 ビットのずらしで世代の数になる。
- 溢れを `wrapping_sub` で扱うので、番号が 0 に戻っても正しい差が得られる。
