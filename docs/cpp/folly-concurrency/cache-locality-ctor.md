---
title: キャッシュを共有する CPU どうしが隣になるように並べ替える
description: CacheLocality のコンストラクタは CPU ごとのキャッシュ共有情報から、近い CPU が隣り合う番号付けを作る。大きいキャッシュから順に比べる比較関数がポイント。
language: cpp
project: Folly（並行処理・I/O）
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
format: 2
file: folly/concurrency/CacheLocality.cpp
lines: [102, 154]
function: CacheLocality::CacheLocality
difficulty: 2
tags: [キャッシュ, ソート, 並行処理, アルゴリズム]
---

## ひとことで

このコンストラクタは、「CPU 番号 → その CPU が属するキャッシュのグループ」という表を受け取り、**キャッシュを共有する CPU ほど近い番号になる並び順** を作ります。
たとえば 4 つの CPU があり、0 と 2 が同じ L2 キャッシュを、1 と 3 が別の L2 キャッシュを共有しているなら、`0, 2, 1, 3` の順に並べます。
この並び順は、データを CPU ごとに分けて置く仕組み（`AccessSpreader`）が「近い CPU には同じ区画を割り当てる」ために使います。

## コード

::: code-group

```cpp:line-numbers=102 [日本語訳]
CacheLocality::CacheLocality(std::vector<std::vector<size_t>> equivClasses) {
  numCpus = equivClasses.size();

  for (size_t cpu = 0; cpu < numCpus; ++cpu) {
    for (size_t level = 0; level < equivClasses[cpu].size(); ++level) {
      if (equivClasses[cpu][level] == cpu) {
        // 同値類は 1 回だけ数えたいので、その代表を処理している
        // ときに数える。
        while (numCachesByLevel.size() <= level) {
          numCachesByLevel.push_back(0);
        }
        numCachesByLevel[level]++;
      }
    }
  }

  std::vector<size_t> cpus(numCpus);
  std::iota(cpus.begin(), cpus.end(), 0);

  std::sort(cpus.begin(), cpus.end(), [&](size_t lhs, size_t rhs) -> bool {
    auto& lhsEquiv = equivClasses[lhs];
    auto& rhsEquiv = equivClasses[rhs];

    // CPU ごとにキャッシュの数が違う場合は、まずキャッシュの数で
    // グループ分けして狭義弱順序を保証する。結果の並びは
    // 最適でないかもしれない。
    if (lhsEquiv.size() != rhsEquiv.size()) {
      return lhsEquiv.size() < rhsEquiv.size();
    }

    // 添字が最大のキャッシュの同値類で並べる。向きは
    // どちらでもよい。
    for (size_t i = lhsEquiv.size(); i > 0; --i) {
      auto idx = i - 1;
      if (lhsEquiv[idx] != rhsEquiv[idx]) {
        return lhsEquiv[idx] < rhsEquiv[idx];
      }
    }

    // 同順位は CPU 番号で決定的に決める。
    return lhs < rhs;
  });

  // これで CPU は近さの順に並び、隣り合う要素は離れた要素より
  // 互いに近い。区画分けには逆向きの対応表が欲しい。
  // 出発点が CPU 番号だからだ。
  localityIndexByCpu.resize(numCpus);
  for (size_t i = 0; i < cpus.size(); ++i) {
    localityIndexByCpu[cpus[i]] = i;
  }

  equivClassesByCpu = std::move(equivClasses);
}
```

