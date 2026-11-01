---
title: "キーごとに要素の数を、出てきた順に数える"
description: "MoreLINQ の CountBy。キーを作って辞書で数え、初めて出てきたキーの順番を保つ。キーと件数の組を、出現順に返す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/CountBy.cs
lines: [89, 112]
function: "MoreEnumerable.CountBy<TSource, TKey>(IEnumerable<TSource>, Func<TSource, TKey>, IEqualityComparer<TKey>?)"
difficulty: 2
format: 2
tags: [ハッシュ, アルゴリズム, イテレータ]
---

## ひとことで

`CountBy(keySelector)` は、列の要素ごとに **キーを作り、キーごとに件数を数える** 関数です。
たとえば `"apple", "avocado", "banana"` を先頭の文字で数えると、`a` が 2 件、`b` が 1 件になります。

結果は、最初に現れたキーの順に並びます。

## コード

```csharp:line-numbers=89
                void Loop(IEqualityComparer<TKey> cmp)
                {
                    var dic = new Collections.Dictionary<TKey, int>(cmp);

                    keys = [];
                    counts = [];

                    foreach (var item in source)
                    {
                        var key = keySelector(item);

                        if (dic.TryGetValue(key, out var index))
                        {
                            counts[index]++;
                        }
                        else
                        {
                            index = keys.Count;
                            dic[key] = index;
                            keys.Add(key);
                            counts.Add(1);
                        }
                    }
                }
```

## 前提知識

- **キー（`keySelector`）**: 要素から、数えるための値（キー）を取り出す関数です。
- **辞書（`Dictionary`）**: キーから値を素早く探せる入れ物です。ここでは、キーから「何番目に見つかったか」を覚えます。
- **`TryGetValue`**: キーがあれば値を取り出し、なければ `false` を返す辞書の関数です。
- **`out var`**: 関数の結果を、その場で変数に入れる書き方です。
- **ローカル関数 `Loop`**: 外側の関数の中で定義する関数です。数える処理を、結果を返す処理から分けるために使われています。

## 何をしているか

### 1. 数える道具を用意する

```csharp:line-numbers=91
                    var dic = new Collections.Dictionary<TKey, int>(cmp);

                    keys = [];
                    counts = [];
```

辞書 `dic` と、キーの一覧 `keys`、件数の一覧 `counts` を用意します。`keys` と `counts` は、同じ位置の値が対応しています。

### 2. 要素ごとにキーを作る

```csharp:line-numbers=96
                    foreach (var item in source)
                    {
                        var key = keySelector(item);

```

列の要素を 1 つずつ取り出し、`keySelector` でキーを作ります。

### 3. 既に出てきたキーなら件数を増やす

```csharp:line-numbers=100
                        if (dic.TryGetValue(key, out var index))
                        {
                            counts[index]++;
                        }
```

キーが辞書にあれば、その位置（`index`）を使って `counts` の件数を 1 増やします。

### 4. 初めてのキーなら登録する

```csharp:line-numbers=104
                        else
                        {
                            index = keys.Count;
                            dic[key] = index;
                            keys.Add(key);
                            counts.Add(1);
                        }
```

キーがなければ、今の一覧の長さを新しい位置にして、辞書とキーの一覧に登録します。件数は 1 から始まります。

### 5. キーと件数を順に返す

```csharp:line-numbers=86
                for (var i = 0; i < keys.Count; i++)
                    yield return new KeyValuePair<TKey, int>(keys[i], counts[i]);
```

数え終わったら、`keys` と `counts` の位置を揃えて、キーと件数の組を順に返します。

## ここがすごい

- **出現順を保つ**: 辞書の順番に頼らず、キーの一覧で順番を管理するので、最初に出てきた順に結果が並びます。
- **数えるのは 1 回**: 列を 1 回だけ読み、辞書で位置を引きながら数えます。
- **比べ方を変えられる**: 比較の道具を引数で渡せるので、大文字小文字を区別しない数え方などもできます。

## まとめ

- キーを作り、辞書で既出かを調べる。
- 既出なら件数を増やし、初めてなら登録する。
- キーと件数を、出現順に返す。
