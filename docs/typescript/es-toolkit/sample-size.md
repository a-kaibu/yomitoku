---
title: "重複なしのランダム抽出を「ちょうど size 回」で終わらせる"
description: "配列から重複なしで size 個をランダムに選ぶ関数。フロイドのアルゴリズムを使い、選び直しのループなしで必ず size 回の乱数だけで終わる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/array/sampleSize.ts
lines: [21, 42]
function: "sampleSize"
difficulty: 3
tags: [アルゴリズム, 乱数, データ構造]
---

## ひとことで

`sampleSize` は、配列の中から **重複なしで** `size` 個の要素をランダムに選び出す関数です。
たとえば `sampleSize([1, 2, 3, 4, 5], 3)` は `[2, 5, 1]` のような結果を返します。

「重複なしで選ぶ」は、素朴に書くと「選んだものがかぶったら選び直す」になり、運が悪いと何度もやり直しになります。この関数は **フロイドのアルゴリズム** と呼ばれる方法で、乱数を引く回数をちょうど `size` 回に抑えています。

## コード

```ts:line-numbers=21
export function sampleSize<T>(array: readonly T[], size: number): T[] {
  if (size > array.length) {
    throw new Error('Size must be less than or equal to the length of array.');
  }

  const result = new Array(size);
  const selected = new Set();

  for (let step = array.length - size, resultIndex = 0; step < array.length; step++, resultIndex++) {
    let index = randomInt(0, step + 1);

    if (selected.has(index)) {
      index = step;
    }

    selected.add(index);

    result[resultIndex] = array[index];
  }

  return result;
}
```

`randomInt(min, max)` は同じライブラリの関数で、`min` 以上 `max` 未満のランダムな整数を返します。

## 前提知識

- **`new Array(size)`**: 長さ `size` の空の配列を作ります。中身はまだ入っていません。
- **`Set`**: 重複しない値の集まりを表す組み込みのデータ構造です。`add` で追加、`has` で「入っているか」を調べます。`has` は配列の検索と違い、要素がいくつあってもほぼ一瞬で答えが出ます。
- **`for (let a = …, b = …; 条件; a++, b++)`**: `for` 文の初期化と更新にはカンマで区切って複数の変数を書けます。ここでは `step` と `resultIndex` を同時に進めています。
- **`throw new Error(...)`**: エラーを投げて処理を中断します。要素数より多く選ぶことはできないので、最初に弾いています。

## 何をしているか

### 1. 範囲を確認する（22〜24 行目）

配列の長さより多くは選べないので、`size` が大きすぎたらエラーにします。

### 2. 選ぶ範囲を 1 つずつ広げながら選ぶ（29〜39 行目）

`step` は `array.length - size` から始まり、`array.length - 1` まで増えていきます。つまりループはちょうど `size` 回です。

各回でやることは次のとおりです。

1. `0` 以上 `step` 以下の位置 `index` をランダムに選ぶ（30 行目）。
2. その位置がすでに選ばれていたら、**代わりに `step` そのものを選ぶ**（32〜34 行目）。
3. 選んだ位置を `selected` に記録し、要素を結果に入れる（36〜38 行目）。

長さ 5 の配列から 3 個選ぶ例で追います（位置は 0〜4）。

```
step = 2: 0〜2 から 1 を引く → 未使用なので 1 を採用   選択済み {1}
step = 3: 0〜3 から 1 を引く → 使用済み！ 代わりに 3   選択済み {1, 3}
step = 4: 0〜4 から 0 を引く → 未使用なので 0 を採用   選択済み {1, 3, 0}
```

かぶったときに選び直さず、「今回新しく範囲に入った `step`」を採用するのがミソです。`step` はこの回で初めて候補に入った位置なので、絶対にまだ選ばれていません。

## ここがすごい

- **やり直しが一度もない**: 「かぶったら引き直す」方式は、`size` が配列の長さに近いほど引き直しが増え、最悪いつ終わるかわかりません。この方法は必ず `size` 回で終わります。
- **それでも確率は公平**: 一見「かぶったら `step` に置き換える」のはズルに見えますが、数学的にはどの組み合わせも同じ確率で選ばれることが証明されています。直感的には、「`step` を直接引いた場合」と「すでに選んだものを引いて `step` に振り替えた場合」の 2 通りが合わさることで、新しく増えた `step` の位置が、ほかの位置とちょうど同じ確率になるように釣り合っています。
- **配列をコピーしない**: シャッフルしてから先頭 `size` 個を取る方法もありますが、それだと配列全体のコピーが必要です。この方法は `size` 個ぶんのメモリしか使わないので、巨大な配列から少しだけ選ぶときに有利です。
- **`Set` で既出チェックを速く**: 選択済みかどうかの確認に配列ではなく `Set` を使うことで、毎回の確認がほぼ一定時間で済みます。

## まとめ

- 重複なしのランダム抽出は、フロイドのアルゴリズムで「やり直しなし」にできる。
- 衝突したときに「その回に初めて候補に入った値」を使うと、公平さを保ったまま一発で決まる。
- 「既に使ったか」の確認には `Set` が向いている。
