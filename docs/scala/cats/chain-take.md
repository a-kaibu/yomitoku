---
title: "木をたどりながら、先頭から必要な個数だけを取り出す"
description: "Cats の Chain.take。Chain の木の形を左から順にたどり、必要な個数に達したら止める。配列のまとまりは Wrap で一気に切り、残りの枝は必要な分だけ連結する。末尾再帰と、左右の枝を積むリストを使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Chain.scala"
lines: [262, 305]
format: 2
function: "Chain.take"
difficulty: 3
tags: [データ構造, アルゴリズム, 遅延評価]
---

## ひとことで

Cats の `Chain` は、連結を木の形で持つ型です。`take` は、先頭から指定の個数だけ要素を取り出した新しい `Chain` を返します。木を左からたどり、必要な個数に達したら、残りの枝は見ずに止めます。

## コード

::: code-group

```scala:line-numbers=262 [日本語訳]
  final def take(count: Long): Chain[A] = {
    // 不変条件として、count >= 1 です。
    @tailrec
    def go(lhs: Chain[A], count: Long, arg: NonEmpty[A], rhs: Chain[A]): Chain[A] =
      arg match {
        case Wrap(seq) =>
          if (count == 1) {
            lhs.append(seq.head)
          } else {
            // count が 1 より大きい場合です。
            val taken =
              if (count < Int.MaxValue) seq.take(count.toInt)
              else seq.take(Int.MaxValue)
            // count のすべてを取れたとは限らないので、残りを数えます。
            val newCount = count - taken.length
            val wrapped = Wrap(taken)
            // concat を使うより効率的なので、この形で作ります。
            val newLhs = if (lhs.isEmpty) wrapped else Append(lhs, wrapped)
            rhs match {
              case rhsNE: NonEmpty[A] if newCount > 0L =>
                // 右側の枝からも、まだ取り続ける必要があります。
                go(newLhs, newCount, rhsNE, Empty)
              case _ =>
                newLhs
            }
          }
        case Append(l, r) =>
          go(lhs, count, l, if (rhs.isEmpty) r else Append(r, rhs))
        case s @ Singleton(_) =>
          // 不変条件 count >= 1 によります。
          val newLhs = if (lhs.isEmpty) s else Append(lhs, s)
          rhs match {
            case rhsNE: NonEmpty[A] if count > 1L =>
              go(newLhs, count - 1L, rhsNE, Empty)
            case _ => newLhs
          }
      }

    this match {
      case ne: NonEmpty[A] if count > 0L =>
        go(Empty, count, ne, Empty)
      case _ => Empty
    }
  }
```

```scala:line-numbers=262 [原文]
  final def take(count: Long): Chain[A] = {
    // invariant count >= 1
    @tailrec
    def go(lhs: Chain[A], count: Long, arg: NonEmpty[A], rhs: Chain[A]): Chain[A] =
      arg match {
        case Wrap(seq) =>
          if (count == 1) {
            lhs.append(seq.head)
          } else {
            // count > 1
            val taken =
              if (count < Int.MaxValue) seq.take(count.toInt)
              else seq.take(Int.MaxValue)
            // we may have not taken all of count
            val newCount = count - taken.length
            val wrapped = Wrap(taken)
            // this is more efficient than using concat
            val newLhs = if (lhs.isEmpty) wrapped else Append(lhs, wrapped)
            rhs match {
              case rhsNE: NonEmpty[A] if newCount > 0L =>
                // we have to keep taking on the rhs
                go(newLhs, newCount, rhsNE, Empty)
              case _ =>
                newLhs
            }
          }
        case Append(l, r) =>
          go(lhs, count, l, if (rhs.isEmpty) r else Append(r, rhs))
        case s @ Singleton(_) =>
          // due to the invariant count >= 1
          val newLhs = if (lhs.isEmpty) s else Append(lhs, s)
          rhs match {
            case rhsNE: NonEmpty[A] if count > 1L =>
              go(newLhs, count - 1L, rhsNE, Empty)
            case _ => newLhs
          }
      }

    this match {
      case ne: NonEmpty[A] if count > 0L =>
        go(Empty, count, ne, Empty)
      case _ => Empty
    }
  }
```

