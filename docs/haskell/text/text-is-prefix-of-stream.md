---
title: "先頭が一致するかを、2 つの列を同時に進めて調べる"
description: "text の Stream 版 isPrefixOf。2 つの列を 1 文字ずつ同時に進め、片方が終わるまで一致を確かめる。空の処理（Skip）は読み飛ばして比べる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [1040, 1049]
function: "isPrefixOf"
difficulty: 3
format: 2
tags: [文字列処理, 再帰, 遅延評価]
---

## ひとことで

`isPrefixOf s1 s2` は、列 `s1` が列 `s2` の先頭に来ているかを調べる関数です。2 つの列を同時に進めながら、1 文字ずつ比べていきます。

## コード

```haskell:line-numbers=1040
isPrefixOf :: (Eq a) => Stream a -> Stream a -> Bool
isPrefixOf (Stream next1 s1 _) (Stream next2 s2 _) = loop (next1 s1) (next2 s2)
    where
      loop Done      _ = True
      loop _    Done = False
      loop (Skip s1')     (Skip s2')     = loop (next1 s1') (next2 s2')
      loop (Skip s1')     x2             = loop (next1 s1') x2
      loop x1             (Skip s2')     = loop x1          (next2 s2')
      loop (Yield x1 s1') (Yield x2 s2') = x1 == x2 &&
                                           loop (next1 s1') (next2 s2')
```

## 前提知識

- **`Stream a`**: 次の要素を順に取り出せる、列の作り方です。`next` で 1 つ進みます。
- **`Done`、`Skip`、`Yield`**: 列の状態を表す 3 つの値です。`Done` は終わり、`Yield` は要素がある、`Skip` は今は要素がないが次へ進む、という意味です。
- **`Eq a`**: 要素どうしを `==` で比べられる、という制約です。
- **`where` の `loop`**: 2 つの列を同時に進める、補助の再帰関数です。

## 何をしているか

### 1. 片方が終わったら、結果が決まる

```haskell:line-numbers=1043
      loop Done      _ = True
      loop _    Done = False
```

先頭の列 `s1` が終わったなら、どこまで比べても一致しているので `True` です。`s2` が終わったのに `s1` がまだ残っていれば、先頭にはなれないので `False` です。

### 2. 両方に要素があるときは、比べる

```haskell:line-numbers=1048
      loop (Yield x1 s1') (Yield x2 s2') = x1 == x2 &&
                                           loop (next1 s1') (next2 s2')
```

両方が `Yield` のときは、要素 `x1` と `x2` が等しいかを比べます。等しければ、両方を 1 つ先へ進めて、同じ調べを続けます。

## ここがすごい

`Skip` の状態は、要素を作らずに次へ進むことを表します。この関数は、`Skip` を読み飛ばして比べ続けるので、途中で空の処理が挟まっても正しく動きます。

また、`&&` の短絡評価によって、一文字でも違えば、そこで比べるのを止めます。無駄な比較が起きないのも工夫です。

## まとめ

- 2 つの列を同時に進めると、一度の走査で比べられる。
- 状態を `Done`、`Skip`、`Yield` に分けると、場合分けが整理される。
- 途中で違うと分かった時点で止める書き方は、速さにつながる。
