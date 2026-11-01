---
title: "深いマージで __proto__ だけは絶対に通さない"
description: "2 つのオブジェクトを入れ子の中まで合体させる merge。source の配列やオブジェクトは新しい入れ物にコピーし、プロトタイプ汚染を起こす __proto__ キーは読み飛ばす。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/merge.ts
lines: [51, 76]
function: "merge"
difficulty: 2
format: 2
tags: [再帰, セキュリティ, 防御的プログラミング]
---

## ひとことで

`merge(target, source)` は、`source` の内容を `target` に **入れ子の奥まで** 合体させます。設定の既定値に、ユーザー設定を重ねる場面などで使います。

```ts
merge({ a: { x: 1, y: 2 } }, { a: { y: 20, z: 30 } })
// { a: { x: 1, y: 20, z: 30 } }
```

`Object.assign` だと `a` が丸ごと置き換わってしまいますが、`merge` は `a` の中身同士を合体させます。そして、悪意のある入力から身を守る **`__proto__` の除外** が入っているのも見どころです。

## コード

```ts:line-numbers=51
export function merge(target: Record<PropertyKey, any>, source: Record<PropertyKey, any>): Record<PropertyKey, any> {
  const sourceKeys = Object.keys(source) as Array<keyof typeof source>;

  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i];

    if (isUnsafeProperty(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (isMergeableValue(sourceValue) && isMergeableValue(targetValue)) {
      target[key] = merge(targetValue, sourceValue);
    } else if (Array.isArray(sourceValue)) {
      target[key] = merge([], sourceValue);
    } else if (isPlainObject(sourceValue)) {
      target[key] = merge({}, sourceValue);
    } else if (targetValue === undefined || sourceValue !== undefined) {
      target[key] = sourceValue;
    }
  }

  return target;
}
```

`isMergeableValue` は「素のオブジェクトか配列なら `true`」、`isPlainObject` は「素のオブジェクトなら `true`」、`isUnsafeProperty` は「キーが `'__proto__'` なら `true`」を返す、同じライブラリの小さな関数です。

## 前提知識

- **`Record<PropertyKey, any>`**: 「どんなキーでも何でも入るオブジェクト」の型です。`PropertyKey` は文字列・数値・シンボルのことです。
- **`Object.keys(obj)`**: オブジェクト自身の列挙可能なキーを配列で返します。
- **`__proto__`**: JavaScript の古い特別なキーで、オブジェクトのプロトタイプ（プロパティを探しに行く親）を指します。`obj['__proto__'] = x` と代入すると、値を入れるのではなく **親が `x` に差し替わります**。
- **プロトタイプ汚染**: `Object.prototype` などの共通の親に勝手にプロパティを書き込まれる攻撃です。すべてのオブジェクトに影響が広がります。
- **再帰**: 関数が自分自身を呼ぶことです。入れ子のデータを処理するのに向いています。

## 何をしているか

### 処理の流れ


`source` のキーを 1 つずつ見ていきます。

```ts:line-numbers=54
  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i];

    if (isUnsafeProperty(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (isMergeableValue(sourceValue) && isMergeableValue(targetValue)) {
      target[key] = merge(targetValue, sourceValue);
    } else if (Array.isArray(sourceValue)) {
      target[key] = merge([], sourceValue);
    } else if (isPlainObject(sourceValue)) {
      target[key] = merge({}, sourceValue);
    } else if (targetValue === undefined || sourceValue !== undefined) {
      target[key] = sourceValue;
    }
  }
```


- キーが `__proto__` なら飛ばす。

```ts:line-numbers=57
    if (isUnsafeProperty(key)) {
      continue;
    }
```

- 両方が合体できる値（オブジェクトか配列）なら、その中身同士を `merge` で合体。

```ts:line-numbers=64
    if (isMergeableValue(sourceValue) && isMergeableValue(targetValue)) {
      target[key] = merge(targetValue, sourceValue);
```

- `source` 側だけが配列なら、**空の配列にコピーしてから** 代入。

```ts:line-numbers=66
    } else if (Array.isArray(sourceValue)) {
      target[key] = merge([], sourceValue);
```

- `source` 側だけがオブジェクトなら、**空のオブジェクトにコピーしてから** 代入。

```ts:line-numbers=68
    } else if (isPlainObject(sourceValue)) {
      target[key] = merge({}, sourceValue);
```

- それ以外の値は、`source` が `undefined` でない限り上書き。`target` 側にその値がまだない場合は、`undefined` でも書き込みます。

```ts:line-numbers=70
    } else if (targetValue === undefined || sourceValue !== undefined) {
      target[key] = sourceValue;
```


## ここがすごい

- **プロトタイプ汚染を防ぐ**: JSON の `JSON.parse('{"__proto__": {"isAdmin": true}}')` は、`__proto__` という **普通のキー** を持つオブジェクトを作ります。これを素朴な深いマージにかけると、`target['__proto__']` で `Object.prototype` を取り出し、そこに `isAdmin: true` を書き込んでしまいます。すると、プログラム中の **すべてのオブジェクト** が `isAdmin` を持っているように見えます。過去に多くのライブラリで脆弱性として報告された問題で、`if (isUnsafeProperty(key)) continue;` という 1 つの `if` がそれを防いでいます。
- **`source` の入れ物を共有しない**: `target[key] = sourceValue` とそのまま代入すると、`target` と `source` が同じ配列やオブジェクトを指してしまい、あとで片方を変更するともう片方も変わります。`merge([], sourceValue)` や `merge({}, sourceValue)` で新しい入れ物にコピーしてから入れることで、それを防いでいます。
- **`undefined` で既存の値を消さない**: `targetValue === undefined || sourceValue !== undefined` という条件により、`source` の値が `undefined` でも、`target` に既にある値は上書きされません。「指定しなかった」項目で既定値が消えてしまう事故を防ぎます。

## まとめ

- 深いマージは「両方が入れ物なら再帰、そうでなければ代入」で書ける。
- 外から来たデータを合体させるときは、`__proto__` を必ず除外する。
- 配列やオブジェクトはコピーしてから入れると、元のデータと絡まらない。
