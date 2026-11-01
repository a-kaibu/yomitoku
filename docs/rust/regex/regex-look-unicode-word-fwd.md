---
title: 有限オートマトンで、単語の境界を前から判定する
description: regex-automata が Unicode の単語境界 \b を判定する関数。\w の DFA を遷移させ、一致や行き止まりを示す状態に着いた時点で答えを決める。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/util/look.rs
lines: [1409, 1437]
function: is_word_char::fwd
difficulty: 3
format: 2
tags: [正規表現, 状態機械, Unicode]
---

## ひとことで

`fwd` は、正規表現の **単語境界（`\b`）** を、Unicode の文字の定義に従って判定する関数です。ある位置の直後から、単語を構成する文字（`\w`）が続くかどうかを、前から順に確かめます。

判定には、正規表現 `\w` を表す **DFA（決定性有限オートマトン）** を使います。DFA は、今の状態と次の 1 バイトで、次の状態が決まる仕組みです。状態が「一致」か「行き止まり」になった時点で、答えが分かります。

## コード

```rust:line-numbers=1409
    pub(super) fn fwd(
        haystack: &[u8],
        mut at: usize,
    ) -> Result<bool, super::UnicodeWordBoundaryError> {
        static WORD: Lazy<DFA> = Lazy::new(|| DFA::new(r"\w").unwrap());
        static CACHE: Lazy<Pool<Cache>> =
            Lazy::new(|| Pool::new(|| WORD.create_cache()));
        let dfa = Lazy::get(&WORD);
        let mut cache = Lazy::get(&CACHE).get();
        let mut sid = dfa
            .start_state_forward(
                &mut cache,
                &Input::new("").anchored(Anchored::Yes),
            )
            .unwrap();
        while at < haystack.len() {
            let byte = haystack[at];
            sid = dfa.next_state(&mut cache, sid, byte).unwrap();
            at += 1;
            if sid.is_tagged() {
                if sid.is_match() {
                    return Ok(true);
                } else if sid.is_dead() {
                    return Ok(false);
                }
            }
        }
        Ok(dfa.next_eoi_state(&mut cache, sid).unwrap().is_match())
    }
```

この関数は、2 つの `static` の値を使います。`WORD` は `\w` の DFA で、初めて使われるときに作られます。`CACHE` は、DFA の作業領域を使い回すためのプールです。作業領域を毎回作り直さないので、判定が速くなります。

## 前提知識

- **有限オートマトン（DFA）**: 状態と遷移の表で、文字列のパターンを認識する仕組みです。1 バイトごとに、決まった状態へ移ります。
- **`\w` と単語境界**: `\w` は、Unicode の単語を構成する文字を表します。`\b` は、単語の内側と外側の境目を表します。
- **`Lazy`**: 最初に使われたときに値を作り、その後は同じ値を使い続ける仕組みです。DFA の構築は重いので、一度だけ行います。
- **`Pool`**: 作業領域を貸し出し、返却されたものを再利用するプールです。
- **状態のタグ**: 一致や行き止まりを、状態の番号の印として表します。`is_match` と `is_dead` で、その印を調べます。

## 何をしているか

### 1. 判定の道具を用意する

```rust:line-numbers=1413
        static WORD: Lazy<DFA> = Lazy::new(|| DFA::new(r"\w").unwrap());
        static CACHE: Lazy<Pool<Cache>> =
            Lazy::new(|| Pool::new(|| WORD.create_cache()));
        let dfa = Lazy::get(&WORD);
        let mut cache = Lazy::get(&CACHE).get();
```

`WORD` と `CACHE` を、必要になったときに一度だけ作ります。`CACHE` からは作業領域を 1 つ借ります。この時点で、探索を始める準備が整います。

### 2. 空の入力から、開始状態を得る

```rust:line-numbers=1418
        let mut sid = dfa
            .start_state_forward(
                &mut cache,
                &Input::new("").anchored(Anchored::Yes),
            )
            .unwrap();
```

開始状態を、`anchored` の空の入力で求めます。ここでは、先頭から `\w` が続くかを確かめる、という状態に入ります。

### 3. 1 バイトずつ遷移させる

```rust:line-numbers=1424
        while at < haystack.len() {
            let byte = haystack[at];
            sid = dfa.next_state(&mut cache, sid, byte).unwrap();
            at += 1;
```

`at` の位置から、1 バイトずつ DFA を進めます。次の状態は、今の状態と、読んだバイトで決まります。

### 4. 印が付いた状態で判断する

```rust:line-numbers=1428
            if sid.is_tagged() {
                if sid.is_match() {
                    return Ok(true);
                } else if sid.is_dead() {
                    return Ok(false);
                }
            }
```

状態に一致の印が付いていれば、`\w` が続いたので `true` です。行き止まりの印なら、続かないので `false` です。印がなければ、まだ判断できないので、次のバイトを読みます。

### 5. 終わりで最後の判定をする

```rust:line-numbers=1436
        Ok(dfa.next_eoi_state(&mut cache, sid).unwrap().is_match())
```

入力の終わりまで来たら、入力の終端を表す遷移を 1 回行い、一致かどうかを返します。

## ここがすごい

- **判定が 1 方向**: 前から読むだけで、答えが出ます。途中で一致や行き止まりが分かれば、残りを読まずに止まります。
- **作業領域を使い回す**: `Pool` を使うので、判定のたびに大きな領域を確保しません。
- **Unicode の定義をそのまま表す**: `\w` の意味は DFA に焼き込まれています。判定のコードは、遷移を回すだけで済みます。

## まとめ

- 単語境界の判定は、`\w` の DFA を前から回して行う。
- 一致や行き止まりの状態に着いた時点で、答えを返す。
- DFA と作業領域は一度だけ作り、使い回す。
