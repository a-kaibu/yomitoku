---
title: 範囲の指定を、開始と終わりの組に正しく直す
description: bytes の slice で使う内部関数。`..=` や `..` などの範囲の書き方を、開始と終わりの組に変え、溢れや範囲外を検査してからパニックする。
language: rust
project: bytes
repo: https://github.com/tokio-rs/bytes
license: MIT
copyright: Copyright (c) 2018 Carl Lerche
commit: "62207901b65e4fc51459b2d558fad8aa882f5d33"
file: src/lib.rs
lines: [138, 167]
function: range
difficulty: 2
format: 2
tags: [防御的プログラミング, 型システム, 文字列処理]
---

## ひとことで

`range` は、`bytes` の `slice` などで受け取る **範囲の指定（`..`、`a..b`、`a..=b` など）を、開始と終わりの 2 つの数に直す** 関数です。範囲の書き方は、いくつもあるので、どれを受け取っても同じ形の結果になるようにします。

さらに、開始が終わりを超えていないか、終わりがバイト列の長さを超えていないかを確かめます。どちらかに当たると、わかりやすいメッセージを付けてパニックします。

## コード

```rust:line-numbers=138
fn range(range: impl core::ops::RangeBounds<usize>, len: usize) -> (usize, usize) {
    use core::ops::Bound;

    let begin = match range.start_bound() {
        Bound::Included(&n) => n,
        Bound::Excluded(&n) => n.checked_add(1).expect("out of range"),
        Bound::Unbounded => 0,
    };

    let end = match range.end_bound() {
        Bound::Included(&n) => n.checked_add(1).expect("out of range"),
        Bound::Excluded(&n) => n,
        Bound::Unbounded => len,
    };

    assert!(
        begin <= end,
        "range start must not be greater than end: {:?} <= {:?}",
        begin,
        end,
    );
    assert!(
        end <= len,
        "range end out of bounds: {:?} <= {:?}",
        end,
        len,
    );

    (begin, end)
}
```

この関数は、`RangeBounds<usize>` を受け取ります。どの書き方の範囲でも、`start_bound` と `end_bound` で、開始と終わりの指定を取り出せます。戻り値は、常に `(begin, end)` の組です。

## 前提知識

- **`RangeBounds`**: 範囲を表すトレイトです。`..`、`a..`、`..b`、`a..b`、`a..=b` などを、同じ方法で扱えます。
- **`Bound`**: 範囲の端を表す列挙型です。`Included`（含む）、`Excluded`（含まない）、`Unbounded`（指定なし）の 3 種類があります。
- **`checked_add`**: 足し算が溢れたら `None` を返します。`n + 1` が溢れる場合に、安全に検出できます。
- **`expect`**: `Option` や `Result` が失敗したときに、指定したメッセージでパニックします。
- **`assert!`**: 条件が偽のときに、パニックを起こす確認です。

## 何をしているか

### 1. 開始の位置を決める

```rust:line-numbers=141
    let begin = match range.start_bound() {
        Bound::Included(&n) => n,
        Bound::Excluded(&n) => n.checked_add(1).expect("out of range"),
        Bound::Unbounded => 0,
    };
```

開始の指定を取り出します。含むならそのまま、含まないなら 1 を足します。指定がなければ 0 です。1 を足すときは、溢れを `checked_add` で確かめます。

### 2. 終わりの位置を決める

```rust:line-numbers=147
    let end = match range.end_bound() {
        Bound::Included(&n) => n.checked_add(1).expect("out of range"),
        Bound::Excluded(&n) => n,
        Bound::Unbounded => len,
    };
```

終わりの指定も同じように取り出します。`..=` の場合は、含むので 1 を足します。指定がなければ、バイト列の長さです。

### 3. 順序と範囲を検査する

```rust:line-numbers=153
    assert!(
        begin <= end,
        "range start must not be greater than end: {:?} <= {:?}",
        begin,
        end,
    );
    assert!(
        end <= len,
        "range end out of bounds: {:?} <= {:?}",
        end,
        len,
    );
```

開始が終わりより大きくないか、終わりが長さを超えていないかを確かめます。違反していれば、どの値が問題かを示すメッセージを付けてパニックします。

### 4. 組を返す

```rust:line-numbers=166
    (begin, end)
```

検査を通った `(begin, end)` を返します。以降の処理は、この組だけを信用して進めます。

## ここがすごい

- **書き方の差を 1 か所に集める**: 範囲の書き方ごとの違いは、この関数だけが知っています。呼び出し側は、常に同じ形の組を受け取ります。
- **溢れを黙って無視しない**: `checked_add` で溢れを検出し、理由を付けてパニックします。不正な値が後で使われることを防ぎます。
- **エラーの内容が分かる**: 検査のメッセージには、問題の値が含まれます。原因を調べやすくなっています。

## まとめ

- 範囲の書き方の違いを、開始と終わりの組に直して吸収する。
- 溢れと順序違いは、`checked_add` と `assert!` で検出する。
- 検査を通った組だけを、後の処理で信用する。