:::

## 前提知識

- `Chain` の木は、`Append(l, r)`（枝）、`Singleton`（1 要素）、`Wrap(seq)`（配列などの並び）でできています。
- `count` は、取り出したい個数です。`Long` で表します。
- `lhs` は、ここまでに取り出した部分の `Chain` です。`rhs` は、まだたどっていない右側の枝を積んだものです。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。
- `seq.take(n)` は、並びの先頭から `n` 個を取り出す関数です。

## 何をしているか

### 1. 配列のまとまり（Wrap）は、必要な分だけ一気に切る

`Wrap(seq)` で、今の個数が 1 なら先頭の 1 つを足します。それ以外なら、`seq.take` で必要な分を切り出して、`lhs` に連結します。取り切れなかった分は `newCount` として残します。

```scala:line-numbers=267
        case Wrap(seq) =>
          if (count == 1) {
            lhs.append(seq.head)
          } else {
            // count > 1
            val taken =
              if (count < Int.MaxValue) seq.take(count.toInt)
              else seq.take(Int.MaxValue)
            // we may have not taken all of count
            val newCount = count - taken.length
            val wrapped = Wrap(taken)
            // this is more efficient than using concat
            val newLhs = if (lhs.isEmpty) wrapped else Append(lhs, wrapped)
            rhs match {
              case rhsNE: NonEmpty[A] if newCount > 0L =>
                // we have to keep taking on the rhs
                go(newLhs, newCount, rhsNE, Empty)
              case _ =>
                newLhs
            }
          }
```

### 2. 枝（Append）は、左を先にたどり、右を積んでおく

`Append(l, r)` は、左の枝 `l` をたどり、右の枝 `r` は `rhs` に積みます。左から順に取り出すための準備です。

```scala:line-numbers=288
        case Append(l, r) =>
          go(lhs, count, l, if (rhs.isEmpty) r else Append(r, rhs))
```

### 3. 1 要素（Singleton）は、必要なら次の枝へ続ける

`Singleton` は 1 要素なので、`lhs` に足します。まだ個数が残っていて、積んだ右側の枝があれば、それを続けてたどります。

```scala:line-numbers=290
        case s @ Singleton(_) =>
          // due to the invariant count >= 1
          val newLhs = if (lhs.isEmpty) s else Append(lhs, s)
          rhs match {
            case rhsNE: NonEmpty[A] if count > 1L =>
              go(newLhs, count - 1L, rhsNE, Empty)
            case _ => newLhs
          }
```

### 4. 空でなければ、先頭から取り始める

最後に、自分が空でなければ、`count > 0` のときだけ `go` を始めます。空の場合や個数が 0 以下の場合は、`Empty` を返します。

```scala:line-numbers=300
    this match {
      case ne: NonEmpty[A] if count > 0L =>
        go(Empty, count, ne, Empty)
      case _ => Empty
    }
```

## ここがすごい

- 必要な個数に達したら止まるので、残りの枝は一切たどりません。大きな `Chain` の先頭だけ欲しいときに、とても速く済みます。
- 配列のまとまりは、要素を 1 つずつ足すのではなく、`seq.take` で一度に切り出します。
- 取り切れなかった分を `newCount` で数え直すので、個数を正しく保てます。
- `lhs` と `rhs` の 2 つの枝の積みかたで、末尾再帰のまま木の形を左から順にたどれます。

## まとめ

- 木の形のデータから先頭の一部を取るには、左から順にたどり、必要な量に達したら止めます。
- 配列などの塊は、要素ごとにではなく、塊のまま切り出すと効率的です。
- 残りの量を数え直しながら進めると、途中で止める条件が正しく働きます。
