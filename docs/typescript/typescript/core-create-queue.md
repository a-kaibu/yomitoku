---
title: "shift を使わず、先頭の位置を進めるだけの配列キュー"
description: "先入れ先出しのキューを、配列と先頭位置の数字だけで実装。取り出した場所は空けておき、空きが半分を超えたらまとめて前に詰めることで、取り出しを平均して一定時間にしている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1569, 1608]
function: "createQueue"
difficulty: 2
tags: [データ構造, 最適化, メモリ管理]
---

## ひとことで

`createQueue` は、**先に入れたものから取り出す**（先入れ先出し）キューを作ります。

配列の `shift`（先頭の削除）は、残りの要素をすべて前にずらすので、要素が多いと遅くなります。この実装は `shift` を使わず、**「今の先頭はどこか」を数字で覚えておき、取り出すたびにその数字を進めるだけ** にしています。そして、前のほうの空きが増えすぎたら、まとめて詰め直します。

## コード

```ts:line-numbers=1569
export function createQueue<T>(items?: readonly T[]): Queue<T> {
    const elements: (T | undefined)[] = items?.slice() ?? [];
    let headIndex = 0;

    function isEmpty() {
        return headIndex === elements.length;
    }

    function enqueue(...items: T[]) {
        elements.push(...items);
    }

    function dequeue(): T {
        if (isEmpty()) {
            throw new Error("Queue is empty");
        }

        const result = elements[headIndex] as T;
        elements[headIndex] = undefined; // Don't keep referencing dequeued item
        headIndex++;

        // If more than half of the queue is empty, copy the remaining elements to the
        // front and shrink the array (unless we'd be saving fewer than 100 slots)
        if (headIndex > 100 && headIndex > (elements.length >> 1)) {
            const newLength = elements.length - headIndex;
            elements.copyWithin(/*target*/ 0, /*start*/ headIndex);

            elements.length = newLength;
            headIndex = 0;
        }

        return result;
    }

    return {
        enqueue,
        dequeue,
        isEmpty,
    };
}
```

## 前提知識

- **クロージャ**: 関数の中で作った関数は、外側の変数（ここでは `elements` と `headIndex`）を覚えていて、あとから読み書きできます。このキューはクラスではなく、クロージャで状態を隠しています。
- **`items?.slice() ?? []`**: 初期の要素が渡されていればそのコピー、なければ空の配列を使います。
- **`...items`**: 残り引数とスプレッド構文です。`enqueue(a, b, c)` のように何個でも渡せて、`push(...items)` で全部を追加します。
- **`copyWithin(target, start)`**: 配列の中で、`start` 以降の要素を `target` の位置にコピーします。配列の中身を前にずらすのに使えます。
- **`>> 1`**: 2 で割って切り捨てるのと同じです。

## 何をしているか

### 取り出し（1581〜1601 行目）

1. 空ならエラー（1582〜1584 行目）。
2. 先頭の位置の値を取り出し、その場所を `undefined` にして、先頭の位置を 1 進めます（1586〜1588 行目）。
3. **先頭の位置が 100 を超え、かつ配列の半分を超えていたら**、残りの要素を前に詰めて、配列を縮めます（1592〜1598 行目）。

```
elements: [a, b, c, d]  headIndex: 0
dequeue → a  elements: [_, b, c, d]  headIndex: 1
dequeue → b  elements: [_, _, c, d]  headIndex: 2
...（空きが 100 を超え、かつ半分を超えたら）
copyWithin で [c, d, …] に詰め直し、headIndex = 0
```

## ここがすごい

- **取り出しはほぼいつも O(1)**: ふだんは位置の数字を進めるだけです。詰め直しは時々起きるだけなので、全体を平均すると、1 回の取り出しにかかる時間は要素数に関係なく一定になります（「償却 O(1)」と呼ばれます）。
- **詰め直しの条件が絶妙**: 「半分を超えたら」という条件なので、詰め直しのコピーの量は、それまでに取り出した数より必ず少なくなります。また「100 を超えたら」という条件で、小さなキューで頻繁に詰め直す無駄を避けています。
- **取り出した場所を `undefined` に**: 1587 行目のコメントのとおり、取り出したあとも配列が値を参照し続けると、そのオブジェクトがメモリから解放されません（ガベージコレクションの対象にならない）。明示的に消すことで、メモリリークを防いでいます。
- **配列のまま**: 連結リストと違ってノードのオブジェクトを作らないので、メモリの使い方がコンパクトです。

## まとめ

- `shift` の代わりに「先頭の位置」を進めると、キューの取り出しが速くなる。
- 空きがたまったら、まとめて詰め直すと平均して一定時間になる。
- 使い終わった参照は消しておかないと、メモリが解放されない。
