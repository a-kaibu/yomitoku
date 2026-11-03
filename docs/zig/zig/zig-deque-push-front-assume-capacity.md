---
title: 円形の配列の先頭の手前に、空きを作って値を入れる
description: Zig の std.Deque の pushFrontAssumeCapacity。先頭の位置を 1 つ前へ戻し、そこに値を書き込む。空きがあることが前提の、確保なしの追加。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/deque.zig
lines: [136, 144]
function: Deque.pushFrontAssumeCapacity
difficulty: 2
format: 2
tags: [データ構造, メモリ管理]
---

## ひとことで

`pushFrontAssumeCapacity` は、両端キューの先頭に値を 1 つ追加する関数です。「空きがあるはずだ」と前提にして、メモリの確保を行いません。
先頭の位置を 1 つ前へ戻し、そこに値を書き込みます。配列の先頭より前に出るときは、配列の末尾側へ回り込みます。

関数の名前の「AssumeCapacity」は、呼び出す前に空きを確保しておく必要があることを示しています。

## コード

```zig:line-numbers=136
        pub fn pushFrontAssumeCapacity(deque: *Self, item: T) void {
            assert(deque.len < deque.buffer.len);
            if (deque.head == 0) {
                deque.head = deque.buffer.len;
            }
            deque.head -= 1;
            deque.buffer[deque.head] = item;
            deque.len += 1;
        }
```
## 前提知識

- **両端キュー（Deque）**: 先頭と末尾のどちらからでも、要素を追加できるデータ構造です。
- **`head`**: 先頭の要素の位置です。前へ追加するときは、この位置を 1 つ手前へずらします。
- **`buffer`**: 要素を入れておく配列です。長さは決まっています。
- **`assert(...)`**: 条件が成り立つことを確かめる文です。成り立たなければ、プログラムを止めます。
- **「AssumeCapacity」という名前**: 空きがあることを呼び出し側が保証する、という意味の慣用的な名前です。Zig の標準ライブラリでは、この接尾辞の関数が多く使われています。
- **`deque.len`**: 今入っている要素の数です。

## 何をしているか

### 1. 空きがあることを確かめる

```zig:line-numbers=137
            assert(deque.len < deque.buffer.len);
```

要素の数が配列の大きさより小さいこと、つまり空きがあることを確かめます。空きがなければ、プログラムを止めます。このため、`pushFront` のように確保をする関数の後ろで使うのが普通です。

### 2. 先頭が 0 なら、配列の末尾に回り込む

```zig:line-numbers=138
            if (deque.head == 0) {
                deque.head = deque.buffer.len;
            }
```

`head` が 0 のときは、先頭より前に位置がありません。そこで、`head` を配列の長さに合わせます。配列の末尾の外側から、1 つ手前に進むための準備です。

### 3. 先頭を 1 つ前へ戻して、値を書く

```zig:line-numbers=141
            deque.head -= 1;
            deque.buffer[deque.head] = item;
            deque.len += 1;
```

`head` を 1 つ減らし、その位置に値を書き込みます。要素の数を 1 増やして終わりです。

たとえば配列の長さが 8 で `head = 0` のとき、先頭に追加すると、`head` は 8 になり、そこから 1 減らして 7 の位置に書きます。配列の末尾側が、新しい先頭になります。

## ここがすごい

- **値の移動がない**: 先頭に追加するとき、既存の要素を後ろへずらす必要がありません。`head` を戻して、空いている位置に書くだけです。
- **確保を分けている**: 確保が必要かどうかを、呼び出し側が判断できます。`pushFront` は、必要なときだけ確保してから、この関数を呼びます。
- **空きを assert で確かめる**: 前提が崩れたときに、黙って既存の要素を上書きしないように、プログラムを止めます。
- **0 の場合の特別扱い**: 先頭が 0 のとき、`head` を末尾側に寄せて引き算を安全にしています。符号なし整数で負にならないための、小さな工夫です。

## まとめ

- 両端キューの先頭への追加は、先頭の位置を 1 つ戻して、そこに書くことで行えます。
- 空きがあることを前提にした関数なので、確保は呼び出し側で行います。
- 先頭が配列の先頭にあるときは、末尾側へ回り込ませてから引きます。
- 既存の要素を動かさないので、追加は一定の時間で終わります。
