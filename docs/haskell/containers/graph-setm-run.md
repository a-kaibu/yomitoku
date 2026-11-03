---
title: "訪問済みの集合を持ち歩く、自作の状態モナド"
description: "深さ優先探索で訪問済みの頂点を記録するため、Graph モジュールが自前で作った状態モナド SetM と、その実行関数 run。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [635, 639]
function: "run"
difficulty: 3
format: 2
tags: [アルゴリズム, 状態機械, 関数型]
---

## ひとことで

`run` は、`SetM` という状態つきの計算（状態モナド）を実行する関数です。`SetM` は、訪問済みの頂点の集合（`IntSet`）を裏で持ち歩きながら、計算を進めます。

深さ優先探索は「訪問したかどうか」を、探索の途中でずっと覚えておく必要があります。その記録を、関数の引数で手渡しせずに、モナドに任せているのがこの仕組みです。

## コード

```haskell:line-numbers=635
run :: Bounds -> ((Vertex -> SetM Bool) -> (Vertex -> SetM ()) -> SetM a) -> a
run _ f = fst (runSetM (f contains include) Set.empty)
  where
    contains v = SetM $ \m -> (Set.member v m, m)
    include v = SetM $ \m -> ((), Set.insert v m)
```

## 前提知識

- **モナド**: 「途中の結果を次の計算へ渡す手順」をまとめた型です。`do` 記法で、手順を上から書けます。
- **`newtype SetM a = SetM { runSetM :: IntSet -> (a, IntSet) }`**: 「集合を受け取り、結果と新しい集合を返す関数」を包んだ型です。`newtype` は、中身の型を別の名前で包む宣言です。
- **`#if` と `#else`**: コンパイル時に、どちらのコードを使うかを切り替える仕組みです。この記事のコードは `USE_ST_MONAD` が偽のときに使われる版です。GHC などでは、ST モナドを使う別の版が選ばれることもあります。
- **`fst`**: 組の最初の要素を取り出す関数です。

## 何をしているか

### 1. 状態つきの計算を定義する

```haskell:line-numbers=620
newtype SetM a = SetM { runSetM :: IntSet -> (a, IntSet) }
```

`SetM` は、「集合を入力して、(結果, 新しい集合) を出力する」関数を包んでいます。計算の途中で集合が更新されていく様子を、型で表しています。

### 2. 訪問したかどうかを確かめる操作

```haskell:line-numbers=638
    contains v = SetM $ \m -> (Set.member v m, m)
```

`contains v` は、集合 `m` に `v` が含まれるかを調べます。集合は変えず、結果として真偽値と元の集合を返します。

### 3. 訪問したことを記録する操作

```haskell:line-numbers=639
    include v = SetM $ \m -> ((), Set.insert v m)
```

`include v` は、集合に `v` を追加します。結果は `()`（何も意味のない値）で、新しい集合だけが次の計算に渡されます。

### 4. 実行して結果だけを取り出す

```haskell:line-numbers=636
run _ f = fst (runSetM (f contains include) Set.empty)
```

`runSetM (f contains include) Set.empty` は、空の集合から計算を始めます。最後に `fst` で、結果の部分だけを取り出して返します。最後の集合は捨てられます。

## ここがすごい

`contains` と `include` を、探索の関数に渡すという設計が要です。探索の本体は「訪問済みかどうか」の中身を知らず、ただ呼び出すだけです。そのため、同じ探索の処理を、別の記録方法（ST モナドの配列など）に差し替えられます。

また、集合を `IntSet` にしているので、頂点の番号を整数のまま記録でき、速く動きます。

## まとめ

- 状態を引数で手渡しする代わりに、モナドに隠すと、処理の本体が読みやすくなる。
- 記録の仕方と探索の手順を分けると、片方だけを取り替えられる。
- `#if` を使うと、環境に応じて実装を切り替えられる。
