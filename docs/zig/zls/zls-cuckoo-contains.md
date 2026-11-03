---
title: 要素の 2 つの候補の棚だけを見て、入っているかを判定する
description: ZLS の CuckooFilter.contains。トリグラムから 2 つの棚と指紋を求め、その 2 か所だけを調べる。全体を走査しないので速い。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/TrigramStore.zig
lines: [621, 639]
function: CuckooFilter.contains
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, 探索]
---

## ひとことで

`contains` は、カッコウフィルタの中に、与えられたトリグラム（3 文字の並び）が入っているかを判定する関数です。
入っていれば `true`、入っていなければ `false` を返します。ただし、入っていないのに `true` を返すことが、まれにあります（偽陽性）。

判定の速さは、フィルタ全体を調べるのではなく、**2 つの棚だけ** を見て決まります。

## コード

```zig:line-numbers=621
    pub fn contains(filter: CuckooFilter, trigram: Trigram) bool {
        const triplet: Triplet = .initFromTrigram(trigram, @intCast(filter.buckets.len));

        return filter.containsInBucket(triplet.index_1, triplet.fingerprint) or
            filter.containsInBucket(triplet.index_2, triplet.fingerprint);
    }

    fn containsInBucket(filter: CuckooFilter, index: BucketIndex, fingerprint: Fingerprint) bool {
        assert(fingerprint != .none);

        const bucket = filter.bucketAt(index);
        for (bucket) |*slot| {
            if (slot.* == fingerprint) {
                return true;
            }
        }

        return false;
    }
```
## 前提知識

- **トリグラム**: 文字列を 3 文字ずつ区切った並びです。`"abc"` からは `"abc"` 1 つ、`"hello"` からは `"hel"`、`"ell"`、`"llo"` が取れます。ZLS は、名前の部分一致を速く調べるためにこれを使います。
- **カッコウフィルタ**: 要素ごとに 2 つの棚を持つ、集合の判定の仕組みです。棚に空きがないときも、もう一方の棚へ要素を移せます。
- **棚（バケット）と指紋**: 棚は 4 つの指紋を入れる箱です。指紋は、要素を短く縮めた数値です。
- **`or`**: どちらかが真なら真になる論理演算子です。`or` の右側は、左側が偽のときだけ調べられます。
- **`for (bucket) |*slot|`**: 棚の 4 つのスロットを順に調べる書き方です。`*slot` は、各要素への参照です。
- **`.initFromTrigram`**: トリグラムから、指紋と 2 つの棚の番号を作る関数です。

## 何をしているか

### 1. トリグラムから、指紋と 2 つの棚を求める

```zig:line-numbers=622
        const triplet: Triplet = .initFromTrigram(trigram, @intCast(filter.buckets.len));
```

トリグラムをハッシュして、指紋 `fingerprint` と、1 つ目の棚の番号 `index_1` を作ります。2 つ目の棚の番号 `index_2` も、同じ関数で一緒に作られます。棚の数は `filter.buckets.len` です。

### 2. 2 つの棚のどちらかに指紋があるか調べる

```zig:line-numbers=624
        return filter.containsInBucket(triplet.index_1, triplet.fingerprint) or
            filter.containsInBucket(triplet.index_2, triplet.fingerprint);
```

1 つ目の棚を調べ、指紋が見つかれば `true` です。見つからなければ、2 つ目の棚を調べます。`or` の右側は、左側が `false` のときだけ実行されます。

### 3. 棚の中の 4 つのスロットを比べる

```zig:line-numbers=632
        for (bucket) |*slot| {
            if (slot.* == fingerprint) {
                return true;
            }
        }

        return false;
```

`containsInBucket` は、棚の中の 4 つのスロットを先頭から順に比べます。同じ指紋があれば `true` です。最後まで見つからなければ `false` を返します。

たとえば、ある棚に `[0x3A, 0x7F, none, none]` が入っていて、探す指紋が `0x7F` なら、2 番目のスロットで見つかり、すぐ `true` になります。

## ここがすごい

- **調べる場所が 2 か所だけ**: フィルタの大きさに関係なく、2 つの棚の 8 個のスロットを見るだけです。要素が増えても、判定の時間は変わりません。
- **偽陽性は起きうるが、偽陰性はない**: 要素を入れたときと同じ 2 つの棚を見るので、入っている要素を「ない」と答えることはありません。指紋の衝突で、入っていない要素を「ある」と答えることだけが起こりえます。
- **短い指紋で省メモリ**: 指紋は 8 ビットです。要素そのものを保存しないので、メモリの使用量が小さくて済みます。
- **`or` で探索を省く**: 1 つ目の棚で見つかれば、2 つ目の棚を調べません。比べる回数を減らしています。

## まとめ

- カッコウフィルタの判定は、要素の指紋と、2 つの候補の棚だけを見ます。
- 1 つ目の棚で見つからなければ、2 つ目の棚を調べます。
- フィルタ全体を走査しないので、判定の速さが安定しています。
- 入っていない要素を「ある」と答えることは起きうるが、入っている要素を「ない」と答えることはありません。
