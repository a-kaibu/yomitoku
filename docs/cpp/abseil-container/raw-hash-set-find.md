---
title: SwissTable の検索ループ — 7 ビットで絞り込み、空きを見たら即終了
description: absl::flat_hash_map の find の心臓部。16 スロットを一度に照合して候補だけキー比較し、空きのあるグループに来たら「無い」と判断する。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/raw_hash_set.h
lines: [3675, 3703]
function: raw_hash_set::find_large
difficulty: 2
tags: [ハッシュ, データ構造, 探索, キャッシュ]
---

## ひとことで

`find_large` は、`absl::flat_hash_map` や `absl::flat_hash_set` でキーを探すときの本体です。
ハッシュ値を **上位 7 ビット（H2）** と **それ以外（H1）** に分け、H1 で探し始める場所を決め、H2 で 16 スロット分の候補を一気に絞り込みます。
候補だけ本物のキーと比べ、**空きスロットのあるグループに出会ったら「見つからない」と即答** します。

## コード

::: code-group

```cpp:line-numbers=3675 [日本語訳]
  template <class K>
  iterator find_large(absl::type_identity_t<K> key) {
    static_assert(std::is_same_v<K, FindLargeKey<K>>);
    prefetch_heap_block();
    const size_t hash = hash_of(key);
    const size_t cap = common().capacity();
    ABSL_ASSUME(cap > kMaxSmallCapacity);
    auto seq = probe(ProbeCapacity{cap}, hash);
    const h2_t h2 = H2(hash);
    ctrl_t* ctrl = control();
    slot_type* slot_array = this->slot_array(cap);
    while (true) {
      // スロットのプリフェッチより先にグループを読むと、クリティカルパスの待ち時間が減る。
      Group g{ctrl + seq.offset()};
#ifndef ABSL_HAVE_MEMORY_SANITIZER
      absl::PrefetchToLocalCache(slot_array + seq.offset());
#endif
      // 1 回のループで終わると予測する（見つかる場合によくあるケース）。
      if (auto match = g.Match(h2); ABSL_PREDICT_TRUE(match)) {
        do {
          const size_t offset = seq.offset(*match);
          if (ABSL_PREDICT_TRUE(equal_to(key, slot_array + offset)))
            return iterator_at_ptr(ctrl + offset, slot_array + offset);
        } while (ABSL_PREDICT_FALSE(++match));
      }
      if (ABSL_PREDICT_TRUE(g.MaskEmpty())) return end();
      seq.next();
    }
  }
```

```cpp:line-numbers=3675 [原文]
  template <class K>
  iterator find_large(absl::type_identity_t<K> key) {
    static_assert(std::is_same_v<K, FindLargeKey<K>>);
    prefetch_heap_block();
    const size_t hash = hash_of(key);
    const size_t cap = common().capacity();
    ABSL_ASSUME(cap > kMaxSmallCapacity);
    auto seq = probe(ProbeCapacity{cap}, hash);
    const h2_t h2 = H2(hash);
    ctrl_t* ctrl = control();
    slot_type* slot_array = this->slot_array(cap);
    while (true) {
      // Loading the group before slot prefetch decreases critical path latency.
      Group g{ctrl + seq.offset()};
#ifndef ABSL_HAVE_MEMORY_SANITIZER
      absl::PrefetchToLocalCache(slot_array + seq.offset());
#endif
      // Predict one iteration (common case for find-hit).
      if (auto match = g.Match(h2); ABSL_PREDICT_TRUE(match)) {
        do {
          const size_t offset = seq.offset(*match);
          if (ABSL_PREDICT_TRUE(equal_to(key, slot_array + offset)))
            return iterator_at_ptr(ctrl + offset, slot_array + offset);
        } while (ABSL_PREDICT_FALSE(++match));
      }
      if (ABSL_PREDICT_TRUE(g.MaskEmpty())) return end();
      seq.next();
    }
  }
```

:::

## 前提知識

