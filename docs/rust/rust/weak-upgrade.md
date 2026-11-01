---
title: 弱参照を強参照に戻すときは「0 から 1」だけは絶対に許さない
description: 弱参照 Weak から Arc を取り戻す関数。強参照カウントを fetch_add ではなく CAS ループで増やし、すでに 0（解放済み）なら増やさずに None を返す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/rcs/arc.rs
lines: [3434, 3466]
function: Weak::upgrade
difficulty: 3
format: 2
tags: [並行処理, ロック不要, メモリ管理, 標準ライブラリ]
---

## ひとことで

`Weak::upgrade` は、弱参照 `Weak` から **強参照 `Arc` を取り戻す** 関数です。中身がまだ生きていれば `Some(Arc)` を、すでに解放されていれば `None` を返します。

ポイントは、強参照カウントを増やす方法です。`Arc::clone` は単純に `fetch_add`（無条件に 1 足す）を使いますが、この関数は **「0 でなければ 1 足す」を CAS ループで行います**。カウントが 0 から 1 に戻ることは、絶対に許されないからです。

## コード

::: code-group

```rust:line-numbers=3434 [日本語訳]
    #[stable(feature = "arc_weak", since = "1.4.0")]
    pub fn upgrade(&self) -> Option<Arc<T, A>>
    where
        A: AllocatorClone,
    {
        #[inline]
        fn checked_increment(n: usize) -> Option<usize> {
            // 0 が一度でも観測されたら、そのフィールドは永久に 0 のまま。
            if n == 0 {
                return None;
            }
            // なぜこうするかは `Arc::clone` のコメントを参照（`mem::forget` 対策）。
            if n > MAX_REFCOUNT {
                panic_arc_overflow();
            }
            Some(n + 1)
        }

        // 強参照カウントを増やすのに fetch_add ではなく CAS ループを使う。
        // この関数はカウントを 0 から 1 に戻してはいけないため。
        //
        //
        // 失敗時は新しい状態について何も期待しないので Relaxed で十分。
        // 成功時は、中身が後から初期化される `Arc::new_cyclic` と同期するため Acquire が必要。
        // Weak が作られたあとに中身が初期化されることがあり、その場合は
        // 初期化済みの値を見ることを期待する。
        if self.inner()?.strong.try_update(Acquire, Relaxed, checked_increment).is_ok() {
            // SAFETY: ポインタは null でない（checked_increment で確認済み）
            unsafe { Some(Arc::from_inner_in(self.ptr, self.alloc.clone())) }
        } else {
            None
        }
    }
```

```rust:line-numbers=3434 [原文]
    #[stable(feature = "arc_weak", since = "1.4.0")]
    pub fn upgrade(&self) -> Option<Arc<T, A>>
    where
        A: AllocatorClone,
    {
        #[inline]
        fn checked_increment(n: usize) -> Option<usize> {
            // Any write of 0 we can observe leaves the field in permanently zero state.
            if n == 0 {
                return None;
            }
            // See comments in `Arc::clone` for why we do this (for `mem::forget`).
            if n > MAX_REFCOUNT {
                panic_arc_overflow();
            }
            Some(n + 1)
        }

        // We use a CAS loop to increment the strong count instead of a
        // fetch_add as this function should never take the reference count
        // from zero to one.
        //
        // Relaxed is fine for the failure case because we don't have any expectations about the new state.
        // Acquire is necessary for the success case to synchronise with `Arc::new_cyclic`, when the inner
        // value can be initialized after `Weak` references have already been created. In that case, we
        // expect to observe the fully initialized value.
        if self.inner()?.strong.try_update(Acquire, Relaxed, checked_increment).is_ok() {
            // SAFETY: pointer is not null, verified in checked_increment
            unsafe { Some(Arc::from_inner_in(self.ptr, self.alloc.clone())) }
        } else {
            None
        }
    }
```

:::

## 前提知識

