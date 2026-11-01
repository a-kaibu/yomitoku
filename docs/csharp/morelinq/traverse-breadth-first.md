---
title: "木の節を、浅い階層から順に幅優先で取り出す"
description: "MoreLINQ の TraverseBreadthFirst。根から始めて、キューで階層ごとに節を取り出し、子をキューの後ろに入れる。根に近い節から順に返す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Traverse.cs
lines: [53, 65]
function: "MoreEnumerable.TraverseBreadthFirst<T>(T, Func<T, IEnumerable<T>>)"
difficulty: 2
format: 2
tags: [アルゴリズム, データ構造, イテレータ]
---

## ひとことで

`TraverseBreadthFirst` は、木のような構造を **浅い階層から順に** 1 つずつ返す関数です。
たとえば、根の `1` に子 `2` と `3` があり、`2` に子 `4` と `5` があるとき、`1, 2, 3, 4, 5` の順に返ります。

これを **幅優先探索** と呼びます。同じ階層の節を、横に広がるように全部見てから、次の階層へ進みます。

## コード

```csharp:line-numbers=53
            static IEnumerable<T> _(T root, Func<T, IEnumerable<T>> childrenSelector)
            {
                var queue = new Queue<T>();
                queue.Enqueue(root);

                while (queue.Count != 0)
                {
                    var current = queue.Dequeue();
                    yield return current;
                    foreach (var child in childrenSelector(current))
                        queue.Enqueue(child);
                }
            }
```

## 前提知識

- **木（ツリー）**: 節（ノード）が、親子の関係でつながった構造です。1 つの根から出発して、子をたどります。
- **キュー（`Queue<T>`）**: 先に入れたものから先に取り出す入れ物です。行列のイメージです。
- **`Enqueue` と `Dequeue`**: 入れる（後ろに並ぶ）と、取り出す（先頭から出る）操作です。
- **`childrenSelector`**: 節を受け取り、その子の一覧を返す関数です。
- **遅延評価**: `yield return` で 1 つずつ返すので、必要になるまで次の節を取り出しません。

## 何をしているか

### 1. 根をキューに入れる

```csharp:line-numbers=55
                var queue = new Queue<T>();
                queue.Enqueue(root);
```

空のキューを作り、根の節を入れます。最初に処理する節は、根です。

### 2. キューが空になるまで繰り返す

```csharp:line-numbers=58
                while (queue.Count != 0)
```

キューに節が残っている間、繰り返します。

### 3. 先頭の節を取り出して返す

```csharp:line-numbers=60
                    var current = queue.Dequeue();
                    yield return current;
```

キューの先頭から節を 1 つ取り出し、結果として返します。キューの先頭は、最も早く入れられた節なので、浅い階層のものから順に出ます。

### 4. 子をキューの後ろに入れる

```csharp:line-numbers=62
                    foreach (var child in childrenSelector(current))
                        queue.Enqueue(child);
```

取り出した節の子を、順にキューの後ろに入れます。子は、いま出た節よりも 1 階層深いので、同じ階層の節をすべて出した後に、取り出されます。

## ここがすごい

- **階層の順序が自然に保たれる**: キューの先入れ先出しのおかげで、特別な並べ替えなしに、浅い節から順に返せます。
- **遅延評価**: 次の節は、要求されるまで取り出されません。大きな木でも、必要な分だけ読めます。
- **深さを気にしない**: 再帰を使わないので、木が深くても、呼び出しの段数が増えません。

## まとめ

- 根をキューに入れて、キューが空になるまで繰り返す。
- 先頭の節を返し、その子を後ろに入れる。
- 浅い階層から、横に広がるように返る。
