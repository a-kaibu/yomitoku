---
title: "遅い比較の前に 2 段階の近道を置くパス比較"
description: "2 つのパスの並び順を比べる関数。ルートが違えば即決、「..」などがなければ文字列比較で即決し、どうしても必要なときだけ部品に分けて正規化してから比べる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [884, 918]
function: "comparePathsWorker"
difficulty: 2
tags: [最適化, ファイル, ソート]
---

## ひとことで

`comparePathsWorker(a, b, componentComparer)` は、2 つのファイルパスの **並び順を比べる** 関数です。並べ替えや重複の判定に使われます。

パスの比較は、`/a/b/../c` と `/a/c` を同じとみなすなど、正しくやろうとすると正規化が必要で重くなります。そこでこの関数は、**本当に必要になるまで重い処理を後回しにする** ように、2 段階の近道を用意しています（889 行目、898 行目のコメント）。

## コード

```ts:line-numbers=884
function comparePathsWorker(a: string, b: string, componentComparer: (a: string, b: string) => Comparison) {
    if (a === b) return Comparison.EqualTo;
    if (a === undefined) return Comparison.LessThan;
    if (b === undefined) return Comparison.GreaterThan;

    // NOTE: Performance optimization - shortcut if the root segments differ as there would be no
    //       need to perform path reduction.
    const aRoot = a.substring(0, getRootLength(a));
    const bRoot = b.substring(0, getRootLength(b));
    const result = compareStringsCaseInsensitive(aRoot, bRoot);
    if (result !== Comparison.EqualTo) {
        return result;
    }

    // NOTE: Performance optimization - shortcut if there are no relative path segments in
    //       the non-root portion of the path
    const aRest = a.substring(aRoot.length);
    const bRest = b.substring(bRoot.length);
    if (!relativePathSegmentRegExp.test(aRest) && !relativePathSegmentRegExp.test(bRest)) {
        return componentComparer(aRest, bRest);
    }

    // The path contains a relative path segment. Normalize the paths and perform a slower component
    // by component comparison.
    const aComponents = reducePathComponents(getPathComponents(a));
    const bComponents = reducePathComponents(getPathComponents(b));
    const sharedLength = Math.min(aComponents.length, bComponents.length);
    for (let i = 1; i < sharedLength; i++) {
        const result = componentComparer(aComponents[i], bComponents[i]);
        if (result !== Comparison.EqualTo) {
            return result;
        }
    }
    return compareValues(aComponents.length, bComponents.length);
}
```

## 前提知識

- **ルート**: パスの最初の部分です。`/`、`c:/`、`http://example.com/` など。`getRootLength` はその長さを返す同じファイルの関数です。
- **`Comparison`**: 比較の結果を表す列挙型で、`LessThan`（前）、`EqualTo`（同じ）、`GreaterThan`（後ろ）があります。
- **`componentComparer`**: 部品を比べる関数です。大文字・小文字を区別するかどうかで、呼び出し側が別の関数を渡します。
- **`relativePathSegmentRegExp`**: `//`、`.`、`..` の部品を含むかを調べる正規表現です（882 行目）。
- **`reducePathComponents(getPathComponents(a))`**: パスを部品の配列に分けてから、`.` と `..` を取り除きます。

## 何をしているか

### 0. 簡単な場合（885〜887 行目）

まったく同じ文字列なら等しい、`undefined` は先に並べます。

### 1. 近道その 1: ルートを比べる（891〜896 行目）

ルートが違えば、それで順番が決まります。ルートは大文字・小文字を区別せずに比べます（Windows のドライブ名 `C:` と `c:` は同じだからです）。

### 2. 近道その 2: 相対的な部品がなければ文字列で比べる（900〜904 行目）

ルート以外の部分に `.` や `..` や `//` が 1 つもなければ、正規化しても文字列は変わりません。なので、そのまま文字列として比べます。

### 3. 最後の手段: 正規化して部品ごとに比べる（908〜917 行目）

部品の配列にして正規化し、0 番目（ルート、比較済み）を除いて 1 つずつ比べます。共通の部分がすべて同じなら、部品が少ないほうを先にします。

```
'/a/b' vs 'C:/a'      → ルートが違う（近道 1）
'/a/b' vs '/a/c'      → 文字列で比較（近道 2）
'/a/x/../b' vs '/a/b' → 部品 [a, b] と [a, b] → 同じ（最後の手段）
```

## ここがすごい

- **重い処理を後回しにする**: パスを部品に分けて正規化するには、新しい配列をいくつも作ります。並べ替えでは比較関数が何千回も呼ばれるので、そのたびに配列を作っていては遅くなります。ほとんどの比較を近道で済ませることで、この問題を避けています。
- **近道が正しい理由が明確**: 「相対的な部品がないなら、正規化しても変わらない」という事実があるから、文字列比較の近道が正しく成り立ちます。単なる速度のための手抜きではなく、結果が変わらないことが保証された近道です。
- **コメントで意図を示す**: 「NOTE: Performance optimization」と書いて、なぜこのコードがあるのかを明記しています。あとから読む人が「この分岐は要らないのでは」と消してしまうのを防げます。

## まとめ

- 正しいが重い処理の前に、結果が変わらないとわかっている近道を置く。
- 並べ替えの比較関数は何度も呼ばれるので、配列の生成などを避けると効く。
- 最適化のためのコードには、その意図をコメントで残す。
