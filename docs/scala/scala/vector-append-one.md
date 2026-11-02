---
title: "末尾に 1 つ足すとき、末尾の配列が満杯なら新しい段を作る"
description: "Scala 標準ライブラリの Vector1.appended。先頭の配列に空きがあれば、コピーして 1 つ足す。満杯なら、配列を先頭の段にした Vector2 を作り、新しい要素を末尾の配列に入れる。木の段を少しずつ増やす仕組み。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/immutable/Vector.scala"
lines: [400, 405]
format: 2
function: "Vector1.appended"
difficulty: 3
tags: [データ構造, 最適化, 関数型]
---

## ひとことで

Scala の `Vector` は、要素を 32 個ずつの配列にまとめて、木のように段を重ねて持つ不変のリストです。`appended` は、末尾に 1 つ要素を足す操作です。元の `Vector` は変えず、新しい `Vector` を返します。要素が少ないうちは 1 つの配列で持ち、満杯になったら段を増やします。

## コード

```scala:line-numbers=400
  override def appended[B >: A](elem: B): Vector[B] = {
    val len1 = prefix1.length
    if(len1 < WIDTH) new Vector1(copyAppend1(prefix1, elem))
    else new Vector2(prefix1, WIDTH, empty2, wrap1(elem), WIDTH+1)
  }

```

## 前提知識

- `Vector` は、要素を変更せず、新しい `Vector` を作って返す不変のデータ構造です。
- 内部では、要素を最大 32 個（`WIDTH`）ずつの配列に入れて持ちます。配列の中身は、まだ使っていない部分を含めて固定の大きさです。
- `Vector1` は、要素が 1 つの配列 `prefix1` だけで収まる状態を表す内部のクラスです。
- `copyAppend1` は、配列を新しい配列にコピーして、末尾に 1 つ足す補助の関数です。元の配列は変わりません。
- `Vector2` は、配列を 2 段持つ形を表す内部のクラスです。先頭側の配列、中間の段、末尾の配列の組で要素を管理します。

## 何をしているか

### 1. 先頭の配列に空きがあるか調べる

`len1` は、先頭の配列に入っている要素の数です。32 より小さければ、配列に空きがあります。

```scala:line-numbers=401
    val len1 = prefix1.length
    if(len1 < WIDTH) new Vector1(copyAppend1(prefix1, elem))
```

### 2. 空きがあれば、配列をコピーして 1 つ足す

空きがあるときは、`copyAppend1` で配列を作り直し、末尾に `elem` を足します。結果は、1 つの配列だけで持つ `Vector1` です。

```scala:line-numbers=403
    else new Vector2(prefix1, WIDTH, empty2, wrap1(elem), WIDTH+1)
```

### 3. 満杯なら、段を増やして末尾の配列に入れる

配列が満杯なら、今の配列 `prefix1` をそのまま先頭の段に使います。新しい要素は、末尾の配列 `wrap1(elem)` に入ります。要素の数は `WIDTH + 1` になります。

```scala:line-numbers=404
  }
```

## ここがすごい

- 配列が 32 個までは、1 つの配列を作り直すだけで済みます。少ない要素のときは、木の構造を作る手間がかかりません。
- 満杯の配列は、コピーせずに先頭の段としてそのまま使います。大きな配列をコピーし続ける無駄を避けています。
- 新しい要素は末尾の小さな配列に入るので、次の追加も同じ仕組みで速く済みます。
- 元の `Vector` を変えずに新しい値を返すので、古い値を持つ別の処理にも影響しません。

## まとめ

- 末尾への追加は、末尾の配列に空きがあれば、その場で小さなコピーを作ります。
- 満杯になったら、配列を段として残し、新しい要素を別の配列に移します。
- 不変のデータを速く扱うには、大きな部分を再利用して、変わる部分だけを作り直します。
