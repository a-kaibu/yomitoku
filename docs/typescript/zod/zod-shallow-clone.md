---
title: "型に応じて、一段だけ中身をコピーする"
description: "オブジェクト・配列・Map・Set のそれぞれに合った方法で、一段だけコピーする shallowClone。中身の入れ子はコピーせず、参照をそのまま共有する。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [558, 564]
function: "shallowClone"
difficulty: 1
format: 2
tags: [データ構造, イディオム, 型システム]
---

## ひとことで

`shallowClone(o)` は、値の **一段目だけ** を新しい入れ物にコピーします。入れ子の中身は、元と同じものを指したままです。

```ts
const a = { x: { y: 1 } }
const b = shallowClone(a)
b.x === a.x  // true（中身は同じもの）
b !== a      // true（一段目の入れ物は別物）
```

Zod では、スキーマの定義を変えるときに、元の定義を壊さないためにコピーが必要になります。ただし、深いコピーはコストが大きいので、一段目だけに留めています。

## コード

```ts:line-numbers=558
export function shallowClone(o: any): any {
  if (isPlainObject(o)) return { ...o };
  if (Array.isArray(o)) return [...o];
  if (o instanceof Map) return new Map(o);
  if (o instanceof Set) return new Set(o);
  return o;
}
```

## 前提知識

- **浅いコピー（shallow copy）**: 入れ物だけを新しくして、中身の参照は共有するコピーです。
- **深いコピー（deep copy）**: 入れ子の中身まで、すべて新しく作るコピーです。
- **スプレッド構文 `{ ...o }`、`[...o]`**: 一段目のプロパティや要素をコピーして、新しい入れ物を作ります。
- **`Map` と `Set`**: キーと値の組、または重複しない値の集まりを扱うコレクションです。`new Map(o)` で中身を引き継いだ新しい Map を作れます。

## 何をしているか

### 1. プレーンオブジェクトはスプレッドでコピーする

```ts:line-numbers=559
  if (isPlainObject(o)) return { ...o };
```

普通のオブジェクトなら、`{ ...o }` で一段目を新しいオブジェクトにコピーします。

### 2. 配列、Map、Set はそれぞれの方法でコピーする

```ts:line-numbers=560
  if (Array.isArray(o)) return [...o];
  if (o instanceof Map) return new Map(o);
  if (o instanceof Set) return new Set(o);
```

配列は `[...o]`、Map は `new Map(o)`、Set は `new Set(o)` で、それぞれ新しい入れ物を作ります。

### 3. それ以外はそのまま返す

```ts:line-numbers=563
  return o;
```

数値や文字列、関数など、コピーの意味がないものは、そのまま返します。

## ここがすごい

- **型ごとにコピーの仕方を分ける**: オブジェクトと配列では、スプレッドの書き方が違います。Map と Set はそもそもプロパティではなく、専用のコンストラクタで引き継ぎます。型に合わせて正しい方法を選んでいます。
- **浅いことを自覚して使う**: 深いコピーは、循環参照や特殊な値で複雑になります。Zod の用途では、一段目を別の入れ物にすれば十分なので、そこに留めています。
- **例外を投げずに返す**: 対象外の値は、そのまま返すので、呼び出し側で特別扱いしなくてよくなります。

## まとめ

- 浅いコピーは、一段目の入れ物だけを新しくする。中身は共有される。
- 配列・Map・Set は、それぞれ専用のコピーの方法を使う。
- 深いコピーが必要かどうかは、用途に合わせて決める。
