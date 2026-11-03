---
title: "半分のとき偶数側へ丸める、10 進数の桁の丸め"
description: "10 進数の桁列を指定した桁で丸める roundTo。ちょうど半分の場合は、直前の桁が偶数になるほうへ丸める（銀行丸め）。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 1994-2002"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Builder/RealFloat/Functions.hs
lines: [17, 35]
function: "roundTo"
difficulty: 3
format: 2
tags: [数値計算, 入出力]
---

## ひとことで

`roundTo` は、10 進数の桁のリストを、指定した桁数で丸める関数です。たとえば `[1,2,5]` を 2 桁で丸めると、`[1,2]` または `[1,3]` になります。

「ちょうど半分」のとき、ふつうは切り上げますが、この関数は直前の桁が偶数になるように丸めます。統計や会計で使われる「銀行丸め」と同じ考え方です。

## コード

::: code-group

```haskell:line-numbers=17 [日本語訳]
roundTo :: Int -> [Int] -> (Int,[Int])
roundTo d is =
  case f d True is of
    x@(0,_) -> x
    (1,xs)  -> (1, 1:xs)
    _       -> error "roundTo: bad Value"
 where
  b2 = base `quot` 2

  f n _ []     = (0, replicate n 0)
  f 0 e (x:xs) | x == b2 && e && all (== 0) xs = (0, [])   -- ちょうど半分のとき、偶数に丸める。
               | otherwise = (if x >= b2 then 1 else 0, [])
  f n _ (i:xs)
     | i' == base = (1,0:ds)
     | otherwise  = (0,i':ds)
      where
       (c,ds) = f (n-1) (even i) xs
       i'     = c + i
  base = 10
```

```haskell:line-numbers=17 [原文]
roundTo :: Int -> [Int] -> (Int,[Int])
roundTo d is =
  case f d True is of
    x@(0,_) -> x
    (1,xs)  -> (1, 1:xs)
    _       -> error "roundTo: bad Value"
 where
  b2 = base `quot` 2

  f n _ []     = (0, replicate n 0)
  f 0 e (x:xs) | x == b2 && e && all (== 0) xs = (0, [])   -- Round to even when at exactly half the base
               | otherwise = (if x >= b2 then 1 else 0, [])
  f n _ (i:xs)
     | i' == base = (1,0:ds)
     | otherwise  = (0,i':ds)
      where
       (c,ds) = f (n-1) (even i) xs
       i'     = c + i
  base = 10
```

:::

## 前提知識

- **桁のリスト**: 数字を 1 桁ずつ並べたリストです。`[1,2,5]` は 125 を表します。先頭が最上位の桁です。
- **`case ... of`**: 結果の組の最初の値（桁上がり）で場合分けしています。
- **`x@(0,_)`**: 名前付きのパターンです。`x` という名前で、組全体を取り出しています。
- **`where`**: 関数の中の補助の定義（`b2`、`f`）を書いています。
- **`replicate`**: 同じ値を指定した数だけ並べたリストを作る関数です。

## 何をしているか

### 1. 丸めの中心の関数 f

::: code-group

```haskell:line-numbers=26 [日本語訳]
  f n _ []     = (0, replicate n 0)
  f 0 e (x:xs) | x == b2 && e && all (== 0) xs = (0, [])   -- ちょうど半分のとき、偶数に丸める。
               | otherwise = (if x >= b2 then 1 else 0, [])
```

```haskell:line-numbers=26 [原文]
  f n _ []     = (0, replicate n 0)
  f 0 e (x:xs) | x == b2 && e && all (== 0) xs = (0, [])   -- Round to even when at exactly half the base
               | otherwise = (if x >= b2 then 1 else 0, [])
```

:::

`f n _ []` は、桁が尽きたら残りを 0 で埋めます。`f 0 e (x:xs)` は、残す桁が 0 になったときの処理です。次の桁 `x` が半分（`b2`、つまり 5）で、その後ろがすべて 0 なら、これは「ちょうど半分」です。このとき `e` が真（直前の桁が偶数）なら、切り捨てて `(0, [])` を返します。そうでなければ、`x >= b2` で切り上げるかを決めます。

### 2. 桁上がりを上の桁へ伝える

```haskell:line-numbers=29
  f n _ (i:xs)
     | i' == base = (1,0:ds)
     | otherwise  = (0,i':ds)
      where
       (c,ds) = f (n-1) (even i) xs
       i'     = c + i
```

`f n _ (i:xs)` は、今の桁 `i` を残して、後ろの桁を再帰で丸めます。後ろからの桁上がり `c` を `i` に足して、もし `10` になったら、`i'` は `base` に等しくなり、上の桁へ `1` を渡します。

### 3. 最上位の桁上がりを処理する

```haskell:line-numbers=18
roundTo d is =
  case f d True is of
    x@(0,_) -> x
    (1,xs)  -> (1, 1:xs)
    _       -> error "roundTo: bad Value"
```

全体の結果が `(1, xs)` なら、先頭に `1` を付けて桁を 1 つ増やします。`(0, _)` なら、そのまま結果を使います。

## ここがすごい

ちょうど半分の判定に、「後ろがすべて 0 か」を確かめる `all (== 0) xs` を使っています。そして、直前の桁の偶数性を、再帰の中で `even i` として次へ渡しています。判定に必要な情報を、引数で運ぶ工夫です。

また、GHC の標準ライブラリにある浮動小数点の表示の関数の一部を取り出したものです。小数点の位置を決める処理を、桁のリストだけで扱えるように、小さくまとめられています。

ふだん目にしない処理ですが、丸めの規則を正確に実装するのは意外に難しいです。その規則をコメント 1 行で示しているので、読む人は意図が分かります。

## まとめ

- 「ちょうど半分」の扱いは、丸めの規則を決める大事な点。
- 直前の桁の偶数性を、再帰の中で次へ渡すと判定できる。
- 桁上がりは、後ろから上へ伝えると、組み立てが素直になる。
