---
title: "配列の一部を、別の配列へ写す「copy」"
description: "unordered-containers の HAMT 用の配列操作 copy。境界を確かめてから、元の配列の範囲を、コピー先の指定位置へ一度に写す。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal/Array.hs
lines: [302, 308]
function: "copy"
difficulty: 3
format: 2
tags: [低レイヤ, 最適化, 防御的プログラミング]
---

## ひとことで

`copy` は、元の配列 `src` の一部を、変更できる配列 `dst` の指定位置へ、まとめてコピーする関数です。元の配列の添字 `_sidx` から `n` 個を、`dst` の添字 `_didx` へ写します。

1 つずつ代入するより、まとめて写すほうが速いので、この関数はライブラリの多くの場所で使われています。

## コード

```haskell:line-numbers=302
copy :: Array e -> Int -> MArray s e -> Int -> Int -> ST s ()
copy !src !_sidx@(I# sidx#) !dst !_didx@(I# didx#) _n@(I# n#) =
    CHECK_LE("copy", _sidx + _n, length src)
    CHECK_LE("copy", _didx + _n, unsafeLengthM dst)
        ST $ \ s# ->
        case copySmallArray# (unArray src) sidx# (unMArray dst) didx# n# s# of
            s2 -> (# s2, () #)
```

## 前提知識

- **`SmallArray#`**: GHC の、小さな配列を表すプリミティブ（箱のない型）です。HAMT の中では、この形の配列を使っています。
- **`CHECK_LE`**: 範囲の確認を行うマクロです。範囲外のときはエラーにします。
- **`copySmallArray#`**: 配列の一部を、別の配列へ写す命令です。
- **`!`**: 引数を厳密に評価させる印です。

## 何をしているか

### 1. 境界を確かめる

```haskell:line-numbers=304
    CHECK_LE("copy", _sidx + _n, length src)
    CHECK_LE("copy", _didx + _n, unsafeLengthM dst)
```

元の配列とコピー先の配列の、両方で範囲が収まるかを確かめます。範囲の外に書かないための安全策です。確認は、設定によっては省かれます。

### 2. 命令でまとめて写す

```haskell:line-numbers=306
        ST $ \ s# ->
        case copySmallArray# (unArray src) sidx# (unMArray dst) didx# n# s# of
            s2 -> (# s2, () #)
```

`copySmallArray#` で、元の添字 `sidx#` から、`n#` 個の要素を、コピー先の `didx#` へ一度に写します。`ST` の中で、写し終わった状態を返します。

## ここがすごい

要素を 1 つずつ読んで書く代わりに、CPU が得意なまとめての写しを使っています。メモリのかたまりをそのまま動かすので、速度が大きく違います。

また、確認（`CHECK_LE`）と命令の実行を分けて書いているので、確認を有効・無効に切り替えても、同じ構造のまま使えます。安全性と速さを、設定で選べる作りです。

## まとめ

- 配列のまとめ写しは、1 要素ずつより速い。
- 範囲の確認は、安全のために残し、設定で省けるようにする。
- 低レイヤの命令を使うときも、境界を確かめてから呼ぶ。
