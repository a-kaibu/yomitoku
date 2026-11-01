---
title: 比較関数の「種類」で二分探索を作り分ける B-tree のノード内探索
description: absl::btree_map のノード内二分探索。比較関数が bool を返すか三方比較を返すかで、タグ型による関数の作り分けを行い、一致したら早く抜ける。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/btree.h
lines: [838, 893]
function: btree_node::binary_search_impl
difficulty: 2
tags: [探索, アルゴリズム, ジェネリクス, 型システム]
---

## ひとことで

`absl::btree_map` は、1 つのノードに複数のキーを並べて持つ B-tree です。ノードの中で「`k` 以上の最初のキー」の位置を探すのが `binary_search_impl` です。
この関数は 2 つの版があり、比較関数が **`a < b` 型（bool を返す）** か **三方比較型（小さい・等しい・大きいを返す）** かで、コンパイル時に使い分けられます。
三方比較なら「等しい」を一度で知れるので、それを結果に添えたり、途中で抜けたりできます。

## コード

::: code-group

```cpp:line-numbers=838 [日本語訳]
  // ふつうの比較を使った二分探索で、キーが k 以上である最初の値の位置を
  // 返す。
  template <typename K, typename Compare>
  SearchResult<size_type, false> binary_search_impl(
      const K &k, size_type s, size_type e, const Compare &comp,
      std::false_type /* IsCompareTo */) const {
    while (s != e) {
      const size_type mid = (s + e) >> 1;
      if (comp(key(mid), k)) {
        s = mid + 1;
      } else {
        e = mid;
      }
    }
    return SearchResult<size_type, false>{s};
  }

  // 三方比較（compare-to）を使った二分探索で、キーが k 以上である最初の値の位置を
  // 返す。
  template <typename K, typename CompareTo>
  SearchResult<size_type, true> binary_search_impl(
      const K &k, size_type s, size_type e, const CompareTo &comp,
      std::true_type /* IsCompareTo */) const {
    if (params_type::template can_have_multiple_equivalent_keys<K>()) {
      MatchKind exact_match = MatchKind::kNe;
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else {
          e = mid;
          if (c == 0) {
            // キーが k 以上である最初の値を返す必要があるので、等しいキーが
            // 複数ありうる場合は二分探索を続けなければならない。
            //
            exact_match = MatchKind::kEq;
          }
        }
      }
      return {s, exact_match};
    } else {  // 等しいキーが複数になることはない。
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else if (c > 0) {
          e = mid;
        } else {
          return {mid, MatchKind::kEq};
        }
      }
      return {s, MatchKind::kNe};
    }
  }
```

```cpp:line-numbers=838 [原文]
  // Returns the position of the first value whose key is not less than k using
  // binary search performed using plain compare.
  template <typename K, typename Compare>
  SearchResult<size_type, false> binary_search_impl(
      const K &k, size_type s, size_type e, const Compare &comp,
      std::false_type /* IsCompareTo */) const {
    while (s != e) {
      const size_type mid = (s + e) >> 1;
      if (comp(key(mid), k)) {
        s = mid + 1;
      } else {
        e = mid;
      }
    }
    return SearchResult<size_type, false>{s};
  }

  // Returns the position of the first value whose key is not less than k using
  // binary search performed using compare-to.
  template <typename K, typename CompareTo>
  SearchResult<size_type, true> binary_search_impl(
      const K &k, size_type s, size_type e, const CompareTo &comp,
      std::true_type /* IsCompareTo */) const {
    if (params_type::template can_have_multiple_equivalent_keys<K>()) {
      MatchKind exact_match = MatchKind::kNe;
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else {
          e = mid;
          if (c == 0) {
            // Need to return the first value whose key is not less than k,
            // which requires continuing the binary search if there could be
            // multiple equivalent keys.
            exact_match = MatchKind::kEq;
          }
        }
      }
      return {s, exact_match};
    } else {  // Can't have multiple equivalent keys.
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else if (c > 0) {
          e = mid;
        } else {
          return {mid, MatchKind::kEq};
        }
      }
      return {s, MatchKind::kNe};
    }
  }
```

:::

## 前提知識

