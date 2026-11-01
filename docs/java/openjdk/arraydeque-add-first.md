---
title: "配列をリング状に使って先頭追加を一瞬で済ませる"
description: "ArrayDeque の先頭に要素を追加するメソッド。配列を輪のように使うので、要素をずらさずに先頭へ追加できる。満杯の判定と拡張のタイミングにも工夫がある。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/ArrayDeque.java
lines: [282, 289]
function: "ArrayDeque.addFirst"
difficulty: 2
tags: [データ構造, 標準ライブラリ, 最適化]
---

## ひとことで

`ArrayDeque` は、先頭と末尾のどちらにも速く要素を出し入れできるデータ構造（両端キュー）です。`addFirst(e)` は先頭に要素を追加します。

ふつうの配列で先頭に追加すると、既存の要素を全部 1 つずつ後ろにずらす必要があります。`ArrayDeque` は **配列を輪（リング）のように使う** ことで、ずらさずに、一定時間で追加できます。

## コード

```java:line-numbers=282
    public void addFirst(E e) {
        if (e == null)
            throw new NullPointerException();
        final Object[] es = elements;
        es[head = dec(head, es.length)] = e;
        if (head == tail)
            grow(1);
    }
```

このメソッドが使う `dec` は、同じファイルの 225〜228 行目で次のように定義されています。

```java
static final int dec(int i, int modulus) {
    if (--i < 0) i = modulus - 1;
    return i;
}
```

## 前提知識

- **`E`**: ジェネリクスの型パラメータで、「このキューに入れる要素の型」です。
- **`Object[] elements`**: 要素を入れる配列です。`head` は先頭の要素の位置、`tail` は「次に末尾へ追加する位置」です。
- **`throw new NullPointerException()`**: `null` を入れようとしたらエラーにします。`ArrayDeque` は空いている場所を `null` で表すので、`null` を要素として入れられないのです。
- **`final Object[] es = elements;`**: フィールドをローカル変数に写しています。この後の処理で何度も使うので、毎回フィールドを読むより速く、読みやすくなります。
- **`es[head = dec(head, es.length)] = e;`**: Java では代入が値を持つので、`head` を更新しながら、その位置に `e` を書き込んでいます。
- **`--i`**: `i` を 1 減らしてからその値を使います。

## 何をしているか

長さ 8 の配列で、要素 `A, B, C` が位置 0〜2 に入っているとします。`head = 0`、`tail = 3` です。

```
[A, B, C, _, _, _, _, _]
 head      tail
```

### 1. 先頭の位置を 1 つ戻す（286 行目）

`dec(0, 8)` は、`0 - 1 = -1` が負なので、配列の最後の位置 `7` を返します。輪のように、0 番の前は 7 番です。そこに新しい要素 `Z` を書きます。

```
[A, B, C, _, _, _, _, Z]
          tail        head
```

論理的な並びは `Z, A, B, C` です。既存の要素は 1 つも動いていません。

### 2. 満杯になったら広げる（287〜288 行目）

追加を繰り返して `head` が `tail` に追いつくと、配列は満杯です。そのときだけ `grow(1)` で配列を大きくします。

`ArrayDeque` は「`head == tail` は空」という約束にしているので、満杯の状態をそのままにしておけません。そこで **満杯になった瞬間にすぐ広げ**、常に 1 つ以上の空きがある状態を保っています。

## ここがすごい

- **要素をずらさない**: 先頭への追加が、要素数に関係なく一定時間で終わります。`ArrayList` の先頭に追加すると要素数に比例した時間がかかるのと対照的です。
- **`%` を使わない**: 輪の位置計算は `(i - 1) % n` でもできそうですが、Java の `%` は負の数に対して負を返すので、補正が必要です。`dec` は「負になったら最後へ」という比較 1 つで済ませています。割り算もしないので速いです。
- **`null` を空きの印に使う**: 要素が `null` になれないという制限と引き換えに、空きを判定するための追加の情報がいりません。シンプルな約束で、コード全体が単純になっています。
- **追加の後で広げる**: 先に満杯かを調べるのではなく、書き込んでから `head == tail` を調べます。比較が 1 回で済み、「常に空きがある」状態を保つことで、ほかのメソッドも簡単になります。

## まとめ

- 配列を輪のように使うと、両端への追加・削除がずらさずにできる（リングバッファ）。
- 輪の位置計算は、`%` より「範囲を出たら反対側へ」の比較の方が速くて安全。
- 「空きがある」という不変条件を保つと、空と満杯を区別しやすくなる。
