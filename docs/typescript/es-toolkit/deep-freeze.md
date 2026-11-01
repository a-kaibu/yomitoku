---
title: "先に凍らせてから潜ることで循環参照でも止まる"
description: "オブジェクトを中身まで変更不可にする deepFreeze。自分を先に freeze し、まだ凍っていない子だけに再帰することで、循環した参照でも無限ループにならない。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/deepFreeze.ts
lines: [17, 35]
function: "deepFreeze"
difficulty: 2
tags: [再帰, 防御的プログラミング, リフレクション]
---

## ひとことで

`deepFreeze(obj)` は、オブジェクトを **入れ子の中身まで含めて変更できなくする** 関数です。

JavaScript には `Object.freeze` がありますが、これは 1 段目だけしか凍らせません。

```ts
const config = Object.freeze({ db: { host: 'localhost' } })
config.db.host = 'evil' // 変更できてしまう

const safe = deepFreeze({ db: { host: 'localhost' } })
safe.db.host = 'evil'   // 変更されない（厳格モードではエラー）
```

`deepFreeze` は、すべての段に `Object.freeze` をかけていきます。処理の **順番** を工夫することで、オブジェクト同士がお互いを参照し合っていても止まるようになっています。

## コード

```ts:line-numbers=17
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  Object.freeze(obj);

  const keys = Reflect.ownKeys(obj) as Array<keyof T>;

  for (let i = 0; i < keys.length; i++) {
    const value = obj[keys[i]];

    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}
```

## 前提知識

- **`Object.freeze(obj)`**: オブジェクトのプロパティの追加・削除・変更をできなくします。ただし、プロパティの値がオブジェクトなら、その中身までは凍りません（浅い凍結）。
- **`Object.isFrozen(obj)`**: 凍っているかどうかを返します。
- **`Reflect.ownKeys(obj)`**: シンボルのキーや列挙されないキーも含めて、オブジェクト自身のキーをすべて返します。
- **循環参照**: `a.self = a` のように、たどっていくと自分に戻ってくる参照のことです。素朴な再帰だと永遠に終わりません。
- **`keyof T`**: 型 `T` のキーの型です。

## 何をしているか

### 1. オブジェクト以外はそのまま（18〜20 行目）

数値や文字列などは凍らせる必要がないので、そのまま返します。

### 2. まず自分を凍らせる（22 行目）

子を処理する **前に** 自分を凍らせます。

### 3. 子をたどる（24〜32 行目）

すべてのキーの値を見て、オブジェクトで、**まだ凍っていないもの** にだけ再帰します。

循環参照の例で追ってみます。

```ts
const a: any = {}; a.self = a
deepFreeze(a)
// 1. a を凍らせる
// 2. a.self を見る → a はもう凍っている → 再帰しない
// 3. 終了
```

## ここがすごい

- **順番で無限ループを防ぐ**: 「子を全部凍らせてから自分を凍らせる」順だと、循環参照で自分に戻ってきたとき、自分はまだ凍っていないので、また最初から処理が始まってしまいます。先に自分を凍らせておけば、戻ってきたときに `isFrozen` が `true` になり、そこで止まります。「訪問済み」を記録する `Set` を別に用意しなくても、凍結の状態そのものを訪問済みの印として使っているわけです。
- **すでに凍ったものはスキップ**: 同じオブジェクトが何か所からも参照されていても、2 回目以降は処理しません。
- **見えないキーも凍らせる**: `Object.keys` ではシンボルのキーを取りこぼします。`Reflect.ownKeys` を使って、すべての値を対象にしています。
- **戻り値に同じオブジェクトを返す**: `const config = deepFreeze({...})` のように、作ると同時に凍らせる書き方ができます。

## まとめ

- `Object.freeze` は浅いので、中身まで凍らせるには再帰が必要。
- 「先に自分を処理して印を付ける」順にすると、循環参照でも止まる。
- オブジェクトの状態（凍っているか）を、訪問済みの印として使い回せる。
