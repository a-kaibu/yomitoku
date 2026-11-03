---
title: ノードの前後のつながりを直して、リストから 1 つを外す
description: Ghostty の侵入型の双方向リスト DoublyLinkedList.remove。ノードが先頭、途中、末尾のどれかに応じて、前後のつなぎ先を変えて外す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/intrusive_linked_list.zig
lines: [94, 110]
function: DoublyLinkedList.remove
difficulty: 2
format: 2
tags: [データ構造, メモリ管理]
---

## ひとことで

`remove` は、双方向リスト（前と次の両方へたどれる連結リスト）から、指定したノード 1 つを取り外す関数です。
ノードは、リストの先頭、途中、末尾のどれかにあります。この関数は、その位置に応じて、前後のノードのつながりを正しく付け替えます。

リストの要素（ノード）の中に、前と次のポインタが入っている「侵入型」のリストです。そのため、ノードを取り外すだけで、メモリを確保し直す必要はありません。

## コード

::: code-group

```zig:line-numbers=94 [日本語訳]
        pub inline fn remove(list: *Self, node: *Node) void {
            if (node.prev) |prev_node| {
                // 途中のノード。
                prev_node.next = node.next;
            } else {
                // リストの先頭の要素。
                list.first = node.next;
            }

            if (node.next) |next_node| {
                // 途中のノード。
                next_node.prev = node.prev;
            } else {
                // リストの末尾の要素。
                list.last = node.prev;
            }
        }
```

```zig:line-numbers=94 [原文]
        pub inline fn remove(list: *Self, node: *Node) void {
            if (node.prev) |prev_node| {
                // Intermediate node.
                prev_node.next = node.next;
            } else {
                // First element of the list.
                list.first = node.next;
            }

            if (node.next) |next_node| {
                // Intermediate node.
                next_node.prev = node.prev;
            } else {
                // Last element of the list.
                list.last = node.prev;
            }
        }
```

:::
## 前提知識

- **連結リスト**: 要素（ノード）が、次の要素へのポインタで順につながったデータ構造です。
- **双方向リスト**: 各ノードが、前のノードと次のノードの両方へのポインタを持つリストです。
- **侵入型（intrusive）**: リストの管理情報（前後のポインタ）が、要素の構造体の中に直接入っている作りです。リストのために別の箱を作らずに済みます。
- **`?*Node`**: 値がないかもしれないポインタです。`null` のとき、そこが先頭や末尾であることを表します。
- **`if (node.prev) |prev_node| { ... } else { ... }`**: 値があるときだけ `prev_node` として使う書き方です。`else` は、値が `null` のときの処理です。
- **`list.first` と `list.last`**: リストの先頭と末尾を指す変数です。

## 何をしているか

### 1. 前のノードのつなぎを直す

```zig:line-numbers=95
            if (node.prev) |prev_node| {
                // Intermediate node.
                prev_node.next = node.next;
            } else {
                // First element of the list.
                list.first = node.next;
            }
```

外すノードに前のノードがあれば、その前のノードの `next` を、外すノードの次へつなぎ変えます。前のノードがない（`null`）なら、外すノードは先頭です。このとき、リストの `first` を、外すノードの次にします。

### 2. 次のノードのつなぎを直す

```zig:line-numbers=103
            if (node.next) |next_node| {
                // Intermediate node.
                next_node.prev = node.prev;
            } else {
                // Last element of the list.
                list.last = node.prev;
            }
```

同じように、後ろ側も直します。次のノードがあれば、その `prev` を外すノードの前へつなぎ変えます。次のノードがなければ、外すノードは末尾なので、リストの `last` を前のノードにします。

たとえば `A - B - C` のリストで `B` を外すと、`A.next` は `C` に、`C.prev` は `A` になります。`B` は、どこからもつながっていない状態になります。

## ここがすごい

- **場合分けは 2 回だけ**: 先頭か途中か末尾かを、前と次のそれぞれで 1 回ずつ判定します。全部で 4 通りの場合を、わずかな `if` で網羅しています。
- **位置を知らなくても外せる**: 外すノードの前後のポインタを持っているので、リストを先頭から探す必要がありません。外すノードさえ分かれば、O(1) の時間で済みます。
- **メモリの確保と解放をしない**: ノードはリストの外に出るだけで、中身は変わりません。ノードを再利用するなら、そのまま別のリストへ付け直せます。
- **`inline` で呼び出しを消す**: `pop` や `popFirst` は、この `remove` を呼んでいます。`inline` を付けてあるので、呼び出しのコストが小さくなります。

## まとめ

- 双方向リストの 1 つのノードを外すには、前と後ろのつなぎ先を直します。
- 前が無ければ先頭、後ろが無ければ末尾として、リスト全体の `first` か `last` を更新します。
- 侵入型のリストなら、ノードの位置だけで外せるので、探す手間もメモリの確保もありません。
- `pop` や `popFirst` は、この `remove` の上に作られています。
