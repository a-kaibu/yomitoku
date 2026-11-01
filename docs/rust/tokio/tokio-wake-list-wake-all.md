---
title: 集めた Waker を、パニックしても取りこぼさずに起こす
description: tokio の WakeList::wake_all。固定長の配列に溜めた Waker を、DropGuard に移してから順に起こす。起こす途中でパニックしても、残りの Waker を必ず破棄する。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/util/wake_list.rs
lines: [39, 73]
function: WakeList::wake_all
difficulty: 3
format: 2
tags: [並行処理, メモリ管理, 防御的プログラミング]
---

## ひとことで

`wake_all` は、溜めておいた **Waker**（タスクを起こすための道具）を、順番に起こす関数です。Waker は固定長の配列に入っていて、この関数はその全部を起こしたあと、配列を空にします。
工夫は、起こす途中で **パニックしても、残りの Waker を必ず破棄する** ことです。Waker を 1 つずつ配列から取り出し、その途中の状態を `DropGuard` という番人に持たせています。

## コード

::: code-group

```rust:line-numbers=39 [日本語訳]
    pub(crate) fn wake_all(&mut self) {
        struct DropGuard {
            start: *mut Waker,
            end: *mut Waker,
        }

        impl Drop for DropGuard {
            fn drop(&mut self) {
                // SAFETY: 2 つのポインタは同じオブジェクトの一部で、`start <= end` である。
                let len = unsafe { self.end.offset_from(self.start) } as usize;
                let slice = ptr::slice_from_raw_parts_mut(self.start, len);
                // SAFETY: `start..len` のすべての要素は初期化済みなので、破棄できる。
                unsafe { ptr::drop_in_place(slice) };
            }
        }

        debug_assert!(self.curr <= NUM_WAKERS);

        let mut guard = {
            let start = self.inner.as_mut_ptr().cast::<Waker>();
            // SAFETY: 結果のポインタは、同じオブジェクトの範囲内か、末尾の 1 つ後ろである。
            let end = unsafe { start.add(self.curr) };
            // `inner` の Waker の所有権を `DropGuard` に移す。
            self.curr = 0;
            DropGuard { start, end }
        };
        while !ptr::eq(guard.start, guard.end) {
            // SAFETY: `start != end` のとき、`start` は必ず初期化されている。
            let waker = unsafe { ptr::read(guard.start) };
            // SAFETY: 結果のポインタは、同じオブジェクトの範囲内か、末尾の 1 つ後ろである。
            guard.start = unsafe { guard.start.add(1) };
            // ここでパニックしても、`guard` が残りの Waker を片付ける。
            waker.wake();
        }
    }
```

```rust:line-numbers=39 [原文]
    pub(crate) fn wake_all(&mut self) {
        struct DropGuard {
            start: *mut Waker,
            end: *mut Waker,
        }

        impl Drop for DropGuard {
            fn drop(&mut self) {
                // SAFETY: Both pointers are part of the same object, with `start <= end`.
                let len = unsafe { self.end.offset_from(self.start) } as usize;
                let slice = ptr::slice_from_raw_parts_mut(self.start, len);
                // SAFETY: All elements in `start..len` are initialized, so we can drop them.
                unsafe { ptr::drop_in_place(slice) };
            }
        }

        debug_assert!(self.curr <= NUM_WAKERS);

        let mut guard = {
            let start = self.inner.as_mut_ptr().cast::<Waker>();
            // SAFETY: The resulting pointer is in bounds or one after the length of the same object.
            let end = unsafe { start.add(self.curr) };
            // Transfer ownership of the wakers in `inner` to `DropGuard`.
            self.curr = 0;
            DropGuard { start, end }
        };
        while !ptr::eq(guard.start, guard.end) {
            // SAFETY: `start` is always initialized if `start != end`.
            let waker = unsafe { ptr::read(guard.start) };
            // SAFETY: The resulting pointer is in bounds or one after the length of the same object.
            guard.start = unsafe { guard.start.add(1) };
            // If this panics, then `guard` will clean up the remaining wakers.
            waker.wake();
        }
    }
```

:::

