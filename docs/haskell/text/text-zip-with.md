---
title: "2 つの列を、同じ位置どうしで組み合わせる"
description: "text の Stream 版 zipWith。2 つの列を同じ速さで進め、同じ位置の要素どうしに関数を当てる。短いほうの長さで止まる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [1172, 1179]
function: "zipWith"
difficulty: 2
format: 2
tags: [文字列処理, 関数型, イテレータ]
---

## ひとことで

`zipWith f s1 s2` は、2 つの列を先頭から同時に進めて、同じ位置の要素どうしに関数 `f` を当てた結果の列を作る関数です。短いほうが終わったところで止まります。

## コード

```haskell:line-numbers=1172
zipWith :: (a -> a -> b) -> Stream a -> Stream a -> Stream b
zipWith f (Stream next0 sa0 len1) (Stream next1 sb0 len2) =
    Stream next (Z1 sa0 sb0) (smaller len1 len2)
    where
      next (Z1 sa sb) = case next0 sa of
                          Done -> Done
                          Skip sa' -> Skip (Z1 sa' sb)
                          Yield a sa' -> Skip (Z2 sa' sb a)
```

## 前提知識

- **`Stream a`**: 次の要素を順に取り出せる列の型です。`next` で 1 つ進みます。
- **`Z1` と `Z2`**: 2 つの列の状態を、どこまで進んだかで区別するための内部の印です。
- **`smaller`**: 2 つの長さのうち、小さいほうを返す関数です。
- **`Skip`**: 要素がないが、次の状態へ進むことを表す印です。

## 何をしているか

### 1. 1 本目の列を進める

```haskell:line-numbers=1176
      next (Z1 sa sb) = case next0 sa of
```

最初は、1 本目の列 `sa` を 1 つ進めます。

### 2. 1 本目の要素を覚えて、2 本目へ移る

```haskell:line-numbers=1179
                          Yield a sa' -> Skip (Z2 sa' sb a)
```

1 本目から要素 `a` が取れたら、その値を覚えたまま、2 本目の列の状態へ移ります。覚えた `a` は、次の段階で 2 本目の要素と組み合わせられます。

## ここがすごい

2 つの列を、リストにせずにそのまま流しながら組み合わせます。途中の大きなリストを作らないので、メモリを節約できます。

また、長さは `smaller` で最初に決めておくので、どちらかが終わった時点で正しく止まります。

## まとめ

- 2 つの列を同時に進めるときは、状態を分けて覚えると分かりやすい。
- 要素を一時的に覚えることで、2 つの列の組み合わせを表せる。
- 長さを先に決めておくと、終わりの処理が簡単になる。
