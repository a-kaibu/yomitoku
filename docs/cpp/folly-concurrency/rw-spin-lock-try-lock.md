---
title: 読み手は「先に足してから確かめる」、32 ビットで作る読み書きロック
description: RWSpinLock は 1 つの int32_t に書き手・昇格待ち・読み手の数を詰め込む。読み手は CAS ではなく fetch_add で楽観的に入り、だめなら引き返す。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/RWSpinLock.h
lines: [198, 242]
function: RWSpinLock::try_lock / try_lock_shared / try_lock_upgrade
difficulty: 2
tags: [並行処理, ビット演算, 最適化, ロック不要]
---

## ひとことで

`RWSpinLock` は、**読み手は何人でも同時に入れるが、書き手は 1 人だけ** という読み書きロック（reader-writer lock）を、32 ビット整数 1 つで実現したスピンロックです。
さらに「今は読むだけだが、あとで書くかもしれない」という **アップグレード** 状態も持ちます。
ここでは、ロックを 1 回だけ取りに行く `try_*` 系の関数を読みます。

## コード

::: code-group

```cpp:line-numbers=198 [日本語訳]
  // 書き手の権利の取得を試みる。取れなければ false を返す。
  bool try_lock() {
    int32_t expect = 0;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acquire);
  }

  // 読み手の権利の取得を試みる。書き手やアップグレード中の人が
  // いると分かった場合は失敗しうる。
  // UPGRADE ビットを立てると、書き手になる予定の人は書く意思を示し、
  // 既存の読み手が読み取りロックを解放するのを待つ間、
  // 新しい読み手をすべて締め出せる。これにより
  // （アップグレードから昇格する）書き手の飢餓を避けやすくなる。
  bool try_lock_shared() {
    // fetch_add は compare_exchange よりかなり（100%）速いので、
    // ここではよくある（ロック成功の）場合に最適化している。
    int32_t value = bits_.fetch_add(SHARED, std::memory_order_acquire);
    if (FOLLY_UNLIKELY(value & (EXCLUSIVE | UPGRADE))) {
      bits_.fetch_add(-SHARED, std::memory_order_release);
      return false;
    }
    return true;
  }

  // アップグレードの解除と書き込みロックの取得を不可分に試みる
  bool try_unlock_upgrade_and_lock() {
    int32_t expect = UPGRADE;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acq_rel);
  }

  // アップグレード可能なロックの取得を試みる。
  bool try_lock_upgrade() {
    int32_t value = bits_.load(std::memory_order_relaxed);
    while ((value & (EXCLUSIVE | UPGRADE)) == 0) {
      if (bits_.compare_exchange_weak(
              value,
              value | UPGRADE,
              std::memory_order_acquire,
              std::memory_order_relaxed)) {
        return true;
      }
    }
    return false;
  }
```

```cpp:line-numbers=198 [原文]
  // Attempt to acquire writer permission. Return false if we didn't get it.
  bool try_lock() {
    int32_t expect = 0;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acquire);
  }

  // Try to get reader permission on the lock. This can fail if we
  // find out someone is a writer or upgrader.
  // Setting the UPGRADE bit would allow a writer-to-be to indicate
  // its intention to write and block any new readers while waiting
  // for existing readers to finish and release their read locks. This
  // helps avoid starving writers (promoted from upgraders).
  bool try_lock_shared() {
    // fetch_add is considerably (100%) faster than compare_exchange,
    // so here we are optimizing for the common (lock success) case.
    int32_t value = bits_.fetch_add(SHARED, std::memory_order_acquire);
    if (FOLLY_UNLIKELY(value & (EXCLUSIVE | UPGRADE))) {
      bits_.fetch_add(-SHARED, std::memory_order_release);
      return false;
    }
    return true;
  }

  // try to unlock upgrade and write lock atomically
  bool try_unlock_upgrade_and_lock() {
    int32_t expect = UPGRADE;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acq_rel);
  }

  // try to acquire an upgradable lock.
  bool try_lock_upgrade() {
    int32_t value = bits_.load(std::memory_order_relaxed);
    while ((value & (EXCLUSIVE | UPGRADE)) == 0) {
      if (bits_.compare_exchange_weak(
              value,
              value | UPGRADE,
              std::memory_order_acquire,
              std::memory_order_relaxed)) {
        return true;
      }
    }
    return false;
  }
```

:::

ビットの割り当てはクラスの先頭で決まっています。

```cpp:line-numbers=123
  enum : int32_t { SHARED = 4, UPGRADE = 2, EXCLUSIVE = 1 };
  static_assert(SHARED > EXCLUSIVE + UPGRADE);
```

## 前提知識

