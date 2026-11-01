---
title: 疎な DFA の状態をバイト列に書き出す
description: regex-automata の sparse 状態の write_to。長さを先に確かめ、マッチ状態の印を上位ビットに入れ、遷移先とパターン ID を順に書き、最後に加速情報を書く。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/dfa/sparse.rs
lines: [2360, 2398]
function: write_to
difficulty: 3
format: 2
tags: [入出力, ビット演算, 防御的プログラミング]
---

## ひとことで

`write_to` は、`regex-automata` の疎な DFA（sparse DFA）の 1 つの状態を、**バイト列に書き出す** 関数です。書き出したバイト列は、あとで読み戻して同じ DFA を再現するために使われます。

この関数は、状態に含まれる情報を決まった順序で並べます。最初に遷移の数とマッチかどうかの印、次に入力の範囲、遷移先の番号、マッチするパターンの番号、最後に高速化のための情報です。書き込み先は、エンディアン（バイトの並び方）を型パラメータ `E` で切り替えられます。

## コード

```rust:line-numbers=2360
    fn write_to<E: Endian>(
        &self,
        mut dst: &mut [u8],
    ) -> Result<usize, SerializeError> {
        let nwrite = self.write_to_len();
        if dst.len() < nwrite {
            return Err(SerializeError::buffer_too_small(
                "sparse state transitions",
            ));
        }

        let ntrans =
            if self.is_match { self.ntrans | (1 << 15) } else { self.ntrans };
        E::write_u16(u16::try_from(ntrans).unwrap(), dst);
        dst = &mut dst[size_of::<u16>()..];

        dst[..self.input_ranges.len()].copy_from_slice(self.input_ranges);
        dst = &mut dst[self.input_ranges.len()..];

        for i in 0..self.ntrans {
            E::write_u32(self.next_at(i).as_u32(), dst);
            dst = &mut dst[StateID::SIZE..];
        }

        if self.is_match {
            E::write_u32(u32::try_from(self.pattern_len()).unwrap(), dst);
            dst = &mut dst[size_of::<u32>()..];
            for i in 0..self.pattern_len() {
                let pid = self.pattern_id(i);
                E::write_u32(pid.as_u32(), dst);
                dst = &mut dst[PatternID::SIZE..];
            }
        }

        dst[0] = u8::try_from(self.accel.len()).unwrap();
        dst[1..][..self.accel.len()].copy_from_slice(self.accel);

        Ok(nwrite)
    }
```

## 前提知識

- **DFA（決定性有限オートマトン）**: 文字を読んで状態を移していく仕組みです。正規表現の検索を速く行うために使われます。
- **疎な（sparse）表現**: 遷移のすべての文字を並べるのではなく、実際に遷移がある範囲だけを持つ表し方です。メモリを節約できます。
- **エンディアン**: 数値のバイトを、どの順序で並べて書くかの決まりです。`E: Endian` の型パラメータで、ビッグエンディアンとリトルエンディアンを切り替えます。
- **`copy_from_slice`**: スライスの中身を、同じ長さの別のスライスにコピーする操作です。長さが違うとパニックします。
- **`u16::try_from`**: 数値の型を小さい型へ変換するときに、範囲を超えていないかを確かめる操作です。失敗すると `Err` を返します。

## 何をしているか

### 1. 書き込み先の長さを確かめる

```rust:line-numbers=2364
        let nwrite = self.write_to_len();
        if dst.len() < nwrite {
            return Err(SerializeError::buffer_too_small(
                "sparse state transitions",
            ));
        }
```

必要なバイト数を先に求め、書き込み先が足りなければ、エラーを返します。途中で領域を超えて書き込むことがないように、最初に確かめます。

### 2. 遷移の数とマッチの印を書く

```rust:line-numbers=2371
        let ntrans =
            if self.is_match { self.ntrans | (1 << 15) } else { self.ntrans };
        E::write_u16(u16::try_from(ntrans).unwrap(), dst);
        dst = &mut dst[size_of::<u16>()..];

        dst[..self.input_ranges.len()].copy_from_slice(self.input_ranges);
        dst = &mut dst[self.input_ranges.len()..];
```

マッチ状態であれば、遷移の数の `u16` に `1 << 15`（最上位ビットの近く）を立てて印にします。そのあと、遷移の数を 2 バイトで書き、続けて入力範囲の表を書き込みます。書き込んだ分だけ `dst` を前へ進めます。

### 3. 遷移先を順に書く

```rust:line-numbers=2379
        for i in 0..self.ntrans {
            E::write_u32(self.next_at(i).as_u32(), dst);
            dst = &mut dst[StateID::SIZE..];
        }
```

各遷移について、遷移先の状態番号を 4 バイトで書きます。書いたあとは、`dst` を状態番号の大きさの分だけ進めます。

### 4. マッチするパターンの番号を書く

```rust:line-numbers=2384
        if self.is_match {
            E::write_u32(u32::try_from(self.pattern_len()).unwrap(), dst);
            dst = &mut dst[size_of::<u32>()..];
            for i in 0..self.pattern_len() {
                let pid = self.pattern_id(i);
                E::write_u32(pid.as_u32(), dst);
                dst = &mut dst[PatternID::SIZE..];
            }
        }
```

マッチ状態のときだけ、パターンの数を書き、続けて各パターンの番号を書きます。ここでも、書いたぶんだけ `dst` を進めます。

### 5. 高速化の情報を書いて終える

```rust:line-numbers=2394
        dst[0] = u8::try_from(self.accel.len()).unwrap();
        dst[1..][..self.accel.len()].copy_from_slice(self.accel);

        Ok(nwrite)
```

加速（accel）の情報の長さを 1 バイトで書き、その後に中身を書きます。最後に、書いたバイト数 `nwrite` を返します。

## ここがすごい

- **先に長さを確かめる**: 書き込みを始める前に必要な大きさを計算するので、途中で配列の範囲を超えるような危険な書き込みを避けています。
- **1 ビットに印を込める**: マッチかどうかを、遷移の数の上位ビットに入れています。余分な領域を使わずに、1 つの値に 2 つの情報を入れています。
- **書き込み位置を前へ進める**: `dst` を少しずつ切り詰めていく書き方で、どこまで書いたかを変数で追う必要がありません。
- **エンディアンを型で指定する**: `E: Endian` によって、プラットフォームや用途に応じた並び方を、同じコードで書き分けられます。

## まとめ

- バイト列へ書き出す処理は、先に必要な長さを確かめると、安全に書けます。
- 1 つの値に複数の印を入れると、データの大きさを抑えられます。
- 書き込み位置を進めるスタイルにすると、順番を間違えにくくなります。
