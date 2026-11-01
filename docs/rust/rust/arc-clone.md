---
title: Arc の複製は Relaxed で十分、ただし数えすぎたら即終了
description: Arc を複製するときの処理。参照カウントの加算は最も軽い Relaxed で行い、mem::forget の乱用によるカウントのあふれだけは即座にプロセスを止めて防ぐ。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/rcs/arc.rs
lines: [2514, 2549]
function: <Arc<T> as Clone>::clone
difficulty: 3
tags: [並行処理, 防御的プログラミング, メモリ管理, 標準ライブラリ]
---

## ひとことで

`Arc::clone` は、スレッド間で共有する `Arc` を **もう 1 個作る** 関数です。中身をコピーするのではなく、同じ値を指すポインタを増やし、参照カウントを 1 増やします。

この関数には 2 つの見どころがあります。1 つは、カウントを増やすときに **いちばん軽い同期（`Relaxed`）で済ませている** こと。もう 1 つは、現実にはまず起きない **カウントのあふれ（オーバーフロー）にも備えている** ことです。

## コード

```rust:line-numbers=2514
    fn clone(&self) -> Arc<T, A> {
        // Using a relaxed ordering is alright here, as knowledge of the
        // original reference prevents other threads from erroneously deleting
        // the object.
        //
        // As explained in the [Boost documentation][1], Increasing the
        // reference counter can always be done with memory_order_relaxed: New
        // references to an object can only be formed from an existing
        // reference, and passing an existing reference from one thread to
        // another must already provide any required synchronization.
        //
        // [1]: (www.boost.org/doc/libs/1_55_0/doc/html/atomic/usage_examples.html)
        let old_size = self.inner().strong.fetch_add(1, Relaxed);

        // However we need to guard against massive refcounts in case someone is `mem::forget`ing
        // Arcs. If we don't do this the count can overflow and users will use-after free. This
        // branch will never be taken in any realistic program. We abort because such a program is
        // incredibly degenerate, and we don't care to support it.
        //
        // This check is not 100% water-proof: we error when the refcount grows beyond `isize::MAX`.
        // But we do that check *after* having done the increment, so there is a chance here that
        // the worst already happened and we actually do overflow the `usize` counter. However, that
        // requires the counter to grow from `isize::MAX` to `usize::MAX` between the increment
        // above and the `abort` below, which seems exceedingly unlikely.
        //
        // This is a global invariant, and also applies when using a compare-exchange loop to increment
        // counters in other methods.
        // Otherwise, the counter could be brought to an almost-overflow using a compare-exchange loop,
        // and then overflow using a few `fetch_add`s.
        if old_size > MAX_REFCOUNT {
            intrinsics::abort_immediate();
        }

        // SAFETY: Pointer is valid & allocator corresponds to the one used to allocate it.
        unsafe { Self::from_inner_in(self.ptr, self.alloc.clone()) }
    }
```

## 前提知識

- **`Clone` トレイト**: `x.clone()` で値を複製できるようにする仕組みです。`Arc` の場合は「同じデータを指す新しい `Arc`」を作ります。
- **`fetch_add(1, Relaxed)`**: アトミック（複数スレッドから同時に呼んでも壊れない）に 1 を足し、足す前の値を返します。`Relaxed` は「この操作自体は壊れないが、前後の操作の順序は何も保証しない」という最も軽い指定です。
- **`MAX_REFCOUNT`**: このファイルの冒頭で `isize::MAX`（64 ビットなら約 922 京）と定義されている上限値です。
- **`mem::forget`**: 値を「破棄しなかったこと」にする関数です。`Arc` を forget すると、カウントが減らないまま `Arc` が消えます。安全な関数ですが、メモリリークを起こします。
- **`abort_immediate`**: プロセスを即座に終了させます。パニック（巻き戻しながら後片付けをする仕組み）とは違い、後片付けを一切しません。

## 何をしているか

### 1. カウントを増やす（2526 行目）

`strong.fetch_add(1, Relaxed)` で参照カウントを 1 増やします。

`Relaxed` で十分な理由は 2515〜2525 行目のコメントにあります。新しい `Arc` は **既存の `Arc` からしか作れません**。`clone` を呼んでいる時点で、呼び出し元は有効な `Arc` を持っているので、カウントが 0 になって中身が解放されることはありません。また、作った `Arc` を別のスレッドに渡すときには、渡す操作（チャネルなど）がすでに必要な同期をしてくれます。

### 2. あふれを防ぐ（2543〜2545 行目）

`mem::forget` で `Arc` を大量に捨てると、カウントは増える一方になります。もしカウントが一周して 0 に戻れば、まだ使っている中身が解放され、解放済みメモリの使用（use-after-free）という深刻なバグになります。

そこで、増やす前の値が `isize::MAX` を超えていたら即座に `abort` します。`usize::MAX` ではなく、その半分の `isize::MAX` を上限にしているのがポイントです。

### 3. 新しい `Arc` を作る（2548 行目）

同じポインタとアロケータ（メモリの確保役）の複製から、新しい `Arc` を組み立てて返します。

## ここがすごい

- **同期のコストを最小に**: `clone` は非常に頻繁に呼ばれます。「既存の参照があるから安全」という論理に基づいて `Relaxed` を選ぶことで、重い同期命令を避けています。
- **余裕を持った上限**: チェックは加算の **後** にしか行えないので、チェックの前に他のスレッドがさらに足す可能性があります。上限を `usize::MAX` の半分にしておけば、`isize::MAX` から `usize::MAX` まで、さらに約 922 京回足されない限り一周しません。2533〜2537 行目で、この「完全ではないが現実的に十分」な理由を説明しています。
- **パニックではなく abort**: これほど異常な状況では、後片付けのコードを走らせること自体が危険です。即座に止めるのが最も安全です。
- **ほぼ起きない分岐は予測でタダ同然**: この `if` はまず真になりません。CPU の分岐予測は必ず当たるので、安全のためのチェックが性能にほとんど影響しません。

## まとめ

- 参照カウントの「増加」は、既存の参照があるので `Relaxed` で十分。
- 安全な API の組み合わせ（`mem::forget`）でもカウントはあふれうる。現実的でなくても防ぐ。
- 事後チェックしかできないときは、上限に大きな余裕を持たせる。
- 回復不能な状態ではパニックより abort のほうが安全なことがある。
