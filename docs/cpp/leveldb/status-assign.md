---
title: ポインタの比較 1 回で「自己代入」と「両方成功」をまとめて片付ける
description: LevelDB の Status のコピー代入とムーブ代入。コピーでは state_ のポインタが等しければ何もしないことで自己代入と成功同士を一度に処理し、ムーブでは swap だけで済ませる。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: include/leveldb/status.h
lines: [103, 118]
function: Status::operator=
difficulty: 2
format: 2
tags: [イディオム, メモリ管理, エラー処理]
---

## ひとことで

`Status` は、LevelDB の関数が成功・失敗を返すためのクラスで、中身はポインタ `state_` 1 個だけです。成功なら `nullptr`、失敗ならエラー内容を入れた配列を指します。
ここで読むのは、`Status` の **コピー** と **代入** の書き方です。とくにコピー代入では、ポインタを 1 回比べるだけで、危ない場合とよくある場合をまとめて処理しています。

## コード

::: code-group

```cpp:line-numbers=103 [日本語訳]
inline Status::Status(const Status& rhs) {
  state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
}
inline Status& Status::operator=(const Status& rhs) {
  // 次の条件は、別名（this == &rhs のとき）と、rhs と *this が
  // どちらも ok というよくある場合の両方をとらえる。
  if (state_ != rhs.state_) {
    delete[] state_;
    state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
  }
  return *this;
}
inline Status& Status::operator=(Status&& rhs) noexcept {
  std::swap(state_, rhs.state_);
  return *this;
}
```

```cpp:line-numbers=103 [原文]
inline Status::Status(const Status& rhs) {
  state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
}
inline Status& Status::operator=(const Status& rhs) {
  // The following condition catches both aliasing (when this == &rhs),
  // and the common case where both rhs and *this are ok.
  if (state_ != rhs.state_) {
    delete[] state_;
    state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
  }
  return *this;
}
inline Status& Status::operator=(Status&& rhs) noexcept {
  std::swap(state_, rhs.state_);
  return *this;
}
```

:::

## 前提知識

- **コピーコンストラクタ `Status(const Status& rhs)`**: 既存のオブジェクトから、新しいオブジェクトを複製して作るときに呼ばれます。`Status b = a;` のような場面です。
- **コピー代入 `operator=(const Status& rhs)`**: すでにあるオブジェクトに、別のオブジェクトの内容を代入するときに呼ばれます。`b = a;` のような場面です。
- **ムーブ代入 `operator=(Status&& rhs)`**: `&&` は「もう使わない一時的なオブジェクト」を受け取る型です。中身を複製せずに奪ってよい場面で呼ばれます。
- **`noexcept`**: この関数が例外を投げないことを約束します。標準ライブラリのコンテナは、これが付いているとムーブを安心して使えます。
- **`delete[] state_`**: `new[]` で確保した配列を解放します。`nullptr` に対して呼んでも何も起きません。
- **`CopyState`**: エラー内容の配列を新しく確保して複製する関数です。
- **`std::swap(a, b)`**: 2 つの値を入れ替えます。
- **`return *this;`**: 代入の結果として自分自身を返します。`a = b = c;` のようにつなげて書けるようにする慣習です。

## 何をしているか

### 1. コピーコンストラクタ

```cpp:line-numbers=103
inline Status::Status(const Status& rhs) {
  state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
}
```
元が成功（`nullptr`）なら成功のまま、失敗なら配列を複製します。

### 2. コピー代入

```cpp:line-numbers=106
inline Status& Status::operator=(const Status& rhs) {
  // 次の条件は、別名（this == &rhs のとき）と、rhs と *this が
  // どちらも ok というよくある場合の両方をとらえる。
  if (state_ != rhs.state_) {
    delete[] state_;
    state_ = (rhs.state_ == nullptr) ? nullptr : CopyState(rhs.state_);
  }
  return *this;
}
```
`state_ != rhs.state_` のときだけ、古い配列を解放して新しく複製します。ポインタが等しくなるのは次の 2 つの場合です。

- **自己代入**（`a = a;`）: 同じオブジェクトなので、ポインタも同じです。ここで先に `delete[]` してしまうと、複製元まで消えてしまいます。
- **両方とも成功**: どちらも `nullptr` です。何もする必要がありません。

失敗同士でも、別々に確保された配列なら住所は違うので、きちんと複製されます。

### 3. ムーブ代入

```cpp:line-numbers=115
inline Status& Status::operator=(Status&& rhs) noexcept {
  std::swap(state_, rhs.state_);
  return *this;
}
```
`b = std::move(a);` のとき、`b` と `a` のポインタを入れ替えるだけです。`b` は `a` の配列を受け取り、`a` は `b` の古い配列を持つことになります。`a` が破棄されるときに、その古い配列も解放されます。

## ここがすごい

- **比較 1 回で 2 つの場合を処理**: 条件の上のコメントにあるとおり、この条件は「自己代入の防止」と「成功同士の代入の省略」を同時にこなします。`Status` はほとんどが成功なので、よくある場合が比較 1 回で終わります。
- **ムーブは確保も解放もしない**: 関数から `Status` を返したり、変数に入れ直したりする場面の多くはムーブになります。ポインタ 2 つの入れ替えだけで済むので、とても安価です。
- **swap で後始末を任せる**: ムーブ代入で、自分の古い配列をその場で `delete[]` する代わりに相手に渡しています。相手のデストラクタが解放してくれるので、コードが 1 行で済み、自己ムーブ（`a = std::move(a)`）でも壊れません。
- **ヘッダに `inline` で置く**: 小さな関数なので、呼び出し元に展開されて関数呼び出しのコストも消えます。

## まとめ

- コピー代入では自己代入に注意し、解放の前に確かめる。
- 「ポインタが同じなら何もしない」という条件は、自己代入と「両方空」をまとめて防げる。
- ムーブ代入は `swap` で書くと短く、後始末も相手のデストラクタに任せられる。
- ムーブには `noexcept` を付けておく。
