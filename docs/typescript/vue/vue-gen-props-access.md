---
title: "コードを生成するとき、変数名を . で書くか [] で書くかを決める"
description: "Vue のコンパイラが使う genPropsAccessExp。props の名前が識別子として正しければ __props.name、そうでなければ __props[\"name\"] の形のコードを作る。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/general.ts
lines: [204, 210]
function: "genPropsAccessExp"
difficulty: 2
format: 2
tags: [パース, 文字列処理, 正規表現]
---

## ひとことで

`genPropsAccessExp(name)` は、Vue のコンパイラが生成するコードの中で、props の値を読む式の文字列を作る関数です。名前が JavaScript の変数名として正しければ `__props.name` と書き、ハイフンなどを含む場合は `__props["my-name"]` と書きます。コードの文字列を組み立てるための小さな部品です。

```ts
genPropsAccessExp('title')      // "__props.title"
genPropsAccessExp('my-title')   // "__props[\"my-title\"]"
```

## コード

```ts:line-numbers=204
const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/

export function genPropsAccessExp(name: string): string {
  return identRE.test(name)
    ? `__props.${name}`
    : `__props[${JSON.stringify(name)}]`
}
```

## 前提知識

- **識別子**: 変数名やプロパティ名として、JavaScript で使える名前のことです。英字・`_`・`$` で始まり、数字を含めることができます。`my-title` はハイフンがあるので、そのままでは識別子になりません。
- **正規表現**: 文字の並び方を、記号で表す書き方です。`^` は先頭、`$` は末尾、`[…]` は文字の範囲を表します。
- **`test`**: 正規表現に文字列が当てはまるかを `true` / `false` で返すメソッドです。
- **テンプレート文字列**: バッククォートの中に `${…}` で値を埋め込めます。コードの文字列を作るときに便利です。
- **`JSON.stringify`**: 値を JSON の文字列に変えます。文字列を引用符で囲み、中の特殊文字も正しくエスケープします。

## 何をしているか

### 1. 識別子として使えるかを調べる

```ts:line-numbers=206
export function genPropsAccessExp(name: string): string {
  return identRE.test(name)
```

`identRE` という正規表現で、名前が識別子の形かを判定します。`title` は合い、`my-title` は合いません。

### 2. ドット記法か、括弧記法かを選ぶ

```ts:line-numbers=208
    ? `__props.${name}`
    : `__props[${JSON.stringify(name)}]`
```

識別子なら、読みやすいドット記法 `__props.title` にします。そうでなければ、`JSON.stringify` で引用符付きの文字列にし、括弧記法 `__props["my-title"]` にします。

## ここがすごい

- **生成されるコードを必ず正しくする**: ハイフンのある名前をそのままドットで書くと、JavaScript の構文として壊れてしまいます。判定して書き分けることで、どんな名前でも正しいコードになります。
- **`JSON.stringify` で安全に引用**: 名前の中に引用符やバックスラッシュが含まれていても、正しくエスケープされます。自分で引用符を足すより、確実です。
- **読みやすさを優先**: 識別子なら短いドット記法を使うので、生成されたコードも読みやすく保たれます。
- **正規表現が 1 か所にまとまっている**: 「識別子とは何か」の定義が `identRE` の 1 行にあり、この関数はその判定を使うだけです。

## まとめ

- コードを文字列で生成するときは、識別子として正しいかを確かめて、書き方を変える。
- 識別子の判定は正規表現で行うと、ルールが 1 行に収まる。
- 引用符を含む文字列は `JSON.stringify` で安全に囲める。
- 生成されるコードの読みやすさも、書き分けの理由になる。
