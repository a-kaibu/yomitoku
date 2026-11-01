---
title: 環状の区画から、次に使われている区画をビットで探す
description: tokio のタイマーホイールで、現在時刻より後で最も近い埋まった区画を求める関数。占有ビットを回転させ、末尾の 0 の数で距離を得る。ループを使わずに一回で決まる。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/runtime/time/wheel/level.rs
lines: [122, 127]
function: Level::next_occupied_slot
difficulty: 3
format: 2
tags: [ビット演算, 探索, アルゴリズム]
---

## ひとことで

`next_occupied_slot` は、タイマーホイールの 1 つの階層の中で、**現在の時刻より後にある、最も近い「埋まった」区画（スロット）** を探す関数です。区画は円環のように並んでいて、終わりまで行くと先頭へ戻ります。

区画が埋まっているかは、`occupied` という 64 ビットの整数の各ビットで表されています。この関数は、そのビット列を回転させて、ビットの並びを読むだけで、答えを一度に求めます。

## コード

```rust:line-numbers=122
        let now_slot = ((now / slot_range(self.level)) % LEVEL_MULT as u64) as usize + 1;
        let occupied = self.occupied.rotate_right(now_slot as u32);
        let zeros = occupied.trailing_zeros() as usize;
        let slot = (zeros + now_slot) % LEVEL_MULT;

        Some(slot)
```

この関数は、階層の `occupied` が 0 なら、埋まった区画がないので `None` を返します。それ以外は、現在の時刻が属する区画の位置から数えて、最初に埋まった区画を返します。

## 前提知識

- **タイマーホイール**: 時間を区画に分けて管理するデータ構造です。タイマーを、期限に近い区画に入れます。
- **占有ビット（`occupied`）**: 各区画が埋まっているかを、1 ビットずつ表す整数です。`occupied_bit` で、区画に対応するビットを作ります。
- **`rotate_right`**: ビットの並びを、右へ回転させます。はみ出したビットは左の端に戻ります。環状の並びを、直線として扱えます。
- **`trailing_zeros`**: 最も下位にある 1 より下の 0 の数を返します。回転後の先頭から、最初の埋まった区画までの距離になります。
- **`LEVEL_MULT`**: 1 つの階層の区画の数です。環の大きさになります。

## 何をしているか

### 1. 空なら、埋まった区画はない

```rust:line-numbers=110
        if self.occupied == 0 {
            return None;
```

`occupied` が 0 なら、どの区画も埋まっていないので `None` を返します。

### 2. 現在の時刻の区画の次から数える

```rust:line-numbers=122
        let now_slot = ((now / slot_range(self.level)) % LEVEL_MULT as u64) as usize + 1;
```

現在の時刻が属する区画の番号を求め、1 を足します。こうすると、今の区画の次から数えることになります。

### 3. ビットを回転させて、先頭の 1 を探す

```rust:line-numbers=123
        let occupied = self.occupied.rotate_right(now_slot as u32);
        let zeros = occupied.trailing_zeros() as usize;
```

`occupied` を、その番号だけ右へ回転させます。回転後の末尾の 0 の数が、今の区画の次から埋まった区画までの距離になります。

### 4. 区画の番号に戻す

```rust:line-numbers=125
        let slot = (zeros + now_slot) % LEVEL_MULT;

        Some(slot)
```

距離に今の区画の番号を足し、区画の数で割った余りを取ります。これで、環の中の区画の番号が得られます。

## ここがすごい

- **ループが要らない**: 区画を 1 つずつ調べる代わりに、ビットの回転と `trailing_zeros` で一度に距離を求めます。区画数が増えても、処理は一定です。
- **環状の探索を直線で扱う**: 回転によって、末尾を越えた探索も同じ式で扱えます。先頭に戻る処理を、別に書く必要がありません。
- **状態が 1 つの整数**: 階層の占有状況は 64 ビットの整数だけです。全体を見渡す探索が、とても軽く済みます。

## まとめ

- 埋まった区画の探索は、占有ビットの回転と末尾の 0 の数で一度に行う。
- 環状の並びは、回転すれば直線として扱える。
- 占有状況が 1 つの整数なので、探索が軽い。
