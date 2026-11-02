---
title: "正規表現の文字列から ^ と $ だけを外す"
description: "Zod が正規表現のソースを別の正規表現に埋め込む前に使う cleanRegex。先頭の ^ と末尾の $ だけを切り取り、ほかはそのまま残す。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [321, 325]
function: "cleanRegex"
difficulty: 1
format: 2
tags: [正規表現, 文字列処理, イディオム]
---

## ひとことで

`cleanRegex(source)` は、正規表現の文字列（ソース）から、先頭の `^` と末尾の `$` を取り除いた文字列を返します。

```ts
cleanRegex('^[a-z]+$') // '[a-z]+'
cleanRegex('abc')      // 'abc'（^ も $ もないのでそのまま）
```

Zod は、文字列の形式を表す正規表現（メールアドレスや UUID など）を、別の正規表現の中に組み込むことがあります。その際に、組み込み先で意味を持つ `^` と `$` が二重になるのを防ぐための関数です。

## コード

```ts:line-numbers=321
export function cleanRegex(source: string): string {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
```

## 前提知識

- **正規表現のソース**: `/^abc$/` の `source` プロパティは `'^abc$'` という文字列です。この関数はその文字列を扱います。
- **`^` と `$`**: `^` は文字列の先頭、`$` は末尾を表す記号です。ほかの正規表現に組み込むと、途中に現れた `^` が意図しない位置の判定になってしまいます。
- **`startsWith` / `endsWith`**: 文字列が指定の文字で始まるか、終わるかを調べます。
- **`slice(start, end)`**: `start` 以上 `end` 未満の部分を切り出します。

## 何をしているか

### 1. 先頭の `^` を外すかを決める

```ts:line-numbers=322
  const start = source.startsWith("^") ? 1 : 0;
```

先頭が `^` なら、切り出しの開始位置を 1 にします。`^` でなければ 0 のままです。

### 2. 末尾の `$` を外すかを決める

```ts:line-numbers=323
  const end = source.endsWith("$") ? source.length - 1 : source.length;
```

末尾が `$` なら、終わりの位置を 1 つ前にずらします。

### 3. 間の部分だけを切り出す

```ts:line-numbers=324
  return source.slice(start, end);
```

決めた範囲だけを `slice` で取り出します。

`'^[a-z]+$'` では、先頭の 1 文字と末尾の 1 文字を外して `'[a-z]+'` になります。

## ここがすごい

- **外すものがなければ何もしない**: `^` や `$` がない文字列は、開始位置が 0、終わりが文字列の長さのまま残るので、`slice(0, length)` で元の文字列と同じものが返ります。特別な分岐が要りません。
- **開始と終わりを別々に決める**: 先頭だけ、末尾だけ、両方、どれもない、の 4 通りを、2 つの三項演算子で表せます。
- **全体を書き換えない**: 正規表現を組み立て直すのではなく、文字列の一部を切るだけなので、中身の文字列は一切変わりません。

## まとめ

- 正規表現のソースから、先頭の `^` と末尾の `$` だけを外すと、別の正規表現に組み込みやすい。
- 「外すかどうか」を開始位置と終わり位置の数字で表すと、`slice` 1 回で済む。
- 対象がない場合にも特別扱いせず、そのまま通る書き方にすると分かりやすい。