- **`Arc` と `Weak`**: `Arc` は中身を生かし続ける強参照、`Weak` は中身を生かし続けない弱参照です。強参照の数が 0 になると中身は破棄されますが、`Weak` は残り続けられます。キャッシュや、親子が互いを指すデータ構造で循環参照を避けるために使います。
- **`Option<T>` と `?`**: `Option` は `Some(値)` か `None` の型です。`self.inner()?` は、`inner()` が `None` ならその場で `None` を返して関数を抜けます（`Weak::new()` で作った、何も指していない `Weak` の場合です）。
- **CAS（compare-and-swap）**: 「今の値が予想どおりなら書き換える」をアトミックに行う操作です。失敗したら最新の値でもう一度試す、というループで使います。
- **`try_update(成功時の順序, 失敗時の順序, 関数)`**: アトミック変数の値を関数で更新する CAS ループを内部で回すメソッドです。関数が `None` を返したら更新をあきらめて `Err` を返します。
- **関数内の関数**: `checked_increment` は `upgrade` の中だけで使う補助関数です。

## 何をしているか

### 1. 増やしてよいかを判定する関数

```rust:line-numbers=3440
        fn checked_increment(n: usize) -> Option<usize> {
            // Any write of 0 we can observe leaves the field in permanently zero state.
            if n == 0 {
                return None;
            }
            // See comments in `Arc::clone` for why we do this (for `mem::forget`).
            if n > MAX_REFCOUNT {
                panic_arc_overflow();
            }
            Some(n + 1)
        }
```


`checked_increment(n)` は、現在のカウント `n` を受け取って、

- `n == 0` なら `None`（すでに解放されている、または解放中）
- `n` が上限 `MAX_REFCOUNT` を超えていたらパニック（`Arc::clone` と同じあふれ対策）
- それ以外なら `Some(n + 1)`

を返します。

### 2. CAS ループで増やす

```rust:line-numbers=3460
        if self.inner()?.strong.try_update(Acquire, Relaxed, checked_increment).is_ok() {
```


`try_update` は、「`strong` を読む → `checked_increment` で新しい値を計算 → 値が変わっていなければ書き込む、変わっていたらやり直す」を繰り返します。
たとえばスレッド A が `upgrade` を、スレッド B が最後の `Arc` の `drop` を同時に呼んだとします。

- B が先に `strong` を 1 → 0 にした場合: A の CAS は失敗し、読み直すと 0 なので `None` を返します。
- A が先に 1 → 2 にした場合: B の減算は 2 → 1 になり、中身は解放されません。

どちらでも矛盾は起きません。

### 3. `Arc` を作る

```rust:line-numbers=3462
            unsafe { Some(Arc::from_inner_in(self.ptr, self.alloc.clone())) }
```


成功したら、同じポインタから `Arc` を組み立てて返します。

## ここがすごい

- **`fetch_add` を使わない理由**: コメントのとおり、無条件に足すと、0（解放済み）のカウントを 1 にしてしまう可能性があります。すると解放済みのメモリを指す `Arc` ができてしまいます。CAS ループなら「0 でないこと」を確認してから足せます。
- **0 は「永久に 0」**: コメントのとおり、一度 0 になったカウントは二度と増えません。この不変条件があるので、`upgrade` は「0 を見たら即あきらめる」だけで済みます。
- **成功時だけ `Acquire`**: コメントのとおり、失敗したときは何も読まないので `Relaxed` で十分です。成功時は、`Arc::new_cyclic`（中身の初期化前に `Weak` を配る関数）で初期化された中身を正しく見るために `Acquire` が必要です。
- **あふれ対策を共有**: `Arc::clone` と同じ上限チェックを入れ、どの経路からでもカウントが一周しないようにしています。

## まとめ

- 「0 でなければ増やす」のような条件付き更新は CAS ループで書く。
- 参照カウントは 0 から 1 に戻してはいけない（解放済みメモリの再利用になる）。
- 一度 0 になったら二度と増えないという不変条件が、並行処理の正しさを支える。
- 失敗時と成功時で、必要なメモリオーダリングは違う。
