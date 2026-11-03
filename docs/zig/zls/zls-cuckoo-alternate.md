---
title: 2 つ目の候補の棚を、奇数の差分で行き来できるように決める
description: ZLS の CuckooFilter の alternate。1 つの要素の候補になる 2 つの棚（バケット）を、指紋から作った奇数の差分で結ぶ。どちらから出発しても、同じ要素を見つけられる。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/TrigramStore.zig
lines: [495, 511]
function: BucketIndex.alternate
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, アルゴリズム]
---

## ひとことで

`alternate` は、カッコウフィルタ（Cuckoo filter）という確率的な集合で、ある要素が入りうる **もう 1 つの棚（バケット）の番号** を計算する関数です。
カッコウフィルタは、要素ごとに 2 つの候補の棚を持ちます。棚がいっぱいになったときに、要素を別の棚へ移せるように、2 つの棚の番号をお互いに結んでおく必要があります。

この関数は、今の棚の番号と、要素の指紋（fingerprint）から、もう一方の棚の番号を求めます。

## コード

```zig:line-numbers=495
        pub fn alternate(index: BucketIndex, fingerprint: Fingerprint, len: u32) BucketIndex {
            assert(@backingInt(index) < len);
            assert(fingerprint != .none);

            const signed_index: i64 = @backingInt(index);
            const odd_hash: i64 = fingerprint.oddHash();

            const unbounded = switch (parity(signed_index)) {
                .even => signed_index + odd_hash,
                .odd => signed_index - odd_hash,
            };
            const bounded: u32 = @intCast(@mod(unbounded, len));

            assert(parity(signed_index) != parity(bounded));

            return @fromBackingInt(bounded);
        }
```
## 前提知識

- **フィルタ（集合の判定）**: 「この値は入っているか」を、少ない領域で調べる仕組みです。偽陽性（入っていないのに入っていると答える）が少しだけ起きることがあります。
- **指紋（fingerprint）**: 要素の情報を、短い数値（ここでは 8 ビット）に縮めたものです。
- **棚（バケット）**: 指紋を入れておく小さな箱の集まりです。1 つの棚には 4 つの指紋が入ります。
- **奇数（odd）**: 2 で割ると 1 余る数です。`| 1` を付けると、必ず奇数になります。
- **`assert`**: 条件が成り立つかを確かめる文です。成り立たなければ、プログラムを止めます。
- **`@mod`**: 負の数も含めて、割った余りを正の値で返す関数です。
- **パリティ（偶奇）**: 数が偶数か奇数かの性質です。`integer & 1` で調べられます。

## 何をしているか

### 1. 指紋から、奇数の差分を取り出す

```zig:line-numbers=499
            const signed_index: i64 = @backingInt(index);
            const odd_hash: i64 = fingerprint.oddHash();
```

今の棚の番号 `signed_index` と、指紋から作られた奇数 `odd_hash` を用意します。`oddHash` は、指紋ごとに前もって計算された奇数の表から値を取ります。奇数なので、差分の偶奇が必ず変わります。

### 2. 偶数の棚と奇数の棚で、向きを変える

```zig:line-numbers=502
            const unbounded = switch (parity(signed_index)) {
                .even => signed_index + odd_hash,
                .odd => signed_index - odd_hash,
            };
```

今の棚が偶数番号なら `odd_hash` を足し、奇数番号なら引きます。どちらの向きでも、結果は差分の分だけ離れた場所になります。

向きを偶奇で分けているのがポイントです。ある棚から見た相手は、相手から見ても同じ差分で戻れるように作られています。片方の棚から計算した答えを、もう一方の棚から同じ式で計算すると、元の棚へ戻ります。

### 3. 棚の数で割った余りを取る

```zig:line-numbers=506
            const bounded: u32 = @intCast(@mod(unbounded, len));
```

棚の数 `len` で割った余りを取り、有効な棚の番号にします。負の値になっても、`@mod` が正の余りを返すので安全です。

### 4. 偶奇が変わったことを確かめる

```zig:line-numbers=508
            assert(parity(signed_index) != parity(bounded));
```

奇数の差分を使ったので、新しい番号は元と偶奇が違うはずです。この性質を `assert` で確かめています。

## ここがすごい

- **ペアの棚を簡単に求める**: 2 つの棚の番号を、指紋と現在の番号だけで行き来できます。候補の番号を別に保存しなくても、同じ要素の 2 つの棚が分かります。
- **偶奇の性質で行き来が安定**: 奇数の差分は偶奇を必ず入れ替えるので、片方向から戻るのも、もう片方向から行くのも、同じ計算の形になります。
- **同じ指紋は同じ差分**: 差分は指紋だけで決まるので、同じ要素を入れたときと、探すときで、必ず同じ 2 つの棚を見ます。
- **負の値と範囲外の値の扱い**: `@intCast` と `@mod` の組み合わせで、差分を引いて負になっても、棚の番号の範囲に収まります。

## まとめ

- カッコウフィルタの要素は、2 つの候補の棚を持ちます。
- もう 1 つの棚は、指紋から作った奇数の差分で、今の棚の番号から求めます。
- 偶奇で足すか引くかを決めると、どちらの棚からでも同じ式で行き来できます。
- 棚の数で `@mod` した後も、偶奇が変わることを `assert` で確かめています。
