---
title: weak_ptr を shared_ptr に昇格させる、-1 を避けて回る CAS ループ
description: weak_ptr::lock の中核 __shared_weak_count::lock。所有者カウントが「破棄済み」を表す -1 でない限り、compare_exchange で +1 を試み続ける。失敗すると最新値が自動で読み直される。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/src/memory.cpp
lines: [91, 98]
function: std::__shared_weak_count::lock
difficulty: 3
format: 2
tags: [並行処理, ロック不要, メモリ管理]
---
## ひとことで

`lock()` は、`weak_ptr` から `shared_ptr` を作る（`weak_ptr::lock()`）ときに使われる関数です。
オブジェクトがまだ生きていれば所有者カウントを 1 増やして `this` を返し、すでに破棄されていれば `nullptr` を返します。
たった 8 行で、**ロックを使わずに** 安全な昇格を実現しています。

## コード

```cpp:line-numbers=91
__shared_weak_count* __shared_weak_count::lock() noexcept {
  long object_owners = __libcpp_atomic_load(&__shared_owners_);
  while (object_owners != -1) {
    if (__libcpp_atomic_compare_exchange(&__shared_owners_, &object_owners, object_owners + 1))
      return this;
  }
  return nullptr;
}
```

## 前提知識

- **`weak_ptr::lock()`**: `weak_ptr` は所有しないポインタです。使うときは `lock()` で `shared_ptr` に変換し、変換できたらその間はオブジェクトが消えない、という使い方をします。
- **所有者カウント `__shared_owners_`**: libc++ では「所有者数 − 1」で保存しています。0 は 1 人、-1 は「もう誰もいない（破棄済み）」です。
- **`long`**: 符号付き整数型です。-1 を表すために符号付きになっています。
- **`nullptr`**: 「何も指していない」ことを表すポインタの値です。
- **`this`**: メンバ関数の中で、自分自身のオブジェクトを指すポインタです。
- **compare-and-swap（CAS）**: `__libcpp_atomic_compare_exchange(&変数, &期待値, 新しい値)` は、「変数がまだ期待値と等しければ新しい値に書き換えて `true`、違っていれば **期待値の変数に今の値を書き込んで** `false`」を不可分に行います。ここで使われているのは、まれに理由なく失敗してよい weak 版です。
- **ロック不要（lock-free）**: ミューテックスのような排他ロックを取らずに、アトミック操作だけで複数スレッドの安全を保つ手法です。

## 何をしているか

### 1. 現在の値を読む

```cpp:line-numbers=92
  long object_owners = __libcpp_atomic_load(&__shared_owners_);
```

所有者カウントを読み、`object_owners` に入れます。

### 2. -1 でない限り +1 を試す

```cpp:line-numbers=93
  while (object_owners != -1) {
    if (__libcpp_atomic_compare_exchange(&__shared_owners_, &object_owners, object_owners + 1))
      return this;
  }
```

-1 でなければ、オブジェクトはまだ生きています。CAS で「まだ `object_owners` のままなら `object_owners + 1` にする」を試みます。

### 3. 2 つのスレッドの競争

所有者 1 人（保存値 0）の状態で、スレッド A が `lock()`、スレッド B が最後の `shared_ptr` を破棄する場合を考えます。

**A が先に CAS に成功した場合**

```
A: 0 を読む → CAS(0 → 1) 成功 → return this
B: 1 → 0 に減らす（まだ A が持っているので破棄しない）
```

**B が先に減らした場合**

```
A: 0 を読む
B: 0 → -1 に減らす → オブジェクトを破棄
A: CAS(0 → 1) 失敗、object_owners に -1 が書き込まれる
A: while の条件で -1 を見てループを抜ける → return nullptr
```

どちらの順序でも、破棄済みのオブジェクトに所有者が付くことはありません。

### 4. 生きていなければ nullptr

```cpp:line-numbers=97
  return nullptr;
```

-1 を見たら、`nullptr` を返します。呼び出し側はこれを見て、空の `shared_ptr` を作ります。

## ここがすごい

素直に「-1 でなければ +1 する」を書くと、次のようになります。

```
if (owners != -1)   // ここで確認したあと
  owners += 1;      // ここまでの間に別スレッドが -1 にするかもしれない
```

確認と書き換えの間に隙間があり、破棄されたオブジェクトをよみがえらせてしまう危険があります。ミューテックスで囲めば防げますが、`weak_ptr::lock()` はよく使われる操作なので、毎回ロックを取るのは重くなります。

CAS は「確認」と「書き換え」を 1 つの不可分な操作にします。失敗したら最新の値が `object_owners` に入るので、**読み直しのコードを書かなくても** ループの条件が最新の値で判定されます。この性質のおかげで、ループ本体が 1 行で済んでいます。

-1 を番兵にした「所有者数 − 1」の表現も効いています。「破棄済みかどうか」と「何人いるか」を 1 つの整数で表しているので、1 回の CAS で両方を同時に扱えます。

CAS を weak 版にしているのは、ループで再試行する前提だからです。まれに失敗しても次の周で再挑戦するだけなので、一部の CPU で効率のよい命令を使えます。

## まとめ

- 「確認してから更新」は、並行処理では隙間ができる。CAS で 1 つの操作にまとめる。
- CAS が失敗すると期待値が最新値に更新されるので、ループの条件判定がそのまま使える。
- 状態（破棄済み）と数量（人数）を 1 つの整数に詰めると、1 回のアトミック操作で扱える。
- 再試行ループの中なら、まれに失敗してよい弱い CAS で十分。
