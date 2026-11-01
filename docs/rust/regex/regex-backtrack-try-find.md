---
title: パターンが 1 つなら、位置の配列を小さく作る
description: regex-automata のバックトラック法の try_find。パターンが 1 つのときは 2 つの位置だけの配列を使い、複数のときは全グループ分の配列を作って、一致の範囲を取り出す。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/nfa/thompson/backtrack.rs
lines: [939, 977]
function: try_find
difficulty: 3
format: 2
tags: [最適化, 探索, 正規表現]
---

## ひとことで

`try_find` は、`regex-automata` のバックトラック法（バックトラックによる正規表現の検索）で、**一致した範囲だけを求める** 関数です。どこからどこまでが一致したかを、開始位置と終了位置で返します。

この関数は、正規表現のパターンが 1 つか複数かで、位置を記録する配列の大きさを変えます。1 つなら必要最小限の 2 要素だけ、複数なら、すべてのキャプチャグループ分の要素を用意します。

## コード

```rust:line-numbers=939
    pub fn try_find<'h, I: Into<Input<'h>>>(
        &self,
        cache: &mut Cache,
        input: I,
    ) -> Result<Option<Match>, MatchError> {
        let input = input.into();
        if self.get_nfa().pattern_len() == 1 {
            let mut slots = [None, None];
            let pid = match self.try_search_slots(cache, &input, &mut slots)? {
                None => return Ok(None),
                Some(pid) => pid,
            };
            let start = match slots[0] {
                None => return Ok(None),
                Some(s) => s.get(),
            };
            let end = match slots[1] {
                None => return Ok(None),
                Some(s) => s.get(),
            };
            return Ok(Some(Match::new(pid, Span { start, end })));
        }
        let ginfo = self.get_nfa().group_info();
        let slots_len = ginfo.implicit_slot_len();
        let mut slots = vec![None; slots_len];
        let pid = match self.try_search_slots(cache, &input, &mut slots)? {
            None => return Ok(None),
            Some(pid) => pid,
        };
        let start = match slots[pid.as_usize() * 2] {
            None => return Ok(None),
            Some(s) => s.get(),
        };
        let end = match slots[pid.as_usize() * 2 + 1] {
            None => return Ok(None),
            Some(s) => s.get(),
        };
        Ok(Some(Match::new(pid, Span { start, end })))
    }
```

## 前提知識

- **バックトラック法**: 候補の道を進んで、行き止まりになったら戻って別の道を試す探索方法です。正規表現のエンジンの 1 つとして使われます。
- **`Match` と `Span`**: `Match` は、一致したパターンの番号と、その範囲の組です。`Span` は、開始と終了の位置の組です。
- **スロット（slots）**: 一致の過程で、グループの開始や終了の位置を記録する配列です。`None` は、その位置がまだ決まっていないことを表します。
- **パターン ID（`PatternID`）**: 複数のパターンを 1 つの正規表現にまとめたときに、どのパターンが一致したかを表す番号です。
- **`Option` の `?`**: 検索でエラーが出たら、その時点で `Err` を返す書き方です。

## 何をしているか

### 1. 入力を整えて、パターンが 1 つかを確かめる

```rust:line-numbers=944
        let input = input.into();
        if self.get_nfa().pattern_len() == 1 {
```

入力を `Input` に変換します。`pattern_len()` が 1 のときは、パターンが 1 つだけなので、特別な扱いをします。

### 2. パターンが 1 つのとき

```rust:line-numbers=946
            let mut slots = [None, None];
            let pid = match self.try_search_slots(cache, &input, &mut slots)? {
                None => return Ok(None),
                Some(pid) => pid,
            };
            let start = match slots[0] {
                None => return Ok(None),
                Some(s) => s.get(),
            };
            let end = match slots[1] {
                None => return Ok(None),
                Some(s) => s.get(),
            };
            return Ok(Some(Match::new(pid, Span { start, end })));
```

`slots` は、開始と終了の 2 要素だけの小さな配列です。検索の結果が `None` なら、一致なしを返します。開始と終了の両方が決まっていれば、`Match` を作って返します。

### 3. パターンが複数のとき

```rust:line-numbers=961
        let ginfo = self.get_nfa().group_info();
        let slots_len = ginfo.implicit_slot_len();
        let mut slots = vec![None; slots_len];
```

グループの情報から、必要なスロットの数を求めます。その数だけの `Vec` を作り、すべて `None` で埋めます。

### 4. 一致したパターンの範囲を取り出す

```rust:line-numbers=964
        let pid = match self.try_search_slots(cache, &input, &mut slots)? {
            None => return Ok(None),
            Some(pid) => pid,
        };
        let start = match slots[pid.as_usize() * 2] {
            None => return Ok(None),
            Some(s) => s.get(),
        };
        let end = match slots[pid.as_usize() * 2 + 1] {
            None => return Ok(None),
            Some(s) => s.get(),
        };
        Ok(Some(Match::new(pid, Span { start, end })))
```

一致したパターンの番号 `pid` を使って、そのパターン専用の開始と終了の位置を取り出します。パターン番号の 2 倍の位置が開始、その次が終了です。両方が決まっているときだけ、`Match` を返します。

## ここがすごい

- **よくあるケースを速く**: パターンが 1 つのときは、ヒープ（`Vec`）を確保せず、スタック上の配列だけで済みます。最もよく使われる形の処理を、軽く保っています。
- **位置の並べ方を決める**: スロットを、パターンごとに 2 つずつ並べるという約束で使っています。`pid * 2` と `pid * 2 + 1` で、対応する位置を一意に取り出せます。
- **`None` で失敗を表す**: 位置が決まっていなければ、一致しなかったとして早く返します。途中の値を使って、誤った範囲を返すことがありません。
- **`?` で検索の失敗を伝える**: 検索の内部でエラーが起きたら、そのエラーを呼び出し元にそのまま返します。

## まとめ

- よく使う単純なケースに専用の経路を用意すると、全体の性能が上がります。
- 配列の並べ方を約束にしておくと、番号から位置を直接計算できます。
- 値が決まっていないことは `Option` で表し、確定したものだけを使うと安全です。