- **関数テンプレート `template <typename K, typename Compare>`**: キーの型や比較関数の型ごとに、関数が自動で作られます。
- **オーバーロード**: 同じ名前の関数を引数の型違いで複数定義できます。ここでは最後の引数が `std::false_type` か `std::true_type` かで 2 つの版を区別しています。
- **`std::true_type` / `std::false_type`**: 中身のない「型」で、`true` / `false` を型として表したものです。引数に渡すと、どちらの版を呼ぶかをコンパイル時に選べます（タグディスパッチと呼ばれる技法）。引数名がない（コメントだけ）のは、値そのものは使わないからです。
- **`absl::weak_ordering`**: 三方比較の結果を表す型です。`0` と比べて `< 0`（小さい）、`== 0`（等しい）、`> 0`（大きい）が分かります。C++20 の `std::weak_ordering` に相当します。
- **`(s + e) >> 1`**: 2 で割るのと同じです。ここでは `s` も `e` もノード内の小さな添字なので、足してもあふれません。
- **`if (params_type::template can_have_multiple_equivalent_keys<K>())`**: 依存型の中のテンプレート関数を呼ぶときは `template` キーワードが必要、という C++ の文法上の決まりです。「検索キーと等しいキーがノード内に複数ありうるか」を返す `constexpr` 関数です。multimap のときや、別の型のキーで検索するときに真になります。
- **`{s, MatchKind::kEq}`**: 戻り値の型 `SearchResult` を波かっこで組み立てる書き方です。

## 何をしているか

### 1. bool 版

```cpp:line-numbers=838
  // Returns the position of the first value whose key is not less than k using
  // binary search performed using plain compare.
  template <typename K, typename Compare>
  SearchResult<size_type, false> binary_search_impl(
      const K &k, size_type s, size_type e, const Compare &comp,
      std::false_type /* IsCompareTo */) const {
    while (s != e) {
      const size_type mid = (s + e) >> 1;
      if (comp(key(mid), k)) {
        s = mid + 1;
      } else {
        e = mid;
      }
    }
    return SearchResult<size_type, false>{s};
```

標準的な「lower_bound」型の二分探索です。範囲 `[s, e)` を半分にしていき、`key(mid) < k` なら右半分、そうでなければ左半分に絞ります。
キーが `[10, 20, 30, 40]` で `k = 25` なら、`mid = 2`（30）→ 左へ、`mid = 1`（20）→ 右へ、で `s = 2` が答えです。

### 2. 三方比較版・重複キーあり

```cpp:line-numbers=857
  template <typename K, typename CompareTo>
  SearchResult<size_type, true> binary_search_impl(
      const K &k, size_type s, size_type e, const CompareTo &comp,
      std::true_type /* IsCompareTo */) const {
    if (params_type::template can_have_multiple_equivalent_keys<K>()) {
      MatchKind exact_match = MatchKind::kNe;
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else {
          e = mid;
          if (c == 0) {
            // Need to return the first value whose key is not less than k,
            // which requires continuing the binary search if there could be
            // multiple equivalent keys.
            exact_match = MatchKind::kEq;
          }
        }
      }
      return {s, exact_match};
```

multimap のように同じキーが複数ありうる場合、「最初の」該当位置を返す必要があるので、等しくても探索を続けます。ただし途中で一度でも `c == 0` になったら `exact_match = kEq` を覚えておき、最後に位置と一緒に返します。

### 3. 三方比較版・重複キーなし

```cpp:line-numbers=879
    } else {  // Can't have multiple equivalent keys.
      while (s != e) {
        const size_type mid = (s + e) >> 1;
        const absl::weak_ordering c = comp(key(mid), k);
        if (c < 0) {
          s = mid + 1;
        } else if (c > 0) {
          e = mid;
        } else {
          return {mid, MatchKind::kEq};
        }
      }
      return {s, MatchKind::kNe};
    }
```

キーが一意なら、等しいものを見つけた瞬間に `{mid, MatchKind::kEq}` を返して終われます。見つからなければ `kNe`（不一致）を添えて挿入位置を返します。

## ここがすごい

- **比較回数の節約**: bool 版では「等しいか」を知るには `!(a < b) && !(b < a)` と 2 回比べる必要があります。三方比較版は 1 回の比較で 3 通りが分かるので、`find` のときに追加の比較をせずに一致を判断できます。文字列のように比較が高いキーで効きます。
- **分岐をコンパイル時に消す**: どの版を使うかは型で決まり、`can_have_multiple_equivalent_keys` もコンパイル時の定数です。実行時の `if` は最適化で消え、それぞれ無駄のないループになります。
- **呼び出し側は 1 つの名前で済む**: 使う側は `binary_search_impl(k, s, e, comp, タグ)` と呼ぶだけです。比較関数の性質をタグ型にして渡すことで、同じ名前のまま最適な実装を選ばせています。

## まとめ

- `std::true_type` / `std::false_type` を引数に渡すタグディスパッチで、実装をコンパイル時に選べる。
- 三方比較は「等しい」を 1 回で判定できるので、探索の比較回数を減らせる。
- 重複キーがあるときは「最初の位置」を返すため、等しくても探索を続ける必要がある。
- 範囲を `[s, e)` の半開区間で持つと、二分探索の境界処理が単純になる。