- **読み書きロック**: 読むだけの人どうしは同時に入ってよく、書く人が入っている間は誰も入れない、というロックです。読み込みが多いデータで効果を発揮します。
- **無名の `enum`**: 名前のない列挙型で、定数をまとめて定義するのに使われます。
- **`compare_exchange_strong(expect, desired, order)`**: 値が `expect` と同じなら `desired` に書き換えて `true`。違えば今の値を `expect` に入れて `false` を返します。
- **`compare_exchange_weak`**: 同じ操作ですが、まれに理由なく失敗することがあります。ループの中で使う前提の速い版です。
- **`fetch_add(x)`**: 足す前の値を返しつつ、不可分に `x` を足します。`-SHARED` を足せば引き算です。
- **`|` と `&`**: ビットの OR と AND です。`value & (EXCLUSIVE | UPGRADE)` は「下位 2 ビットのどちらかが立っているか」を調べます。
- **`FOLLY_UNLIKELY`**: この条件はめったに真にならない、というコンパイラへのヒントです。

## 何をしているか

### ビットの配置

`bits_` の最下位ビット（値 1）が書き手、次のビット（値 2）がアップグレード、それより上（4 の倍数）が読み手の人数 × 4 です。
読み手が 3 人いれば `bits_ = 12`、そこにアップグレード中の人がいれば `14` です。

### try_lock：書き手として入る

```cpp:line-numbers=199
  bool try_lock() {
    int32_t expect = 0;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acquire);
  }
```
`bits_` がちょうど 0（誰もいない）のときだけ、`EXCLUSIVE`（1）に書き換えます。
読み手が 1 人でもいれば 0 ではないので失敗します。

### try_lock_shared：読み手として入る

```cpp:line-numbers=211
  bool try_lock_shared() {
    // fetch_add は compare_exchange よりかなり（100%）速いので、
    // ここではよくある（ロック成功の）場合に最適化している。
    int32_t value = bits_.fetch_add(SHARED, std::memory_order_acquire);
    if (FOLLY_UNLIKELY(value & (EXCLUSIVE | UPGRADE))) {
      bits_.fetch_add(-SHARED, std::memory_order_release);
      return false;
    }
    return true;
  }
```
まず **確かめずに** `SHARED`（4）を足します。
足す前の値の下位 2 ビットを見て、書き手もアップグレード中の人もいなければ成功です。
どちらかがいたら、足した 4 を引いて「なかったこと」にし、`false` を返します。

たとえば `bits_ = 1`（書き手が入っている）のときに呼ぶと、一瞬 `5` になり、すぐ `1` に戻ります。

### try_unlock_upgrade_and_lock：アップグレードから書き手へ

```cpp:line-numbers=223
  bool try_unlock_upgrade_and_lock() {
    int32_t expect = UPGRADE;
    return bits_.compare_exchange_strong(
        expect, EXCLUSIVE, std::memory_order_acq_rel);
  }
```
`bits_` がちょうど `UPGRADE`（2）なら `EXCLUSIVE`（1）に変えます。
読み手が残っている間は 2 ではないので失敗し、全員が抜けるのを待つことになります。

### try_lock_upgrade：アップグレード権を取る

```cpp:line-numbers=230
  bool try_lock_upgrade() {
    int32_t value = bits_.load(std::memory_order_relaxed);
    while ((value & (EXCLUSIVE | UPGRADE)) == 0) {
      if (bits_.compare_exchange_weak(
              value,
              value | UPGRADE,
              std::memory_order_acquire,
              std::memory_order_relaxed)) {
        return true;
      }
    }
    return false;
  }
```
書き手もアップグレード中の人もいない間、`value | UPGRADE` への CAS を繰り返します。
`weak` 版が失敗すると `value` が最新の値に更新されるので、ループの条件で改めて調べ直せます。
アップグレード権を持つ人が 1 人でもいると、新しい読み手は `try_lock_shared` で弾かれます。

## ここがすごい

- **楽観的な fetch_add**: `try_lock_shared` の中のコメントによれば、`fetch_add` は `compare_exchange` よりかなり速いので、成功する場合が多い読み手は「まず足す」方式にしています。CAS 方式だと、他の読み手が同時に人数を変えるたびに失敗してやり直しになります。`fetch_add` なら何人同時に来ても全員 1 回で済みます。
- **失敗しても壊れない設計**: 足した後に引き返す方式は、一瞬だけ読み手の数が多く見えます。それでも書き手の判定は「ちょうど 0 か」、アップグレードからの昇格は「ちょうど 2 か」なので、一時的な余分は「まだ空いていない」と見なされるだけで、安全側に倒れます。`unlock_and_lock_upgrade` のコメントもこの点に触れています。
- **書き手を飢えさせない**: アップグレード中の人がいると新しい読み手を入れないので、読み手が途切れずに来ても、いずれ書き手が入れます（`try_lock_shared` の直前のコメント）。
- **値の大小関係を static_assert で保証**: `SHARED > EXCLUSIVE + UPGRADE` により、読み手の人数が下位 2 ビットにはみ出さないことをコンパイル時に確かめています。

## まとめ

- 1 つの整数に「フラグ」と「人数」を同居させると、ロックの状態を 1 回の atomic 操作で扱える。
- 成功しやすい操作は、CAS ではなく `fetch_add` で楽観的に行い、だめなら引き返す手がある。
- 一時的なずれが生じても安全側に倒れるように、判定条件を「ちょうど一致」で書くとよい。
- 書き手の予約（アップグレード）を用意すると、読み手が多くても書き手が飢えない。

