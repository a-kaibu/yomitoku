---
title: "上限を超えたら即座にあきらめる編集距離の計算"
description: "2 つの文字列の編集距離を求める動的計画法。2 行分の配列だけを使い回し、上限を超えうる範囲は計算せず、大文字小文字の違いは 0.1 という安いコストにしている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [2196, 2242]
function: "levenshteinWithMax"
difficulty: 3
tags: [アルゴリズム, 文字列処理, 最適化]
---

## ひとことで

`levenshteinWithMax(s1, s2, max)` は、2 つの文字列がどれくらい違うか（**編集距離**）を計算します。ただし距離が `max` を超えると分かった時点で計算をやめて `undefined` を返します。

TypeScript の「もしかして○○ですか？」という提案のために使われていて、普通の編集距離に 3 つの工夫が加えられています。

1. 必要なメモリを 2 行ぶんだけにする。
2. 上限を超えるとわかっている部分は計算しない。
3. 大文字・小文字の違いは「ほぼ同じ」として安く数える。

## コード

```ts:line-numbers=2196
function levenshteinWithMax(s1: string, s2: string, max: number): number | undefined {
    let previous = new Array(s2.length + 1);
    let current = new Array(s2.length + 1);
    /** Represents any value > max. We don't care about the particular value. */
    const big = max + 0.01;

    for (let i = 0; i <= s2.length; i++) {
        previous[i] = i;
    }

    for (let i = 1; i <= s1.length; i++) {
        const c1 = s1.charCodeAt(i - 1);
        const minJ = Math.ceil(i > max ? i - max : 1);
        const maxJ = Math.floor(s2.length > max + i ? max + i : s2.length);
        current[0] = i;
        /** Smallest value of the matrix in the ith column. */
        let colMin = i;
        for (let j = 1; j < minJ; j++) {
            current[j] = big;
        }
        for (let j = minJ; j <= maxJ; j++) {
            // case difference should be significantly cheaper than other differences
            const substitutionDistance = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase()
                ? (previous[j - 1] + 0.1)
                : (previous[j - 1] + 2);
            const dist = c1 === s2.charCodeAt(j - 1)
                ? previous[j - 1]
                : Math.min(/*delete*/ previous[j] + 1, /*insert*/ current[j - 1] + 1, /*substitute*/ substitutionDistance);
            current[j] = dist;
            colMin = Math.min(colMin, dist);
        }
        for (let j = maxJ + 1; j <= s2.length; j++) {
            current[j] = big;
        }
        if (colMin > max) {
            // Give up -- everything in this column is > max and it can't get better in future columns.
            return undefined;
        }

        const temp = previous;
        previous = current;
        current = temp;
    }

    const res = previous[s2.length];
    return res > max ? undefined : res;
}
```

## 前提知識

- **編集距離**: 文字列 A を B に変えるのに必要な、1 文字の挿入・削除・置換の最小回数です。
- **動的計画法**: 大きな問題を小さな問題に分け、小さな問題の答えを表に記録しながら組み立てる方法です。編集距離では「A の先頭 i 文字を B の先頭 j 文字にする距離」を表に埋めていきます。
- **表の 1 マスの決め方**: 2 つの文字が同じなら左上のマスの値。違えば「上 + 1（削除）」「左 + 1（挿入）」「左上 + 置換のコスト」の最小値です。
- **`charCodeAt(i)`**: `i` 番目の文字の文字コード（数値）を返します。数値の比較は文字列の比較より速いです。
- **`Math.ceil` / `Math.floor`**: 切り上げ・切り捨て。`max` が `1.9` のような小数になることがあるので使っています。

## 何をしているか

### 1. 表の 1 行目（2197〜2204 行目）

`previous` は表の 1 つ前の行、`current` は今の行です。最初の行は「空の文字列から B の先頭 j 文字を作る距離」なので `j` です。

### 2. 1 行ずつ埋める（2206〜2238 行目）

- **計算する範囲を絞る**（2208〜2209 行目）。位置 `i` と `j` の差が `max` を超えるマスは、少なくともその差だけの挿入か削除が必要なので、必ず `max` を超えます。その範囲は計算せず、「大きい値」の `big` を入れておきます（2213〜2215 行目、2227〜2229 行目）。
- **置換のコスト**（2218〜2220 行目）。大文字・小文字だけの違いなら `0.1`、それ以外は `2` です。
- **1 マスの値**（2221〜2223 行目）。同じ文字なら左上の値、違えば削除・挿入・置換の最小値です。
- **行の最小値が上限を超えたらあきらめる**（2230〜2233 行目）。距離は行が進むほど小さくなることはないので、この行で全部 `max` を超えていたら、もう望みはありません。
- **2 つの配列を入れ替える**（2235〜2237 行目）。今の行が次の「前の行」になります。

### 3. 結果（2240〜2241 行目）

最後のマスが答えです。上限を超えていれば `undefined` です。

## ここがすごい

- **メモリは 2 行だけ**: 表全体を持つと「文字数 × 文字数」のメモリが必要ですが、次の行を作るのに必要なのは 1 つ前の行だけです。2 つの配列を入れ替えながら使うので、新しい配列も作りません。
- **帯の部分だけ計算**: `max` が小さければ、計算するのは表の対角線に沿った細い帯だけになります。長い名前どうしを比べても、計算量は大きく減ります。
- **早めにあきらめる**: 行の最小値で打ち切ることで、まったく似ていない候補の計算をすぐにやめられます。何千もの候補と比べる「もしかして」機能にとって大事な工夫です。
- **人間の感覚に合わせたコスト**: `Console` と `console` は、普通の編集距離では 1 文字違いですが、人間にとってはほぼ同じです。コストを `0.1` にすることで、大文字・小文字違いの候補が優先されます。逆に別の文字への置換はコスト `2`（削除 + 挿入と同じ）にして、文字の入れ替わりより挿入や削除の打ち間違いを優先しています。

## まとめ

- 編集距離は動的計画法で表を埋めて求める。必要なのは直前の 1 行だけ。
- 上限があるなら、対角線の帯の外は計算しなくてよい。
- コストの値を調整すると、「人間にとっての似ている」に近づけられる。
