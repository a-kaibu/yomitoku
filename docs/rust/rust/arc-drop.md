---
title: 共有ポインタ Arc の後片付けと、最後の 1 人だけが打つ「フェンス」
description: スレッド間で共有するスマートポインタ Arc が破棄されるときの処理。参照カウントを Release で減らし、最後の 1 つのときだけ Acquire フェンスを置いて中身を解放する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/rcs/arc.rs
lines: [2981, 3032]
function: <Arc<T> as Drop>::drop
difficulty: 3
tags: [並行処理, メモリ管理, ロック不要, 標準ライブラリ]
---

## ひとことで

`Arc`（Atomically Reference Counted）は、複数のスレッドで 1 つの値を共有するためのスマートポインタです。「いま何個の `Arc` がこの値を指しているか」を参照カウントで数え、**最後の 1 個が破棄されたときに中身を解放** します。

この `drop` は、`Arc` が 1 個破棄されるたびに呼ばれる関数です。たった数行ですが、**メモリオーダリング**（スレッド間でメモリ操作の順序をどう保証するか）の教科書のような設計になっています。

## コード

```rust:line-numbers=2981
    #[inline]
    fn drop(&mut self) {
        // Because `fetch_sub` is already atomic, we do not need to synchronize
        // with other threads unless we are going to delete the object. This
        // same logic applies to the below `fetch_sub` to the `weak` count.
        if self.inner().strong.fetch_sub(1, Release) != 1 {
            return;
        }

        // This fence is needed to prevent reordering of use of the data and
        // deletion of the data. Because it is marked `Release`, the decreasing
        // of the reference count synchronizes with this `Acquire` fence. This
        // means that use of the data happens before decreasing the reference
        // count, which happens before this fence, which happens before the
        // deletion of the data.
        //
        // As explained in the [Boost documentation][1],
        //
        // > It is important to enforce any possible access to the object in one
        // > thread (through an existing reference) to *happen before* deleting
        // > the object in a different thread. This is achieved by a "release"
        // > operation after dropping a reference (any access to the object
        // > through this reference must obviously happened before), and an
        // > "acquire" operation before deleting the object.
        //
        // In particular, while the contents of an Arc are usually immutable, it's
        // possible to have interior writes to something like a Mutex<T>. Since a
        // Mutex is not acquired when it is deleted, we can't rely on its
        // synchronization logic to make writes in thread A visible to a destructor
        // running in thread B.
        //
        // Also note that the Acquire fence here could probably be replaced with an
        // Acquire load, which could improve performance in highly-contended
        // situations. See [2].
        //
        // [1]: (www.boost.org/doc/libs/1_55_0/doc/html/atomic/usage_examples.html)
        // [2]: (https://github.com/rust-lang/rust/pull/41714)
        acquire!(self.inner().strong);

        // Make sure we aren't trying to "drop" the shared static for empty slices
        // used by Default::default.
        debug_assert!(
            !ptr::addr_eq(self.ptr.as_ptr(), &STATIC_INNER_SLICE.inner),
            "Arcs backed by a static should never reach a strong count of 0. \
            Likely decrement_strong_count or from_raw were called too many times.",
        );

        // ignore-tidy-undocumented-unsafe
        unsafe {
            self.drop_slow();
        }
    }
```

## 前提知識

- **`Drop` トレイトと `drop`**: Rust では値がスコープを抜けると自動で `drop` が呼ばれます。C++ のデストラクタに相当します。
- **アトミック操作 `fetch_sub`**: 複数スレッドから同時に呼んでも壊れない「読み出して引いて書き戻す」操作です。戻り値は **引く前の値** です。
- **メモリオーダリング（`Release` / `Acquire` / `Relaxed`）**: CPU やコンパイラは高速化のためにメモリ操作の順序を入れ替えることがあります。`Release` は「これより前の操作が、この操作より後に回されない」、`Acquire` は「これより後の操作が、この操作より前に回されない」という約束です。`Release` で書いた値を `Acquire` で読むと、書いた側の「それ以前の操作」がすべて読んだ側から見えるようになります。
- **フェンス**: 特定の変数に結びつかない「順序の壁」です。`acquire!` マクロはこのファイルで `atomic::fence(Acquire)` と定義されています。
- **`unsafe` と `drop_slow`**: `drop_slow` は中身を実際に解放する関数です。

## 何をしているか

### 1. カウントを 1 減らす（2986〜2988 行目）

`strong.fetch_sub(1, Release)` で参照カウントを 1 減らします。引く前の値が 1 でなければ、まだ他の `Arc` が残っているので何もせず帰ります。
カウントが 3 なら、1 つ目と 2 つ目の `drop` はここで終わり、3 つ目（引く前が 1）だけが先へ進みます。

### 2. 最後の 1 人だけフェンスを置く（3018 行目）

最後の `Arc` を破棄するスレッドだけが `Acquire` フェンスを実行します。

なぜ必要かを、スレッド A と B で考えます。A が `Arc` 経由で中身（たとえば `Mutex` の中の値）に書き込んでから自分の `Arc` を破棄し、そのあと B が最後の `Arc` を破棄して中身を解放するとします。
A の書き込みは `Release` の `fetch_sub` より前に完了します。B は `Acquire` フェンスを通るので、A の書き込みがすべて終わってから解放に進みます。これがないと、**A がまだ使っているメモリを B が解放してしまう** 可能性があります。

### 3. 解放する（3022〜3031 行目）

静的領域に置かれた特別な `Arc` を誤って解放しようとしていないかをデバッグ時だけ確認し、`drop_slow` で中身と（弱参照がなければ）メモリを解放します。

## ここがすごい

- **必要な人だけが高いコストを払う**: すべての `fetch_sub` を `AcqRel`（両方の性質を持つ重い順序）にしても正しく動きます。しかし実際に同期が必要なのは「解放するスレッド」だけです。そこで減算は軽い `Release` にし、最後の 1 人だけがフェンスで `Acquire` を追加します。何千回と呼ばれる `drop` の大半が速くなります。
- **理由を出典付きで説明**: 2990〜3017 行目のコメントは、Boost のドキュメントを引用しながら「データの使用 → カウントの減算 → フェンス → 削除」という順序の連鎖を説明しています。`Mutex` のような内部可変性がある場合にも必要だという具体例まで挙げています。
- **改善の余地まで書いてある**: 「フェンスは `Acquire` の load に置き換えられるかもしれない」と、関連する議論へのリンクとともに残しています。
- **共通の実装パターン**: C++ の `std::shared_ptr` など、多くの参照カウント実装が同じ「Release で減らし、0 になったら Acquire」の形をとっています。

## まとめ

- 参照カウントは「最後の 1 人が片付ける」方式で共有データを解放する。
- 減算は `Release`、解放前に `Acquire` を置くことで、他スレッドの使用が終わってから解放できる。
- 同期のコストは、本当に必要な経路だけで払えばよい。
- メモリオーダリングの判断理由は、コメントにきちんと書き残す。
