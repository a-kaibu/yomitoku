---
title: "同じハッシュ値のキーを、配列 1 つにまとめる"
description: "HAMT で、異なるキーが同じハッシュ値になったとき、その 2 つを 1 つの Collision ノードに入れる collision。ハッシュの衝突を安全に扱う。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [861, 865]
function: "collision"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, 防御的プログラミング]
---

## ひとことで

`collision` は、2 つの異なるキーが同じハッシュ値になってしまったときに、それらを 1 つの `Collision` ノードにまとめて作る関数です。ハッシュ値が同じでも、キーの区別は失われません。

ハッシュ値は、完璧には一意になりません。2 つのキーが同じ値を返すことを「衝突（collision）」と呼びます。HAMT は、この場合でも正しく動くように、衝突専用のノードを用意しています。

## コード

```haskell:line-numbers=861
collision h !e1 !e2 =
    let v = A.run $ do mary <- A.new 2 e1
                       A.write mary 1 e2
                       return mary
    in Collision h v
```

## 前提知識

- **`Leaf`**: 木の葉（キーと値の 1 組）です。`Leaf h (キー, 値)` のように、ハッシュ値と組を持ちます。
- **`!e1 !e2`**: 引数を厳密に計算させる印です。葉の値をすぐに確定させます。
- **`A.run` と `do`**: `A` は配列のモジュールです。`A.run` は、中で配列を作って書き込み、最後に凍結（変更できない形に）して返す関数です。
- **`A.new 2 e1`**: 長さ 2 の配列を作り、先頭に `e1` を入れます。`A.write mary 1 e2` で、2 番目に `e2` を書き込みます。

## 何をしているか

### 1. 配列に 2 つの葉を入れる

```haskell:line-numbers=862
    let v = A.run $ do mary <- A.new 2 e1
                       A.write mary 1 e2
                       return mary
```

長さ 2 の配列を作り、先頭に `e1`、2 番目に `e2` を入れます。この配列が、衝突したキーのすべてを持ちます。ここでは 2 つだけなので、長さは 2 です。後から同じハッシュ値のキーが追加されると、この配列が伸びていきます。

### 2. Collision ノードを作る

```haskell:line-numbers=865
    in Collision h v
```

ハッシュ値 `h` と配列 `v` を組み合わせて、`Collision` ノードを作ります。配列の中の葉は、どれもハッシュ値が同じなので、ノードにハッシュ値を 1 つだけ持たせています。

## ここがすごい

同じハッシュ値の葉を、配列にまとめるだけという単純な方法で、衝突を扱っています。特別な連結リストや、別のデータ構造を用意する必要がありません。

また、ハッシュ値が一致するかどうかは、ノードの `h` を見れば分かるので、探索のときは、配列の中を順に比べれば済みます。衝突は稀にしか起きないので、この形で十分速く動きます。

コードは、配列の作成と書き込みを `A.run` の中で閉じ込めています。外からは、変更できない値として見えるので、関数の結果は純粋なままです。

## まとめ

- ハッシュ値が同じでも、キーは配列に入れて区別を保てる。
- 衝突は稀なので、配列にまとめる単純な方法で十分速い。
- 可変な配列の操作は、`A.run` の中に閉じ込めると、外からは純粋に見える。
