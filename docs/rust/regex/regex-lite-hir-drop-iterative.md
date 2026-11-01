---
title: 深く入れ子の式を、再帰せずに解放する
description: regex-lite の Hir の Drop。入れ子になった式を再帰で解放するとスタックが溢れるため、子の式を明示的なスタックに移してから順に解放する。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-lite/src/hir/mod.rs
lines: [770, 808]
function: drop
difficulty: 3
format: 2
tags: [メモリ管理, 再帰, 防御的プログラミング]
---

## ひとことで

`Hir` は、正規表現を解析した結果を表す木構造の型です。この `drop` は、`Hir` が破棄されるときの後片付けを、**再帰を使わずに** 行うための特別な実装です。

Rust の値は、ふつう子の値を先に、その子の子を、と再帰的に破棄されます。正規表現が極端に深く入れ子になっていると、この再帰が深くなりすぎて、スタックが溢れてしまいます。この関数は、子の式を自分で持つスタックへ移し、一つずつ空にしながら取り出すことで、その問題を避けています。

## コード

```rust:line-numbers=770
    fn drop(&mut self) {
        use core::mem;

        match *self.kind() {
            HirKind::Empty
            | HirKind::Char(_)
            | HirKind::Class(_)
            | HirKind::Look(_) => return,
            HirKind::Capture(ref x) if x.sub.kind.subs().is_empty() => return,
            HirKind::Repetition(ref x) if x.sub.kind.subs().is_empty() => {
                return
            }
            HirKind::Concat(ref x) if x.is_empty() => return,
            HirKind::Alternation(ref x) if x.is_empty() => return,
            _ => {}
        }

        let mut stack = vec![mem::replace(self, Hir::empty())];
        while let Some(mut expr) = stack.pop() {
            match expr.kind {
                HirKind::Empty
                | HirKind::Char(_)
                | HirKind::Class(_)
                | HirKind::Look(_) => {}
                HirKind::Capture(ref mut x) => {
                    stack.push(mem::replace(&mut x.sub, Hir::empty()));
                }
                HirKind::Repetition(ref mut x) => {
                    stack.push(mem::replace(&mut x.sub, Hir::empty()));
                }
                HirKind::Concat(ref mut x) => {
                    stack.extend(x.drain(..));
                }
                HirKind::Alternation(ref mut x) => {
                    stack.extend(x.drain(..));
                }
            }
        }
    }
```

## 前提知識

- **HIR（高レベル中間表現）**: 正規表現の文法を、意味の単位に整理した木構造です。文字、文字クラス、連結、選択（`|`）、繰り返し、グループなどの種類があります。
- **`Drop` トレイト**: 値が破棄されるときに呼ばれる後片付けの処理です。`drop` を書くと、既定の破棄処理の代わりに、この処理が先に動きます。
- **再帰と呼び出しスタック**: 関数が自分自身を呼ぶ仕組みです。呼び出しが深くなると、スタックという作業領域が足りなくなり、プログラムが異常終了します。
- **`mem::replace`**: 値を別の値と入れ替え、古い値を返す関数です。ここでは、子の式を空の `Hir` と入れ替えるために使います。
- **`Hir::empty()`**: 何もしない空の式を作る関数です。

## 何をしているか

### 1. 子がない式は、何もせずに戻る

```rust:line-numbers=773
        match *self.kind() {
            HirKind::Empty
            | HirKind::Char(_)
            | HirKind::Class(_)
            | HirKind::Look(_) => return,
            HirKind::Capture(ref x) if x.sub.kind.subs().is_empty() => return,
            HirKind::Repetition(ref x) if x.sub.kind.subs().is_empty() => {
                return
            }
            HirKind::Concat(ref x) if x.is_empty() => return,
            HirKind::Alternation(ref x) if x.is_empty() => return,
            _ => {}
```

まず、子を持たない種類（空、文字、文字クラス、アンカーなど）や、子がすでに空のグループや繰り返しは、そのまま戻ります。ふつうの破棄で十分なので、ここで処理を終えます。こうすると、大部分の小さな式で余計な作業が起きません。

### 2. 自分を空にして、スタックを作る

```rust:line-numbers=787
        let mut stack = vec![mem::replace(self, Hir::empty())];
```

`mem::replace(self, Hir::empty())` で、いま `drop` されている式を空の式と入れ替え、その元の式をスタックに積みます。こうすると、この関数が終わって既定の破棄が走っても、中身は空なので深い再帰は起きません。

### 3. 子を取り出して、順に空にする

```rust:line-numbers=788
        while let Some(mut expr) = stack.pop() {
            match expr.kind {
                HirKind::Empty
                | HirKind::Char(_)
                | HirKind::Class(_)
                | HirKind::Look(_) => {}
                HirKind::Capture(ref mut x) => {
                    stack.push(mem::replace(&mut x.sub, Hir::empty()));
                }
                HirKind::Repetition(ref mut x) => {
                    stack.push(mem::replace(&mut x.sub, Hir::empty()));
                }
                HirKind::Concat(ref mut x) => {
                    stack.extend(x.drain(..));
                }
                HirKind::Alternation(ref mut x) => {
                    stack.extend(x.drain(..));
                }
            }
```

スタックから式を 1 つずつ取り出し、子を次々と `stack` へ移します。`Capture` と `Repetition` は子が 1 つなので `mem::replace` で取り出します。`Concat` と `Alternation` は、`drain(..)` で中身の `Vec` を空にしながら移します。子を移し終えた式は、中身が空なので、取り出されたループの最後で浅く破棄されます。

## ここがすごい

- **再帰の深さを一定に保つ**: 木が深くても、破棄の処理は同じループの中で進みます。呼び出しスタックの使用量が、式の深さに比例しません。
- **空の式で入れ替える**: 子を `Hir::empty()` と入れ替えるので、親が破棄されても、子は空のまま残ります。破棄の二重な処理や、中身の取り忘れを防げます。
- **早い戻り口**: 単純な式は最初に戻るので、ほとんどの場合で追加の作業がかかりません。
- **型の性質に合わせた処理**: 子が 1 つの種類と、子が複数の種類を、それぞれ `mem::replace` と `drain` で扱い分けています。

## まとめ

- 深い木構造を破棄するときは、再帰を避けて明示的なスタックを使うと、スタックの溢れを防げます。
- 子を空の値と入れ替えると、親を破棄しても子が再び処理されません。
- 大部分の単純なケースは早く戻るようにすると、性能を落とさずに安全性を高められます。
