---
title: "釣り合った 2 本の木を、端と端で結ぶ「glue」"
description: "左の木の最大キーを取り出し、右の木の最小キーを取り出して、大きいほうを根にして 2 本をつなぐ関数 glue。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4201, 4206]
function: "glue"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`glue` は、2 本の木 `l` と `r` を、キーの順序を保ったままつなぐ関数です。前提として、2 本の大きさが釣り合っていることが必要です。

方法は単純で、**大きいほうの木から端のキーを 1 つ取り出し、それを新しい根にして、残りの木を両側にぶら下げる** というものです。

## コード

```haskell:line-numbers=4201
glue :: Map k a -> Map k a -> Map k a
glue Tip r = r
glue l Tip = l
glue l@(Bin sl kl xl ll lr) r@(Bin sr kr xr rl rr)
  | sl > sr = let !(MaxView km m l') = maxViewSure kl xl ll lr in Bin (sl+sr) km m l' r
  | otherwise = let !(MinView km m r') = minViewSure kr xr rl rr in Bin (sl+sr) km m l r'
```

## 前提知識

- **`Map` の節**: `Bin` は `大きさ キー 値 左 右` を持つ節です。`glue` は、`Bin sl kl xl ll lr` のように、名前を付けて中身を取り出しています。
- **`let ... in`**: 途中の値を名前に束ねてから、次の式で使う書き方です。
- **`!(パターン)`**: 取り出した値を厳密に計算させる書き方です。`!(MaxView km m l')` は、中身をすぐ確定させながら分解します。
- **`MinView` と `MaxView`**: 木から端の要素を 1 つ取り出した結果を入れる型です。次の行で定義されています。

```haskell:line-numbers=4208
data MinView k a = MinView !k a !(Map k a)
data MaxView k a = MaxView !k a !(Map k a)
```

## 何をしているか

### 1. 空の木の処理

```haskell:line-numbers=4202
glue Tip r = r
glue l Tip = l
```

片方が空なら、もう片方をそのまま返します。

### 2. 大きいほうから端を取り出す

```haskell:line-numbers=4204
glue l@(Bin sl kl xl ll lr) r@(Bin sr kr xr rl rr)
  | sl > sr = let !(MaxView km m l') = maxViewSure kl xl ll lr in Bin (sl+sr) km m l' r
  | otherwise = let !(MinView km m r') = minViewSure kr xr rl rr in Bin (sl+sr) km m l r'
```

- `sl > sr`（左の方が大きい）なら、左の木の最大キー `km` を取り出し、残りの木 `l'` を使います。そして、新しい根 `km` の右に元の右の木 `r` をぶら下げます。
- そうでなければ、右の木の最小キー `km` を取り出し、残りの木 `r'` を使います。新しい根 `km` の左に元の左の木 `l` をぶら下げます。

取り出すのは端の 1 件だけなので、キーの順序は崩れません。左の木の最大より右の木の最小のほうが大きいからです。

### 3. 取り出す処理

取り出しは、`maxViewSure` や `minViewSure` という補助関数で行います。取り出した後は、`balanceL` などを呼んで釣り合いを直します。

## ここがすごい

`glue` は、「釣り合っている 2 本の木を、1 つの節の追加だけでつなぐ」という手際のよさが魅力です。全体を組み直さず、端の 1 件を抜き出して根にするだけなので、処理は端までの道のりの分だけで済みます。

さらに、大きいほうから取り出すことで、取り出した後の木も大きさの偏りが小さくなります。大きさを比べて選ぶという、ほかの関数と同じ考え方が、ここでも使われています。

## まとめ

- 2 本の木は、端のキーを 1 つ取り出して根にすれば、順序を保ったままつなげられる。
- どちらを取り出すかは、大きさを比べて決める。
- 取り出した後は、釣り合いを直す関数を呼ぶ。
