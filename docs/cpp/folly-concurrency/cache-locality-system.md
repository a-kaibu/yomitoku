---
title: ロックなしの遅延初期化、競争に負けたら自分の分を捨てる
description: CacheLocality::system は CPU のキャッシュ構成を初回だけ調べて共有する。atomic ポインタと CAS 1 回で、ミューテックスなしにスレッド安全な遅延初期化を実現する。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/concurrency/CacheLocality.cpp
lines: [87, 100]
function: CacheLocality::system<std::atomic>
difficulty: 2
tags: [並行処理, ロック不要, 遅延評価, 設計パターン]
---

## ひとことで

`CacheLocality::system()` は、このマシンの CPU とキャッシュの構成情報を返す関数です。
情報を集めるには `/sys` 以下のファイルを読むなど手間がかかるので、**最初に呼ばれたときに 1 回だけ** 作り、以後は同じものを返します。
複数のスレッドが同時に初回を迎えても、ミューテックス（ロック）を使わずに正しく 1 つにまとめます。

## コード

```cpp:line-numbers=87
template <>
const CacheLocality& CacheLocality::system<std::atomic>() {
  static std::atomic<const CacheLocality*> cache;
  auto value = cache.load(std::memory_order_acquire);
  if (value != nullptr) {
    return *value;
  }
  auto next = new CacheLocality(readSystemLocalityInfo());
  if (cache.compare_exchange_strong(value, next, std::memory_order_acq_rel)) {
    return *next;
  }
  delete next;
  return *value;
}
```

## 前提知識

- **`template <>`（完全特殊化）**: テンプレート関数 `system<Atom>()` のうち、`Atom = std::atomic` の場合の中身だけを個別に定義する書き方です。テスト用に別の `Atom` を差し込めるよう、テンプレートになっています。
- **関数内の `static` 変数**: 関数の中で `static` を付けた変数は、プログラム全体で 1 つだけ存在し、呼び出しをまたいで値を保ちます。
- **`std::atomic<const CacheLocality*>`**: ポインタを atomic にしたものです。複数スレッドから読み書きしても壊れません。`static` な atomic は最初 `nullptr`（何も指していない）です。
- **`new` / `delete`**: `new` はヒープ（自由に使えるメモリ領域）にオブジェクトを作り、そのポインタを返します。`delete` はそれを破棄します。
- **参照を返す（`const CacheLocality&`）**: ポインタではなく別名として返すので、呼び出し側は `system().numCpus` のように普通の変数として使えます。
- **`compare_exchange_strong(expected, desired, order)`**: 値が `expected` と同じなら `desired` に書き換えて `true`、違えば今の値を `expected` に入れて `false` を返します。
- **`acquire` / `acq_rel`**: `acquire` で読むと、そのポインタを `release` 付きで書いたスレッドが作ったオブジェクトの中身まで正しく見えます。`acq_rel` は読み書き両方の約束です。

## 何をしているか

### 速い道：もうあるなら返す

```cpp:line-numbers=89
  static std::atomic<const CacheLocality*> cache;
  auto value = cache.load(std::memory_order_acquire);
  if (value != nullptr) {
    return *value;
  }
```
`cache` を `acquire` で読み、`nullptr` でなければ指している先を返します。
2 回目以降の呼び出しはすべてここで終わります。

### 遅い道：自分で作ってみる

```cpp:line-numbers=94
  auto next = new CacheLocality(readSystemLocalityInfo());
```
`readSystemLocalityInfo()` でシステムの情報を読み、`new` でオブジェクトを作ります。
この時点では、まだ自分だけが持っているオブジェクトです。

### 登録を試みる

```cpp:line-numbers=95
  if (cache.compare_exchange_strong(value, next, std::memory_order_acq_rel)) {
    return *next;
  }
```
`cache` がまだ `nullptr`（`value` の値）なら、自分のオブジェクト `next` に書き換えます。
成功すれば自分が「初代」なので `*next` を返します。

### 競争に負けたら捨てる

```cpp:line-numbers=98
  delete next;
  return *value;
```
スレッド A と B が同時に初回を迎えた場合を考えます。

1. A も B も最初の `load` で `nullptr` を読みます。
2. 両方が `new` でそれぞれオブジェクトを作ります。
3. A の CAS が先に成功し、`cache` は A のオブジェクトを指します。
4. B の CAS は失敗し、`value` に A のオブジェクトのポインタが書き戻されます。
5. B は自分のオブジェクトを `delete` し、A のものを返します。

結果として、全員が同じオブジェクトを使います。

## ここがすごい

- **ロックを持たない**: ミューテックスを使う版だと、初期化後も毎回ロックを取るか、二重チェックを正しく書く手間がかかります。この書き方なら、速い道は atomic な読み込み 1 回だけです。
- **初期化中に誰も待たない**: 競争に負けたスレッドも待たされることはなく、作り終えてから結果を確認するだけです。その代わり、重い初期化が無駄に複数回走ることがあります。CPU 構成の読み取りはプログラムの最初に数回起きる程度なので、この無駄は許容できる、という判断です。
- **破棄しない**: 作ったオブジェクトは `delete` されず、プログラムの終了まで生き続けます。終了処理の途中で別のスレッドが使っても、すでに壊れている心配がありません。
- **`static` 変数の初期化を軽くする**: `static std::atomic<...> cache;` はゼロ初期化されるだけです。C++ の関数内 `static` に重いコンストラクタを持たせると、コンパイラが「初期化済みか」のフラグとロックを裏で用意します。ここではそれも不要です。

## まとめ

- 遅延初期化は「atomic ポインタ + CAS」でロックなしに書ける。
- 競争に負けた側は自分の作ったものを捨て、勝った側のものを使えばよい。
- この方式は「初期化が複数回走っても害がなく、結果が同じ」場合に向いている。
- `acquire` で読むと、別スレッドが作ったオブジェクトの中身まで安全に見える。
