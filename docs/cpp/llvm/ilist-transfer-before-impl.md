---
title: 双方向リストの区間を、ポインタ 6 本の付け替えだけで別の場所へ移す
description: ilist_base::transferBeforeImpl は、[First, Last) の範囲をまとめて Next の直前へ移します。要素の数に関係なく、前後のポインタを数本書き換えるだけの O(1) の操作です。
language: cpp
project: LLVM
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/ADT/ilist_base.h
lines: [52, 74]
function: ilist_base::transferBeforeImpl
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, メモリ管理]
---

## ひとことで

`transferBeforeImpl` は、双方向リストの **区間 `[First, Last)` を切り取り、`Next` の直前に差し込む** 関数です。同じリストの中でも、別のリストへでも使えます。
LLVM では命令の並びや基本ブロックの並びを、こうしたリストで管理しています。区間に何個の要素があっても、書き換えるのは両端のポインタだけです。

## コード

::: code-group

```cpp:line-numbers=52 [日本語訳]
  static void transferBeforeImpl(node_base_type &Next, node_base_type &First,
                                 node_base_type &Last) {
    if (&Next == &Last || &First == &Last)
      return;

    // 挿入位置は、移す範囲の中にあってはいけない。
    assert(&Next != &First &&
           // いちばんよくある間違いを確かめる。
           "Insertion point can't be one of the transferred nodes");

    node_base_type &Final = *Last.getPrev();

    // 元のリスト／位置から切り離す。
    First.getPrev()->setNext(&Last);
    Last.setPrev(First.getPrev());

    // [First, Final] を新しいリスト／位置へつなぐ。
    node_base_type &Prev = *Next.getPrev();
    Final.setNext(&Next);
    First.setPrev(&Prev);
    Prev.setNext(&First);
    Next.setPrev(&Final);
  }
```

```cpp:line-numbers=52 [原文]
  static void transferBeforeImpl(node_base_type &Next, node_base_type &First,
                                 node_base_type &Last) {
    if (&Next == &Last || &First == &Last)
      return;

    // Position cannot be contained in the range to be transferred.
    assert(&Next != &First &&
           // Check for the most common mistake.
           "Insertion point can't be one of the transferred nodes");

    node_base_type &Final = *Last.getPrev();

    // Detach from old list/position.
    First.getPrev()->setNext(&Last);
    Last.setPrev(First.getPrev());

    // Splice [First, Final] into its new list/position.
    node_base_type &Prev = *Next.getPrev();
    Final.setNext(&Next);
    First.setPrev(&Prev);
    Prev.setNext(&First);
    Next.setPrev(&Final);
  }
```

:::

## 前提知識

- **双方向リスト**: 各要素（ノード）が「前のノード」と「次のノード」へのポインタを持つデータ構造です。途中への挿入や削除が速いのが特徴です。
- **侵入型リスト（intrusive list）**: 要素自身の中に前後のポインタを持たせる方式です。リスト用のノードを別に確保しないので、メモリ確保が減ります。LLVM の `ilist` はこの方式です。
- **番兵（sentinel）**: リストの端に置く、データを持たない特別なノードです。末尾の次が番兵、番兵の次が先頭、という輪にしておくと、端の特別扱いが要らなくなります。
- **参照 `node_base_type &Next`**: ノードを別名で受け取ります。`&Next` はその住所です。
- **`static` メンバ関数**: オブジェクトなしで呼べる関数です。リストの状態はノード同士のポインタだけで表されるので、リストのオブジェクト自体は要りません。
- **半開区間 `[First, Last)`**: `First` は含み、`Last` は含みません。

## 何をしているか

リスト A が `a1 ⇄ a2 ⇄ a3 ⇄ a4`、リスト B が `b1 ⇄ b2` のとき、`[a2, a4)`（`a2, a3`）を `b2` の直前へ移す例で追います。

### 1. 何もしなくてよい場合

```cpp:line-numbers=54
    if (&Next == &Last || &First == &Last)
      return;
```

- `&Next == &Last`: 区間はもう `Next` の直前にあります。
- `&First == &Last`: 区間が空です。

### 2. 区間の最後を求める

```cpp:line-numbers=62
    node_base_type &Final = *Last.getPrev();
```

`Last` は区間に含まれないので、本当の最後は `Last` の前、`Final = a3` です。

### 3. 元の場所から外す

```cpp:line-numbers=65
    First.getPrev()->setNext(&Last);
    Last.setPrev(First.getPrev());
```

区間の前（`a1`）と後ろ（`a4`）を直接つなぎます。

- `a1.next = a4`
- `a4.prev = a1`

A は `a1 ⇄ a4` になりました。`a2 ⇄ a3` は宙に浮いていますが、`a2` と `a3` の間のポインタはそのままです。

### 4. 新しい場所へ差し込む

```cpp:line-numbers=69
    node_base_type &Prev = *Next.getPrev();
    Final.setNext(&Next);
    First.setPrev(&Prev);
    Prev.setNext(&First);
    Next.setPrev(&Final);
```

`Next = b2`、その前 `Prev = b1` の間に入れます。

- `a3.next = b2`
- `a2.prev = b1`
- `b1.next = a2`
- `b2.prev = a3`

B は `b1 ⇄ a2 ⇄ a3 ⇄ b2` になりました。

### 5. 典型的な誤りを assert で防ぐ

```cpp:line-numbers=58
    assert(&Next != &First &&
           // いちばんよくある間違いを確かめる。
           "Insertion point can't be one of the transferred nodes");
```

差し込み先 `Next` が区間の先頭 `First` と同じだと、自分の中に自分を差し込むことになり、リストが壊れます。開発中にはこれを検出します。

## ここがすごい

- **要素数に関係なく一定時間**: 区間に 1 万個のノードがあっても、書き換えるのは 6 本のポインタだけです。配列でまとめて移すなら、要素数に比例したコピーが必要です。
- **番兵のおかげで場合分けがない**: 区間がリストの先頭や末尾にあっても、前後には必ず何かのノード（番兵を含む）があります。そのため `nullptr` のチェックが 1 つもありません。
- **区間の中を触らない**: 区間の内側のつながりはそのまま使うので、ループがありません。
- **侵入型なのでノードを作り直さない**: ノードそのものを移動するので、要素へのポインタや参照は移動後も有効です。

## まとめ

- 双方向リストの区間の移動は、両端のポインタの付け替えだけでできる。
- 番兵ノードで輪にすると、端の特別扱いがなくなる。
- 半開区間なら、「本当の最後」は `Last` の前として求められる。
- 自分の中に自分を差し込むような誤用は、assert で早めに検出する。

