---
title: "共通の先頭を数えて「../」の数を決める相対パス"
description: "あるディレクトリから別の場所への相対パスを部品の配列で求める関数。先頭から一致する部品を数え、残った from の数だけ「..」を並べ、to の残りをつなげる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [1010, 1032]
function: "getPathComponentsRelativeTo"
difficulty: 2
format: 2
tags: [ファイル, アルゴリズム, 文字列処理]
---

## ひとことで

`getPathComponentsRelativeTo(from, to, …)` は、**ディレクトリ `from` から見た `to` の相対パス** を、部品の配列で求めます。

```
from: /home/user/project/src
to:   /home/user/project/lib/util.ts
→ ["", "..", "lib", "util.ts"]   （../lib/util.ts）
```

TypeScript が `import` 文を自動で書き足すときなどに、「今のファイルから見たパス」を作るのに使われています。考え方は、**先頭から同じ部分を数えて、残りの `from` の数だけ上に戻る** というシンプルなものです。

## コード

```ts:line-numbers=1010
function getPathComponentsRelativeTo(from: string, to: string, stringEqualityComparer: (a: string, b: string) => boolean, getCanonicalFileName: GetCanonicalFileName) {
    const fromComponents = reducePathComponents(getPathComponents(from));
    const toComponents = reducePathComponents(getPathComponents(to));

    let start: number;
    for (start = 0; start < fromComponents.length && start < toComponents.length; start++) {
        const fromComponent = getCanonicalFileName(fromComponents[start]);
        const toComponent = getCanonicalFileName(toComponents[start]);
        const comparer = start === 0 ? equateStringsCaseInsensitive : stringEqualityComparer;
        if (!comparer(fromComponent, toComponent)) break;
    }

    if (start === 0) {
        return toComponents;
    }

    const components = toComponents.slice(start);
    const relative: string[] = [];
    for (; start < fromComponents.length; start++) {
        relative.push("..");
    }
    return ["", ...relative, ...components];
}
```

## 前提知識

- **パスの部品**: `/home/user` を `["/", "home", "user"]` のように分けたものです。0 番目は必ずルート（相対パスなら空文字）です。
- **`reducePathComponents(getPathComponents(p))`**: パスを部品に分け、`.` や `..` を取り除いて正規化します。
- **`getCanonicalFileName`**: ファイル名を比較用の形にそろえる関数です。大文字・小文字を区別しないファイルシステムでは、小文字にそろえます。
- **`for (start = 0; …)`**: ループの外で宣言した変数 `start` を使っているので、ループを抜けたあとも「どこまで一致したか」が残ります。
- **`["", ...relative, ...components]`**: スプレッド構文で、配列をつなげた新しい配列を作ります。先頭の `""` は「相対パスのルート」を表します。

## 何をしているか

### 1. 両方を正規化して部品に分ける

```ts:line-numbers=1011
    const fromComponents = reducePathComponents(getPathComponents(from));
    const toComponents = reducePathComponents(getPathComponents(to));
```
### 2. 先頭から一致する部品を数える

```ts:line-numbers=1015
    for (start = 0; start < fromComponents.length && start < toComponents.length; start++) {
        const fromComponent = getCanonicalFileName(fromComponents[start]);
        const toComponent = getCanonicalFileName(toComponents[start]);
        const comparer = start === 0 ? equateStringsCaseInsensitive : stringEqualityComparer;
        if (!comparer(fromComponent, toComponent)) break;
    }
```
0 番目（ルート）だけは、大文字・小文字を区別せずに比べます。Windows の `C:/` と `c:/` は同じだからです。それ以外は、渡された比較関数を使います。

```ts:line-numbers=1018
        const comparer = start === 0 ? equateStringsCaseInsensitive : stringEqualityComparer;
```


### 3. ルートから違えば、相対パスにできない

```ts:line-numbers=1022
    if (start === 0) {
        return toComponents;
    }
```
`C:/a` と `D:/b` のように別のドライブなら、`to` の絶対パスをそのまま返します。

### 4. `..` を並べて、残りをつなぐ

```ts:line-numbers=1026
    const components = toComponents.slice(start);
    const relative: string[] = [];
    for (; start < fromComponents.length; start++) {
        relative.push("..");
    }
    return ["", ...relative, ...components];
```
`from` の一致しなかった部品の数だけ `..` を並べ、そのあとに `to` の一致しなかった部品を続けます。

```
from: ["/", "home", "user", "project", "src"]
to:   ["/", "home", "user", "project", "lib", "util.ts"]
一致: 4 個（"/", "home", "user", "project"）
from の残り: ["src"] → ".." が 1 つ
to の残り: ["lib", "util.ts"]
→ ["", "..", "lib", "util.ts"]
```

## ここがすごい

- **最初に正規化する**: `a/b/../c` と `a/c` は同じ場所ですが、文字列のままだと先頭の一致がずれてしまいます。最初に正規化しておくことで、部品の比較が正しく働きます。
- **ルートだけ比較方法を変える**: ドライブ名は常に大文字・小文字を区別しないという Windows の決まりを、1 行の条件で反映しています。それ以外の部品は、ファイルシステムの設定に応じて呼び出し側が比較方法を選べます。
- **相対パスにできない場合を区別**: ルートが違えば、どれだけ `..` を並べても届きません。その場合は絶対パスを返すことで、常に「たどり着けるパス」を返します。
- **配列で返す**: 文字列ではなく部品の配列で返すので、呼び出し側でさらに加工してから、最後に 1 回だけ文字列にできます。

## まとめ

- 相対パスは「共通の先頭を数え、残りの from の数だけ `..`、そのあとに to の残り」で作れる。
- 比べる前に正規化しておかないと、同じ場所を違うと判断してしまう。
- ルートが違えば相対パスにはできないので、その場合を分けて扱う。
