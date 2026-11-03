---
title: "列が空かどうかを、最初の文字で判定する"
description: "text の Stream 版 null。列の中で最初に文字が見つかった時点で False を返す。空の列だけ True を返す。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [369, 375]
function: "null"
difficulty: 1
format: 2
tags: [文字列処理, 再帰, 防御的プログラミング]
---

## ひとことで

`null s` は、文字列の列 `s` が空かどうかを判定する関数です。文字が 1 つでも見つかれば `False` を返し、空なら `True` を返します。

## コード

```haskell:line-numbers=369
null :: Stream Char -> Bool
null (Stream next s0 _len) = loop_null s0
    where
      loop_null !s = case next s of
                       Done      -> True
                       Yield _ _ -> False
                       Skip s'   -> loop_null s'
```

## 前提知識

- **空（null）**: 中身が 1 つもない状態です。
- **`Yield _ _`**: 文字が 1 つあることを表します。中身は使わないので `_` にしています。
- **`Skip`**: 文字がないが、次へ進むことを表す状態です。
- **`Done`**: 列の終わりを表す状態です。

## 何をしているか

### 1. 文字があれば False

```haskell:line-numbers=374
                       Yield _ _ -> False
```

文字が 1 つでも見つかれば、列は空ではありません。すぐに `False` を返します。

### 2. 終わりなら True

```haskell:line-numbers=373
                       Done      -> True
```

列の終わりまで文字が無ければ、空なので `True` を返します。

### 3. 空の部分は読み飛ばす

```haskell:line-numbers=375
                       Skip s'   -> loop_null s'
```

`Skip` の状態は、次の状態を調べ直すために進みます。

## ここがすごい

空かどうかを確かめるだけなら、文字の中身を読む必要はありません。最初の文字が見つかった時点で答えが決まるので、とても速く終わります。

また、`Yield` の中身を `_` で捨てているので、「文字があるかどうか」だけに注目した書き方になっています。

### 4. 空のときと空でないときの違い

空の列では、どの状態に進んでも最後は `Done` にたどり着きます。逆に、1 文字でも残っている列は、必ず `Yield` の状態を通ります。この 2 つの違いを見分けるのが、この関数の仕事です。

## まとめ

- 空の判定は、最初の 1 つが見つかれば答えが決まる。
- 使わない値は `_` で捨てると、何を見ているかが明確になる。
- 状態を分けて書くと、空の部分を正しく読み飛ばせる。
