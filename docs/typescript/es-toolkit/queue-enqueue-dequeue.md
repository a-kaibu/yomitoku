---
title: "先頭と末尾を覚えた連結リストで O(1) のキュー"
description: "先に入れたものから取り出すキューを、配列ではなく連結リストで実装。先頭と末尾の両方を持つことで、追加も取り出しも常に一定時間で終わる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/util/queue.ts
lines: [61, 101]
function: "Queue#enqueue / Queue#dequeue"
difficulty: 2
tags: [データ構造, 最適化, アルゴリズム]
---

## ひとことで

`Queue` は、**先に入れたものから順に取り出す**（先入れ先出し）データ構造です。`enqueue` で末尾に追加し、`dequeue` で先頭から取り出します。

JavaScript の配列でも `push` と `shift` で同じことができますが、`shift` は要素が多いと遅くなります。この実装は **連結リスト**（要素を矢印でつないでいくデータ構造）を使い、どれだけ要素があっても追加も取り出しも一瞬で終わるようにしています。

## コード

```ts:line-numbers=61
  enqueue(value: T): void {
    const node: QueueNode<T> = { v: value, n: null };

    if (this.#tail === null) {
      this.#head = node;
    } else {
      this.#tail.n = node;
    }

    this.#tail = node;
    this.#size++;
  }

  /**
   * Removes and returns the item at the front of the queue.
   *
   * @returns The removed item, or `undefined` if the queue is empty.
   *
   * @example
   * const queue = new Queue<number>();
   * queue.enqueue(1);
   * console.log(queue.dequeue()); // 1
   * console.log(queue.dequeue()); // undefined
   */
  dequeue(): T | undefined {
    const node = this.#head;

    if (node === null) {
      return undefined;
    }

    this.#head = node.n;

    if (this.#head === null) {
      this.#tail = null;
    }

    this.#size--;

    return node.v;
  }
```

ノードは `{ v: 値, n: 次のノード }` という小さなオブジェクトで、ファイルの先頭で定義されています。

## 前提知識

- **連結リスト**: 各要素（ノード）が「値」と「次のノードへの参照」を持ち、数珠つなぎになったデータ構造です。
- **`#head`、`#tail`**: 名前の先頭の `#` は、クラスの外から絶対に触れない **プライベートフィールド** を表す JavaScript の機能です。ここでは先頭と末尾のノードを覚えています。
- **`QueueNode<T> | null`**: ノードか、何もない（`null`）かのどちらかという型です。
- **`T | undefined`**: 空のキューから取り出したときは `undefined` を返すことを表しています。
- **O(1)**: 処理にかかる時間が、データの量に関係なく一定であることを表す書き方です。O(n) ならデータの量に比例して時間がかかります。

## 何をしているか

### enqueue: 末尾に追加（61〜72 行目）

新しいノードを作り、キューが空なら先頭にします（64〜65 行目）。そうでなければ、今の末尾のノードの「次」を新しいノードにします（66〜67 行目）。最後に、末尾を新しいノードに更新します。

### dequeue: 先頭から取り出す（85〜101 行目）

先頭がなければ `undefined` を返します（88〜90 行目）。あれば、先頭を「次のノード」に進め（92 行目）、その結果キューが空になったら末尾も `null` にします（94〜96 行目）。

```
enqueue(1), enqueue(2):  head → [1] → [2] ← tail
dequeue() → 1:           head → [2] ← tail
dequeue() → 2:           head = tail = null
```

## ここがすごい

- **配列の `shift` の遅さを避ける**: 配列の `shift` は、先頭を取り除いたあと残りの要素を 1 つずつ前にずらすため、要素数に比例した時間がかかることがあります。セマフォの待ち行列のように大量の要素を順番に取り出すと、全体の時間が要素数の 2 乗で増えてしまいます。連結リストなら、先頭の参照を 1 つ進めるだけです。
- **末尾も覚えておく**: 先頭だけでは、末尾に追加するために毎回最後までたどる必要があります。`#tail` を持つことで、追加も一定時間になります。そのぶん、空になったときに `#tail` も忘れずに `null` に戻しています（94〜96 行目）。
- **フィールド名を 1 文字に**: 1 行目のコメントにあるとおり、コードを小さくするツール（ミニファイア）は変数名は短くしてくれますが、オブジェクトのプロパティ名は変えてくれません。`value` や `next` ではなく `v` と `n` にすることで、配布されるコードを小さくしています。

## まとめ

- 先頭から大量に取り出すなら、配列の `shift` より連結リストのキューが速い。
- 先頭と末尾の両方を覚えておくと、追加も取り出しも O(1) になる。
- 配布サイズを気にするライブラリでは、プロパティ名の長さまで工夫することがある。
