---
title: 1 つのメモリオーダーを「読む用」と「書く用」に分解する
description: 読み書きを両方行う操作のメモリオーダーから、読むだけ・書くだけの部分に使える順序を constexpr で計算する小さな関数 2 つ。三項演算子の連鎖で表を表す。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/synchronization/AtomicUtil-inl.h
lines: [34, 56]
function: memory_order_load / memory_order_store
difficulty: 3
tags: [並行処理, 標準ライブラリ, イディオム]
---

## ひとことで

`memory_order_load(order)` と `memory_order_store(order)` は、メモリオーダー（後述）を 1 つ受け取り、その **読み込み部分** と **書き込み部分** にそれぞれ使える順序を返す関数です。
たとえば `acq_rel`（読みも書きも順序を守る）を渡すと、読み込み用には `acquire`、書き込み用には `release` が返ります。
「読んで書く」操作を、読み込みと書き込みの 2 段に分けて実装したいときに使います。

## コード

::: code-group

```cpp:line-numbers=34 [日本語訳]
constexpr std::memory_order memory_order_load(
    std::memory_order const order) noexcept {
  constexpr auto relaxed = std::memory_order_relaxed;
  constexpr auto release = std::memory_order_release;
  constexpr auto acquire = std::memory_order_acquire;
  constexpr auto acq_rel = std::memory_order_acq_rel;
  return order == acq_rel ? acquire : order == release ? relaxed : order;
}

constexpr std::memory_order memory_order_store(
    std::memory_order const order) noexcept {
  constexpr auto relaxed = std::memory_order_relaxed;
  constexpr auto release = std::memory_order_release;
  constexpr auto consume = std::memory_order_consume;
  constexpr auto acquire = std::memory_order_acquire;
  constexpr auto acq_rel = std::memory_order_acq_rel;
  // clang-format off（ここから自動整形を止める）
  return
      order == acq_rel ? release :
      order == acquire || order == consume ? relaxed :
      order;
  // clang-format on（自動整形を再開する）
}
```

```cpp:line-numbers=34 [原文]
constexpr std::memory_order memory_order_load(
    std::memory_order const order) noexcept {
  constexpr auto relaxed = std::memory_order_relaxed;
  constexpr auto release = std::memory_order_release;
  constexpr auto acquire = std::memory_order_acquire;
  constexpr auto acq_rel = std::memory_order_acq_rel;
  return order == acq_rel ? acquire : order == release ? relaxed : order;
}

constexpr std::memory_order memory_order_store(
    std::memory_order const order) noexcept {
  constexpr auto relaxed = std::memory_order_relaxed;
  constexpr auto release = std::memory_order_release;
  constexpr auto consume = std::memory_order_consume;
  constexpr auto acquire = std::memory_order_acquire;
  constexpr auto acq_rel = std::memory_order_acq_rel;
  // clang-format off
  return
      order == acq_rel ? release :
      order == acquire || order == consume ? relaxed :
      order;
  // clang-format on
}
```

:::

## 前提知識

- **メモリオーダー**: 複数スレッドで atomic 変数を使うとき、「その前後の普通の読み書きを、どこまで並べ替えてよいか」を指定する値です。C++ の `std::memory_order` には次の種類があります。
  - `relaxed`: 順序の約束なし。値の読み書きそのものが壊れないことだけを保証します。
  - `acquire`: **読み込み** 用。これより後の読み書きを、この読み込みより前に動かさない。
  - `release`: **書き込み** 用。これより前の読み書きを、この書き込みより後ろに動かさない。
  - `acq_rel`: 読み書き両方を行う操作用。`acquire` と `release` の両方。
  - `consume`: `acquire` を弱めたもの。実際にはほぼ `acquire` として扱われます。
  - `seq_cst`: 最も強い順序。全スレッドで 1 つの順番に見えることを保証します。
- **`constexpr` 関数**: 引数がコンパイル時に分かっていれば、結果もコンパイル時に計算される関数です。実行時には定数に置き換わり、計算コストが残りません。
- **`noexcept`**: 例外を投げないという宣言です。
- **三項演算子の連鎖**: `a ? x : b ? y : z` は「a なら x、そうでなく b なら y、どちらでもなければ z」と読みます。if-else の連鎖を 1 つの式で書けます。
- **`// clang-format off` / `on`**: 自動整形ツールにこの範囲を触らせないための目印です。

## 何をしているか

### 1. 読み込み用の順序

```cpp:line-numbers=40
  return order == acq_rel ? acquire : order == release ? relaxed : order;
```

この式を表にすると次のとおりです。

| 渡した順序 | 返る順序 | 理由 |
| --- | --- | --- |
| `acq_rel` | `acquire` | 読み込みに意味があるのは acquire の部分だけ |
| `release` | `relaxed` | release は書き込みにしか効かない |
| それ以外 | そのまま | `relaxed`、`acquire`、`consume`、`seq_cst` は読み込みにそのまま使える |

### 2. 書き込み用の順序

```cpp:line-numbers=51
  return
      order == acq_rel ? release :
      order == acquire || order == consume ? relaxed :
      order;
```

こちらも同じように読めます。

| 渡した順序 | 返る順序 | 理由 |
| --- | --- | --- |
| `acq_rel` | `release` | 書き込みに意味があるのは release の部分だけ |
| `acquire` / `consume` | `relaxed` | これらは読み込みにしか効かない |
| それ以外 | そのまま | `relaxed`、`release`、`seq_cst` は書き込みにそのまま使える |

### 3. 具体例

`fetch_or` のような「読んで書く」操作を、利用者が `release` で呼んだとします。
これを「まず読んで、条件を見て、必要なら書く」という 2 段に分けて実装するなら、読み込みには `memory_order_load(release)` = `relaxed`、書き込みには `memory_order_store(release)` = `release` を使えばよい、と分かります。

## ここがすごい

- **規格の落とし穴を関数で塞ぐ**: C++ では、`load` に `release` を渡したり、`store` に `acquire` を渡したりすると未定義動作になります。素直に「利用者の順序をそのまま load と store に渡す」と書くと、この罠を踏みます。この関数を通せば、必ず合法な順序に変換されます。
- **意味を保ったまま弱める**: 単に全部 `seq_cst` にしてしまえば安全ですが、遅くなります。この関数は「その部分に効く成分だけを残す」ので、利用者が指定した強さを無駄に強めも弱めもしません。
- **実行時コストがゼロ**: `constexpr` なので、引数が定数ならコンパイル時に答えが決まります。
- **表をそのまま式にする**: 分岐を三項演算子の連鎖で書き、整形ツールを止めてまで 1 行 1 条件に揃えています。対応表として目で追いやすい形です。
- **定数に短い名前を付ける**: 関数の頭で `relaxed` などのローカル定数を作り、`std::memory_order_` の長い名前を繰り返さずに済ませています。

## まとめ

- メモリオーダーには「読み込みに効く成分」と「書き込みに効く成分」がある。
- 読み書きを分けて実装するときは、それぞれに合法で過不足ない順序を選ぶ必要がある。
- 小さな対応表は `constexpr` 関数にしておくと、実行時コストなしで再利用できる。
- 三項演算子の連鎖は、整形を工夫すれば読みやすい「表」になる。