```cpp:line-numbers=102 [原文]
CacheLocality::CacheLocality(std::vector<std::vector<size_t>> equivClasses) {
  numCpus = equivClasses.size();

  for (size_t cpu = 0; cpu < numCpus; ++cpu) {
    for (size_t level = 0; level < equivClasses[cpu].size(); ++level) {
      if (equivClasses[cpu][level] == cpu) {
        // we only want to count the equiv classes once, so we do it when we
        // are processing their representative.
        while (numCachesByLevel.size() <= level) {
          numCachesByLevel.push_back(0);
        }
        numCachesByLevel[level]++;
      }
    }
  }

  std::vector<size_t> cpus(numCpus);
  std::iota(cpus.begin(), cpus.end(), 0);

  std::sort(cpus.begin(), cpus.end(), [&](size_t lhs, size_t rhs) -> bool {
    auto& lhsEquiv = equivClasses[lhs];
    auto& rhsEquiv = equivClasses[rhs];

    // If different cpus have different numbers of caches group first by number
    // of caches to guarantee strict weak ordering, even though the resulting
    // order may be sub-optimal.
    if (lhsEquiv.size() != rhsEquiv.size()) {
      return lhsEquiv.size() < rhsEquiv.size();
    }

    // Order by equiv class of cache with highest index, direction doesn't
    // matter.
    for (size_t i = lhsEquiv.size(); i > 0; --i) {
      auto idx = i - 1;
      if (lhsEquiv[idx] != rhsEquiv[idx]) {
        return lhsEquiv[idx] < rhsEquiv[idx];
      }
    }

    // Break ties deterministically by cpu.
    return lhs < rhs;
  });

  // The cpus are now sorted by locality, with neighboring entries closer
  // to each other than entries that are far away.  For striping we want
  // the inverse map, since we are starting with the cpu.
  localityIndexByCpu.resize(numCpus);
  for (size_t i = 0; i < cpus.size(); ++i) {
    localityIndexByCpu[cpus[i]] = i;
  }

  equivClassesByCpu = std::move(equivClasses);
}
```

:::

## 前提知識

- **キャッシュの階層**: CPU には L1・L2・L3 と段階的に大きくなるキャッシュがあり、上の段ほど多くの CPU で共有されます。同じキャッシュを共有する CPU どうしはデータのやりとりが速いです。
- **同値類（equivalence class）**: 「同じキャッシュを共有する CPU の集まり」のことです。ここでは集まりの代表として **一番小さい CPU 番号** を使います。`equivClasses[cpu][level]` は「CPU `cpu` の、段 `level` のキャッシュのグループの代表番号」です。
- **`std::vector<std::vector<size_t>>`**: 可変長配列の配列、つまり 2 次元の表です。
- **`std::iota(first, last, 0)`**: 範囲に `0, 1, 2, ...` と連番を埋めます。
- **`std::sort(first, last, 比較関数)`**: 並べ替えます。比較関数は「`lhs` を `rhs` より前に置くなら `true`」を返します。比較関数は「狭義弱順序」という一貫性のルールを守る必要があり、守らないと結果がおかしくなったり、動作が未定義になったりします。
- **ラムダ式 `[&](size_t lhs, size_t rhs) -> bool { ... }`**: その場で作る無名関数です。`[&]` で周りの変数（ここでは `equivClasses`）を参照で使えます。
- **`auto&`**: 型を自動で決め、コピーせずに参照で受け取ります。
- **`std::move`**: 中身をコピーせずに「移動」します。大きな配列でも、内部のポインタを付け替えるだけで済みます。

## 何をしているか

CPU が 4 つで、キャッシュが 2 段（段 0 = L1、段 1 = L2）の例で追います。

| CPU | 段 0 の代表 | 段 1 の代表 |
| --- | --- | --- |
| 0 | 0 | 0 |
| 1 | 1 | 1 |
| 2 | 2 | 0 |
| 3 | 3 | 1 |

L1 は各 CPU が専用、L2 は 0 と 2、1 と 3 が共有しています。

### キャッシュの個数を数える

```cpp:line-numbers=105
  for (size_t cpu = 0; cpu < numCpus; ++cpu) {
    for (size_t level = 0; level < equivClasses[cpu].size(); ++level) {
      if (equivClasses[cpu][level] == cpu) {
        // 同値類は 1 回だけ数えたいので、その代表を処理している
        // ときに数える。
        while (numCachesByLevel.size() <= level) {
          numCachesByLevel.push_back(0);
        }
        numCachesByLevel[level]++;
      }
    }
  }
```
各段で「代表番号が自分自身」の CPU を数えれば、その段のキャッシュの個数になります。
段 0 では 4 つ全部が自分自身なので 4 個、段 1 では CPU 0 と 1 だけなので 2 個です。
`numCachesByLevel` は `{4, 2}` になります。

