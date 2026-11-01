---
title: 順番を気にしないなら、配列の削除は一瞬で終わる
description: Vec から指定位置の要素を取り除く関数。後ろの要素を詰める代わりに、末尾の要素を空いた場所に移すことで O(1) で削除する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/vec/mod.rs
lines: [2170, 2193]
function: Vec::swap_remove
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 最適化, 標準ライブラリ]
---

## ひとことで

`swap_remove` は、可変長配列 `Vec` から **指定した位置の要素を取り除いて返す** 関数です。
ふつうの `remove` は、取り除いた場所より後ろの要素を全部 1 つずつ前に詰めるので、要素数に比例した時間がかかります。`swap_remove` は **末尾の要素を空いた場所に移すだけ** なので、要素数に関係なく一瞬で終わります。

たとえば `['a', 'b', 'c', 'd']` で `swap_remove(1)` を呼ぶと、`'b'` が返り、配列は `['a', 'd', 'c']` になります。並び順が変わってもよい場面で使います。

## コード

::: code-group

```rust:line-numbers=2170 [日本語訳]
    pub fn swap_remove(&mut self, index: usize) -> T {
        #[cold]
        #[cfg_attr(not(panic = "immediate-abort"), inline(never))]
        #[optimize(size)]
        fn assert_failed(index: usize, len: usize) -> ! {
            panic!("swap_remove index (is {index}) should be < len (is {len})");
        }

        let len = self.len();
        if index >= len {
            assert_failed(index, len);
        }
        // ignore-tidy-undocumented-unsafe
        unsafe {
            // self[index] を末尾の要素で置き換える。上の範囲チェックが通れば、
            // 末尾の要素が必ず存在する（それが self[index] 自身の場合もある）。
            //
            let value = ptr::read(self.as_ptr().add(index));
            let base_ptr = self.as_mut_ptr();
            ptr::copy(base_ptr.add(len - 1), base_ptr.add(index), 1);
            self.set_len(len - 1);
            value
        }
    }
```

```rust:line-numbers=2170 [原文]
    pub fn swap_remove(&mut self, index: usize) -> T {
        #[cold]
        #[cfg_attr(not(panic = "immediate-abort"), inline(never))]
        #[optimize(size)]
        fn assert_failed(index: usize, len: usize) -> ! {
            panic!("swap_remove index (is {index}) should be < len (is {len})");
        }

        let len = self.len();
        if index >= len {
            assert_failed(index, len);
        }
        // ignore-tidy-undocumented-unsafe
        unsafe {
            // We replace self[index] with the last element. Note that if the
            // bounds check above succeeds there must be a last element (which
            // can be self[index] itself).
            let value = ptr::read(self.as_ptr().add(index));
            let base_ptr = self.as_mut_ptr();
            ptr::copy(base_ptr.add(len - 1), base_ptr.add(index), 1);
            self.set_len(len - 1);
            value
        }
    }
```

:::

## 前提知識

- **`Vec<T>`**: 要素数を後から増減できる配列です。内部ではヒープ（実行時に確保するメモリ）上の連続した領域と、要素数 `len` と容量を持っています。
- **`&mut self` と `-> T`**: 配列自身を書き換え可能な参照で受け取り、取り除いた要素を（所有権ごと）返します。
- **関数の中の関数と `-> !`**: `assert_failed` は `swap_remove` の中だけで使う補助関数です。`-> !` は「この関数は決して戻らない（必ずパニックする）」という型です。
- **属性**: `#[cold]` は「めったに呼ばれない」、`inline(never)` は「呼び出し元に展開しない」、`#[optimize(size)]` は「速さよりサイズを優先」という指示です。
- **`ptr::read` と `ptr::copy`**: `ptr::read` はメモリから値をビットごとコピーして取り出します（元の場所は「抜け殻」とみなします）。`ptr::copy(src, dst, n)` は n 個の要素をメモリ上でコピーします。
- **`set_len`**: `Vec` の要素数を直接書き換える `unsafe` な関数です。

## 何をしているか

### 1. 範囲チェック

```rust:line-numbers=2178
        let len = self.len();
        if index >= len {
            assert_failed(index, len);
        }
```


`index` が要素数以上なら、`assert_failed` でパニックします。

### 2. 取り出して、末尾で埋める

```rust:line-numbers=2187
            let value = ptr::read(self.as_ptr().add(index));
            let base_ptr = self.as_mut_ptr();
            ptr::copy(base_ptr.add(len - 1), base_ptr.add(index), 1);
            self.set_len(len - 1);
            value
```


`['a', 'b', 'c', 'd']`、`index = 1` で追います。

```
value = ptr::read(&v[1])        → value = 'b'（v[1] は抜け殻扱い）
ptr::copy(&v[3], &mut v[1], 1)  → [a, d, c, d]
set_len(3)                      → [a, d, c]
```

4 番目に残った `'d'` は、`len` を減らしたことで「配列の外」になり、二度と使われません。値はすでに `v[1]` に移っているので、二重に破棄されることもありません。

`index` が末尾（`index = 3`）の場合は、自分自身を自分にコピーすることになります。`ptr::copy` は重なったコピーにも対応しているので問題ありませんのコメント）。

```rust:line-numbers=2184
            // We replace self[index] with the last element. Note that if the
            // bounds check above succeeds there must be a last element (which
            // can be self[index] itself).
```


## ここがすごい

- **O(1) の削除**: 後ろを詰めるのではなく、末尾を 1 つ持ってくるだけなので、100 万要素の配列でも削除は一瞬です。「順序を保つ」という条件を手放す代わりに、速さを手に入れています。
- **パニック処理を外に追い出す**: エラーメッセージを組み立てる処理は意外と大きなコードになります。それを `#[cold]` かつ `inline(never)` の別関数に分けることで、`swap_remove` 本体を小さく保ち、呼び出し元に展開されやすくしています。標準ライブラリでよく見られるテクニックです。
- **余計な処理をしない**: 安全な関数だけで書くなら `self.swap(index, len - 1); self.pop().unwrap()` でも同じ結果になります。しかしそれだと値の入れ替え（3 回のコピー）と `pop` の空チェックが入ります。ここでは「取り出す」「1 つコピーする」「長さを減らす」の最小限の操作だけを行っています。
- **重なりを考えた関数選び**: `index == len - 1` のときコピー元とコピー先が同じになるので、重なりを許さない `copy_nonoverlapping` ではなく `copy` を使っています。

## まとめ

- 順序がいらないなら、配列の削除は「末尾を空いた場所へ移す」で O(1) にできる。
- めったに通らないエラー処理は別の関数に追い出すと、本体が小さく速くなる。
- `unsafe` なコードでは、コピー元と先が重なる場合まで考えて関数を選ぶ。
