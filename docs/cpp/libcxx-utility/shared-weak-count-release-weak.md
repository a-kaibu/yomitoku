---
title: 最後の weak 参照なら、高価なアトミック減算をせずに読むだけで済ませる
description: shared_ptr の制御ブロックを解放する __release_weak。弱参照カウントがすでに 0 なら自分が最後の参照者なので、アトミックな書き込みを省いて即座に破棄する。その安全性をコメントで論証している。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/src/memory.cpp
lines: [60, 89]
function: std::__shared_weak_count::__release_weak
difficulty: 3
format: 2
tags: [並行処理, 最適化, メモリ管理]
---
## ひとことで

`__release_weak` は、`shared_ptr` / `weak_ptr` が共有している **制御ブロック**（参照カウントなどを入れた管理用のメモリ）を、最後の 1 人がいなくなったときに解放する関数です。
ふつうはカウントをアトミックに 1 減らしますが、「自分が最後だ」とわかる場合は **読むだけ** で済ませ、書き込みを省略します。

## コード

::: code-group

```cpp:line-numbers=60 [日本語訳]
void __shared_weak_count::__release_weak() noexcept {
  // 注: ここでの acquire 読み出しは、ごくよくあるケース、つまり
  // ほかに競合する参照がない状態で shared pointer が破棄される
  // ケースのための最適化である。
  //
  // 利点: よくあるケースで、XADD や STREX のような高価なアトミック
  // 書き込みを避けられる。これらの命令は遅く、キャッシュに
  // ひどいことをする。
  //
  // 安全なのか? 安全である。weak の破棄中に自分が最後の参照だとわかれば、
  // ほかに誰も自分にアクセスしていないとわかる。もし誰かが
  // アクセスしているなら、それは最後の shared / weak_ptr の破棄中に
  // アクセスしていることになり、それはどのみち
  // 未定義動作だ。
  //
  // 0 以外の値が見えたら、競合の可能性があるので、
  // アトミックな read-modify-write 操作を使う必要がある。
  // 同じ議論はインクリメントには当てはまらない。インクリメントでは
  // （勧められはしないが）shared_ptr の参照をスレッド間で共有し、
  // 一斉にコピーすることが許されているからだ。この議論は
  // __release_shared にも当てはまらない。未完了の
  // weak_ptr::lock() が共有カウントを読み書きしうるからだ。
  if (__libcpp_atomic_load(&__shared_weak_owners_, _AO_Acquire) == 0) {
    // この書き込みは不要。これから
    // すべてを破棄するのだから。
    //__libcpp_atomic_store(&__shared_weak_owners_, -1, _AO_Release);
    __on_zero_shared_weak();
  } else if (__libcpp_atomic_refcount_decrement(__shared_weak_owners_) == -1)
    __on_zero_shared_weak();
}
```

```cpp:line-numbers=60 [原文]
void __shared_weak_count::__release_weak() noexcept {
  // NOTE: The acquire load here is an optimization of the very
  // common case where a shared pointer is being destructed while
  // having no other contended references.
  //
  // BENEFIT: We avoid expensive atomic stores like XADD and STREX
  // in a common case.  Those instructions are slow and do nasty
  // things to caches.
  //
  // IS THIS SAFE?  Yes.  During weak destruction, if we see that we
  // are the last reference, we know that no-one else is accessing
  // us. If someone were accessing us, then they would be doing so
  // while the last shared / weak_ptr was being destructed, and
  // that's undefined anyway.
  //
  // If we see anything other than a 0, then we have possible
  // contention, and need to use an atomicrmw primitive.
  // The same arguments don't apply for increment, where it is legal
  // (though inadvisable) to share shared_ptr references between
  // threads, and have them all get copied at once.  The argument
  // also doesn't apply for __release_shared, because an outstanding
  // weak_ptr::lock() could read / modify the shared count.
  if (__libcpp_atomic_load(&__shared_weak_owners_, _AO_Acquire) == 0) {
    // no need to do this store, because we are about
    // to destroy everything.
    //__libcpp_atomic_store(&__shared_weak_owners_, -1, _AO_Release);
    __on_zero_shared_weak();
  } else if (__libcpp_atomic_refcount_decrement(__shared_weak_owners_) == -1)
    __on_zero_shared_weak();
}
```

:::

## 前提知識

