---
title: 複数行のエラーを、行頭だけに字下げして書く
description: anyhow のエラー表示で使う Indented。改行で分けた各行の先頭だけに字下げや行番号を入れ、途中の改行には続きの字下げを入れる。
language: rust
project: anyhow
repo: https://github.com/dtolnay/anyhow
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "bb1b0f9af0f645d5fdf1ac63a1fcbf3975ee452c"
file: src/fmt.rs
lines: [79, 100]
function: Indented::write_str
difficulty: 2
format: 2
tags: [文字列処理, 型システム, イテレータ]
---

## ひとことで

`Indented::write_str` は、anyhow がエラーを表示するときに使う **字下げの書き込み器** の中心です。文字列を受け取り、その中の各行の **先頭だけ** に、字下げや行番号を付けて書き出します。

エラーの原因は、複数行のメッセージになることがあります。どの行にも同じ字下げを入れると、読みにくくなります。この関数は、行の始まりだけに字下げを付け、同じ論理行の続きには付けないように工夫しています。

## コード

```rust:line-numbers=79
    fn write_str(&mut self, s: &str) -> fmt::Result {
        for (i, line) in s.split('\n').enumerate() {
            if !self.started {
                self.started = true;
                match self.number {
                    Some(number) => write!(self.inner, "{: >5}: ", number)?,
                    None => self.inner.write_str("    ")?,
                }
            } else if i > 0 {
                self.inner.write_char('\n')?;
                if self.number.is_some() {
                    self.inner.write_str("       ")?;
                } else {
                    self.inner.write_str("    ")?;
                }
            }

            self.inner.write_str(line)?;
        }

        Ok(())
    }
```

この関数は、`fmt::Write` の一部として呼ばれます。`self.started` は、このブロックで最初の行の字下げを書いたかどうかを表します。`self.number` があれば、行番号付きで字下げを書きます。

## 前提知識

- **`fmt::Write`**: 文字列を少しずつ書き出すためのトレイトです。`write_str` と `write_char` を持ちます。
- **`split('\n')`**: 文字列を改行で区切り、各行を順に取り出します。
- **`enumerate`**: 各行に、その番号（0 から）を付けます。
- **`started`**: 字下げを書き始めたかを覚えておくフラグです。最初の行にだけ、行頭の字下げを入れます。
- **`{: >5}`**: 整数を、幅 5 で右詰めにして書く書式です。行番号の見た目を揃えます。

## 何をしているか

### 1. 最初の行には、字下げか行番号を付ける

```rust:line-numbers=81
            if !self.started {
                self.started = true;
                match self.number {
                    Some(number) => write!(self.inner, "{: >5}: ", number)?,
                    None => self.inner.write_str("    ")?,
                }
```

まだ開始していなければ、フラグを立てて、先頭の字下げを書きます。行番号が指定されていれば、幅 5 の番号と `: ` を書きます。番号がなければ、4 つの空白を書きます。

### 2. 2 つ目以降の行は、改行の後に字下げを入れる

```rust:line-numbers=87
            } else if i > 0 {
                self.inner.write_char('\n')?;
                if self.number.is_some() {
                    self.inner.write_str("       ")?;
                } else {
                    self.inner.write_str("    ")?;
                }
            }
```

2 つ目以降の行は、まず改行を書きます。その後、番号があるなら番号の幅に合わせた空白を、なければ 4 つの空白を書きます。

### 3. 行の中身を書く

```rust:line-numbers=96
            self.inner.write_str(line)?;
```

どの場合も、行の中身をそのまま書きます。字下げは、行の始まりにだけ入ります。

## ここがすごい

- **行の始まりだけを字下げ**: 行の途中で字下げを入れないので、もとの文章の形が保たれます。
- **番号と字下げを揃える**: 行番号の幅に合わせて空白を入れるので、番号付きの行とそうでない行が、きれいに揃います。
- **状態は 1 つのフラグだけ**: `started` だけで、最初の行の処理を区別しています。書き込み器が、途中の状態を少ししか持ちません。

## まとめ

- 字下げは、各行の先頭だけに入れる。
- 行番号があれば、その幅に合わせて字下げを揃える。
- 最初の行かどうかは `started` のフラグで区別する。