`WakeList` は、最大 32 個の Waker を配列に持つ構造体です。`curr` は、先頭から何個が初期化済みかを表します。

## 前提知識

- **Waker**: 非同期処理で、止まっているタスクを「また進めてよい」と知らせる道具です。`wake()` を呼ぶと、そのタスクが実行キューに戻ります。
- **`MaybeUninit`**: まだ値が入っていない領域を表す型です。配列を最初に作るとき、中身を初期化せずに置けます。
- **`ptr::read`**: ポインタの指す値を、所有権ごと読み出します。読み出したあと、元の場所は使ってはいけません。
- **`ptr::drop_in_place`**: ポインタの指す値を、破棄します。残った要素を片付けるために使います。
- **`DropGuard`**: 値が破棄されるときに、自分の `drop` を実行する番人です。パニックで関数を抜けるときも、`drop` は必ず呼ばれます。

## 何をしているか

### 1. 所有権を DropGuard に移す

```rust:line-numbers=56

        let mut guard = {
            let start = self.inner.as_mut_ptr().cast::<Waker>();
            // SAFETY: The resulting pointer is in bounds or one after the length of the same object.
            let end = unsafe { start.add(self.curr) };
            // Transfer ownership of the wakers in `inner` to `DropGuard`.
            self.curr = 0;
            DropGuard { start, end }
        };
```

`start` と `end` で、初期化済みの範囲を表します。`curr` を 0 にしてから、この範囲の所有権を `DropGuard` に渡します。
こうすると、`WakeList` は空になり、残りの責任は `DropGuard` が持ちます。

### 2. 1 つずつ取り出して起こす

```rust:line-numbers=65
        while !ptr::eq(guard.start, guard.end) {
            // SAFETY: `start` is always initialized if `start != end`.
            let waker = unsafe { ptr::read(guard.start) };
            // SAFETY: The resulting pointer is in bounds or one after the length of the same object.
            guard.start = unsafe { guard.start.add(1) };
            // If this panics, then `guard` will clean up the remaining wakers.
            waker.wake();
        }
```

`start` が `end` になるまで、Waker を `ptr::read` で取り出し、`wake()` を呼びます。取り出すたびに `start` を 1 つ進めます。
`wake()` の途中でパニックしても、`start` は、まだ起こしていない最初の Waker を指しています。そのため、残りの範囲だけが `DropGuard` に破棄されます。

### 3. 残りを破棄する

```rust:line-numbers=45
        impl Drop for DropGuard {
            fn drop(&mut self) {
                // SAFETY: Both pointers are part of the same object, with `start <= end`.
                let len = unsafe { self.end.offset_from(self.start) } as usize;
                let slice = ptr::slice_from_raw_parts_mut(self.start, len);
                // SAFETY: All elements in `start..len` are initialized, so we can drop them.
                unsafe { ptr::drop_in_place(slice) };
            }
```

`DropGuard` の `drop` は、`start` から `end` までの残りの Waker を `drop_in_place` で破棄します。正常に終わったときは残りがないので、何もしません。

## ここがすごい

- **パニックしても漏れない**: 途中の Waker を 1 つも落とさずに破棄できます。一部だけ起こされて、残りが宙に浮く、という事故を防いでいます。
- **所有権の移し替えが明確**: `curr = 0` にしてから `DropGuard` に渡すことで、「この Waker は今から別の人の責任」と明確になります。二重に解放する危険がありません。
- **番人が後片付けを担当する**: 途中で抜けても、`drop` が必ず動きます。片付けの書き忘れが起きない仕組みです。
- **`SAFETY` コメントで約束を明示**: `unsafe` の箇所ごとに、どの条件を満たしているから安全か、が書かれています。読み手が検証できます。
- **配列をそのまま再利用できる**: 処理が終わると `curr` は 0 なので、同じ `WakeList` に次の Waker を溜められます。確保し直す必要がありません。

## まとめ

- 溜めた Waker は、所有権を番人に移してから、1 つずつ取り出して起こす。
- パニックで途中から抜けても、番人が残りを破棄するので、取りこぼしがない。
- `unsafe` の前提を `SAFETY` コメントで書き、配列は次の用途に再利用する。
