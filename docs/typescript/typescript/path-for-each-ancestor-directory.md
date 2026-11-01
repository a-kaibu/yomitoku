---
title: "親が自分と同じになったらルートに着いた合図"
description: "指定したディレクトリから親へ親へとさかのぼってコールバックを呼ぶ関数。ルートの親はルート自身になる性質を終了条件に使い、値が見つかればそこで止まる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [1096, 1110]
function: "forEachAncestorDirectory"
difficulty: 1
tags: [ファイル, イディオム, 探索]
---

## ひとことで

`forEachAncestorDirectory(directory, callback)` は、指定したディレクトリから **親ディレクトリへ順にさかのぼりながら**、それぞれで `callback` を呼びます。`callback` が値を返したら、そこで止まってその値を返します。

```
/home/user/project/src → /home/user/project → /home/user → /home → /
```

TypeScript は、設定ファイル `tsconfig.json` や `node_modules` を、今のファイルの場所から上に向かって探します。そうした「上へ上へと探す」処理の共通部品です。

## コード

```ts:line-numbers=1096
export function forEachAncestorDirectory<T, P extends string>(directory: P, callback: (directory: P) => T | undefined): T | undefined {
    while (true) {
        const result = callback(directory);
        if (result !== undefined) {
            return result;
        }

        const parentPath = getDirectoryPath(directory) as P;
        if (parentPath === directory) {
            return undefined;
        }

        directory = parentPath;
    }
}
```

`getDirectoryPath` は同じファイルの関数で、パスの親ディレクトリを返します。ルート（`/` や `c:/`）を渡すと、ルートそのものを返します。

## 前提知識

- **`P extends string`**: 型引数 `P` は文字列の一種だという制約です。TypeScript コンパイラには、正規化済みのパスを表す `Path` という特別な文字列の型があり、それを渡せば戻り値も `Path` のまま扱えるようにしています。
- **`T | undefined`**: `callback` は、見つかった値か、「見つからなかった」を表す `undefined` を返します。
- **`while (true)`**: 中の `return` で抜けるまで繰り返します。
- **`as P`**: `getDirectoryPath` の戻り値を、引数と同じ型 `P` として扱うように伝えています。

## 何をしているか

1. 今のディレクトリで `callback` を呼び、値が返ればそれを返す（1098〜1101 行目）。
2. 親ディレクトリを求める（1103 行目）。
3. **親が自分と同じなら**、ルートに着いたということなので、見つからなかったとして `undefined` を返す（1104〜1106 行目）。
4. 親に移って繰り返す（1108 行目）。

`tsconfig.json` を探す使い方の例です。

```ts
const found = forEachAncestorDirectory('/home/user/project/src', (dir) =>
  host.fileExists(dir + '/tsconfig.json') ? dir + '/tsconfig.json' : undefined)
// /home/user/project/tsconfig.json があればそれが返る
```

## ここがすごい

- **ルートの判定を書かない**: 「ルートかどうか」を判定しようとすると、`/`、`c:/`、`\\server\share\`、`http://…/` など、パスの種類ごとに場合分けが必要になります。この関数は「親を求めても変わらなければルート」という性質を使うので、ルートの種類を一切気にしなくて済みます。ルートの扱いは `getDirectoryPath` に任せ、ここでは結果を比べるだけです。
- **見つかったらすぐ止まる**: `callback` が値を返した時点で終わるので、近くで見つかれば遠くまでさかのぼる無駄がありません。
- **「探す」と「さかのぼる」を分ける**: 何を探すかは `callback` に任せ、この関数はさかのぼることだけを担当しています。設定ファイル探し、`node_modules` 探し、`package.json` 探しなど、同じ部品を使い回せます。

## まとめ

- 「親が自分と同じ」をルートの判定に使うと、パスの種類ごとの場合分けがいらない。
- 値が見つかったら止まるコールバック方式は、探索の部品として使い回しやすい。
- 型引数を使うと、特別な文字列の型（`Path` など）を崩さずに受け渡しできる。
