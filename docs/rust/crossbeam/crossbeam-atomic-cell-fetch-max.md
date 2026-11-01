---
title: 原子的な命令がない型でも、最大値を更新できる
description: crossbeam の AtomicCell の fetch_max。対応する原子的な命令があればそれを使い、なければアドレスで選んだロックを取って同じ更新をする。型ごとの分岐を、マクロが生成する。
language: rust
project: Crossbeam
repo: https://github.com/crossbeam-rs/crossbeam
license: MIT OR Apache-2.0
copyright: Copyright (c) 2019 The Crossbeam Project Developers
commit: "a28f40fdddb70bea8e5faf0efad9af0be4b9dbea"
file: crossbeam-utils/src/atomic/atomic_cell.rs
lines: [588, 610]
function: AtomicCell::fetch_max
difficulty: 3
format: 2
tags: [並行処理, ロック不要, 型システム]
---

## ひとことで

`fetch_max` は、原子的な変数の値を **今の値と新しい値の大きいほうに書き換え、古い値を返す** 関数です。複数のスレッドが同時に呼んでも、結果が壊れません。

ただし、すべての型に対して、CPU の原子的な命令があるわけではありません。`AtomicCell` は、そうした型も扱えるように、命令があれば命令を使い、なければロックで同じ操作を行います。その分岐を、マクロ `atomic!` が型ごとに生成しています。

## コード

```rust:line-numbers=588
            pub fn fetch_max(&self, val: $t) -> $t {
                atomic! {
                    $t, _a,
                    {
                        #[cfg($target_has_atomic)]
                        {
                            let a = unsafe { &*(self.as_ptr() as *const atomic::$atomic) };
                            a.fetch_max(val, Ordering::AcqRel)
                        }
                        #[cfg(not($target_has_atomic))]
                        {
                            self.fetch_update(|old| Some(cmp::max(old, val))).unwrap()
                        }
                    },
                    {
                        let _guard = lock(self.as_ptr() as usize).write();
                        let value = unsafe { &mut *(self.as_ptr()) };
                        let old = *value;
                        *value = cmp::max(old, val);
                        old
                    }
                }
            }
```

この関数は、マクロ `atomic!` の中の 2 通りの処理を、型ごとに選びます。前半は、原子的な `fetch_max` を直接使う版です。後半は、ロックを取ってから、古い値を読み、最大値を書く版です。

## 前提知識

- **原子的操作（アトミック）**: 途中の状態を他のスレッドに見せずに、読み書きを 1 回で行う操作です。
- **`fetch_max`**: 原子的に最大値を書き、古い値を返す操作です。標準の整数型のアトミックには用意されています。
- **`AcqRel`**: 読み書きの順序を保証する指定です。取得と解放の両方の効果を持ちます。
- **`#[cfg]`**: 条件によって、コードを含めるかどうかを決める属性です。ここでは、対象の CPU に原子的な命令があるかで分けています。
- **ロック**: 一度に 1 つのスレッドだけが入れる区間を作る仕組みです。ここでは、アドレスから選ばれたロックを使います。

## 何をしているか

### 1. 原子的な命令があれば、そのまま使う

```rust:line-numbers=592
                        #[cfg($target_has_atomic)]
                        {
                            let a = unsafe { &*(self.as_ptr() as *const atomic::$atomic) };
                            a.fetch_max(val, Ordering::AcqRel)
                        }
```

対象の型に対応する整数のアトミックがあれば、ポインタをそのアトミックとして読み替えます。そのうえで、標準の `fetch_max` を呼びます。

### 2. 命令がなければ、更新を繰り返す

```rust:line-numbers=597
                        #[cfg(not($target_has_atomic))]
                        {
                            self.fetch_update(|old| Some(cmp::max(old, val))).unwrap()
                        }
```

原子的な命令がない場合は、`fetch_update` で、古い値と新しい値の大きいほうを書き込みます。更新が競合したら、内部で再試行されます。

### 3. 命令がない型では、ロックで守る

```rust:line-numbers=602
                    {
                        let _guard = lock(self.as_ptr() as usize).write();
                        let value = unsafe { &mut *(self.as_ptr()) };
                        let old = *value;
                        *value = cmp::max(old, val);
                        old
                    }
```

型が大きすぎて原子的に扱えない場合は、アドレスからロックを選び、書き込みの権利を取ります。その間に、古い値を読み、最大値を書き、古い値を返します。ロックを離すのは、`_guard` が破棄されるときです。

## ここがすごい

- **型ごとに最適な経路**: 命令がある型は速い経路を、無い型はロックの経路を通ります。利用者は、型の違いを意識せずに同じ関数を呼べます。
- **結果の意味が同じ**: どの経路でも、古い値を返し、最大値を書くという意味は同じです。
- **分岐がマクロに閉じる**: 型ごとの違いは `atomic!` が生成します。`fetch_max` の本体は、型に依存しない形で書かれています。

## まとめ

- 原子的な命令があるなら、それを使うのが一番速い。
- 命令がない型は、アドレスで選んだロックで同じ更新を行う。
- 型ごとの分岐はマクロで生成し、利用者からは同じ関数に見せる。
