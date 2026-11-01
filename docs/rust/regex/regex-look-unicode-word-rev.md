---
title: 逆向きの DFA で、直前の文字が単語かを調べる
description: regex-automata の単語境界の判定。\w の逆向き DFA を一度だけ作り、位置より前のバイトを後ろから読んで、直前が単語文字かを状態遷移で求める。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/util/look.rs
lines: [1440, 1473]
function: is_word_char::rev
difficulty: 3
format: 2
tags: [状態機械, 正規表現, Unicode]
---

## ひとことで

`is_word_char::rev` は、`regex-automata` で、**ある位置より前の部分を後ろ向きに読んで、直前の文字が単語文字（`\w`）かを調べる** 関数です。単語境界（`\b`）の判定で、直前の文字を見るために使われます。

単語文字の判定には、正規表現 `\w` を表す DFA（状態遷移による判定器）を使います。ただし、前向きではなく、後ろ向きに読むように組み立てた DFA です。この関数は、その DFA を一度だけ作って、以降は使い回します。

## コード

```rust:line-numbers=1440
    pub(super) fn rev(
        haystack: &[u8],
        mut at: usize,
    ) -> Result<bool, super::UnicodeWordBoundaryError> {
        static WORD: Lazy<DFA> = Lazy::new(|| {
            DFA::builder()
                .thompson(NFA::config().reverse(true))
                .build(r"\w")
                .unwrap()
        });
        static CACHE: Lazy<Pool<Cache>> =
            Lazy::new(|| Pool::new(|| WORD.create_cache()));
        let dfa = Lazy::get(&WORD);
        let mut cache = Lazy::get(&CACHE).get();
        let mut sid = dfa
            .start_state_reverse(
                &mut cache,
                &Input::new("").anchored(Anchored::Yes),
            )
            .unwrap();
        while at > 0 {
            at -= 1;
            let byte = haystack[at];
            sid = dfa.next_state(&mut cache, sid, byte).unwrap();
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

## 前提知識

- **DFA（決定性有限オートマトン）**: 入力の 1 バイトごとに状態を移していき、最後に一致かどうかを判定する仕組みです。
- **逆向きの DFA（reverse）**: 入力を後ろから前へ読むように作った DFA です。位置の直前の文字を、先頭から全部読まずに判定できます。
- **`Lazy`**: 最初に使われたときに、一度だけ値を作る仕組みです。`static` に置いた DFA を、必要になったときに作ります。
- **`Pool<Cache>`**: DFA の作業領域（キャッシュ）を、スレッド間で使い回すための仕組みです。
- **タグ付きの状態（tagged）**: 一致や行き止まりなど、特別な意味を持つ状態です。`is_match` と `is_dead` で、その種類を確かめます。

## 何をしているか

### 1. 逆向きの DFA を一度だけ作る

```rust:line-numbers=1444
        static WORD: Lazy<DFA> = Lazy::new(|| {
            DFA::builder()
                .thompson(NFA::config().reverse(true))
                .build(r"\w")
                .unwrap()
        });
        static CACHE: Lazy<Pool<Cache>> =
            Lazy::new(|| Pool::new(|| WORD.create_cache()));
        let dfa = Lazy::get(&WORD);
```

`\w` を逆向きに読む DFA を `static` に置き、最初の使用時に作ります。キャッシュも同じように、プールとして一度だけ用意します。以降の呼び出しでは、作り直しがありません。

### 2. 開始状態を用意する

```rust:line-numbers=1453
        let mut cache = Lazy::get(&CACHE).get();
        let mut sid = dfa
            .start_state_reverse(
                &mut cache,
                &Input::new("").anchored(Anchored::Yes),
            )
            .unwrap();
```

キャッシュを取り出し、空の入力を「固定された位置（アンカー）」として、逆向きの開始状態を求めます。

### 3. 位置より前のバイトを後ろから読む

```rust:line-numbers=1460
        while at > 0 {
            at -= 1;
            let byte = haystack[at];
            sid = dfa.next_state(&mut cache, sid, byte).unwrap();
            if sid.is_tagged() {
                if sid.is_match() {
                    return Ok(true);
                } else if sid.is_dead() {
                    return Ok(false);
                }
            }
        }
```

`at` を 1 つずつ減らしながら、そのバイトで状態を移します。状態が一致を表していれば、直前が単語文字なので `true` を返します。行き止まりなら、単語文字ではないので `false` を返します。

### 4. 入力の先頭に着いた場合

```rust:line-numbers=1472
        Ok(dfa.next_eoi_state(&mut cache, sid).unwrap().is_match())
```

先頭まで読み終わったら、入力の終わりを表す遷移を 1 回行い、一致かどうかを返します。

## ここがすごい

- **必要な分だけ読む**: 直前の 1 文字（ユニコードでは数バイト）を判定するために、位置より前の必要な範囲だけを読みます。文字列全体を走査しません。
- **初期化を一度に限る**: `Lazy` と `Pool` によって、DFA の作成とキャッシュの確保は一度きりです。単語境界の判定が何度も呼ばれても、重い処理が繰り返されません。
- **状態の印で早く決める**: 一致や行き止まりの状態が来た時点で、残りを読まずに答えが決まります。
- **逆向きに読む工夫**: 後ろ向きの DFA を用意することで、直前の文字を判定する処理を、前向きの判定と同じ仕組みで扱えます。

## まとめ

- 文字の前後を判定するときは、前向きと後ろ向きの 2 つの判定器を用意すると、どちらにも対応できます。
- 重い初期化は `Lazy` で一度だけ行うと、繰り返しの呼び出しが速くなります。
- 状態に印を付けておくと、答えが決まった時点で処理を止められます。
