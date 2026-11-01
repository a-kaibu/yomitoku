---
title: 1 行に収まらない単語を、残りの幅に合わせて分割する
description: textwrap の内部メソッド _handle_long_word は、どの行にも収まらないほど長い単語を扱う。break_long_words が真なら、行の残りの幅ぶんだけ切り出し、ハイフンの後でも切れる。偽なら、単語を壊さずに行の先頭に置く。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/textwrap.py
lines: [197, 230]
function: TextWrapper._handle_long_word
difficulty: 3
format: 2
tags: [文字列処理, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`_handle_long_word(...)` は、`textwrap` の折り返しの中で、**どの行にも収まらないほど長い単語を処理する** 内部のメソッドです。
たとえば幅 5 の行に `abcdefgh` を入れるとき、`abcde` を今の行に入れ、残りの `fgh` を次の行へ回す、という処理を行います。

## コード

::: code-group

```python:line-numbers=197 [日本語訳]
    def _handle_long_word(self, reversed_chunks, cur_line, cur_len, width):
        """_handle_long_word(chunks : [string],
                             cur_line : [string],
                             cur_len : int, width : int)

        空白ではなく、どの行にも収まらないほど長い塊（多くは単語）を扱う。
        is too long to fit in any line.
        """
        # インデントが指定の幅より大きい場合を判定し、
        # どの回でも、少なくとも 1 文字は取り除かれるようにする
        if width < 1:
            space_left = 1
        else:
            space_left = width - cur_len

        # 長い単語を分割してよいなら分割する。次の塊をできるだけ
        # 今の行に収まるだけ入れる。
        if self.break_long_words and space_left > 0:
            end = space_left
            chunk = reversed_chunks[-1]
            if self.break_on_hyphens and len(chunk) > space_left:
                # ハイフンの後で分ける。ただし、その前にハイフン以外の文字がある場合だけ
                # （ハイフン以外の文字がある場合）
                hyphen = chunk.rfind('-', 0, space_left)
                if hyphen > 0 and any(c != '-' for c in chunk[:hyphen]):
                    end = hyphen + 1
            cur_line.append(chunk[:end])
            reversed_chunks[-1] = chunk[end:]

        # そうでなければ、長い単語を壊さずに保つ。今の行が空のときだけ追加する
        # （すでに何かあれば、追加せずに次の行へ送る）。
        # これで、幅の制約を破る量を最小限にできる。
        elif not cur_line:
            cur_line.append(reversed_chunks.pop())
```

```python:line-numbers=197 [原文]
    def _handle_long_word(self, reversed_chunks, cur_line, cur_len, width):
        """_handle_long_word(chunks : [string],
                             cur_line : [string],
                             cur_len : int, width : int)

        Handle a chunk of text (most likely a word, not whitespace) that
        is too long to fit in any line.
        """
        # Figure out when indent is larger than the specified width, and make
        # sure at least one character is stripped off on every pass
        if width < 1:
            space_left = 1
        else:
            space_left = width - cur_len

        # If we're allowed to break long words, then do so: put as much
        # of the next chunk onto the current line as will fit.
        if self.break_long_words and space_left > 0:
            end = space_left
            chunk = reversed_chunks[-1]
            if self.break_on_hyphens and len(chunk) > space_left:
                # break after last hyphen, but only if there are
                # non-hyphens before it
                hyphen = chunk.rfind('-', 0, space_left)
                if hyphen > 0 and any(c != '-' for c in chunk[:hyphen]):
                    end = hyphen + 1
            cur_line.append(chunk[:end])
            reversed_chunks[-1] = chunk[end:]

        # Otherwise, we have to preserve the long word intact.  Only add
        # it to the current line if there's nothing already there --
        # that minimizes how much we violate the width constraint.
        elif not cur_line:
            cur_line.append(reversed_chunks.pop())
```

:::

## 前提知識

- **`break_long_words`**: 長い単語を分割してよいかを決める設定です。偽なら、単語を壊しません。
- **`break_on_hyphens`**: ハイフンの後で分けてよいかを決める設定です。
- **`space_left`**: 今の行の残りの幅です。`width - cur_len` で求めます。
- **`reversed_chunks`**: 処理前の塊（単語や空白）を、後ろから取り出せるように逆順に並べたリストです。末尾が次に処理する塊になります。

## 何をしているか

### 1. 残りの幅を求める

```python:line-numbers=205
        # インデントが指定の幅より大きい場合を判定し、
        # どの回でも、少なくとも 1 文字は取り除かれるようにする
        if width < 1:
            space_left = 1
        else:
            space_left = width - cur_len
```

今の行に、あと何文字入るかを求めます。幅が 1 より小さいときは、少なくとも 1 文字は進めるように 1 とします。そうしないと、同じ場所で処理が止まってしまうからです。

### 2. 分割してよければ、入る分だけ切り出す

```python:line-numbers=212
        # 長い単語を分割してよいなら分割する。次の塊をできるだけ
        # 今の行に収まるだけ入れる。
        if self.break_long_words and space_left > 0:
            end = space_left
            chunk = reversed_chunks[-1]
            if self.break_on_hyphens and len(chunk) > space_left:
                # ハイフンの後で分ける。ただし、その前にハイフン以外の文字がある場合だけ
                # （ハイフン以外の文字がある場合）
                hyphen = chunk.rfind('-', 0, space_left)
                if hyphen > 0 and any(c != '-' for c in chunk[:hyphen]):
                    end = hyphen + 1
            cur_line.append(chunk[:end])
            reversed_chunks[-1] = chunk[end:]
```

残りの幅が 0 より大きく、分割が許されていれば、次の塊の先頭から残りの幅ぶんを今の行に入れます。塊の残りは、`reversed_chunks` の末尾に戻して、次の行で処理します。ハイフンが近くにあれば、そこで切ることもあります。

### 3. 分割しない場合は、単語を丸ごと入れる

```python:line-numbers=226
        # そうでなければ、長い単語を壊さずに保つ。今の行が空のときだけ追加する
        # （すでに何かあれば、追加せずに次の行へ送る）。
        # これで、幅の制約を破る量を最小限にできる。
        elif not cur_line:
            cur_line.append(reversed_chunks.pop())
```

分割が許されていない場合は、今の行が空のときだけ、単語を丸ごと入れます。すでに何かが入っていれば、単語を次の行へ送るので、幅を超える量が最小になります。

## ここがすごい

### 「必ず 1 文字進む」を保証する

幅が小さすぎても、残りの幅を 1 として扱うので、処理が無限に続くことがありません。コメントにある「どの回でも 1 文字は取り除かれる」という約束が、この 1 行で守られています。

### ハイフンで切る親切さ

`exam-ple-word` のような単語は、ハイフンの後で切ると読みやすくなります。ただし、`---` のようにハイフンだけの塊では切りません。この条件は、`any(c != '-' ...)` で確かめています。

### 幅の制約を最小限だけ破る

分割を禁止されたときは、今の行が空なら単語を入れます。空でなければ、単語は次の行に回します。どちらの場合も、幅を超える量が最も少なくなるように選んでいます。

## まとめ

- 長い単語は、残りの幅で切り出し、残りを次の行へ回すと処理できる。
- 処理が必ず進むように、残りの幅に下限を置く。
- 分割の規則（ハイフン、禁止）は、条件を分けて読むと理解しやすい。
