---
title: "条件を満たす最初の要素の位置を、列を 1 回読んで求める"
description: "Newtonsoft.Json の CollectionUtils.IndexOf（条件版）。判定の関数を満たす最初の要素の位置を返す。見つからなければ -1 を返す。列は 1 回だけ読み、見つかった時点で止める。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [225, 238]
function: "CollectionUtils.IndexOf<T>(IEnumerable<T>, Func<T, bool>)"
difficulty: 1
format: 2
tags: [探索, イテレータ, 可読性]
---

## ひとことで

`IndexOf(collection, predicate)` は、列の中で **条件を満たす最初の要素の位置** を返す関数です。
たとえば `[3, 8, 5, 10]` から「偶数」を探すと、`8` の位置である `1` を返します。条件を満たす要素がなければ、`-1` を返します。

値そのものが分かっていなくても、「どんな条件か」を関数で渡せば探せるのが特徴です。

## コード

```csharp:line-numbers=225
        public static int IndexOf<T>(this IEnumerable<T> collection, Func<T, bool> predicate)
        {
            int index = 0;
            foreach (T value in collection)
            {
                if (predicate(value))
                {
                    return index;
                }

                index++;
            }

            return -1;
```

## 前提知識

- **判定の関数（predicate）**: 要素を受け取り、条件に合うかを `true` か `false` で返す関数です。
- **`foreach`**: 列の要素を先頭から 1 つずつ取り出す書き方です。
- **位置（添字）**: 列の先頭を 0 とする、要素の番号です。
- **`-1`**: 見つからなかったことを表す、慣習的な値です。
- **`IEnumerable<T>`**: 順番に読める列の型です。配列やリストだけでなく、どんな列にも使えます。

## 何をしているか

### 1. 位置を数えながら順に読む

```csharp:line-numbers=227
            int index = 0;
            foreach (T value in collection)
```

`index` を 0 から始め、列の要素を先頭から 1 つずつ取り出します。

### 2. 条件を満たしたら、その位置を返す

```csharp:line-numbers=230
                if (predicate(value))
                {
                    return index;
                }
```

判定の関数が `true` を返したら、そのときの `index` を返します。見つかった時点で止まるので、残りの要素は読みません。

### 3. 見つからなければ -1

```csharp:line-numbers=235
                index++;
            }

            return -1;
```

判定が一度も `true` にならなければ、列の終わりで `-1` を返します。

### 具体例で確かめる

`[3, 8, 5, 10]` で偶数を探します。

```
index 0: 3 → 奇数 → 次へ
index 1: 8 → 偶数 → 1 を返す（ここで止まる）
```

## ここがすごい

- **条件を自由に決められる**: 値の一致だけでなく、「大きい」「ある性質を持つ」など、任意の条件で探せます。
- **見つかった時点で止まる**: 条件を満たす要素の後ろは読まないので、長い列でも無駄がありません。
- **どんな列にも使える**: `IEnumerable<T>` を受け取るので、配列、リスト、途中で作られる列にも同じように使えます。
- **書き方が短い**: 位置を数える処理を 1 か所にまとめているので、呼び出す側は条件だけを書けます。

## まとめ

- `IndexOf` の条件版は、判定の関数を満たす最初の要素の位置を返す。
- 見つかった時点で止まり、見つからなければ `-1` を返す。
- 列の種類を問わず使え、条件は呼び出す側が自由に決められる。
