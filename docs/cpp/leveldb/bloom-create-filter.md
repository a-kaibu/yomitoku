---
title: ハッシュ 1 回から k 個の位置を作るブルームフィルタ
description: LevelDB のブルームフィルタを作る関数。キーごとにハッシュを 1 回だけ計算し、回転させた値を足し続ける「ダブルハッシュ」で k 個のビット位置を作り出す。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2012 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/bloom.cc
lines: [28, 54]
function: BloomFilterPolicy::CreateFilter
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, ビット演算]
---

## ひとことで

ブルームフィルタは、「このキーは **絶対に入っていない**」か「**入っているかもしれない**」かを、少ないメモリで素早く答えるデータ構造です。LevelDB は、ディスクのファイルを読む前にこれで確かめ、無駄な読み込みを減らします。
`CreateFilter` は、キーの一覧からフィルタ（ビットの並び）を作る関数です。1 つのキーにつき k 個のビットを立てますが、**ハッシュの計算は 1 回だけ** です。

## コード

::: code-group

```cpp:line-numbers=28 [日本語訳]
  void CreateFilter(const Slice* keys, int n, std::string* dst) const override {
    // ブルームフィルタの大きさを（ビットとバイトの両方で）計算する
    size_t bits = n * bits_per_key_;

    // n が小さいと誤判定率がとても高くなることがある。
    // フィルタの最低の長さを決めて、それを防ぐ。
    if (bits < 64) bits = 64;

    size_t bytes = (bits + 7) / 8;
    bits = bytes * 8;

    const size_t init_size = dst->size();
    dst->resize(init_size + bytes, 0);
    dst->push_back(static_cast<char>(k_));  // フィルタに探査回数を記録しておく
    char* array = &(*dst)[init_size];
    for (int i = 0; i < n; i++) {
      // ダブルハッシュで一連のハッシュ値を作る。
      // 解析は [Kirsch, Mitzenmacher 2006] を参照。
      uint32_t h = BloomHash(keys[i]);
      const uint32_t delta = (h >> 17) | (h << 15);  // 右に 17 ビット回転
      for (size_t j = 0; j < k_; j++) {
        const uint32_t bitpos = h % bits;
        array[bitpos / 8] |= (1 << (bitpos % 8));
        h += delta;
      }
    }
  }
```

```cpp:line-numbers=28 [原文]
  void CreateFilter(const Slice* keys, int n, std::string* dst) const override {
    // Compute bloom filter size (in both bits and bytes)
    size_t bits = n * bits_per_key_;

    // For small n, we can see a very high false positive rate.  Fix it
    // by enforcing a minimum bloom filter length.
    if (bits < 64) bits = 64;

    size_t bytes = (bits + 7) / 8;
    bits = bytes * 8;

    const size_t init_size = dst->size();
    dst->resize(init_size + bytes, 0);
    dst->push_back(static_cast<char>(k_));  // Remember # of probes in filter
    char* array = &(*dst)[init_size];
    for (int i = 0; i < n; i++) {
      // Use double-hashing to generate a sequence of hash values.
      // See analysis in [Kirsch,Mitzenmacher 2006].
      uint32_t h = BloomHash(keys[i]);
      const uint32_t delta = (h >> 17) | (h << 15);  // Rotate right 17 bits
      for (size_t j = 0; j < k_; j++) {
        const uint32_t bitpos = h % bits;
        array[bitpos / 8] |= (1 << (bitpos % 8));
        h += delta;
      }
    }
  }
```

:::

k の値はコンストラクタで、キー 1 個あたりのビット数から決めています。

```cpp:line-numbers=19
  explicit BloomFilterPolicy(int bits_per_key) : bits_per_key_(bits_per_key) {
    // 探査のコストを少し減らすため、あえて切り捨てている
    k_ = static_cast<size_t>(bits_per_key * 0.69);  // 0.69 ≒ ln(2)
    if (k_ < 1) k_ = 1;
    if (k_ > 30) k_ = 30;
  }
```

## 前提知識

- **`const Slice* keys`**: `Slice` は「バイト列の先頭ポインタと長さ」の組です。文字列をコピーせずに指し示すための軽い型です。ここでは `n` 個の `Slice` の配列を受け取ります。
- **`std::string* dst`**: 結果を書き足す先です。LevelDB は `std::string` をただのバイト列の入れ物として使います。
- **`const override`**: `const` はこのメソッドがオブジェクトの状態を変えないこと、`override` は親クラス `FilterPolicy` の仮想関数を上書きしていることを表します。
- **`dst->resize(size, 0)`**: 文字列の長さを `size` にし、増えた部分を 0 で埋めます。
- **`&(*dst)[init_size]`**: 文字列の `init_size` 番目の文字の住所です。ここから先を生のバイト配列として書き換えます。
- **`(h >> 17) | (h << 15)`**: 32 ビットの値を右に 17 ビット「回転」させます。右にはみ出したビットが左から戻ってきます。

