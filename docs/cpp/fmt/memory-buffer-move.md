---
title: 内蔵配列のときだけコピーする、スモールバッファのムーブ
description: basic_memory_buffer のムーブ処理。中身がヒープにあればポインタを奪うだけで済ませ、オブジェクト内蔵の配列にあるときだけ要素をコピーする。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1043, 1059]
function: basic_memory_buffer::move
difficulty: 2
format: 2
tags: [メモリ管理, データ構造, イディオム]
---

## ひとことで

`move(other)` は、別の `basic_memory_buffer`（`other`）の中身を自分に **移す** 関数で、ムーブコンストラクタとムーブ代入から呼ばれます。

このバッファは、短いうちはオブジェクトの中の配列 `store_` に、長くなるとヒープ上の領域にデータを置きます。**どちらにあるかで移し方を変える** のがポイントです。

## コード

::: code-group

```cpp:line-numbers=1043 [日本語訳]
  // other のデータをこのバッファに移す。
  FMT_CONSTEXPR20 void move(basic_memory_buffer& other) {
    T* data = other.data();
    size_t size = other.size(), capacity = other.capacity();
    if (!move_alloc(other)) return;
    if (data == other.store_) {
      this->set(store_, capacity);
      detail::copy<T>(other.store_, other.store_ + size, store_);
    } else {
      this->set(data, capacity);
      // 解放時に delete が呼ばれないよう、ポインタを内蔵配列に
      // 向けておく。
      other.set(other.store_, 0);
      other.clear();
    }
    this->resize(size);
  }
```

```cpp:line-numbers=1043 [原文]
  // Move data from other to this buffer.
  FMT_CONSTEXPR20 void move(basic_memory_buffer& other) {
    T* data = other.data();
    size_t size = other.size(), capacity = other.capacity();
    if (!move_alloc(other)) return;
    if (data == other.store_) {
      this->set(store_, capacity);
      detail::copy<T>(other.store_, other.store_ + size, store_);
    } else {
      this->set(data, capacity);
      // Set pointer to the inline array so that delete is not called
      // when deallocating.
      other.set(other.store_, 0);
      other.clear();
    }
    this->resize(size);
  }
```

:::

## 前提知識

- **ムーブ**: C++ で「コピーせずに中身を移す」操作です。移された側（`other`）は、壊れてはいないが中身は空っぽ、という状態になるのが普通です。
- **参照 `basic_memory_buffer& other`**: `other` は元のオブジェクトそのものを指します。コピーではありません。
- **`this->`**: 自分自身のメンバを指します。基底クラスのテンプレートのメンバを呼ぶときは、`this->` を付けないと見つからないことがあります。
- **`set(ptr, capacity)`**: バッファが指すメモリと容量を差し替える基底クラスの関数です。
- **`store_`**: オブジェクトに内蔵された配列です。オブジェクトごとに別の場所にあります。
- **`move_alloc`**: アロケータ（メモリを確保する係）の移し方を決める、同じクラスの関数です。アロケータ同士で互換性がなければ中身をコピーして `false` を返します。

## 何をしているか

### 1. 相手の状態を控える

```cpp:line-numbers=1045
    T* data = other.data();
    size_t size = other.size(), capacity = other.capacity();
    if (!move_alloc(other)) return;
```

`other` のデータの場所 `data`、サイズ、容量を覚えておきます。アロケータを移せない場合は `move_alloc` がコピーまで済ませているので、ここで終わります。

### 2. 相手が内蔵配列を使っていたらコピー

```cpp:line-numbers=1048
    if (data == other.store_) {
      this->set(store_, capacity);
      detail::copy<T>(other.store_, other.store_ + size, store_);
```

`other` が 10 文字だけ持っていて、それが `other.store_` にあるとします。`store_` は `other` の体の一部なので、ポインタだけもらっても、`other` が消えればデータも消えます。

そこで、自分の `store_` を使うよう設定し、10 文字を `other.store_` から自分の `store_` にコピーします。

### 3. 相手がヒープを使っていたらポインタを奪う

```cpp:line-numbers=1051
    } else {
      this->set(data, capacity);
      // 解放時に delete が呼ばれないよう、ポインタを内蔵配列に
      // 向けておく。
      other.set(other.store_, 0);
      other.clear();
    }
```

`other` が 10000 文字をヒープに持っているなら、自分のポインタをその領域に向けるだけです。コピーは起きません。

そのあと `other` を「自分の `store_` を指す、容量 0、サイズ 0」の状態にします。こうしておけば、`other` のデストラクタは「内蔵配列を使っている」と判断して、奪われた領域を解放しません。二重解放を防ぐための大事な一手です。

### 4. サイズを合わせる

```cpp:line-numbers=1058
    this->resize(size);
```

最後に自分のサイズを `size` にして完了です。

## ここがすごい

- **場合分けで最小のコスト**: ヒープにあるときは O(1) のポインタの付け替え、内蔵配列にあるときだけ要素のコピーです。内蔵配列は小さい（デフォルト 500 要素）ので、コピーしても安く済みます。
- **ムーブ元を安全な状態に戻す**: `else` 側のコメントにあるとおり、`other` のポインタを自分の `store_` に戻して解放を防いでいます。ムーブ後のオブジェクトも、そのまま再利用や破棄ができます。
- **スモールバッファ最適化の落とし穴を理解した実装**: 「中身がオブジェクト内にあるとポインタを移すだけでは済まない」は、`std::string` などでも同じ問題です。この関数はそれを短く正しく扱う手本になっています。

## まとめ

- オブジェクト内蔵の配列は、ムーブでもコピーが必要になる。
- ヒープ上の領域は、ポインタを付け替えるだけでムーブできる。
- ムーブ元は「解放しても安全な空の状態」にしておく。
- 状態に応じて移し方を変えると、ムーブのコストを最小にできる。