- **`template <class K>`**: キーの型 `K` を引数にとるテンプレート関数です。`std::string` のキーを `std::string_view` で探す、といった使い方を可能にします。
- **`static_assert`**: コンパイル時のチェックです。条件が偽ならコンパイルが止まります。
- **`const size_t hash = ...`**: `const` は「この変数はあとで書き換えない」という宣言です。
- **`while (true)`**: 無限ループです。`return` で抜けます。
- **`if (auto match = ...; 条件)`**: C++17 の「初期化付き if」です。変数 `match` を作り、そのまま条件判定に使えます。`match` はこの if の中だけで有効です。
- **`do { ... } while (...)`**: 本体を最低 1 回実行してから条件を調べるループです。
- **`*match` と `++match`**: `match` は「一致したスロット番号を順に返すビットマスク」で、`*` で現在の番号、`++` で次へ進みます。全部見終わると偽になります。
- **`ABSL_PREDICT_TRUE` / `ABSL_PREDICT_FALSE`**: 「この条件はたいてい真（偽）」とコンパイラに伝えるマクロです。よく通る道を速いコードにしてもらえます。
- **`#ifndef ... #endif`**: プリプロセッサの条件分岐です。メモリ検査ツール（MSan）を使うビルドではプリフェッチを外しています。

## 何をしているか

### 1. 準備

```cpp:line-numbers=3678
    prefetch_heap_block();
    const size_t hash = hash_of(key);
    const size_t cap = common().capacity();
    ABSL_ASSUME(cap > kMaxSmallCapacity);
    auto seq = probe(ProbeCapacity{cap}, hash);
    const h2_t h2 = H2(hash);
    ctrl_t* ctrl = control();
    slot_type* slot_array = this->slot_array(cap);
```

`prefetch_heap_block()` で表のメモリを先読みし、キーのハッシュ値を計算します。
`probe(...)` で探索の順番（`probe_seq`）を作り、`H2(hash)` でハッシュの上位 7 ビットを取り出します。制御バイトの配列 `ctrl` とスロットの配列 `slot_array` も手元に置きます。

### 2. グループを読む

```cpp:line-numbers=3688
      Group g{ctrl + seq.offset()};
#ifndef ABSL_HAVE_MEMORY_SANITIZER
      absl::PrefetchToLocalCache(slot_array + seq.offset());
#endif
```

`Group g{ctrl + seq.offset()}` で、現在位置から 16 個の制御バイトを読み込みます。
同時に、対応するスロットのメモリを `PrefetchToLocalCache` で先読みします。コメントにあるとおり、**グループを先に読んでからプリフェッチ** するほうが待ち時間が短くなるそうです。

### 3. 候補だけ比べる

```cpp:line-numbers=3693
      if (auto match = g.Match(h2); ABSL_PREDICT_TRUE(match)) {
        do {
          const size_t offset = seq.offset(*match);
          if (ABSL_PREDICT_TRUE(equal_to(key, slot_array + offset)))
            return iterator_at_ptr(ctrl + offset, slot_array + offset);
        } while (ABSL_PREDICT_FALSE(++match));
```

`g.Match(h2)` は、制御バイトが H2 と一致したスロットのビットマスクです。7 ビットの一致なので、関係ないキーはおよそ 128 分の 1 しか残りません。
候補ごとに `equal_to(key, slot_array + offset)` で本物のキーを比べ、一致すればそのイテレータを返します。

### 4. 空きがあれば終了、なければ次へ

```cpp:line-numbers=3700
      if (ABSL_PREDICT_TRUE(g.MaskEmpty())) return end();
      seq.next();
```

このグループに空きスロットが 1 つでもあれば、探しているキーはこれより先にはありません（挿入時、空きがあればそこに入っているはずだからです）。`end()` を返します。
空きがなければ `seq.next()` で次のグループに進みます。

## ここがすごい

- **キー比較がほとんど起きない**: 文字列などのキー比較は高くつきます。1 バイトの制御バイトで先にふるい落とすので、ハズレのキーを比べることはまれです。
- **終了判定も 1 グループ単位**: 「空きを見たら終わり」を 16 スロットまとめて判定するので、見つからない場合も短い時間で答えが出ます。
- **よくある場合にコードを寄せる**: ループ内のコメント「Predict one iteration (common case for find-hit)」のとおり、最初のグループで見つかる場合が最速になるよう分岐予測のヒントを付けています。
- **メモリ待ちを隠す**: 制御バイトとスロットは別の場所にあるので、両方をなるべく早く読み始めるようにプリフェッチを差し込んでいます。

## まとめ

- ハッシュ値を「場所を決める部分」と「照合用の小さな指紋」に分けると、比較を安くできる。
- 指紋で候補を絞り、最後に本物のキーで確かめるのが SwissTable の基本形。
- 「空きがあれば打ち切り」は挿入側のルールと対になって初めて成り立つ。
- 分岐予測のヒントやプリフェッチで、よく通る道とメモリ待ちを最適化している。
