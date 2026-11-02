---
title: "パスの末尾の区切りを、あれば取り除く"
description: "TypeScript コンパイラの removeTrailingDirectorySeparator。末尾に区切りがあれば 1 文字取り除き、無ければそのまま返す。フォルダの表記をそろえるために使う。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/path.ts
lines: [785, 791]
function: "removeTrailingDirectorySeparator"
difficulty: 1
format: 2
tags: [ファイル, 文字列処理, イディオム]
---

## ひとことで

`removeTrailingDirectorySeparator(path)` は、パスの末尾に区切り文字が付いていれば、それを 1 つ取り除く関数です。`'src/'` は `'src'` になり、`'src'` はそのまま返されます。パスを比べたり、キーとして保存したりするときに、表記のゆれをなくすために使われます。

```ts
removeTrailingDirectorySeparator('src/')   // 'src'
removeTrailingDirectorySeparator('src')    // 'src'
```

## コード

```ts:line-numbers=785
export function removeTrailingDirectorySeparator(path: string) {
    if (hasTrailingDirectorySeparator(path)) {
        return path.substr(0, path.length - 1);
    }

    return path;
}
```

## 前提知識

- **`hasTrailingDirectorySeparator`**: 末尾が区切りかを判定する、この関数の直前にある関数です。
- **`substr(開始, 長さ)`**: 文字列の一部を取り出すメソッドです。ここでは、末尾の 1 文字を除くために使われています。現在は `slice` を使うのが一般的です。
- **表記のゆれ**: 同じフォルダを `src` と `src/` と書ける、という状態です。比べるときに、どちらかにそろえないと、同じものが違うと判定されてしまいます。
- **早い return**: 条件に合うときだけ処理を行い、それ以外はすぐに元の値を返す書き方です。

## 何をしているか

### 1. 末尾に区切りがあるかを調べる

```ts:line-numbers=786
    if (hasTrailingDirectorySeparator(path)) {
```

`hasTrailingDirectorySeparator` で、末尾に区切りがあるかを確かめます。

### 2. あれば、末尾の 1 文字を除く

```ts:line-numbers=787
        return path.substr(0, path.length - 1);
```

区切りがあれば、長さから 1 を引いた位置までを取り出します。これで末尾の区切りだけが消えます。

### 3. なければそのまま返す

```ts:line-numbers=790
    return path;
```

区切りが無ければ、元の文字列をそのまま返します。

## ここがすごい

- **判定と処理を分けている**: 「末尾に区切りがあるか」を前の関数に任せ、この関数は取り除くことだけに集中しています。部品が再利用されています。
- **無い場合は何もしない**: 余計なコピーを作らず、元の値を返します。ほとんどのパスに対して、速く動きます。
- **表記をそろえる役割**: 比べる前に、このような正規化をしておくと、同じフォルダを別物として扱う誤りを防げます。
- **注意点**: `substr` は古い書き方です。現代のコードでは `slice` を使う方が、意図が明確になります。

## まとめ

- 末尾の区切りを消すには、判定の関数で有無を確かめてから、1 文字を取り除く。
- 表記のゆれは、比べる前に正規化すると、誤判定を防げる。
- 変化が不要な場合は、元の値を返すと無駄がない。
- 古い書き方（`substr`）と新しい書き方（`slice`）の違いも、読みながら確かめておくとよい。
