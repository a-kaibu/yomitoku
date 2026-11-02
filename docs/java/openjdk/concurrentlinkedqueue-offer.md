---
title: "CAS で末尾に連結する、ロックなしの待ち行列"
description: "Java 標準の ConcurrentLinkedQueue.offer。末尾ノードの next を CAS で差し替えて要素を連結し、末尾の更新は 2 ホップに 1 回だけ遅らせる。Michael と Scott の非ブロッキングキューの流れを汲む実装。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ConcurrentLinkedQueue.java
lines: [354, 381]
function: "ConcurrentLinkedQueue.offer"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`ConcurrentLinkedQueue.offer(e)` は、キューの末尾に要素を追加します。ロックを使わず、複数のスレッドが同時に追加しても、壊れないように作られています。

待ち行列（キュー）は、並行処理でタスクを受け渡すときによく使われます。この実装は、ロックで全体を止める代わりに、CAS（比較して交換する操作）で一つずつ末尾をつなぎます。

## コード

::: code-group

```java:line-numbers=354 [日本語訳]
    public boolean offer(E e) {
        final Node<E> newNode = new Node<E>(Objects.requireNonNull(e));

        for (Node<E> t = tail, p = t;;) {
            Node<E> q = p.next;
            if (q == null) {
                // p は最後のノードである
                if (NEXT.compareAndSet(p, null, newNode)) {
                    // CAS が成功した時点が、e がこのキューの要素になる線形化点である
                    // e がこのキューの要素になる
                    // newNode が「生きている」（キューから見える）状態になる
                    if (p != t) // 一度に 2 つのノードずつ進む。失敗しても問題ない
                        TAIL.weakCompareAndSet(this, t, newNode);
                    return true;
                }
                // 別のスレッドとの CAS 競合に負けた。次の周回で読み直す
            }
            else if (p == q)
                // リストから外れてしまった。tail が変わっていなければ、tail もリストから外れている
                // つまり head へ飛ぶ必要がある
                // head からは、生きているノードすべてに到達できる
                // そうでなければ、新しい tail の方が良い候補である
                p = (t != (t = tail)) ? t : head;
            else
                // 2 ホップの後に、tail が更新されていないか確かめる
                p = (p != t && t != (t = tail)) ? t : q;
        }
    }
```

```java:line-numbers=354 [原文]
    public boolean offer(E e) {
        final Node<E> newNode = new Node<E>(Objects.requireNonNull(e));

        for (Node<E> t = tail, p = t;;) {
            Node<E> q = p.next;
            if (q == null) {
                // p is last node
                if (NEXT.compareAndSet(p, null, newNode)) {
                    // Successful CAS is the linearization point
                    // for e to become an element of this queue,
                    // and for newNode to become "live".
                    if (p != t) // hop two nodes at a time; failure is OK
                        TAIL.weakCompareAndSet(this, t, newNode);
                    return true;
                }
                // Lost CAS race to another thread; re-read next
            }
            else if (p == q)
                // We have fallen off list.  If tail is unchanged, it
                // will also be off-list, in which case we need to
                // jump to head, from which all live nodes are always
                // reachable.  Else the new tail is a better bet.
                p = (t != (t = tail)) ? t : head;
            else
                // Check for tail updates after two hops.
                p = (p != t && t != (t = tail)) ? t : q;
        }
    }
```

:::

## 前提知識

- **キュー**: 先に入れた要素を、先に取り出す入れ物です。ここでは、末尾に追加します。
- **連結リスト**: 各ノードが次のノードを指すことで、一列につながった構造です。
- **CAS（compare-and-set）**: 「値が期待したものなら、新しい値に変える」を、分割されない一つの命令で行います。他のスレッドが先に変えていたら、失敗します。
- **末尾（tail）と先頭（head）**: 末尾は最後の要素、先頭は取り出す側の要素を指す参照です。ここでは、末尾の位置を探すために使います。
- **線形化点**: 並行処理の操作が、その瞬間に効果を持つ、と見なせる一点です。ここでは CAS が成功した瞬間です。

## 何をしているか

### 1. 新しいノードを用意する

```java:line-numbers=355
        final Node<E> newNode = new Node<E>(Objects.requireNonNull(e));

        for (Node<E> t = tail, p = t;;) {
```

要素を持つ新しいノードを作ります。`null` の要素は、`requireNonNull` で弾きます。ループの最初では、`p` を末尾の参照 `tail` から始めます。

### 2. 末尾なら、CAS で連結する

```java:line-numbers=358
            Node<E> q = p.next;
            if (q == null) {
                // p は最後のノードである
                if (NEXT.compareAndSet(p, null, newNode)) {
                    // CAS が成功した時点が、e がこのキューの要素になる線形化点である
                    // e がこのキューの要素になる
                    // newNode が「生きている」（キューから見える）状態になる
                    if (p != t) // 一度に 2 つのノードずつ進む。失敗しても問題ない
                        TAIL.weakCompareAndSet(this, t, newNode);
                    return true;
                }
```

`p.next` が `null` なら、`p` は今の最後のノードです。`NEXT.compareAndSet(p, null, newNode)` で、`null` だった `next` を新しいノードに変えます。成功すれば、要素は追加されたことになります。失敗したら、別のスレッドが先に追加したので、もう一度ループします。

### 3. 末尾の更新は時々にする

```java:line-numbers=365
                    if (p != t) // 一度に 2 つのノードずつ進む。失敗しても問題ない
                        TAIL.weakCompareAndSet(this, t, newNode);
```

2 つ以上先へ進んでいた場合だけ、`tail` を新しいノードへ進めます。これは失敗しても構いません。`tail` が少し遅れても、次の `offer` で正しく追いつくからです。

### 4. 離れてしまったら戻る

```java:line-numbers=371
            else if (p == q)
                // リストから外れてしまった。tail が変わっていなければ、tail もリストから外れている
                // つまり head へ飛ぶ必要がある
                // head からは、生きているノードすべてに到達できる
                // そうでなければ、新しい tail の方が良い候補である
                p = (t != (t = tail)) ? t : head;
```

`p == q` は、ノードが自分自身を指していて、リストから外れた状態を表します。`tail` がまだ同じなら `head` に戻り、そうでなければ新しい `tail` を使います。

### 5. 2 ホップごとに tail を見直す

```java:line-numbers=377
            else
                // 2 ホップの後に、tail が更新されていないか確かめる
                p = (p != t && t != (t = tail)) ? t : q;
```

それ以外は、`p` を次のノードへ進めます。2 ホップごとに `tail` の値を読み直し、新しい末尾が見つかれば、そこへ飛びます。

## ここがすごい

- **ロックがない**: 追加のたびに、CAS を 1 回試すだけです。待たされるスレッドがいないので、全体として止まりにくくなります。
- **末尾の更新を遅らせる**: `tail` を毎回更新すると、CAS の競合が増えます。2 ホップに 1 回だけ更新することで、競合を減らしています。
- **失敗を前提にする**: 競合に負けたら、読み直して同じ手順を繰り返すだけです。特別な回復処理を書かず、ループで自然に進みます。
- **離れた場所からも戻れる**: 取り出し済みのノードに迷い込んでも、`head` から辿り直せます。途中で構造が変わっても、正しい末尾に到達できるように設計されています。

## まとめ

- 末尾の `next` を CAS で差し替えて、要素を連結する。
- 競合に負けたら読み直し、末尾の更新は 2 ホップに 1 回だけにする。
- ロックなしで、複数のスレッドが同時に追加できる。