- **`shared_ptr` と `weak_ptr`**: `shared_ptr` はオブジェクトを共有して所有するスマートポインタ、`weak_ptr` は所有せずに「まだ生きているか」を確かめられるポインタです。両者は同じ制御ブロックを指しています。
- **弱参照カウント `__shared_weak_owners_`**: 制御ブロックを指している `weak_ptr` の数です。libc++ では「数 − 1」で保存していて、0 は「残り 1 人」を意味します。`shared_ptr` が 1 つ以上あるあいだは、それらがまとめて弱参照を 1 つ持っている扱いです。
- **`__shared_weak_count::`**: クラス `__shared_weak_count` のメンバ関数を、クラスの外で定義する書き方です。
- **`noexcept`**: 例外を投げないことを示します。
- **アトミック操作**: 複数のスレッドが同時に触っても壊れない、不可分な読み書きです。読み出し（load）は軽く、読んで書き換える操作（read-modify-write、例: x86 の `LOCK XADD`、ARM の `LDREX`/`STREX`）は重い操作です。
- **`_AO_Acquire`**: acquire（獲得）というメモリ順序です。この読み出しより後の処理が、前に並べ替えられないことを保証します。
- **`__on_zero_shared_weak()`**: 制御ブロック自身を破棄する仮想関数です。

## 何をしているか

### 1. まず読むだけ

```cpp:line-numbers=82
  if (__libcpp_atomic_load(&__shared_weak_owners_, _AO_Acquire) == 0) {
```

弱参照カウントをアトミックに **読みます**。値が 0（＝残りは自分 1 人）なら、

### 2. 書かずに破棄

```cpp:line-numbers=83
    // この書き込みは不要。これから
    // すべてを破棄するのだから。
    //__libcpp_atomic_store(&__shared_weak_owners_, -1, _AO_Release);
    __on_zero_shared_weak();
```

本来なら 0 から -1 へ書き込むところですが、コメントのとおり「すぐに全部破棄するので、この書き込みは要らない」として省き、`__on_zero_shared_weak()` を呼んで制御ブロックを破棄します。

### 3. 0 でなければふつうに減らす

```cpp:line-numbers=87
  } else if (__libcpp_atomic_refcount_decrement(__shared_weak_owners_) == -1)
    __on_zero_shared_weak();
```

ほかにも参照者がいるかもしれないので、アトミックに 1 減らします。その結果が -1 なら（読んでから減らすまでの間にほかの参照者がいなくなっていた場合など）、やはり破棄します。

### 例

`shared_ptr` が 1 つだけあり、`weak_ptr` はない状態で、`shared_ptr` が破棄されたとします。

1. 所有者カウントが -1 になり、オブジェクト本体が破棄される。
2. 続いて `__release_weak` が呼ばれる。弱参照カウントは 0。
3. 最初のアトミックな読み出しで 0 を読み、アトミックな減算なしで制御ブロックを破棄する。

いちばんよくある「`weak_ptr` を一度も使わない」場合が、この近道を通ります。

## ここがすごい

関数冒頭の長いコメントは、最適化の **効果** と **安全性の論証** を両方書いています。

- **効果**: XADD や STREX のような読み書き一体のアトミック命令は遅く、キャッシュにも悪い影響を与えます。よくある場合にそれを避けられます。
- **安全性**: カウントが 0 なら、制御ブロックを指しているのは自分だけです。もしほかの誰かが同時に触っているなら、それは「最後の参照が破棄されている最中に、その参照をコピーしている」ことになり、そもそも未定義動作です。だから、ほかのスレッドとの競合を心配しなくてよいのです。
- **どこまで使えるか**: 同じ理屈は、カウントを増やす操作や、所有者カウントの減算には使えないと明記しています。`weak_ptr::lock()` がほかのスレッドから所有者カウントを書き換えるかもしれないからです。

並行処理の最適化は、「なぜ安全か」を説明できないと怖くて触れません。このコードは、省略した書き込みそのものもコメントとして残し、何を省いたのかがひと目でわかるようにしています。

## まとめ

- アトミックな読み出しは、読み書き一体の操作より軽い。読むだけで判断できるなら、そうする。
- 「自分しか触っていない」と論証できれば、同期の操作を省ける。
- 並行処理の最適化には、効果・安全性・適用できない場面の 3 つをコメントで残すとよい。
- 省いた処理をコメントアウトして残すと、何を省略したかが読み手に伝わる。
