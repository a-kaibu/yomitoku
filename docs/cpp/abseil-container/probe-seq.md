---
title: 三角数ずつ跳ぶと全グループを 1 回ずつ訪れる、SwissTable の探索順
description: ハッシュ衝突時に次に見る場所を決める probe_seq。16 スロット単位で三角数ずつ進むだけで、2 のべき乗個のグループを重複なく一巡できる。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2018 The Abseil Authors.
file: absl/container/internal/raw_hash_set.h
lines: [1877, 1926]
function: probe_seq
difficulty: 2
tags: [ハッシュ, アルゴリズム, データ構造, 最適化]
---

## ひとことで

オープンアドレス法のハッシュテーブル（要素を配列に直接並べ、衝突したら別の場所を探す方式）では、「衝突したら次にどこを見るか」を決める必要があります。
`probe_seq` はその順番を作るクラスで、**グループ幅（16 など）× 三角数（0, 1, 3, 6, 10, …）** ずつずらした位置を順に返します。
この並びは、グループ数が 2 のべき乗なら **すべてのグループをちょうど 1 回ずつ** 訪れます。

## コード

::: code-group

```cpp:line-numbers=1877 [日本語訳]
// 探索列（probe sequence）の状態。
//
// 現在、この列は次の形の三角数の数列になっている
//
//   p(i) := Width * (i^2 + i)/2 + hash (mod mask + 1)
//
// `Width` を掛けることで、各ステップがグループ同士で重ならないようにしている。
// つまりこの列は実質的に *グループ* の位置を出力する（ただし何かの境界に
// そろっているとは限らない）。`Group` の仕組みを使えば、グループ全体を
// 最小限の分岐で調べられる。
//
// `mask + 1` で折り返すことは重要だが、その理由は見た目どおりではない。
// 前述のとおり、制御バイト配列の先頭のいくつかは配列の末尾に
// 複製されており、`Group` はそれも見つけて候補選びに使う。しかし
// その候補のスロットを実際に調べるとき、複製されたバイトに対応する
// スロットは存在しないので、それらの位置を「折り返したもの」として扱う必要がある。
// so we need to make sure we've treated those offsets as "wrapping around".
//
// グループ数が 2 のべき乗なら、この探索列はすべてのグループをちょうど
// 1 回ずつ訪れることが分かっている。(i^2+i)/2 は次の上での全単射だからである:
// Z/(2^m)。https://en.wikipedia.org/wiki/Quadratic_probing を参照
template <size_t Width>
class probe_seq {
 public:
  // `hash` を列の初期値とし、`capacity` を数列の各値に適用する
  // マスクとして使う、新しい探索列を作る。
  //
  probe_seq(ProbeCapacity capacity, size_t hash)
      : capacity_(capacity.capacity), offset_(hash & capacity_) {}

  // 表の中での位置、つまり上の `p(i)` の値。
  size_t offset() const { return offset_; }
  size_t offset(size_t i) const { return (offset_ + i) & capacity_; }

  void next() {
    ABSL_SWISSTABLE_ASSERT(next_index_ <= capacity_ && "full table!");
    offset_ += next_index_;
    offset_ &= capacity_;
    next_index_ += Width;
  }
  // 0 始まりの探索番号。`Width` の倍数になる。
  size_t index() const { return next_index_ - Width; }

 private:
  size_t capacity_;
  size_t offset_;
  // より良いコードを生成するため、現在の番号ではなく次の番号を保持している。
  // 例: https://godbolt.org/z/6jvWd135G を参照。
  size_t next_index_ = Width;
};
```

```cpp:line-numbers=1877 [原文]
// The state for a probe sequence.
//
// Currently, the sequence is a triangular progression of the form
//
//   p(i) := Width * (i^2 + i)/2 + hash (mod mask + 1)
//
// The use of `Width` ensures that each probe step does not overlap groups;
// the sequence effectively outputs the addresses of *groups* (although not
// necessarily aligned to any boundary). The `Group` machinery allows us
// to check an entire group with minimal branching.
//
// Wrapping around at `mask + 1` is important, but not for the obvious reason.
// As described above, the first few entries of the control byte array
// are mirrored at the end of the array, which `Group` will find and use
// for selecting candidates. However, when those candidates' slots are
// actually inspected, there are no corresponding slots for the cloned bytes,
// so we need to make sure we've treated those offsets as "wrapping around".
//
// It turns out that this probe sequence visits every group exactly once if the
// number of groups is a power of two, since (i^2+i)/2 is a bijection in
// Z/(2^m). See https://en.wikipedia.org/wiki/Quadratic_probing
template <size_t Width>
class probe_seq {
 public:
  // Creates a new probe sequence using `hash` as the initial value of the
  // sequence and `capacity` as the mask to apply to each value in the
  // progression.
  probe_seq(ProbeCapacity capacity, size_t hash)
      : capacity_(capacity.capacity), offset_(hash & capacity_) {}

  // The offset within the table, i.e., the value `p(i)` above.
  size_t offset() const { return offset_; }
  size_t offset(size_t i) const { return (offset_ + i) & capacity_; }

  void next() {
    ABSL_SWISSTABLE_ASSERT(next_index_ <= capacity_ && "full table!");
    offset_ += next_index_;
    offset_ &= capacity_;
    next_index_ += Width;
  }
  // 0-based probe index, a multiple of `Width`.
  size_t index() const { return next_index_ - Width; }

 private:
  size_t capacity_;
  size_t offset_;
  // We keep track of the next index rather than the current index to get better
  // generated code. See e.g. https://godbolt.org/z/6jvWd135G.
  size_t next_index_ = Width;
};
```

