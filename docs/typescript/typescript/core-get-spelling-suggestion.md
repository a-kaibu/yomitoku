---
title: "「もしかして？」の候補を賢く絞り込む"
description: "名前の打ち間違いに対して「もしかして○○？」と提案するための関数。長さの差や短い名前の扱いで候補を素早くふるい落とし、最良の距離を上限にして計算を打ち切る。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [2167, 2194]
function: "getSpellingSuggestion"
difficulty: 2
tags: [文字列処理, アルゴリズム, 最適化]
---

## ひとことで

TypeScript でうっかり `consle.log()` と書くと、「`consle` は見つかりません。`console` ですか？」と教えてくれます。`getSpellingSuggestion` は、その **「もしかして」の候補を選ぶ関数** です。

候補の名前と打ち間違えた名前の「似ていなさ」（編集距離）を計算して、最も似ているものを選びます。候補は何千個もあることがあるので、**計算する前にふるい落とす** 工夫が詰まっています。

## コード

```ts:line-numbers=2167
export function getSpellingSuggestion<T>(name: string, candidates: Iterable<T>, getName: (candidate: T) => string | undefined): T | undefined {
    const maximumLengthDifference = Math.max(2, Math.floor(name.length * 0.34));
    let bestDistance = Math.floor(name.length * 0.4) + 1; // If the best result is worse than this, don't bother.
    let bestCandidate: T | undefined;
    for (const candidate of candidates) {
        const candidateName = getName(candidate);
        if (candidateName !== undefined && Math.abs(candidateName.length - name.length) <= maximumLengthDifference) {
            if (candidateName === name) {
                continue;
            }
            // Only consider candidates less than 3 characters long when they differ by case.
            // Otherwise, don't bother, since a user would usually notice differences of a 2-character name.
            if (candidateName.length < 3 && candidateName.toLowerCase() !== name.toLowerCase()) {
                continue;
            }

            const distance = levenshteinWithMax(name, candidateName, bestDistance - 0.1);
            if (distance === undefined) {
                continue;
            }

            Debug.assert(distance < bestDistance); // Else `levenshteinWithMax` should return undefined
            bestDistance = distance;
            bestCandidate = candidate;
        }
    }
    return bestCandidate;
}
```

`levenshteinWithMax` は同じファイルにある、上限付きで編集距離を計算する関数です。距離が上限を超えると分かった時点で `undefined` を返します。

## 前提知識

- **編集距離（レーベンシュタイン距離）**: ある文字列を別の文字列にするのに、1 文字の挿入・削除・置換が何回必要かを表す数です。`consle` → `console` は `o` を 1 文字挿入するだけなので距離 1 です。
- **`Iterable<T>`**: `for … of` で 1 つずつ取り出せるものの型です。配列や `Map` のキーなどが当てはまります。
- **`getName`**: 候補から名前を取り出す関数です。候補がシンボルや宣言のオブジェクトでも使えるようにしています。
- **`continue`**: ループの残りを飛ばして、次の候補に進みます。
- **`Debug.assert(条件)`**: 条件が偽なら開発中にエラーを出す確認用の関数です。

## 何をしているか

### 1. しきい値を決める（2168〜2169 行目）

- 長さの差の上限: 名前の長さの 34 %（最低 2）。
- 距離の上限: 名前の長さの 40 % + 1。これより似ていなければ提案しません。

### 2. 候補をふるい落とす（2171〜2181 行目）

- 長さが違いすぎる候補は、計算せずに飛ばします（2173 行目）。
- 完全に同じ名前は飛ばします（2174〜2176 行目）。
- 3 文字未満の候補は、**大文字・小文字の違いだけ** のときしか考えません（2179〜2181 行目）。

### 3. 距離を計算して最良を更新（2183〜2190 行目）

上限を「今までの最良の距離 - 0.1」にして計算します。つまり **今の最良より良くなる見込みがない候補は途中で打ち切られます**。打ち切られなかったら、それが新しい最良です。

## ここがすごい

- **安い判定から順に**: 編集距離の計算は、文字数の掛け算に比例する重い処理です。長さの差を見る、同じ名前を除く、といった一瞬で済む判定を先に行い、重い計算をする候補を減らしています。
- **最良の距離を上限にする**: 候補を処理するたびに上限が厳しくなるので、後のほうの候補ほど早く打ち切られます。「最良の解を見つけたら、それより悪いものは最後まで調べない」という、探索問題でよく使われる考え方（枝刈り）です。
- **人間の感覚に合わせた調整**: 2 文字の名前は、1 文字違うだけで全く別の名前になります（`id` と `if` など）。2177〜2178 行目のコメントのとおり、短い名前の違いには人は自分で気づくので、大文字・小文字の違いだけを提案しています。数字のしきい値も含めて、使い勝手を考えた調整です。

## まとめ

- 「もしかして」は、編集距離が最も小さい候補を選ぶことで作れる。
- 重い計算の前に、安い判定でふるい落とす。
- 今の最良の値を上限にして計算を打ち切ると、探索が速くなる。
