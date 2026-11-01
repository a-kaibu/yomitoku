---
title: 範囲の両端を、失敗を Option で返しながら数に直す
description: indexmap が、Rust の範囲指定を実際の開始と終了の位置に直す try_simplify_range。両端の包む・包まないを match で場合分けし、範囲外なら None を返す。
language: rust
project: indexmap
repo: https://github.com/indexmap-rs/indexmap
license: Apache-2.0 OR MIT
copyright: Copyright (c) 2016--2017
commit: "41a870887c4c77adf665886e63df08f406bfe37a"
file: src/util.rs
lines: [56, 76]
function: try_simplify_range
difficulty: 2
format: 2
tags: [エラー処理, API設計, 型システム]
---

## ひとことで

`try_simplify_range` は、`..` や `1..=3` のような **範囲の指定** を、スライスの中で使える開始位置と終了位置（`start..end`）に直す関数です。直せないとき（範囲が長さを超えるなど）は、パニックせずに `None` を返します。
Rust の範囲には、「含む（Included）」「含まない（Excluded）」「指定なし（Unbounded）」の 3 種類の境界があります。この関数は、その組み合わせを 1 つずつ場合分けして、正しい数に直しています。

## コード

```rust:line-numbers=56
pub(crate) fn try_simplify_range<R>(range: R, len: usize) -> Option<Range<usize>>
where
    R: RangeBounds<usize>,
{
    let start = match range.start_bound() {
        Bound::Unbounded => 0,
        Bound::Included(&i) if i <= len => i,
        Bound::Excluded(&i) if i < len => i + 1,
        _ => return None,
    };
    let end = match range.end_bound() {
        Bound::Unbounded => len,
        Bound::Excluded(&i) if i <= len => i,
        Bound::Included(&i) if i < len => i + 1,
        _ => return None,
    };
    if start > end {
        return None;
    }
    Some(start..end)
}
```

同じファイルの `simplify_range` は、この関数と同じ場合分けをして、失敗のときにパニックします。違いは、失敗の扱いだけです。

## 前提知識

- **`RangeBounds` トレイト**: `..`、`1..3`、`..=5` のような範囲を、共通の方法で扱えるようにするトレイトです。`start_bound` と `end_bound` で、両端の境界を取り出せます。
- **`Bound`**: 境界の種類を表す列挙型です。`Included(値)`（その値を含む）、`Excluded(値)`（その値を含まない）、`Unbounded`（指定なし）の 3 つがあります。
- **`Option`**: 値があるかないかを表す型です。`Some(値)` または `None` のどちらかになります。
- **`match` のガード**: `Bound::Included(&i) if i <= len` のように、パターンの後ろに `if` の条件を付けられます。条件を満たすときだけ、その腕が選ばれます。
- **`Range<usize>`**: `start..end` の形の範囲で、開始を含み、終了を含みません。

## 何をしているか

### 1. 開始位置を決める

```rust:line-numbers=60
    let start = match range.start_bound() {
        Bound::Unbounded => 0,
        Bound::Included(&i) if i <= len => i,
        Bound::Excluded(&i) if i < len => i + 1,
        _ => return None,
    };
```

開始の境界が「含む」なら、その値がそのまま開始位置です。「含まない」なら、1 つ先が開始位置になります。ただし、`i < len` のときだけ `i + 1` は長さ以下になるので有効です。指定なしは 0 です。どれにも当てはまらないときは `None` を返します。

### 2. 終了位置を決める

```rust:line-numbers=66
    let end = match range.end_bound() {
        Bound::Unbounded => len,
        Bound::Excluded(&i) if i <= len => i,
        Bound::Included(&i) if i < len => i + 1,
        _ => return None,
    };
```

終了の境界は、開始とちょうど逆です。「含まない」なら、その値が終了位置です。「含む」なら、1 つ先が終了位置です。指定なしは長さになります。

### 3. 開始が終了より後なら失敗にする

```rust:line-numbers=72
    if start > end {
        return None;
    }
    Some(start..end)
```

開始が終了より大きい範囲は、ありえない範囲です。そのときは `None`、そうでなければ `start..end` を `Some` で返します。

## ここがすごい

- **場合分けが表になっている**: 開始と終了それぞれ 4 本ずつの腕があり、3 種類の境界の組み合わせが一目で分かります。読み手は、どの値が有効になるかを、そのまま追えます。
- **溢れを起こさない書き方**: `i + 1` は、ガードの `i < len` を満たすときだけ計算されます。`usize::MAX` のような値でも、溢れる計算が実行されません。
- **失敗を値として返す**: `None` を返すので、呼び出し側は、範囲が間違っていたときに別の処理を選べます。パニックで止める版と、この版を分けて持つ設計です。
- **2 つの関数の共通の形**: `simplify_range` は、同じ場合分けをパニックに置き換えたものです。境界の意味を 1 か所で決め、失敗の扱いだけを変えています。
- **`&i` のパターン**: `start_bound` は参照の `Bound<&usize>` を返すので、`&i` で値を取り出します。参照の扱いを、パターンの中で済ませています。

## まとめ

- Rust の範囲の 3 種類の境界を、`match` とガードで 1 つずつ場合分けして、開始と終了の位置を決める。
- 失敗は `None` で返すので、呼び出し側が判断できる。
- 溢れが起きないように、ガードの条件の中で `+ 1` を計算している。