### 並べ替える

```cpp:line-numbers=118
  std::vector<size_t> cpus(numCpus);
  std::iota(cpus.begin(), cpus.end(), 0);

  std::sort(cpus.begin(), cpus.end(), [&](size_t lhs, size_t rhs) -> bool {
    auto& lhsEquiv = equivClasses[lhs];
    auto& rhsEquiv = equivClasses[rhs];

    // CPU ごとにキャッシュの数が違う場合は、まずキャッシュの数で
    // グループ分けして狭義弱順序を保証する。結果の並びは
    // 最適でないかもしれない。
    if (lhsEquiv.size() != rhsEquiv.size()) {
      return lhsEquiv.size() < rhsEquiv.size();
    }

    // 添字が最大のキャッシュの同値類で並べる。向きは
    // どちらでもよい。
    for (size_t i = lhsEquiv.size(); i > 0; --i) {
      auto idx = i - 1;
      if (lhsEquiv[idx] != rhsEquiv[idx]) {
        return lhsEquiv[idx] < rhsEquiv[idx];
      }
    }

    // 同順位は CPU 番号で決定的に決める。
    return lhs < rhs;
  });
```
まず `cpus = {0, 1, 2, 3}` を作ります。
比較関数は、**一番上の段から** 代表番号を比べます（`for` ループの部分）。

- 段 1 の代表は、CPU 0 と 2 が `0`、CPU 1 と 3 が `1` なので、`{0, 2}` が `{1, 3}` より前になります。
- 段 1 が同じ CPU 0 と 2 は、段 0 の代表 `0` と `2` で比べ、0 が前です。

結果は `cpus = {0, 2, 1, 3}` です。

最初の `if` は、CPU によってキャッシュの段数が違う珍しい場合への備えです。段数で先に分けることで、比較関数の一貫性を保っています。
全部同じなら、最後に CPU 番号そのもので比べます（`return lhs < rhs;`）。

### 逆引きの表を作る

```cpp:line-numbers=148
  localityIndexByCpu.resize(numCpus);
  for (size_t i = 0; i < cpus.size(); ++i) {
    localityIndexByCpu[cpus[i]] = i;
  }
```
`cpus[i]` は「並び順で i 番目の CPU」です。
使う側は「CPU 番号から並び順を知りたい」ので、逆向きの表 `localityIndexByCpu` を作ります。
この例では `localityIndexByCpu = {0, 2, 1, 3}` です（CPU 1 は 2 番目、CPU 2 は 1 番目）。

## ここがすごい

- **集合を代表番号で済ませる**: このコンストラクタの直後にあるコメントのとおり、Linux の `shared_cpu_list` を完全に解析しなくても、先頭の数字（最小の CPU 番号）さえ読めば代表として使えます。集合の比較が整数の比較に変わります。
- **大きいキャッシュから比べる**: 一番上の段（L3 など）で先にまとめ、その中で下の段を比べることで、「同じ L3 の中で同じ L2 どうしが隣」という入れ子の並びが 1 回のソートでできます。
- **比較関数の安全性に気を配る**: 段数が違う CPU が混ざっても狭義弱順序が崩れないよう、まず段数で比べ、最後は CPU 番号で決着をつけています。
- **向きを変えた表を用意する**: 並べ替えた結果をそのまま持たず、使う側の問い（CPU 番号 → 位置）に合わせた逆引き表を作っておきます。

## まとめ

- 集合を比べたいときは、代表となる要素（最小値など）に置き換えると扱いやすい。
- 階層のあるデータは、上の階層から順に比べる比較関数で入れ子の並びにできる。
- ソートの比較関数は、どんな入力でも一貫した順序になるように書く。
- 結果は「使う側が引きたい向き」の表にして保存しておく。

