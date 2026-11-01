---
title: 見つかっても止まらない二分探索のほうが速い理由
description: スライスの二分探索。一致しても途中で抜けず、ループ回数を長さだけで決めることで CPU の予測を外さず、条件付き移動命令で分岐もなくしている。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/mod.rs
lines: [2980, 3032]
function: <[T]>::binary_search_by
difficulty: 3
tags: [探索, アルゴリズム, 最適化, 標準ライブラリ]
---

## ひとことで

`binary_search_by` は、**並べ替え済み** のスライス（配列の一部）から、目的の要素を二分探索で探す関数です。
見つかれば `Ok(位置)`、見つからなければ「そこに入れれば並び順が保たれる位置」を `Err(位置)` で返します。

たとえば `[1, 3, 5, 7, 9, 11]` で `7` を探すと `Ok(3)`、`8` を探すと `Err(4)` です。
教科書の二分探索は「真ん中が一致したらすぐ終了」しますが、この実装は **一致しても最後までループを回します**。それが速さの秘密です。

## コード

```rust:line-numbers=2980
    pub const fn binary_search_by<'a, F>(&'a self, mut f: F) -> Result<usize, usize>
    where
        F: [const] FnMut(&'a T) -> Ordering + [const] Destruct,
    {
        let mut size = self.len();
        if size == 0 {
            return Err(0);
        }
        let mut base = 0usize;

        // This loop intentionally doesn't have an early exit if the comparison
        // returns Equal. We want the number of loop iterations to depend *only*
        // on the size of the input slice so that the CPU can reliably predict
        // the loop count.
        while size > 1 {
            let half = size / 2;
            let mid = base + half;

            // SAFETY: the call is made safe by the following invariants:
            // - `mid >= 0`: by definition
            // - `mid < size`: `mid = size / 2 + size / 4 + size / 8 ...`
            let cmp = f(unsafe { self.get_unchecked(mid) });

            // Binary search interacts poorly with branch prediction, so force
            // the compiler to use conditional moves if supported by the target
            // architecture.
            base = hint::select_unpredictable(cmp == Greater, base, mid);

            // This is imprecise in the case where `size` is odd and the
            // comparison returns Greater: the mid element still gets included
            // by `size` even though it's known to be larger than the element
            // being searched for.
            //
            // This is fine though: we gain more performance by keeping the
            // loop iteration count invariant (and thus predictable) than we
            // lose from considering one additional element.
            size -= half;
        }

        // SAFETY: base is always in [0, size) because base <= mid.
        let cmp = f(unsafe { self.get_unchecked(base) });
        if cmp == Equal {
            // SAFETY: same as the `get_unchecked` above.
            unsafe { hint::assert_unchecked(base < self.len()) };
            Ok(base)
        } else {
            let result = base + (cmp == Less) as usize;
            // SAFETY: same as the `get_unchecked` above.
            // Note that this is `<=`, unlike the assume in the `Ok` path.
            unsafe { hint::assert_unchecked(result <= self.len()) };
            Err(result)
        }
    }
```

## 前提知識

- **スライスとメソッド**: `&'a self` はスライス自身への参照です。`'a` はライフタイム（参照が有効な期間）の名前で、比較関数に渡す要素の参照が同じ期間有効であることを表しています。
- **クロージャ `F: FnMut(&'a T) -> Ordering`**: `f` は「要素を受け取って比較結果を返す関数」です。`Ordering` は `Less`（小さい）・`Equal`（等しい）・`Greater`（大きい）の 3 値の型です。`[const]` や `Destruct` は、この関数をコンパイル時にも使えるようにするための新しい書き方で、読むうえでは無視して構いません。
- **`Result<usize, usize>`**: 成功 `Ok(値)` か失敗 `Err(値)` のどちらかを表す型です。ここでは両方に位置が入ります。
- **`get_unchecked(mid)`**: 範囲チェックをせずに要素を取り出します。範囲外だと未定義動作になるので `unsafe` が必要で、その理由が `SAFETY` コメントに書かれています。
- **`(cmp == Less) as usize`**: `bool` を整数に変換すると `true` が 1、`false` が 0 になります。

## 何をしているか

### 1. 範囲を半分ずつ縮める（2994〜3017 行目）

`base` は候補範囲の先頭、`size` はその長さです。真ん中 `mid = base + size/2` を比べ、

- 要素が目的より大きい（`Greater`）なら、`base` はそのまま（左半分に絞る）
- それ以外なら、`base = mid`（右半分に絞る。`mid` 自身も候補に残す）

として、`size` から半分を引きます。`7` を探す例では次のように進みます。

```
size=6 base=0 → mid=3 (7: Equal)   → base=3, size=3
size=3 base=3 → mid=4 (9: Greater) → base=3, size=2
size=2 base=3 → mid=4 (9: Greater) → base=3, size=1
```

### 2. 最後に 1 回だけ比べる（3020〜3031 行目）

残った `base` の要素と比べ、一致なら `Ok(base)`。一致しなければ、要素が目的より小さいときは 1 つ右（`base + 1`）、大きいときは `base` を挿入位置として `Err` で返します。`8` を探すと最後に `7` と比べて `Less` なので `Err(4)` になります。

## ここがすごい

- **ループ回数が入力の長さだけで決まる**: 2990〜2993 行目のコメントのとおり、一致で途中終了しないので、長さが同じなら毎回同じ回数だけ回ります。CPU はループの終わりを正確に予測できます。一致で早く抜けられる回は意外と少なく、予測が外れるコストのほうが大きいのです。
- **分岐をなくす**: 二分探索の「左か右か」は毎回ランダムに近く、CPU の分岐予測がほぼ当たりません。`hint::select_unpredictable` は「この選択は予測できない」とコンパイラに伝え、`if` の代わりに条件付き移動命令（`cmov` など、分岐せずに値を選ぶ命令）を使わせます。
- **あえて不正確にする**: 3008〜3015 行目のコメントのとおり、`size` が奇数で `Greater` のとき、本当は除外できる要素が 1 つ範囲に残ります。それでもループ回数を一定に保つほうが得だという判断です。
- **境界チェックの省略を安全に**: `mid` が範囲内である理由を `SAFETY` コメントで示し、最後の `assert_unchecked` で戻り値の範囲をコンパイラに教えています。呼び出し側で `slice[i]` としたときの範囲チェックも消しやすくなります。

## まとめ

- 二分探索は「一致したら即終了」より「回数固定」のほうが速いことがある。
- 予測しにくい分岐は、条件付き移動命令に置き換えると速くなる。
- 見つからなかったときに挿入位置を返すと、ソート済み配列への挿入に使える。
- 正確さを少し犠牲にして、CPU にとって予測しやすい形を選ぶ最適化もある。
