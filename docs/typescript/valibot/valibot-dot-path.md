---
title: "エラーの場所を a.b.0 のような一本の文字列にする"
description: "valibot の getDotPath。入れ子になったデータの途中で、名前や番号でないキーが混じると null を返す。ドット区切りの文字列を、1 回の走査で組み立てている。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/getDotPath/getDotPath.ts
lines: [32, 49]
function: "getDotPath"
difficulty: 2
format: 2
tags: [エラー処理, 文字列処理, イテレータ]
---

## ひとことで

`getDotPath(issue)` は、検証に失敗した場所（エラーの「パス」）を `user.address.0.zip` のような、ドットで区切った 1 本の文字列にする関数です。valibot では、フォームのどの項目が間違っているかを表示するときに使えます。ただし、パスの途中に文字列でも数字でもないキー（`Symbol` など）があると、文字列にできないので `null` を返します。

```ts
// パス: [{ key: 'user' }, { key: 'tags' }, { key: 0 }]
getDotPath(issue) // "user.tags.0"
```

## コード

```ts:line-numbers=32
export function getDotPath(issue: BaseIssue<unknown>): string | null {
  if (issue.path) {
    let key = '';
    for (const item of issue.path) {
      if (typeof item.key === 'string' || typeof item.key === 'number') {
        if (key) {
          key += `.${item.key}`;
        } else {
          key += item.key;
        }
      } else {
        return null;
      }
    }
    return key;
  }
  return null;
}
```

## 前提知識

- **issue（イシュー）**: valibot の検証が失敗したときに作られる、エラーの情報です。どのキーで、何が問題だったかを持っています。
- **path（パス）**: データの中での場所を、外側から順番に並べた配列です。`{ key: 'user' }` のような要素が並びます。
- **`for ... of`**: 配列の要素を先頭から 1 つずつ取り出して、同じ処理を繰り返す書き方です。
- **`typeof`**: 値の種類を文字列で返す演算子です。`typeof 'a'` は `'string'`、`typeof 0` は `'number'` です。
- **テンプレート文字列 `` `.${item.key}` ``**: バッククォートで囲んだ文字列の中に、`${…}` で値を埋め込める書き方です。

## 何をしているか

### 1. パスがなければ `null` を返す

```ts:line-numbers=33
  if (issue.path) {
```

エラーにパスが付いていない場合は、場所を表せないので `null` を返します（最後の行）。

### 2. 文字列か数字のキーだけを許す

```ts:line-numbers=36
      if (typeof item.key === 'string' || typeof item.key === 'number') {
```

配列のキーは文字列か数字なら、ドットの区切りに入れられます。`Symbol` などのキーは文字列にできないので、後の `else` で `null` を返します。

### 3. 最初の要素と 2 つ目以降で書き方を変える

```ts:line-numbers=37
        if (key) {
          key += `.${item.key}`;
        } else {
          key += item.key;
        }
```

まだ何も入っていないとき（最初の要素）は、ドットを付けずにキーだけを入れます。2 つ目以降は、先頭に `.` を付けてから追加します。これで `user` の前にドットが付くことを防いでいます。

## ここがすごい

- **1 回の走査で組み立てる**: `join('.')` を使う方法もありますが、このコードは、途中で `null` を返せるように、`for` で 1 つずつ確かめながら組み立てています。
- **文字列にできないキーを「無かったこと」にしない**: 途中に 1 つでも表せないキーがあれば、全体を `null` にします。一部だけのパスを返して誤解を招くことを防いでいます。
- **空文字の判定を `if (key)` だけで済ませる**: 最初の要素かどうかを、「まだ何も入っていないか」という条件で判定しています。別の変数を用意する必要がありません。
- **型で入り口を絞る**: 関数の引数の型が `issue` の型として決まっているので、誤った値を渡すと TypeScript が指摘してくれます。

## まとめ

- エラーの場所は、ドット区切りの文字列にすると画面に表示しやすい。
- 文字列にできないキーがあるときは、一部だけを返さずに `null` を返す。
- 最初の要素だけドットを付けない、という条件分岐で区切りを作れる。
- `for ... of` と `typeof` を組み合わせると、型の違いを見分けながら走査できる。