:::

## 前提知識

- **テンプレート引数 `template <size_t Width>`**: 整数をテンプレートの引数にできます。`Width` はコンパイル時に決まる定数（SSE2 版なら 16）になり、コードに直接埋め込まれます。
- **`size_t`**: メモリの大きさや配列の添字に使う符号なし整数型です。
- **メンバ初期化子リスト `: capacity_(...), offset_(...)`**: コンストラクタ本体の前で、メンバ変数に初期値を入れる書き方です。
- **`size_t next_index_ = Width;`**: メンバ変数の宣言に初期値を書く「デフォルトメンバ初期化子」です。
- **`&` によるマスク**: ここでの容量 `capacity_` は常に `2^m - 1`（`0b111...1`）なので、`x & capacity_` は `x % (capacity_ + 1)` と同じ意味になります。割り算より速い演算です。
- **`ABSL_SWISSTABLE_ASSERT`**: デバッグ時だけ有効になるチェック用マクロです。

## 何をしているか

冒頭のコメントにあるとおり、i 回目の位置は次の式です。

```
p(i) = Width * (i^2 + i) / 2 + hash   (mod capacity + 1)
```

`(i^2 + i) / 2` は三角数で、0, 1, 3, 6, 10, … と増えます。

### 1. 開始位置

```cpp:line-numbers=1904
  probe_seq(ProbeCapacity capacity, size_t hash)
      : capacity_(capacity.capacity), offset_(hash & capacity_) {}
```

コンストラクタは `hash & capacity_` を最初の位置にします。たとえば容量 63、`Width = 16`、`hash = 100` なら `100 & 63 = 36` です。

### 2. 次へ進む

```cpp:line-numbers=1911
  void next() {
    ABSL_SWISSTABLE_ASSERT(next_index_ <= capacity_ && "full table!");
    offset_ += next_index_;
    offset_ &= capacity_;
    next_index_ += Width;
  }
```

`next()` は `offset_ += next_index_` してマスクし、`next_index_` を `Width` だけ増やします。増分が 16, 32, 48, … と増えるので、位置は三角数×16 ずつずれます。

```
36 → 36+16=52 → 52+32=84 & 63 = 20 → 20+48=68 & 63 = 4
```

開始位置から見たずれは 0, 16, 48, 96 で、64 で割った余りは 0, 16, 48, 32。4 つのグループすべてを 1 回ずつ通っています。

### 3. いまのグループ内の位置

```cpp:line-numbers=1909
  size_t offset(size_t i) const { return (offset_ + i) & capacity_; }
```

`offset(i)` は、グループ内 i 番目のスロットの位置を返します。端を越えたら先頭に戻るよう、ここでもマスクしています。

## ここがすごい

- **掛け算も割り算もない**: 三角数を毎回計算せず、「増分を Width ずつ増やして足す」だけで次の位置が出ます。1 回の `next()` は足し算 2 回と AND 1 回です。
- **重なりのない二次探索**: 1 スロットずつずらす線形探索だと、衝突した要素が固まって長い列ができやすくなります。三角数で跳ぶ二次探索はそれを避けつつ、`Width` を掛けているので **グループ同士が重ならない** ように進みます。グループ全体は SIMD で一度に調べられるので、1 歩でたくさんのスロットを確認できます。
- **一巡が保証されている**: 冒頭のコメントの最後にあるように、`(i^2+i)/2` は 2 のべき乗を法として全単射（すべての値を 1 回ずつとる対応）です。空きがあれば必ず見つかります。
- **生成コードへの配慮**: `next_index_` に付いたコメントのとおり、「現在の番号」ではなく「次の増分」を覚えておくほうが良いコードになるので、`index()` は `next_index_ - Width` と引き算で返しています。

## まとめ

- 容量を `2^m - 1` にしておくと、余りの計算を `&` 1 回にできる。
- 三角数ずつ進む二次探索は、2 のべき乗の大きさの表を必ず一巡する。
- 「増分を増やしながら足す」と、二次式を掛け算なしで順に計算できる。
- 探索の単位をグループ（16 スロット）にすると、1 歩で調べられる量が増える。
