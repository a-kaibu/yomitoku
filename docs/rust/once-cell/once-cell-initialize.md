---
title: 初期化の失敗を Result で返し、値は一度だけ書き込む
description: once_cell の initialize。初期化関数が失敗したら値は書かれず、エラーだけが呼び出し側へ返る。成功した値は、後から来るスレッドが読めるように 1 回だけ書き込まれる。
language: rust
project: once_cell
repo: https://github.com/matklad/once_cell
license: MIT OR Apache-2.0
copyright: Copyright (c) Aleksey Kladov (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "80fe900b21f6d76c1a2ed74d3343e8a3a88c46d0"
file: src/imp_std.rs
lines: [61, 85]
function: OnceCell::initialize
difficulty: 2
format: 2
tags: [並行処理, 遅延評価, 状態機械, エラー処理]
---

## ひとことで

`initialize` は、`OnceCell` に値を入れるためのメソッドです。引数の `f` は値を作る処理で、`Result` を返します。`f` が成功すれば、その値を `OnceCell` に書き込みます。`f` が失敗すれば、値は書かれず、エラーだけが呼び出し側に返ります。

中身の仕事は、前の記事で見た `initialize_or_wait` に任せています。この関数は、`initialize_or_wait` に渡す **クロージャ** を組み立てる係です。

## コード

```rust:line-numbers=61
    pub(crate) fn initialize<F, E>(&self, f: F) -> Result<(), E>
    where
        F: FnOnce() -> Result<T, E>,
    {
        let mut f = Some(f);
        let mut res: Result<(), E> = Ok(());
        let slot: *mut Option<T> = self.value.get();
        initialize_or_wait(
            &self.queue,
            Some(&mut || {
                let f = unsafe { f.take().unwrap_unchecked() };
                match f() {
                    Ok(value) => {
                        unsafe { *slot = Some(value) };
                        true
                    }
                    Err(err) => {
                        res = Err(err);
                        false
                    }
                }
            }),
        );
        res
    }
```

`initialize` は、`OnceCell` の中の値を書き込む場所（`slot`）と、外から渡された `f` を使い、処理の結果を `res` に残します。`res` は `Ok(())` で始まり、失敗したときだけ `Err(err)` に変わります。

## 前提知識

- **`Result<(), E>`**: 成功なら `Ok(())`、失敗なら `Err(E)` を返す型です。
- **クロージャ**: 周りの変数を取り込んで使える、名前のない関数です。ここでは `f` と `res` と `slot` を取り込んでいます。
- **`FnOnce`**: 一度だけ呼べる関数の型です。`f` は値を作るのに一度だけ使われるので、この型で十分です。
- **`Option::take`**: `Option` の中身を取り出し、元の場所を `None` にします。`f` を一度だけ使うための仕掛けです。
- **`UnsafeCell`**: 中身の可変性を、型の外から保証する仕組みです。`self.value.get()` は、その中身への生ポインタを返します。

## 何をしているか

### 1. 初期化の道具を用意する

```rust:line-numbers=65
        let mut f = Some(f);
        let mut res: Result<(), E> = Ok(());
```

`f` を `Option` に包み、`res` に `Ok(())` を入れておきます。`f` は `take` で取り出されるので、二度呼ばれることはありません。

### 2. 値の書き込み先を決める

```rust:line-numbers=67
        let slot: *mut Option<T> = self.value.get();
```

`slot` は、`OnceCell` の中で値を置く場所へのポインタです。ここに書き込むことで、`OnceCell` が値を持つようになります。

### 3. 初期化を協調させる

```rust:line-numbers=68
        initialize_or_wait(
            &self.queue,
            Some(&mut || {
                let f = unsafe { f.take().unwrap_unchecked() };
                match f() {
                    Ok(value) => {
                        unsafe { *slot = Some(value) };
                        true
                    }
                    Err(err) => {
                        res = Err(err);
                        false
                    }
                }
            }),
        );
```

`initialize_or_wait` に、クロージャを渡します。クロージャの中で `f` を呼び、成功したら `slot` に値を書いて `true` を返します。失敗したら `res` にエラーを残して `false` を返します。`false` を受け取った `initialize_or_wait` は、状態を未初期化へ戻します。

### 4. 結果を返す

```rust:line-numbers=84
        res
```

最後に、`res` を返します。成功なら `Ok(())`、失敗なら `Err(err)` が呼び出し側に届きます。

## ここがすごい

- **協調と結果の分離**: 「誰が初期化するか」は `initialize_or_wait` が決め、「何を作るか」はクロージャが決めます。役割が分かれているので、関数が短く保たれています。
- **失敗が値になる**: 初期化の失敗は、パニックではなく `Err` として返ります。呼び出し側は、再試行するかどうかを自分で選べます。
- **値の一度きりの書き込み**: 書き込みは成功したときだけ、しかも一度だけ行われます。書き込み後は読み取り専用になるので、共有しても安全です。

## まとめ

- 初期化処理を `Result` で書くと、失敗を型で扱える。
- 協調の仕組みと、値を作る処理を分けると、読みやすくなる。
- 失敗したときは値が書かれないので、次の試行で最初からやり直せる。
