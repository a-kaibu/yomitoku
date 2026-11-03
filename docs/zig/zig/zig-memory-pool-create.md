---
title: 解放されたメモリを再利用する、同じ大きさの物だけを扱う確保
description: Zig の std.heap.MemoryPool の create。解放済みのメモリを連結リストで覚えておき、同じ型の値を素早く確保する。足りないときだけ新しく確保する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/heap/memory_pool.zig
lines: [130, 140]
function: Pool.create
difficulty: 3
format: 2
tags: [メモリ管理, データ構造, 最適化]
---

## ひとことで

`create` は、メモリプールから同じ型の値の領域を 1 つ取り出す関数です。プールは、使い終わったメモリを捨てずに覚えておく仕組みです。
まず解放済みの領域（フリーリスト）から 1 つ取り出し、無ければ新しく確保します。

小さい同じ大きさのオブジェクトを何度も作って壊すような場面で、メモリ確保の手間を減らせます。

## コード

```zig:line-numbers=130
        pub fn create(pool: *Pool, allocator: Allocator) Allocator.Error!ItemPtr {
            const ptr: ItemPtr = if (pool.free_list.popFirst()) |node|
                @ptrCast(@alignCast(node))
            else if (pool_options.growable)
                @ptrCast(try pool.allocNew(allocator))
            else
                return error.OutOfMemory;

            ptr.* = undefined;
            return ptr;
        }
```
## 前提知識

- **メモリプール**: 同じ大きさのメモリを、まとめて確保して使い回す仕組みです。`malloc` や `alloc` を毎回呼ぶより速くなることが多いです。
- **フリーリスト（free list）**: 解放された領域を、連結リストでつないで覚えておく場所です。先頭から取り出し、先頭へ戻すので、とても速く操作できます。
- **`Allocator.Error!ItemPtr`**: 確保が失敗したら `error.OutOfMemory` を返すことを示す戻り値の型です。
- **`popFirst()` と `prepend()`**: リストの先頭から 1 つ取り出す操作と、先頭へ追加する操作です。
- **`if (...) |node| ... else ...`**: 値があるときだけ `node` として使う、オプショナル（値がないかもしれない型）の書き方です。
- **`pool_options.growable`**: プールが、足りなくなったときに自分で領域を増やせるかどうかを決める設定です。
- **`undefined`**: 値が未定義であることを示す特別な値です。中身を読むことを禁止する意味があります。

## 何をしているか

### 1. 解放済みの領域があれば、それを使う

```zig:line-numbers=131
            const ptr: ItemPtr = if (pool.free_list.popFirst()) |node|
                @ptrCast(@alignCast(node))
```

フリーリストの先頭から領域を 1 つ取り出します。取り出せれば、その領域のポインタを `ItemPtr` として使います。新しく確保するより、ずっと速い操作です。

`@alignCast` は、領域の位置が必要な整列（アライメント）を満たしていることを確かめる変換です。

### 2. 無ければ、増やせる設定なら新しく確保する

```zig:line-numbers=133
            else if (pool_options.growable)
                @ptrCast(try pool.allocNew(allocator))
```

フリーリストが空で、プールが増やせる設定なら、`allocNew` で新しい領域を確保します。`try` を付けているので、確保に失敗すればそのエラーをすぐ返します。

### 3. 増やせない設定なら、エラーを返す

```zig:line-numbers=135
            else
                return error.OutOfMemory;
```

増やせない設定で、解放済みの領域も無ければ、`error.OutOfMemory` を返します。プールの大きさを前もって決めておきたいときに使える設定です。

### 4. 取り出した領域を未定義にする

```zig:line-numbers=138
            ptr.* = undefined;
            return ptr;
```

返す領域の中身は、前の値が残っているので、`undefined` に設定します。呼び出し側は、値を書いてから読む必要があります。読むと安全モードで検出されます。

## ここがすごい

- **取り出しは一瞬**: フリーリストの先頭から取り出すだけなので、標準のアロケータを呼ぶより速いです。解放時も、先頭に戻すだけで済みます（`destroy`）。
- **メモリが断片化しにくい**: 同じ大きさの領域だけを扱うので、大小さまざまな領域が散らばる問題が起きにくいです。
- **増やすかどうかを設定で決める**: `growable` によって、上限の決まったプールと、伸びるプールを同じコードで作れます。
- **未定義を明示する**: 前の中身を `undefined` にすることで、初期化せずに読んだ誤りを安全モードで見つけられます。

## まとめ

- メモリプールは、同じ大きさの領域を再利用して、確保の手間を減らします。
- 解放済みの領域はフリーリストで覚えておき、まずそこから取り出します。
- 無ければ、設定に応じて新しく確保するか、`OutOfMemory` のエラーを返します。
- 取り出した領域は `undefined` にして、初期化の漏れを検出しやすくします。