## 何をしているか

キー 2 個、`bits_per_key_ = 10` の場合を追います。k は `10 × 0.69 = 6.9` を切り捨てて 6 です。

### 1. フィルタの大きさを決める

```cpp:line-numbers=30
    size_t bits = n * bits_per_key_;

    // n が小さいと誤判定率がとても高くなることがある。
    // フィルタの最低の長さを決めて、それを防ぐ。
    if (bits < 64) bits = 64;

    size_t bytes = (bits + 7) / 8;
    bits = bytes * 8;
```
`bits = 2 × 10 = 20` ですが、64 未満なので 64 に引き上げます。キーが少ないと誤判定が多くなるので、最低の長さを決めているのです（コメントにもそう書かれています）。
バイト数は `(64 + 7) / 8 = 8` です。`+ 7` は「8 で割って切り上げ」の定番の書き方です。最後に `bits = 8 × 8 = 64` と、バイト単位に合わせ直します。

### 2. 領域を確保し、k を末尾に記録

```cpp:line-numbers=39
    const size_t init_size = dst->size();
    dst->resize(init_size + bytes, 0);
    dst->push_back(static_cast<char>(k_));  // フィルタに探査回数を記録しておく
    char* array = &(*dst)[init_size];
```
`dst` の後ろに 8 バイトの 0 を足し、さらに 1 バイト、k の値（6）を書きます。読み出す側はこの最後のバイトから k を知ります。`array` はフィルタの先頭です。

### 3. キーごとに k 個のビットを立てる

```cpp:line-numbers=43
    for (int i = 0; i < n; i++) {
      // ダブルハッシュで一連のハッシュ値を作る。
      // 解析は [Kirsch, Mitzenmacher 2006] を参照。
      uint32_t h = BloomHash(keys[i]);
      const uint32_t delta = (h >> 17) | (h << 15);  // 右に 17 ビット回転
      for (size_t j = 0; j < k_; j++) {
        const uint32_t bitpos = h % bits;
        array[bitpos / 8] |= (1 << (bitpos % 8));
        h += delta;
      }
    }
```
キーのハッシュ `h` を 1 回計算し、`h` を右に 17 ビット回転した値を `delta` とします。
そのあとは `h % bits` の位置のビットを立て、`h += delta` で次の位置へ、を 6 回くり返します。
ビットを立てるには、`bitpos / 8` でバイトを選び、`1 << (bitpos % 8)` でそのバイトの中のビットを選んで OR します。たとえば `bitpos = 21` なら 2 バイト目（0 始まり）の 5 ビット目です。

## ここがすごい

- **ハッシュは 1 回で済ませる**: 素直に作ると、k 種類のハッシュ関数を用意して k 回計算します。ここでは `h, h+δ, h+2δ, …` という等差数列で k 個の位置を作ります。コメントにある Kirsch と Mitzenmacher の 2006 年の論文で、この方法でも誤判定率がほとんど変わらないことが示されています。
- **k を最適値に近づける**: ブルームフィルタの誤判定率は、k が「キーあたりビット数 × ln 2」のとき最小になります。0.69 はその ln 2 です。コメントのとおり、少しだけ小さく丸めて、調べるビットの数（コスト）を減らしています。
- **パラメータをフィルタに埋め込む**: k を最後の 1 バイトに記録するので、設定を変えた後でも、昔のファイルのフィルタを正しく読めます。データ形式に「自分の読み方」を持たせる設計です。
- **小さすぎるフィルタを防ぐ**: キーが 1 つしかないブロックでも 64 ビットは確保し、誤判定が増えすぎないようにしています。

## まとめ

- ブルームフィルタは「絶対にない」を素早く判定し、無駄な読み込みを減らす。
- 2 つのハッシュ値 `h` と `δ` から `h + iδ` で k 個のハッシュを作れる（ダブルハッシュ）。
- 最適な k は「ビット数 / キー数 × ln 2」。
- 保存するデータには、読み方を決めるパラメータも一緒に書いておくと互換性を保ちやすい。
