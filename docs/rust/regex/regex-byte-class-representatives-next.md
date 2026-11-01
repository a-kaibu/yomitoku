---
title: 同じクラスの連続するバイトを、1 つの範囲にまとめる
description: regex-automata のバイトクラス列挙で使う next。列の中で連続する要素を、開始と終わりの組にまとめて返す。隣との連続だけを見て、範囲を伸ばしていく。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-automata/src/util/alphabet.rs
lines: [637, 658]
function: ByteClassRepresentatives::next
difficulty: 3
format: 2
tags: [正規表現, アルゴリズム, イテレータ]
---

## ひとことで

`next` は、正規表現エンジンが持つ **バイトのクラス分け（バイトクラス）** を、範囲の列として列挙する関数です。バイトを 256 個ずつ並べると長くなるので、列の中で **連続している** 要素を 1 つの範囲にまとめて返します。

たとえば、続けて並ぶ `a`、`b`、`c` は、1 つの組 `(a, c)` にまとめられます。

## コード

```rust:line-numbers=637
    fn next(&mut self) -> Option<(Unit, Unit)> {
        loop {
            let element = match self.elements.next() {
                None => return self.range.take(),
                Some(element) => element,
            };
            match self.range.take() {
                None => {
                    self.range = Some((element, element));
                }
                Some((start, end)) => {
                    if end.as_usize() + 1 != element.as_usize()
                        || element.is_eoi()
                    {
                        self.range = Some((element, element));
                        return Some((start, end));
                    }
                    self.range = Some((start, element));
                }
            }
        }
    }
```

この関数は、`self.elements` という、クラスの境界を順に与える列から要素を取り出します。`self.range` は、いま作っている範囲です。範囲が確定したときに、その組を返します。

## 前提知識

- **バイトクラス**: 正規表現のオートマトンでは、同じ振る舞いをするバイトをまとめて 1 つのクラスとして扱います。クラスの数を減らすと、遷移表が小さくなります。
- **`Unit`**: バイトや、ファイルの終わりの印（EOI）を表す型です。`is_eoi` で、終わりの印かを確かめます。
- **`Option::take`**: 値を取り出し、元の場所を `None` にします。範囲をいったん取り出して、作り直すのに使います。
- **範囲の伸長**: 連続する要素を見つけるたびに、範囲の終わりを 1 つ後ろへ伸ばすことです。
- **`as_usize() + 1`**: 次のバイトの番号を求めます。前の終わりと比べて連続しているかを確かめます。

## 何をしているか

### 1. 要素が無くなったら、最後の範囲を返す

```rust:line-numbers=639
            let element = match self.elements.next() {
                None => return self.range.take(),
                Some(element) => element,
            };
```

次の要素を取り出します。もう無ければ、作りかけの範囲を返して終わります。

### 2. 範囲がまだ無ければ、1 つ目の範囲を始める

```rust:line-numbers=643
            match self.range.take() {
                None => {
                    self.range = Some((element, element));
                }
```

まだ範囲が無いなら、今の要素だけの範囲を作ります。

### 3. 連続していれば、範囲を伸ばす

```rust:line-numbers=647
                Some((start, end)) => {
                    if end.as_usize() + 1 != element.as_usize()
                        || element.is_eoi()
                    {
                        self.range = Some((element, element));
                        return Some((start, end));
                    }
                    self.range = Some((start, element));
                }
```

作りかけの範囲の終わりの次が今の要素なら、連続しています。その場合は、範囲の終わりを今の要素に更新して、次へ進みます。連続が切れたとき、または終わりの印に当たったときは、作りかけの範囲を返し、今の要素から新しい範囲を始めます。

## ここがすごい

- **1 回の走査で済む**: 要素を前から一度だけ読みます。範囲の伸長と、切れ目の判定を、同じ流れの中で行います。
- **切れ目を一度だけ返す**: 範囲は、連続が切れたときにだけ返されます。途中の要素ごとに値を返すことはありません。
- **終わりの印を特別扱い**: ファイルの終わりを表す印は、連続していても範囲に含めず、必ず区切ります。

## まとめ

- 連続する要素は、開始と終わりの組に伸ばしていく。
- 連続が切れたときだけ範囲を返し、新しい範囲を始める。
- 終わりの印は、連続していても必ず区切る。
