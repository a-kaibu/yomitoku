---
title: バイト列から特殊な状態 ID を読み戻す
description: regex-automata の Special::from_bytes。閉包で読み取り位置を進めながら 8 個の状態 ID を読み、値を検証してから書き込み時の長さと照合する。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/dfa/special.rs
lines: [223, 258]
function: from_bytes
difficulty: 3
format: 2
tags: [入出力, 防御的プログラミング, エラー処理]
---

## ひとことで

`Special::from_bytes` は、`regex-automata` の DFA（有限オートマトン）を、バイト列から元の形に読み戻す関数です。DFA の中には「特殊な状態」の番号が 8 個あり、この関数はそれらを順番に読み取ります。

読み取りはすべて、同じ `read_id` という閉包（クロージャ）で行います。閉包は、読み取り位置とバイト数の合計を一緒に持って、少しずつ前へ進めます。最後に、読んだ値の整合性を確かめます。

## コード

```rust:line-numbers=223
    pub(crate) fn from_bytes(
        mut slice: &[u8],
    ) -> Result<(Special, usize), DeserializeError> {
        wire::check_slice_len(slice, 8 * StateID::SIZE, "special states")?;

        let mut nread = 0;
        let mut read_id = |what| -> Result<StateID, DeserializeError> {
            let (id, nr) = wire::try_read_state_id(slice, what)?;
            nread += nr;
            slice = &slice[StateID::SIZE..];
            Ok(id)
        };

        let max = read_id("special max id")?;
        let quit_id = read_id("special quit id")?;
        let min_match = read_id("special min match id")?;
        let max_match = read_id("special max match id")?;
        let min_accel = read_id("special min accel id")?;
        let max_accel = read_id("special max accel id")?;
        let min_start = read_id("special min start id")?;
        let max_start = read_id("special max start id")?;

        let special = Special {
            max,
            quit_id,
            min_match,
            max_match,
            min_accel,
            max_accel,
            min_start,
            max_start,
        };
        special.validate()?;
        assert_eq!(nread, special.write_to_len());
        Ok((special, nread))
    }
```

## 前提知識

- **DFA（決定性有限オートマトン）**: 文字を 1 つずつ読みながら、状態を遷移させて文字列が一致するかを調べる仕組みです。正規表現の検索に使われます。
- **状態 ID（`StateID`）**: DFA の状態に付けられた番号です。`StateID::SIZE` バイトで表されます。
- **閉包（クロージャ）**: 周囲の変数を捕まえた関数です。ここでは `slice` と `nread` を捕まえて、読むたびに書き換えます。
- **`Result` と `?`**: 失敗を値として返す型です。`?` は、エラーなら即座にその値を返す記号です。
- **`wire` モジュール**: バイト列との出し入れを行う補助関数を集めた場所です。長さの確認と、状態 ID の読み取りを担当します。

## 何をしているか

### 1. 必要な長さがあるかを確かめる

```rust:line-numbers=226
        wire::check_slice_len(slice, 8 * StateID::SIZE, "special states")?;
```

読み取る前に、`8 * StateID::SIZE` バイト以上あるかを確かめます。足りなければ、読まずにエラーを返します。読み取りの途中で配列の範囲を超えないようにするための、最初の守りです。

### 2. 閉包で 1 つずつ読む

```rust:line-numbers=228
        let mut nread = 0;
        let mut read_id = |what| -> Result<StateID, DeserializeError> {
            let (id, nr) = wire::try_read_state_id(slice, what)?;
            nread += nr;
            slice = &slice[StateID::SIZE..];
            Ok(id)
        };
```

閉包 `read_id` は、`try_read_state_id` で 1 つの状態 ID を読みます。読んだバイト数を `nread` に加え、`slice` を先頭からその分だけ進めます。呼び出すたびに、次の値が正しい位置から読まれます。

### 3. 8 個の値を順に読む

```rust:line-numbers=236
        let max = read_id("special max id")?;
        let quit_id = read_id("special quit id")?;
        let min_match = read_id("special min match id")?;
        let max_match = read_id("special max match id")?;
        let min_accel = read_id("special min accel id")?;
        let max_accel = read_id("special max accel id")?;
        let min_start = read_id("special min start id")?;
        let max_start = read_id("special max start id")?;
```

`max` から `max_start` まで、同じ閉包を 8 回呼びます。値の名前は、読み取りの失敗が起きたときにエラーの説明に使われる文字列として渡されます。

### 4. 検証して、長さを照合する

```rust:line-numbers=245
        let special = Special {
            max,
            quit_id,
            min_match,
            max_match,
            min_accel,
            max_accel,
            min_start,
            max_start,
        };
        special.validate()?;
        assert_eq!(nread, special.write_to_len());
        Ok((special, nread))
```

読んだ値を `Special` の構造体にまとめ、`validate` で値の関係が正しいかを確かめます。最後に、読んだ合計のバイト数と、書き込み時に期待される長さが一致するかを `assert_eq!` で確かめます。

## ここがすごい

- **閉包に状態を閉じ込める**: 読み取り位置と合計のバイト数を、外から個別に管理しなくてよくなっています。呼び出しの繰り返しが、1 行ずつで書けます。
- **二重の確認**: 最初に長さを確かめ、後で値の関係と合計の長さを確かめます。途中で壊れたデータが入ってきても、問題を見つけやすい形になっています。
- **エラーを型で返す**: 読み取りの失敗も、`?` で呼び出し元へ伝わります。エラーが途中で握りつぶされることはありません。
- **名前付きの読み取り**: 読み取りのたびに、どの値かの名前を付けているので、失敗したときに原因の場所が分かります。

## まとめ

- バイト列から読み戻すときは、先に長さを確かめてから、一つずつ位置を進めます。
- 読み取りの位置や合計を閉包に持たせると、繰り返しの処理が簡潔になります。
- 読んだ値は、関係の検証と長さの照合で二重に確かめると安全です。
